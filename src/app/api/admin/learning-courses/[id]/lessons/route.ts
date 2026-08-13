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
    await connectDB();

    const course = await Course.findById(id).lean();
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const list = await Lesson.find({ courseId: id }).sort({ order: 1 }).lean();
    return NextResponse.json(list);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load lessons" }, { status: 500 });
  }
}

export async function POST(
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

    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const contentType = body.contentType;
    if (contentType !== "video" && contentType !== "text" && contentType !== "quiz") {
      return NextResponse.json(
        { error: "contentType must be video, text, or quiz" },
        { status: 400 }
      );
    }

    await connectDB();

    const course = await Course.findById(id);
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    let order: number;
    if (typeof body.order === "number") {
      order = body.order;
    } else {
      const maxLesson = await Lesson.findOne({ courseId: id })
        .sort({ order: -1 })
        .select("order")
        .lean();
      order = maxLesson && typeof maxLesson.order === "number" ? maxLesson.order + 1 : 0;
    }

    const lessonData: Record<string, unknown> = {
      courseId: id,
      title,
      contentType,
      visibilityStatus: body.visibilityStatus === "published" ? "published" : "draft",
      order,
    };

    if (contentType === "video") {
      lessonData.youtubeUrl = typeof body.youtubeUrl === "string" ? body.youtubeUrl : undefined;
      lessonData.youtubeVideoId = typeof body.youtubeVideoId === "string" ? body.youtubeVideoId : undefined;
      lessonData.durationSeconds = typeof body.durationSeconds === "number" ? body.durationSeconds : undefined;
    } else if (contentType === "text") {
      lessonData.textContent = typeof body.textContent === "string" ? body.textContent : undefined;
    } else if (contentType === "quiz") {
      lessonData.passPercentage = typeof body.passPercentage === "number" ? body.passPercentage : 70;
      const quizValidation = validateQuizQuestions(body.quizQuestions);
      if (!quizValidation.valid) {
        return NextResponse.json({ error: quizValidation.error }, { status: 400 });
      }
      lessonData.quizQuestions = quizValidation.data;
    }

    const doc = await Lesson.create(lessonData);

    await Course.findByIdAndUpdate(id, { $inc: { lessonCount: 1 } });

    return NextResponse.json(doc);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create lesson" }, { status: 500 });
  }
}
