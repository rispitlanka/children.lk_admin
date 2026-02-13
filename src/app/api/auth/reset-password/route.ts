import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, otp, newPassword } = body;
    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { error: "Email, OTP and new password are required" },
        { status: 400 }
      );
    }
    await connectDB();
    const user = await User.findOne({ email }).lean();
    if (!user || user.otp !== otp || !user.otpExpires || user.otpExpires < new Date()) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 400 }
      );
    }
    const hashed = await bcrypt.hash(newPassword, 12);
    await User.updateOne(
      { _id: user._id },
      { password: hashed, otp: undefined, otpExpires: undefined }
    );
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
