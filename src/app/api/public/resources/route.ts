import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import "@/models/Organization";
import { ResourceRequest } from "@/models/ResourceRequest";

export async function GET() {
  try {
    await connectDB();
    const list = await ResourceRequest.find({ status: "approved" })
      .populate("organizationId", "name")
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json(list);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load resources" },
      { status: 500 }
    );
  }
}
