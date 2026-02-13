import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { file: base64, folder = "childrenlk", resource_type = "auto" } = body;
    if (!base64 || typeof base64 !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid file (base64)" },
        { status: 400 }
      );
    }
    const result = await uploadToCloudinary(base64, {
      folder,
      resource_type: resource_type as "image" | "video" | "raw" | "auto",
    });
    return NextResponse.json({ url: result.secure_url, publicId: result.public_id });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
