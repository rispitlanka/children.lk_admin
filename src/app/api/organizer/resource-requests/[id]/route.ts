import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
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
    if (!/^[a-f\d]{24}$/i.test(id)) {
      return NextResponse.json({ error: "Invalid resource ID" }, { status: 400 });
    }

    await connectDB();

    if (!/^[a-f\d]{24}$/i.test(session.user.id)) {
      return NextResponse.json({ error: "Invalid user session" }, { status: 401 });
    }

    const user = await User.findOne({ _id: session.user.id }).select("organizationId").lean();
    if (!user?.organizationId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const resourceRequest = await ResourceRequest.findOne({
      _id: id,
      organizationId: user.organizationId,
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
