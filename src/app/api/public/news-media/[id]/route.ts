import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { NewsMedia } from "@/models/NewsMedia";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const doc = await NewsMedia.findOne({ _id: id }).lean();
    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(doc);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load news media details" },
      { status: 500 }
    );
  }
}
