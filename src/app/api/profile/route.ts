import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { isValidPhone, PHONE_VALIDATION_MESSAGE } from "@/lib/validation";
import { User } from "@/models/User";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await connectDB();
    const user = await User.findOne({ _id: session.user.id })
      .select("name email avatar phone address")
      .lean();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      phone: user.phone,
      address: user.address,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { name, phone, address, avatar } = body;
    if (phone !== undefined && phone !== null && phone !== "" && !isValidPhone(phone)) {
      return NextResponse.json(
        { error: PHONE_VALIDATION_MESSAGE },
        { status: 400 }
      );
    }
    await connectDB();
    const update: Record<string, unknown> = {};
    if (name !== undefined) update.name = name;
    if (phone !== undefined) update.phone = phone;
    if (address !== undefined) update.address = address;
    if (avatar !== undefined) update.avatar = avatar;
    await User.updateOne({ _id: session.user.id }, update);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
