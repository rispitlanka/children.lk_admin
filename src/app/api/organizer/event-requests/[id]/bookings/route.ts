import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { EventRequest } from "@/models/EventRequest";
import { Event } from "@/models/Event";
import { EventBooking } from "@/models/EventBooking";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "organizer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Event request ID is required" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(session.user.id).select("organizationId").lean();
    if (!user?.organizationId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const request = await EventRequest.findOne({
      _id: id,
      organizationId: user.organizationId,
      status: "approved",
    })
      .select("slug registrationMode name")
      .lean();

    if (!request) {
      return NextResponse.json({ error: "Approved event request not found" }, { status: 404 });
    }
    if (request.registrationMode !== "internal") {
      return NextResponse.json(
        { error: "This event is not configured for internal registration" },
        { status: 400 }
      );
    }

    const event = await Event.findOne({
      slug: request.slug,
      organizationId: user.organizationId,
    })
      .select("_id name slug pricingType")
      .lean();

    if (!event) {
      return NextResponse.json(
        { error: "Approved event record not found for this request" },
        { status: 404 }
      );
    }

    const bookings = await EventBooking.find({ eventId: event._id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      event: {
        _id: event._id,
        name: event.name,
        slug: event.slug,
        pricingType: event.pricingType ?? "free",
      },
      total: bookings.length,
      bookings,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load event bookings" },
      { status: 500 }
    );
  }
}
