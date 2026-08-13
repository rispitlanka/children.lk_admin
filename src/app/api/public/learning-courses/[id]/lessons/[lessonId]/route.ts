import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Course } from "@/models/Course";
import { Lesson } from "@/models/Lesson";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    await connectDB();
    const { id, lessonId } = await params;

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

    const lesson = await Lesson.findOne({
      _id: lessonId,
      courseId: id,
      visibilityStatus: "published",
    }).lean();

    if (!lesson) {
      return NextResponse.json(
        { error: "Lesson not found or not published" },
        { status: 404 }
      );
    }

    return NextResponse.json(lesson);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load lesson detail" },
      { status: 500 }
    );
  }
}
