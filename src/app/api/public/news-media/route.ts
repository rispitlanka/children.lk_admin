import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { NewsMedia } from "@/models/NewsMedia";

export async function GET() {
  try {
    await connectDB();
    const list = await NewsMedia.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json(list);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load news media" },
      { status: 500 }
    );
  }
}
