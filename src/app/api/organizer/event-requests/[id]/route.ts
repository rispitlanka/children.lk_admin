import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { EventRequest } from "@/models/EventRequest";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "organizer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Handle both sync and async params
    const resolvedParams = await Promise.resolve(params);
    console.log("Full params object:", resolvedParams);
    console.log("Received ID:", resolvedParams?.id, "Type:", typeof resolvedParams?.id);
    
    if (!resolvedParams?.id) {
      return NextResponse.json({ error: "ID parameter is required" }, { status: 400 });
    }

    const id = resolvedParams.id;
    
    // Validate ObjectId format if needed for debugging
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("ID is not a valid ObjectId format:", id);
    }

    await connectDB();

    const user = await User.findOne({ _id: session.user.id }).select("organizationId").lean();
    if (!user?.organizationId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    console.log("Looking for event with ID:", id, "and organizationId:", user.organizationId);

    // First, let's see if the event exists at all (without organizationId filter)
    const anyEvent = await EventRequest.findOne({ _id: id }).lean();
    console.log("Event exists (any org):", anyEvent ? "Yes" : "No");
    if (anyEvent) {
      console.log("Event organizationId:", anyEvent.organizationId);
      console.log("User organizationId:", user.organizationId);
      console.log("IDs match:", anyEvent.organizationId.toString() === user.organizationId.toString());
    }

    // Try with string first, then ObjectId if needed
    let eventRequest = await EventRequest.findOne({
      _id: id,
      organizationId: user.organizationId,
    }).lean();

    // If not found and ID looks like it could be an ObjectId, try converting
    if (!eventRequest && mongoose.Types.ObjectId.isValid(id)) {
      eventRequest = await EventRequest.findOne({
        _id: new mongoose.Types.ObjectId(id),
        organizationId: new mongoose.Types.ObjectId(user.organizationId),
      }).lean();
    }

    console.log("Found event (with org filter):", eventRequest ? "Yes" : "No");

    if (!eventRequest) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(eventRequest);
  } catch (error) {
    console.error("Error fetching event request:", error);
    return NextResponse.json(
      { error: "Failed to fetch event request" },
      { status: 500 }
    );
  }
}