import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { NewsMedia } from "@/models/NewsMedia";
import { uploadToCloudinary } from "@/lib/cloudinary";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await connectDB();
    const list = await NewsMedia.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json(list);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load news media" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const formData = await req.formData();
    const title = formData.get("title")?.toString().trim();
    const content = formData.get("content")?.toString().trim();
    const featuredImageFile = formData.get("featuredImage") as File | null;
    const files = formData.getAll("files") as File[];

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    let featuredImageUrl = "";
    if (featuredImageFile && featuredImageFile.size > 0) {
      if (featuredImageFile.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: "Featured image exceeds 10MB limit" }, { status: 400 });
      }
      const buffer = Buffer.from(await featuredImageFile.arrayBuffer());
      const base64 = `data:${featuredImageFile.type};base64,${buffer.toString("base64")}`;
      const result = await uploadToCloudinary(base64, { folder: "news-media", resource_type: "auto", original_filename: featuredImageFile.name });
      featuredImageUrl = result.secure_url;
    }

    const fileUrls: string[] = [];
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

    await connectDB();
    const doc = await NewsMedia.create({
      title,
      content,
      featuredImage: featuredImageUrl || undefined,
      files: fileUrls,
    });

    return NextResponse.json({ success: true, id: doc._id });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to create news media" },
      { status: 500 }
    );
  }
}
