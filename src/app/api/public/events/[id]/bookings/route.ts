import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Event } from "@/models/Event";
import { EventBooking } from "@/models/EventBooking";

type TicketOption = { ticketType: string; ticketPrice: number };

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      name,
      email,
      phone,
      ticketType,
    }: { name?: unknown; email?: unknown; phone?: unknown; ticketType?: unknown } = body;

    const nm = typeof name === "string" ? name.trim() : "";
    const em = typeof email === "string" ? email.trim().toLowerCase() : "";
    const ph = typeof phone === "string" ? phone.trim() : "";
    const requestedTicketType = typeof ticketType === "string" ? ticketType.trim() : "";

    if (!nm || !em || !ph) {
      return NextResponse.json(
        { error: "name, email, and phone are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const event = await Event.findById(id).lean();
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.registrationMode !== "internal") {
      return NextResponse.json(
        { error: "This event does not support internal registration" },
        { status: 400 }
      );
    }

    const ticketOptions = Array.isArray(event.ticketOptions)
      ? (event.ticketOptions as TicketOption[])
      : [];
    const isPaid = event.pricingType === "paid";

    let selectedTicket: TicketOption | undefined;
    if (isPaid) {
      if (ticketOptions.length > 0) {
        selectedTicket = ticketOptions.find((t) => t.ticketType === requestedTicketType);
        if (!selectedTicket) {
          return NextResponse.json(
            { error: "Valid ticketType is required for this paid event" },
            { status: 400 }
          );
        }
      } else if (event.ticketType && typeof event.ticketPrice === "number") {
        if (requestedTicketType && requestedTicketType !== event.ticketType) {
          return NextResponse.json(
            { error: "Valid ticketType is required for this paid event" },
            { status: 400 }
          );
        }
        selectedTicket = { ticketType: event.ticketType, ticketPrice: event.ticketPrice };
      } else {
        return NextResponse.json(
          { error: "Ticket setup is invalid for this paid event" },
          { status: 400 }
        );
      }
    }

    const created = await EventBooking.create({
      eventId: event._id,
      eventSlug: event.slug,
      organizerOrganizationId: event.organizationId,
      name: nm,
      email: em,
      phone: ph,
      ticketType: selectedTicket?.ticketType,
      ticketPrice: selectedTicket?.ticketPrice,
    });

    return NextResponse.json({
      success: true,
      booking: {
        _id: created._id,
        eventId: created.eventId,
        name: created.name,
        email: created.email,
        phone: created.phone,
        ticketType: created.ticketType ?? null,
        ticketPrice: created.ticketPrice ?? null,
        createdAt: created.createdAt,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to create event booking" },
      { status: 500 }
    );
  }
}
