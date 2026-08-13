import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Course } from "@/models/Course";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const ageGroup = searchParams.get("ageGroup");
    const targetAudience = searchParams.get("targetAudience");
    const tag = searchParams.get("tag");

    const query: Record<string, unknown> = {
      visibilityStatus: "published",
    };

    if (ageGroup) {
      query.ageGroup = ageGroup;
    }
    if (targetAudience) {
      query.targetAudience = targetAudience;
    }
    if (tag) {
      query.tags = tag;
    }

    const list = await Course.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json(list);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load public learning courses" },
      { status: 500 }
    );
  }
}
