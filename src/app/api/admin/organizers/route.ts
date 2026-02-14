import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { sendOrganizerCredentialsEmail } from "@/lib/email";
import { isValidPhone, PHONE_VALIDATION_MESSAGE } from "@/lib/validation";
import { User } from "@/models/User";
import { Organization } from "@/models/Organization";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await connectDB();
    const organizers = await User.find({ role: "organizer" })
      .select("name email createdAt")
      .populate("organizationId", "name contactEmail contactPhone")
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json(organizers);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load organizers" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const {
      name,
      email,
      password,
      organizationName,
      shortDescription,
      logo,
      contactEmail,
      contactPhone,
      address,
      website,
    } = body;
    if (!name || !email || !password || !organizationName || !shortDescription || !contactEmail || !contactPhone || !address) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    if (!isValidPhone(contactPhone)) {
      return NextResponse.json(
        { error: PHONE_VALIDATION_MESSAGE },
        { status: 400 }
      );
    }
    await connectDB();
    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }
    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      email,
      password: hashed,
      name,
      role: "organizer",
    });
    await Organization.create({
      name: organizationName,
      shortDescription,
      logo: logo || undefined,
      contactEmail,
      contactPhone,
      address,
      website: website || undefined,
      userId: user._id,
    });
    const orgDoc = await Organization.findOne({ userId: user._id });
    if (orgDoc) {
      await User.updateOne({ _id: user._id }, { organizationId: orgDoc._id });
    }
    try {
      await sendOrganizerCredentialsEmail(email, name, email, password);
    } catch (emailErr) {
      console.error("Failed to send credentials email:", emailErr);
      // Organizer is created; don't fail the request
    }
    return NextResponse.json({ success: true, id: user._id });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to create organizer" },
      { status: 500 }
    );
  }
}
