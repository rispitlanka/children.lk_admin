import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import {
  isValidSuperHeroContact,
  SUPER_HERO_CONTACT_VALIDATION_MESSAGE,
} from "@/lib/validation";
import { SuperHero } from "@/models/SuperHero";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await connectDB();
    const list = await SuperHero.find({})
      .populate("organizationId", "name")
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
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { name, color, contactNumber, image, imagePublicId, description, organizationId } = body;
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
    await connectDB();
    const doc = await SuperHero.create({
      name,
      color,
      contactNumber: String(contactNumber).trim(),
      image,
      imagePublicId: imagePublicId || undefined,
      description,
      organizationId: organizationId || undefined,
    });
    return NextResponse.json({ success: true, id: doc._id });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to create" },
      { status: 500 }
    );
  }
}
