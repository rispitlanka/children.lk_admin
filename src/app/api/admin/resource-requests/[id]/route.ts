import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ResourceRequest } from "@/models/ResourceRequest";
import { Resource } from "@/models/Resource";

export async function GET(
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
    const request = await ResourceRequest.findById(id)
      .populate("organizationId", "name contactEmail contactPhone")
      .lean();
    if (!request) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(request);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const body = await _req.json();
    const { status, adminReason } = body;
    if (!status || !["approved", "denied"].includes(status)) {
      return NextResponse.json(
        { error: "status must be approved or denied" },
        { status: 400 }
      );
    }
    if (status === "denied" && !adminReason?.trim()) {
      return NextResponse.json(
        { error: "Reason is required when denying" },
        { status: 400 }
      );
    }
    await connectDB();
    const request = await ResourceRequest.findById(id).lean();
    if (!request) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (request.status !== "pending") {
      return NextResponse.json(
        { error: "Request already reviewed" },
        { status: 400 }
      );
    }
    const reviewedBy = session.user.id;
    const reviewedAt = new Date();
    if (status === "approved") {
      await Resource.create({
        name: request.name,
        shortDescription: request.shortDescription,
        picture: request.picture,
        picturePublicId: request.picturePublicId,
        documents: request.documents ?? [],
        tags: request.tags ?? [],
        organizationId: request.organizationId,
      });
    }
    await ResourceRequest.updateOne(
      { _id: id },
      { status, adminReason: adminReason?.trim(), reviewedAt, reviewedBy }
    );
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to update" },
      { status: 500 }
    );
  }
}
