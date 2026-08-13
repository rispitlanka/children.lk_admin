import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Course } from "@/models/Course";
import { Lesson } from "@/models/Lesson";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const courseExists = await Course.exists({
      _id: id,
      visibilityStatus: "published",
    });
    if (!courseExists) {
      return NextResponse.json(
        { error: "Course not found or not published" },
        { status: 404 }
      );
    }

    const lessons = await Lesson.find({
      courseId: id,
      visibilityStatus: "published",
    })
      .sort({ order: 1 })
      .lean();

    return NextResponse.json(lessons);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load lessons for course" },
      { status: 500 }
    );
  }
}
