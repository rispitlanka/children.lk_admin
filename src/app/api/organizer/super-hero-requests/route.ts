import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import {
  isValidSuperHeroContact,
  SUPER_HERO_CONTACT_VALIDATION_MESSAGE,
} from "@/lib/validation";
import { User } from "@/models/User";
import { SuperHeroRequest } from "@/models/SuperHeroRequest";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "organizer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await connectDB();
    const user = await User.findOne({ _id: session.user.id }).select("organizationId").lean();
    if (!user?.organizationId) return NextResponse.json([]);
    const list = await SuperHeroRequest.find({ organizationId: user.organizationId })
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
    const { name, color, contactNumber, image, imagePublicId, description } = body;
    if (!name || !color || !contactNumber || !image || !description) {
      return NextResponse.json(
        { error: "Name, color, contact number, image and description are required" },
        { status: 400 }
      );
    }
    if (!isValidSuperHeroContact(contactNumber)) {
      return NextResponse.json(
        { error: SUPER_HERO_CONTACT_VALIDATION_MESSAGE },
        { status: 400 }
      );
    }
    await SuperHeroRequest.create({
      name,
      color,
      contactNumber: String(contactNumber).trim(),
      image,
      imagePublicId: imagePublicId || undefined,
      description,
      organizationId: user.organizationId,
      status: "pending",
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to submit" },
      { status: 500 }
    );
  }
}
