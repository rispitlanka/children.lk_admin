import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ensureTags } from "@/lib/tags";
import { User } from "@/models/User";
import { ResourceRequest } from "@/models/ResourceRequest";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "organizer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await connectDB();
    const user = await User.findOne({ _id: session.user.id }).select("organizationId").lean();
    if (!user?.organizationId) return NextResponse.json([]);
    const list = await ResourceRequest.find({ organizationId: user.organizationId })
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
    const { name, shortDescription, picture, picturePublicId, documents, tags } = body;
    if (!name || !shortDescription) {
      return NextResponse.json(
        { error: "Name and short description required" },
        { status: 400 }
      );
    }
    const tagList = Array.isArray(tags) ? tags : [];
    await ResourceRequest.create({
      name,
      shortDescription,
      picture: picture || undefined,
      picturePublicId: picturePublicId || undefined,
      documents: Array.isArray(documents) ? documents : [],
      tags: tagList,
      organizationId: user.organizationId,
      status: "pending",
    });
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
