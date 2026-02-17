import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import "@/models/Organization";
import { EventRequest } from "@/models/EventRequest";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }
    await connectDB();
    const event = await EventRequest.findOne({
      _id: id,
      status: "approved",
    })
      .populate("organizationId", "name")
      .lean();

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(event);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load event" },
      { status: 500 }
    );
  }
}
