import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Course } from "@/models/Course";
import { Lesson } from "@/models/Lesson";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid course id" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { orderedLessonIds } = body;

    if (!Array.isArray(orderedLessonIds)) {
      return NextResponse.json(
        { error: "orderedLessonIds must be an array" },
        { status: 400 }
      );
    }

    await connectDB();

    const courseExists = await Course.exists({ _id: id });
    if (!courseExists) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (orderedLessonIds.length === 0) {
      return NextResponse.json({ success: true });
    }

    for (const lessonId of orderedLessonIds) {
      if (typeof lessonId !== "string" || !mongoose.Types.ObjectId.isValid(lessonId)) {
        return NextResponse.json(
          { error: `Invalid lesson ID: ${lessonId}` },
          { status: 400 }
        );
      }
    }

    const bulkOps = orderedLessonIds.map((lessonId: string, index: number) => ({
      updateOne: {
        filter: { _id: lessonId, courseId: id },
        update: { $set: { order: index } },
      },
    }));

    await Lesson.bulkWrite(bulkOps);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to reorder lessons" }, { status: 500 });
  }
}
