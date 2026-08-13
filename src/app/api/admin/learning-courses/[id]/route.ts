import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { slugify } from "@/lib/slugify";
import { Course } from "@/models/Course";
import { Lesson } from "@/models/Lesson";

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
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  try {
    await connectDB();
    const doc = await Course.findById(id).lean();
    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
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
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  try {
    const body = await req.json();
    await connectDB();

    const update: Record<string, unknown> = {};

    if (typeof body.name === "string" && body.name.trim()) {
      update.name = body.name.trim();
    }
    if (typeof body.shortDescription === "string") {
      update.shortDescription = body.shortDescription;
    }
    if (body.description !== undefined) {
      update.description = body.description;
    }
    if (body.coverImage !== undefined) {
      update.coverImage = body.coverImage;
    }
    if (body.coverImagePublicId !== undefined) {
      update.coverImagePublicId = body.coverImagePublicId;
    }
    if (Array.isArray(body.tags)) {
      update.tags = body.tags;
    }
    if (body.ageGroup !== undefined) {
      update.ageGroup = body.ageGroup;
    }
    if (body.targetAudience !== undefined) {
      update.targetAudience = body.targetAudience;
    }
    if (body.visibilityStatus !== undefined) {
      update.visibilityStatus = body.visibilityStatus;
    }
    if (typeof body.lessonCount === "number") {
      update.lessonCount = body.lessonCount;
    }

    const hasManualSlug = typeof body.slug === "string" && body.slug.trim();
    const hasNameChange = typeof body.name === "string" && body.name.trim();

    if (hasManualSlug) {
      let base = slugify(body.slug.trim());
      if (!base) base = "course";
      let slug = base;
      let n = 0;
      while (await Course.exists({ slug, _id: { $ne: id } })) {
        n += 1;
        slug = `${base}-${n}`;
      }
      update.slug = slug;
    } else if (hasNameChange) {
      let base = slugify(body.name.trim());
      if (!base) base = "course";
      let slug = base;
      let n = 0;
      while (await Course.exists({ slug, _id: { $ne: id } })) {
        n += 1;
        slug = `${base}-${n}`;
      }
      update.slug = slug;
    }

    const doc = await Course.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(doc);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
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
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  try {
    await connectDB();
    const course = await Course.findById(id);
    if (!course) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await Lesson.deleteMany({ courseId: id });
    await Course.deleteOne({ _id: id });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
