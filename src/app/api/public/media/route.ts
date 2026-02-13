import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Media } from "@/models/Media";

export async function GET() {
  try {
    await connectDB();
    const list = await Media.find({})
      .sort({ createdAt: -1 })
      .select("name description files createdAt")
      .lean();
    return NextResponse.json(list);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load media" },
      { status: 500 }
    );
  }
}
