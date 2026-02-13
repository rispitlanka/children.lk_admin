import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { isValidPhone, PHONE_VALIDATION_MESSAGE } from "@/lib/validation";
import { SuperHero } from "@/models/SuperHero";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const body = await req.json();
    const { name, icon, iconType, iconPublicId, phone, shortDescription, organizationId } = body;
    if (phone !== undefined && !isValidPhone(phone)) {
      return NextResponse.json(
        { error: PHONE_VALIDATION_MESSAGE },
        { status: 400 }
      );
    }
    await connectDB();
    const update: Record<string, unknown> = {};
    if (name !== undefined) update.name = name;
    if (icon !== undefined) update.icon = icon;
    if (iconType !== undefined) update.iconType = iconType;
    if (iconPublicId !== undefined) update.iconPublicId = iconPublicId;
    if (phone !== undefined) update.phone = phone;
    if (shortDescription !== undefined) update.shortDescription = shortDescription;
    if (organizationId !== undefined) update.organizationId = organizationId;
    await SuperHero.updateOne({ _id: id }, update);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to update" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    await SuperHero.deleteOne({ _id: id });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to delete" },
      { status: 500 }
    );
  }
}
