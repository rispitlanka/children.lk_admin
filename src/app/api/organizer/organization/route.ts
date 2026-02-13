import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { isValidPhone, PHONE_VALIDATION_MESSAGE } from "@/lib/validation";
import { User } from "@/models/User";
import { Organization } from "@/models/Organization";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "organizer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await connectDB();
    const user = await User.findOne({ _id: session.user.id }).select("organizationId").lean();
    if (!user?.organizationId) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 });
    }
    const org = await Organization.findOne({ _id: user.organizationId }).lean();
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    return NextResponse.json(org);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "organizer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await connectDB();
    const user = await User.findOne({ _id: session.user.id }).select("organizationId").lean();
    if (!user?.organizationId) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 });
    }
    const body = await req.json();
    const { name, shortDescription, logo, contactEmail, contactPhone, address, website } = body;
    if (contactPhone !== undefined && !isValidPhone(contactPhone)) {
      return NextResponse.json(
        { error: PHONE_VALIDATION_MESSAGE },
        { status: 400 }
      );
    }
    const update: Record<string, unknown> = {};
    if (name !== undefined) update.name = name;
    if (shortDescription !== undefined) update.shortDescription = shortDescription;
    if (logo !== undefined) update.logo = logo;
    if (contactEmail !== undefined) update.contactEmail = contactEmail;
    if (contactPhone !== undefined) update.contactPhone = contactPhone;
    if (address !== undefined) update.address = address;
    if (website !== undefined) update.website = website;
    await Organization.updateOne({ _id: user.organizationId }, update);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to update" },
      { status: 500 }
    );
  }
}
