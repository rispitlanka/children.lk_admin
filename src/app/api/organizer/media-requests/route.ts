import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { MediaRequest } from "@/models/MediaRequest";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "organizer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await connectDB();
    const user = await User.findOne({ _id: session.user.id }).select("organizationId").lean();
    if (!user?.organizationId) return NextResponse.json([]);
    const list = await MediaRequest.find({ organizationId: user.organizationId })
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
    const { name, description, contentType, textContent, files, targetAudience, ageGroup } = body;
    if (!name || !description) {
      return NextResponse.json(
        { error: "Name and description required" },
        { status: 400 }
      );
    }
    
    // Validate content based on type
    if (contentType === "article" || contentType === "poem") {
      if (!textContent || !textContent.trim()) {
        return NextResponse.json(
          { error: `${contentType} content is required` },
          { status: 400 }
        );
      }
    } else {
      if (!files || !Array.isArray(files) || files.length === 0) {
        return NextResponse.json(
          { error: "At least one file is required" },
          { status: 400 }
        );
      }
    }
    
    console.log("Creating MediaRequest with data:", {
      name,
      description,
      contentType: contentType || "pictures",
      textContent: textContent || undefined,
      files: Array.isArray(files) ? files : [],
      targetAudience: targetAudience || "children",
      ageGroup: targetAudience === "children" ? (ageGroup || "1-5") : undefined,
      organizationId: user.organizationId,
      status: "pending",
    });
    
    const createdMediaRequest = await MediaRequest.create({
      name,
      description,
      contentType: contentType || "pictures",
      textContent: textContent || undefined,
      files: Array.isArray(files) ? files : [],
      targetAudience: targetAudience || "children",
      ageGroup: targetAudience === "children" ? (ageGroup || "1-5") : undefined,
      organizationId: user.organizationId,
      status: "pending",
    });
    
    console.log("Successfully created MediaRequest:", createdMediaRequest);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to submit" },
      { status: 500 }
    );
  }
}
