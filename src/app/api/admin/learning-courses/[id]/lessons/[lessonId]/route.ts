import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Course } from "@/models/Course";
import { Lesson } from "@/models/Lesson";
import { validateQuizQuestions } from "@/lib/quizValidation";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, lessonId } = await params;
  if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(lessonId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    await connectDB();
    const lesson = await Lesson.findOne({ _id: lessonId, courseId: id }).lean();
    if (!lesson) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(lesson);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load lesson" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, lessonId } = await params;
  if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(lessonId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const body = await req.json();
    await connectDB();

    const lesson = await Lesson.findOne({ _id: lessonId, courseId: id });
    if (!lesson) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (typeof body.title === "string") {
      const trimmed = body.title.trim();
      if (!trimmed) {
        return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
      }
      lesson.title = trimmed;
    }

    if (body.visibilityStatus !== undefined) {
      if (body.visibilityStatus !== "draft" && body.visibilityStatus !== "published") {
        return NextResponse.json(
          { error: "visibilityStatus must be draft or published" },
          { status: 400 }
        );
      }
      lesson.visibilityStatus = body.visibilityStatus;
    }

    if (typeof body.order === "number") {
      lesson.order = body.order;
    }

    const contentType = body.contentType !== undefined ? body.contentType : lesson.contentType;
    if (contentType !== "video" && contentType !== "text" && contentType !== "quiz") {
      return NextResponse.json(
        { error: "contentType must be video, text, or quiz" },
        { status: 400 }
      );
    }
    lesson.contentType = contentType;

    if (contentType === "video") {
      if (body.youtubeUrl !== undefined) {
        lesson.youtubeUrl = typeof body.youtubeUrl === "string" ? body.youtubeUrl : undefined;
      }
      if (body.youtubeVideoId !== undefined) {
        lesson.youtubeVideoId = typeof body.youtubeVideoId === "string" ? body.youtubeVideoId : undefined;
      }
      if (body.durationSeconds !== undefined) {
        lesson.durationSeconds = typeof body.durationSeconds === "number" ? body.durationSeconds : undefined;
      }
      lesson.textContent = undefined;
      lesson.quizQuestions = undefined;
      lesson.passPercentage = undefined;
    } else if (contentType === "text") {
      if (body.textContent !== undefined) {
        lesson.textContent = typeof body.textContent === "string" ? body.textContent : undefined;
      }
      lesson.youtubeUrl = undefined;
      lesson.youtubeVideoId = undefined;
      lesson.durationSeconds = undefined;
      lesson.quizQuestions = undefined;
      lesson.passPercentage = undefined;
    } else if (contentType === "quiz") {
      if (body.passPercentage !== undefined) {
        lesson.passPercentage = typeof body.passPercentage === "number" ? body.passPercentage : 70;
      }
      if (body.quizQuestions !== undefined) {
        const quizValidation = validateQuizQuestions(body.quizQuestions);
        if (!quizValidation.valid) {
          return NextResponse.json({ error: quizValidation.error }, { status: 400 });
        }
        lesson.quizQuestions = quizValidation.data;
      } else if (body.contentType !== undefined && lesson.isModified("contentType")) {
        lesson.quizQuestions = [];
      }
      lesson.youtubeUrl = undefined;
      lesson.youtubeVideoId = undefined;
      lesson.durationSeconds = undefined;
      lesson.textContent = undefined;
    }

    await lesson.save();
    return NextResponse.json(lesson);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update lesson" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, lessonId } = await params;
  if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(lessonId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    await connectDB();
    const lesson = await Lesson.findOne({ _id: lessonId, courseId: id });
    if (!lesson) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await Lesson.deleteOne({ _id: lessonId, courseId: id });
    await Course.findByIdAndUpdate(id, { $inc: { lessonCount: -1 } });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete lesson" }, { status: 500 });
  }
}
