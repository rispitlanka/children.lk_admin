import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import "@/models/Organization";
import { Resource } from "@/models/Resource";

export async function GET() {
  try {
    await connectDB();
    const list = await Resource.find({})
      .populate("organizationId")
      .sort({ createdAt: -1 })
      .lean();
    const normalized = list.map((item) => ({
      ...item,
      publicationDate: item.publicationDate ?? item.contentPublishedAt ?? null,
    }));
    return NextResponse.json(normalized);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load resources" },
      { status: 500 }
    );
  }
}
