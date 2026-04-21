import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import "@/models/Organization";
import { Event } from "@/models/Event";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const normalizedSlug = (slug || "").trim();
    if (!normalizedSlug) {
      return NextResponse.json({ error: "Event slug is required" }, { status: 400 });
    }

    await connectDB();
    const event = await Event.findOne({ slug: normalizedSlug })
      .populate("organizationId", "name")
      .lean();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load event" }, { status: 500 });
  }
}
