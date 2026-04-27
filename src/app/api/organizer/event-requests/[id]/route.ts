import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ensureTags } from "@/lib/tags";
import { isRichTextEmpty } from "@/lib/rich-text";
import { slugify } from "@/lib/slugify";
import { fromZonedTime } from "date-fns-tz";
import { User } from "@/models/User";
import { EventRequest } from "@/models/EventRequest";
import { Event } from "@/models/Event";

const TZ = "Asia/Colombo";

function buildEventLocationDisplay(name: string, address: string, contact: string): string {
  const bits = [
    name.trim(),
    address.trim(),
    contact.trim() ? `Contact: ${contact.trim()}` : "",
  ].filter(Boolean);
  return bits.join(" · ");
}

async function uniqueEventSlug(base: string, currentId: string): Promise<string> {
  let slug = base || "event";
  let n = 0;
  while (
    (await EventRequest.exists({ slug, _id: { $ne: currentId } })) ||
    (await Event.exists({ slug }))
  ) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "organizer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams?.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ _id: session.user.id }).select("organizationId").lean();
    if (!user?.organizationId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const existing = await EventRequest.findOne({ _id: id, organizationId: user.organizationId }).lean();
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const isDraft = existing.visibilityStatus === "draft";
    const isDenied = existing.status === "denied";
    if (!isDraft && !isDenied) {
      return NextResponse.json(
        { error: "Cannot edit while request is awaiting admin review or already approved" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const {
      name,
      eventCategory,
      locationName,
      locationAddress,
      locationContact,
      locationLatitude,
      locationLongitude,
      startDate,
      endDate,
      description,
      tags,
      pricingType,
      ticketOptions,
      registrationMode,
      registrationExternalUrl,
      internalRegistrationFields,
      whoCanJoin,
      coverImage,
      coverImagePublicId,
      highlight1,
      highlight2,
      highlight3,
      slug: slugInput,
      visibilityStatus,
    } = body;

    const nm = typeof name === "string" ? name.trim() : "";
    const cat = typeof eventCategory === "string" ? eventCategory.trim() : "";
    const locName = typeof locationName === "string" ? locationName.trim() : "";
    const locAddr = typeof locationAddress === "string" ? locationAddress.trim() : "";
    const locContact = typeof locationContact === "string" ? locationContact.trim() : "";
    const desc = typeof description === "string" ? description : "";
    const normalizedVisibilityStatus = visibilityStatus === "draft" ? "draft" : "published";
    const normalizedPricingType = pricingType === "paid" ? "paid" : "free";
    const normalizedRegistrationMode = registrationMode === "internal" ? "internal" : "external";
    const normalizedWhoCanJoin = Array.isArray(whoCanJoin)
      ? whoCanJoin.map((x) => (typeof x === "string" ? x.trim() : "")).filter(Boolean)
      : [];
    const normalizedInternalFields = Array.isArray(internalRegistrationFields)
      ? internalRegistrationFields
          .map((x) => (typeof x === "string" ? x.trim().toLowerCase() : ""))
          .filter((x) => ["name", "email", "phone"].includes(x))
      : [];
    const normalizedTicketOptions = Array.isArray(ticketOptions)
      ? ticketOptions
          .map((item) => {
            if (!item || typeof item !== "object") return null;
            const t = "ticketType" in item && typeof item.ticketType === "string" ? item.ticketType.trim() : "";
            const p = "ticketPrice" in item ? Number(item.ticketPrice) : Number.NaN;
            if (!t || !Number.isFinite(p) || p < 0) return null;
            return { ticketType: t, ticketPrice: p };
          })
          .filter((item): item is { ticketType: string; ticketPrice: number } => item !== null)
      : [];

    if (!nm || !cat || !startDate || isRichTextEmpty(desc)) {
      return NextResponse.json(
        { error: "Title, category, start date, and description are required" },
        { status: 400 }
      );
    }
    if (!locName || !locAddr || !locContact) {
      return NextResponse.json(
        { error: "Location name, address, and contact are required" },
        { status: 400 }
      );
    }
    if (normalizedPricingType === "paid" && normalizedTicketOptions.length === 0) {
      return NextResponse.json(
        { error: "Add at least one valid ticket type and price for paid events" },
        { status: 400 }
      );
    }
    if (normalizedRegistrationMode === "external") {
      if (typeof registrationExternalUrl !== "string" || !registrationExternalUrl.trim()) {
        return NextResponse.json({ error: "External registration URL is required" }, { status: 400 });
      }
    }
    if (normalizedRegistrationMode === "internal" && normalizedInternalFields.length === 0) {
      return NextResponse.json(
        { error: "Select at least one internal registration field" },
        { status: 400 }
      );
    }
    if (normalizedWhoCanJoin.length === 0) {
      return NextResponse.json({ error: "Add at least one \"Who can join\" audience" }, { status: 400 });
    }

    const lat =
      locationLatitude !== undefined && locationLatitude !== "" ? Number(locationLatitude) : undefined;
    const lng =
      locationLongitude !== undefined && locationLongitude !== "" ? Number(locationLongitude) : undefined;
    const hasCoords = lat !== undefined && lng !== undefined && Number.isFinite(lat) && Number.isFinite(lng);

    const slugBase =
      typeof slugInput === "string" && slugInput.trim() ? slugify(slugInput.trim()) : slugify(nm);
    const slug = await uniqueEventSlug(slugBase, id);
    const tagList = Array.isArray(tags) ? tags : [];

    await EventRequest.updateOne(
      { _id: id, organizationId: user.organizationId },
      {
        name: nm,
        slug,
        location: buildEventLocationDisplay(locName, locAddr, locContact),
        eventCategory: cat,
        locationName: locName,
        locationAddress: locAddr,
        locationContact: locContact,
        locationLatitude: hasCoords ? lat : undefined,
        locationLongitude: hasCoords ? lng : undefined,
        startDate: fromZonedTime(startDate, TZ),
        endDate: endDate ? fromZonedTime(endDate, TZ) : undefined,
        description: desc.trim(),
        tags: tagList,
        pricingType: normalizedPricingType,
        ticketOptions: normalizedPricingType === "paid" ? normalizedTicketOptions : [],
        ticketType: normalizedPricingType === "paid" ? normalizedTicketOptions[0]?.ticketType : undefined,
        ticketPrice: normalizedPricingType === "paid" ? normalizedTicketOptions[0]?.ticketPrice : undefined,
        registrationMode: normalizedRegistrationMode,
        registrationExternalUrl:
          normalizedRegistrationMode === "external" && typeof registrationExternalUrl === "string"
            ? registrationExternalUrl.trim()
            : undefined,
        internalRegistrationFields:
          normalizedRegistrationMode === "internal" ? normalizedInternalFields : [],
        whoCanJoin: normalizedWhoCanJoin,
        coverImage: coverImage || undefined,
        coverImagePublicId: coverImagePublicId || undefined,
        highlight1: typeof highlight1 === "string" ? highlight1.trim() || undefined : undefined,
        highlight2: typeof highlight2 === "string" ? highlight2.trim() || undefined : undefined,
        highlight3: typeof highlight3 === "string" ? highlight3.trim() || undefined : undefined,
        visibilityStatus: normalizedVisibilityStatus,
        status: "pending",
        adminReason: undefined,
        reviewedAt: undefined,
        reviewedBy: undefined,
      }
    );
    await ensureTags(tagList);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating event request:", error);
    return NextResponse.json({ error: "Failed to update event request" }, { status: 500 });
  }
}