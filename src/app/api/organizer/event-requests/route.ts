import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ensureTags } from "@/lib/tags";
import { isRichTextEmpty } from "@/lib/rich-text";
import { slugify } from "@/lib/slugify";
import { User } from "@/models/User";
import { EventRequest } from "@/models/EventRequest";
import { Event } from "@/models/Event";

function buildEventLocationDisplay(name: string, address: string, contact: string): string {
  const bits = [
    name.trim(),
    address.trim(),
    contact.trim() ? `Contact: ${contact.trim()}` : "",
  ].filter(Boolean);
  return bits.join(" · ");
}

async function uniqueEventSlug(base: string): Promise<string> {
  let slug = base || "event";
  let n = 0;
  while ((await EventRequest.exists({ slug })) || (await Event.exists({ slug }))) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "organizer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await connectDB();
    const user = await User.findOne({ _id: session.user.id }).select("organizationId").lean();
    if (!user?.organizationId) return NextResponse.json([]);
    const list = await EventRequest.find({ organizationId: user.organizationId })
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json(list);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "organizer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await connectDB();
    const user = await User.findOne({ _id: session.user.id }).select("organizationId").lean();
    if (!user?.organizationId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }
    const body = await req.json();
    const {
      name,
      location: locationLegacy,
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
      ticketType,
      ticketPrice,
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
    } = body;

    const nm = typeof name === "string" ? name.trim() : "";
    const cat = typeof eventCategory === "string" ? eventCategory.trim() : "";
    const locName = typeof locationName === "string" ? locationName.trim() : "";
    const locAddr = typeof locationAddress === "string" ? locationAddress.trim() : "";
    const locContact = typeof locationContact === "string" ? locationContact.trim() : "";
    const desc = typeof description === "string" ? description : "";
    const normalizedPricingType = pricingType === "paid" ? "paid" : "free";
    const normalizedRegistrationMode = registrationMode === "internal" ? "internal" : "external";
    const normalizedWhoCanJoin = Array.isArray(whoCanJoin)
      ? whoCanJoin
          .map((x) => (typeof x === "string" ? x.trim() : ""))
          .filter(Boolean)
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
    const slugBase =
      typeof slugInput === "string" && slugInput.trim()
        ? slugify(slugInput.trim())
        : slugify(nm);

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
    if (normalizedPricingType === "paid") {
      if (normalizedTicketOptions.length === 0) {
        const fallbackType = typeof ticketType === "string" ? ticketType.trim() : "";
        const fallbackPrice = Number(ticketPrice);
        if (!fallbackType || !Number.isFinite(fallbackPrice) || fallbackPrice < 0) {
          return NextResponse.json(
            { error: "Add at least one valid ticket type and price for paid events" },
            { status: 400 }
          );
        }
        normalizedTicketOptions.push({ ticketType: fallbackType, ticketPrice: fallbackPrice });
      }
    }
    if (normalizedRegistrationMode === "external") {
      if (typeof registrationExternalUrl !== "string" || !registrationExternalUrl.trim()) {
        return NextResponse.json({ error: "External registration URL is required" }, { status: 400 });
      }
    }
    if (normalizedRegistrationMode === "internal" && normalizedInternalFields.length === 0) {
      return NextResponse.json(
        { error: "Select at least one internal registration field (name/email/phone)" },
        { status: 400 }
      );
    }
    if (normalizedWhoCanJoin.length === 0) {
      return NextResponse.json({ error: "Add at least one \"Who can join\" audience" }, { status: 400 });
    }
    if (!slugBase) {
      return NextResponse.json(
        { error: "A valid slug could not be generated for this event" },
        { status: 400 }
      );
    }

    const lat =
      locationLatitude !== undefined && locationLatitude !== null && locationLatitude !== ""
        ? Number(locationLatitude)
        : undefined;
    const lng =
      locationLongitude !== undefined && locationLongitude !== null && locationLongitude !== ""
        ? Number(locationLongitude)
        : undefined;
    const hasCoords = lat !== undefined && lng !== undefined && Number.isFinite(lat) && Number.isFinite(lng);

    const locationDisplay =
      typeof locationLegacy === "string" && locationLegacy.trim()
        ? locationLegacy.trim()
        : buildEventLocationDisplay(locName, locAddr, locContact);

    const tagList = Array.isArray(tags) ? tags : [];
    const slug = await uniqueEventSlug(slugBase);

    const createdEvent = await EventRequest.create({
      name: nm,
      slug,
      location: locationDisplay,
      eventCategory: cat,
      locationName: locName,
      locationAddress: locAddr,
      locationContact: locContact,
      locationLatitude: hasCoords ? lat : undefined,
      locationLongitude: hasCoords ? lng : undefined,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
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
      organizationId: user.organizationId,
      status: "pending",
    });
    await ensureTags(tagList);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to submit" },
      { status: 500 }
    );
  }
}
