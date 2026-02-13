import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import {
  ResourceRequest,
  MediaRequest,
  EventRequest,
  SuperHeroRequest,
} from "@/models";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "organizer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await connectDB();
    const user = await User.findOne({ _id: session.user.id }).select("organizationId").lean();
    const orgId = user?.organizationId;
    if (!orgId) {
      return NextResponse.json({
        resourcesPending: 0,
        resourcesApproved: 0,
        mediaPending: 0,
        mediaApproved: 0,
        eventsPending: 0,
        eventsApproved: 0,
        superHeroPending: 0,
        superHeroApproved: 0,
      });
    }
    const [
      resourcesPending,
      resourcesApproved,
      mediaPending,
      mediaApproved,
      eventsPending,
      eventsApproved,
      superHeroPending,
      superHeroApproved,
    ] = await Promise.all([
      ResourceRequest.countDocuments({ organizationId: orgId, status: "pending" }),
      ResourceRequest.countDocuments({ organizationId: orgId, status: "approved" }),
      MediaRequest.countDocuments({ organizationId: orgId, status: "pending" }),
      MediaRequest.countDocuments({ organizationId: orgId, status: "approved" }),
      EventRequest.countDocuments({ organizationId: orgId, status: "pending" }),
      EventRequest.countDocuments({ organizationId: orgId, status: "approved" }),
      SuperHeroRequest.countDocuments({ organizationId: orgId, status: "pending" }),
      SuperHeroRequest.countDocuments({ organizationId: orgId, status: "approved" }),
    ]);
    return NextResponse.json({
      resourcesPending,
      resourcesApproved,
      mediaPending,
      mediaApproved,
      eventsPending,
      eventsApproved,
      superHeroPending,
      superHeroApproved,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load stats" },
      { status: 500 }
    );
  }
}
