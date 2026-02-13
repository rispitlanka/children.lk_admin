import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { isValidPhone, PHONE_VALIDATION_MESSAGE } from "@/lib/validation";
import { OrganizerRequest } from "@/models/OrganizerRequest";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, message } = body;
    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }
    if (phone && phone.trim() && !isValidPhone(phone.trim())) {
      return NextResponse.json(
        { error: PHONE_VALIDATION_MESSAGE },
        { status: 400 }
      );
    }
    await connectDB();
    await OrganizerRequest.create({
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim(),
      message: message?.trim(),
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to submit request" },
      { status: 500 }
    );
  }
}
