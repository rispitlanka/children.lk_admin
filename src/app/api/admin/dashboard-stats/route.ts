import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import {
  ResourceRequest,
  MediaRequest,
  EventRequest,
  SuperHeroRequest,
  OrganizerRequest,
} from "@/models";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await connectDB();
    const [resourcePending, mediaPending, eventPending, superHeroPending, organizerRequests] =
      await Promise.all([
        ResourceRequest.countDocuments({ status: "pending" }),
        MediaRequest.countDocuments({ status: "pending" }),
        EventRequest.countDocuments({ status: "pending" }),
        SuperHeroRequest.countDocuments({ status: "pending" }),
        OrganizerRequest.countDocuments({}),
      ]);
    return NextResponse.json({
      resourceRequests: resourcePending,
      mediaRequests: mediaPending,
      eventRequests: eventPending,
      superHeroRequests: superHeroPending,
      organizerRequests,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load stats" },
      { status: 500 }
    );
  }
}
