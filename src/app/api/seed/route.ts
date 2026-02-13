import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not in production" }, { status: 403 });
  }
  try {
    await connectDB();
    const existing = await User.findOne({ role: "admin" }).lean();
    if (existing) {
      return NextResponse.json({
        message: "Admin already exists",
        email: existing.email,
      });
    }
    const hashed = await bcrypt.hash("admin123", 12);
    await User.create({
      email: "admin@children.lk",
      password: hashed,
      name: "Admin",
      role: "admin",
    });
    return NextResponse.json({
      message: "Admin user created",
      email: "admin@children.lk",
      password: "admin123",
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Seed failed" },
      { status: 500 }
    );
  }
}
