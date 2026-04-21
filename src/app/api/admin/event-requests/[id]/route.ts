import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { slugify } from "@/lib/slugify";
import { EventRequest } from "@/models/EventRequest";
import { Event } from "@/models/Event";

async function uniqueApprovedEventSlug(base: string): Promise<string> {
  let slug = base || "event";
  let n = 0;
  while (await Event.exists({ slug })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    await connectDB();
    const request = await EventRequest.findById(id)
      .populate("organizationId", "name contactEmail contactPhone")
      .lean();
    if (!request) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(request);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const body = await _req.json();
    const { status, adminReason } = body;
    if (!status || !["approved", "denied"].includes(status)) {
      return NextResponse.json(
        { error: "status must be approved or denied" },
        { status: 400 }
      );
    }
    if (status === "denied" && !adminReason?.trim()) {
      return NextResponse.json(
        { error: "Reason is required when denying" },
        { status: 400 }
      );
    }
    await connectDB();
    const request = await EventRequest.findById(id).lean();
    if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (request.status !== "pending") {
      return NextResponse.json(
        { error: "Request already reviewed" },
        { status: 400 }
      );
    }
    const reviewedBy = session.user.id;
    const reviewedAt = new Date();
    if (status === "approved") {
      const slugBase = slugify(request.slug || request.name || "event");
      const approvedSlug = await uniqueApprovedEventSlug(slugBase || "event");
      await Event.create({
        name: request.name,
        slug: approvedSlug,
        location: request.location,
        eventCategory: request.eventCategory,
        locationName: request.locationName,
        locationAddress: request.locationAddress,
        locationContact: request.locationContact,
        locationLatitude: request.locationLatitude,
        locationLongitude: request.locationLongitude,
        startDate: request.startDate,
        endDate: request.endDate,
        description: request.description,
        tags: request.tags ?? [],
        pricingType: request.pricingType,
        ticketOptions: request.ticketOptions ?? [],
        ticketType: request.ticketType,
        ticketPrice: request.ticketPrice,
        registrationMode: request.registrationMode,
        registrationExternalUrl: request.registrationExternalUrl,
        internalRegistrationFields: request.internalRegistrationFields ?? [],
        whoCanJoin: request.whoCanJoin ?? [],
        coverImage: request.coverImage,
        coverImagePublicId: request.coverImagePublicId,
        highlight1: request.highlight1,
        highlight2: request.highlight2,
        highlight3: request.highlight3,
        organizationId: request.organizationId,
      });
    }
    await EventRequest.updateOne(
      { _id: id },
      { status, adminReason: adminReason?.trim(), reviewedAt, reviewedBy }
    );
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to update" },
      { status: 500 }
    );
  }
}
