import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { EventRequest } from "@/models/EventRequest";

export async function GET() {
  try {
    await connectDB();
    const list = await EventRequest.find({ status: "approved" })
      .populate("organizationId", "name")
      .sort({ startDate: 1 })
      .lean();
    return NextResponse.json(list);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load events" },
      { status: 500 }
    );
  }
}
