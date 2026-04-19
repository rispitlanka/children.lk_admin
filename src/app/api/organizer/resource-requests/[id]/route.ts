import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { ResourceRequest } from "@/models/ResourceRequest";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "organizer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams?.id;
    if (!id) {
      return NextResponse.json({ error: "ID parameter is required" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ _id: session.user.id }).select("organizationId").lean();
    if (!user?.organizationId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const orgFilter = mongoose.Types.ObjectId.isValid(String(user.organizationId))
      ? new mongoose.Types.ObjectId(String(user.organizationId))
      : user.organizationId;

    const idFilter = mongoose.Types.ObjectId.isValid(id)
      ? new mongoose.Types.ObjectId(id)
      : id;

    const resourceRequest = await ResourceRequest.findOne({
      _id: idFilter,
      organizationId: orgFilter,
    })
      .populate("categoryId", "name slug")
      .populate("subCategoryId", "name slug")
      .populate("coPublisherOrganizationIds", "name")
      .lean();

    if (!resourceRequest) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    return NextResponse.json(resourceRequest);
  } catch (error) {
    console.error("Error fetching resource request:", error);
    return NextResponse.json(
      { error: "Failed to fetch resource request" },
      { status: 500 }
    );
  }
}
