import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { slugify } from "@/lib/slugify";
import { Course } from "@/models/Course";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await connectDB();
    const list = await Course.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(list);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const shortDescription =
      typeof body.shortDescription === "string" ? body.shortDescription.trim() : "";

    if (!name || !shortDescription) {
      return NextResponse.json(
        { error: "Name and shortDescription are required" },
        { status: 400 }
      );
    }

    await connectDB();

    let base = slugify(typeof body.slug === "string" && body.slug.trim() ? body.slug.trim() : name);
    if (!base) base = "course";
    let slug = base;
    let n = 0;
    while (await Course.exists({ slug })) {
      n += 1;
      slug = `${base}-${n}`;
    }

    const doc = await Course.create({
      name,
      slug,
      shortDescription,
      description: typeof body.description === "string" ? body.description : undefined,
      coverImage: typeof body.coverImage === "string" ? body.coverImage : undefined,
      coverImagePublicId:
        typeof body.coverImagePublicId === "string" ? body.coverImagePublicId : undefined,
      tags: Array.isArray(body.tags) ? body.tags : [],
      ageGroup: body.ageGroup || undefined,
      targetAudience: body.targetAudience || undefined,
      visibilityStatus: body.visibilityStatus || "draft",
      lessonCount: typeof body.lessonCount === "number" ? body.lessonCount : 0,
    });

    return NextResponse.json(doc);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
