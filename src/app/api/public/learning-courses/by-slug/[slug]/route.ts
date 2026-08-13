import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Course } from "@/models/Course";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const normalizedSlug = (slug || "").trim();
    if (!normalizedSlug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    await connectDB();
    const doc = await Course.findOne({
      slug: normalizedSlug,
      visibilityStatus: "published",
    }).lean();

    if (!doc) {
      return NextResponse.json(
        { error: "Course not found or not published" },
        { status: 404 }
      );
    }

    return NextResponse.json(doc);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load learning course by slug" },
      { status: 500 }
    );
  }
}
