import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import "@/models/Organization";
import { Media } from "@/models/Media";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: raw } = await params;
    const slug = decodeURIComponent(raw ?? "").trim();
    if (!slug) {
      return NextResponse.json(
        { error: "Media slug is required" },
        { status: 400 }
      );
    }
    await connectDB();
    const media = await Media.findOne({ slug })
      .populate("organizationId")
      .lean();

    if (!media) {
      return NextResponse.json(
        { error: "Media not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(media);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load media" },
      { status: 500 }
    );
  }
}
