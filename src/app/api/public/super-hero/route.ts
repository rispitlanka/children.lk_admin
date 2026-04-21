import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import "@/models/Organization";
import { SuperHero } from "@/models/SuperHero";

export async function GET() {
  try {
    await connectDB();
    const list = await SuperHero.find({})
      .populate("organizationId", "name logo shortDescription")
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json(list);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load super heroes" },
      { status: 500 }
    );
  }
}
