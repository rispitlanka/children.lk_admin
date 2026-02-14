import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ensureTags } from "@/lib/tags";
import { User } from "@/models/User";
import { EventRequest } from "@/models/EventRequest";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "organizer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await connectDB();
    const user = await User.findOne({ _id: session.user.id }).select("organizationId").lean();
    if (!user?.organizationId) return NextResponse.json([]);
    const list = await EventRequest.find({ organizationId: user.organizationId })
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
    const { name, location, startDate, endDate, description, tags, registrationLink, coverImage, coverImagePublicId, targetAudience, ageGroup } = body;
    if (!name || !location || !startDate || !description) {
      return NextResponse.json(
        { error: "Name, location, start date and description required" },
        { status: 400 }
      );
    }
    const tagList = Array.isArray(tags) ? tags : [];
    
    console.log("Creating event with data:", {
      name,
      location,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      description,
      tags: tagList,
      registrationLink: registrationLink || undefined,
      coverImage: coverImage || undefined,
      coverImagePublicId: coverImagePublicId || undefined,
      targetAudience: targetAudience || "children",
      ageGroup: targetAudience === "children" ? (ageGroup || "1-5") : undefined,
      organizationId: user.organizationId,
      status: "pending",
    });
    
    const createdEvent = await EventRequest.create({
      name,
      location,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      description,
      tags: tagList,
      registrationLink: registrationLink || undefined,
      coverImage: coverImage || undefined,
      coverImagePublicId: coverImagePublicId || undefined,
      targetAudience: targetAudience || "children",
      ageGroup: targetAudience === "children" ? (ageGroup || "1-5") : undefined,
      organizationId: user.organizationId,
      status: "pending",
    });
    
    console.log("Created event:", createdEvent);
    await ensureTags(tagList);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to submit" },
      { status: 500 }
    );
  }
}
