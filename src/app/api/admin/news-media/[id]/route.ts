import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { NewsMedia } from "@/models/NewsMedia";
import { uploadToCloudinary } from "@/lib/cloudinary";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    await connectDB();
    const doc = await NewsMedia.findById(id).lean();
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(doc);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const formData = await req.formData();
    const title = formData.get("title")?.toString().trim();
    const content = formData.get("content")?.toString().trim();
    
    // For files, we check if new ones were uploaded
    const featuredImageFile = formData.get("featuredImage") as File | null;
    const files = formData.getAll("files") as File[];
    
    // Also support keeping existing files if they're passed as strings or not overwritten.
    // In FormData, multiple values for the same key can be sent.
    const existingFeaturedImage = formData.get("existingFeaturedImage")?.toString();
    const existingFiles = formData.getAll("existingFiles").map(f => f.toString());

    await connectDB();
    const update: Record<string, any> = {};
    if (title !== undefined) update.title = title;
    if (content !== undefined) update.content = content;

    if (featuredImageFile && featuredImageFile.size > 0) {
      if (featuredImageFile.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: "Featured image exceeds 10MB limit" }, { status: 400 });
      }
      const buffer = Buffer.from(await featuredImageFile.arrayBuffer());
      const base64 = `data:${featuredImageFile.type};base64,${buffer.toString("base64")}`;
      const result = await uploadToCloudinary(base64, { folder: "news-media", resource_type: "auto", original_filename: featuredImageFile.name });
      update.featuredImage = result.secure_url;
    } else if (existingFeaturedImage !== undefined) {
      update.featuredImage = existingFeaturedImage;
    }

    const fileUrls: string[] = existingFiles ? [...existingFiles] : [];
    for (const file of files) {
      if (file.size > 0) {
        if (file.size > MAX_FILE_SIZE) {
          return NextResponse.json({ error: `File ${file.name} exceeds 10MB limit` }, { status: 400 });
        }
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;
        const result = await uploadToCloudinary(base64, { folder: "news-media", resource_type: "auto", original_filename: file.name });
        fileUrls.push(result.secure_url);
      }
    }
    
    // Only update files if they were provided in the request
    // If files are sent or existingFiles are sent, we update the array.
    if (files.length > 0 || formData.has("existingFiles")) {
      update.files = fileUrls;
    }

    await NewsMedia.updateOne({ _id: id }, update);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to update news media" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    await connectDB();
    await NewsMedia.deleteOne({ _id: id });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to delete news media" },
      { status: 500 }
    );
  }
}
