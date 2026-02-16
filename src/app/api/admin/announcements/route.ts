import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Announcement } from "@/models/Announcement";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await connectDB();
    const list = await Announcement.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json(list);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load announcements" },
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
    const { title, description, isLive } = body;
    if (!title || description === undefined) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      );
    }
    await connectDB();
    const doc = await Announcement.create({
      title: String(title).trim(),
      description: String(description).trim(),
      isLive: Boolean(isLive),
    });
    return NextResponse.json({ success: true, id: doc._id });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to create announcement" },
      { status: 500 }
    );
  }
}
