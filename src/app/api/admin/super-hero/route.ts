import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { isValidPhone, PHONE_VALIDATION_MESSAGE } from "@/lib/validation";
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
    const { name, icon, iconType, iconPublicId, phone, shortDescription, organizationId } = body;
    if (!name || !icon || !phone || !shortDescription) {
      return NextResponse.json(
        { error: "Name, icon, phone and short description required" },
        { status: 400 }
      );
    }
    if (!isValidPhone(phone)) {
      return NextResponse.json(
        { error: PHONE_VALIDATION_MESSAGE },
        { status: 400 }
      );
    }
    await connectDB();
    const doc = await SuperHero.create({
      name,
      icon,
      iconType: iconType ?? "emoji",
      iconPublicId: iconPublicId || undefined,
      phone,
      shortDescription,
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
