import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import "@/models/Organization";
import { Resource } from "@/models/Resource";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Resource ID is required" },
        { status: 400 }
      );
    }
    await connectDB();
    const resource = await Resource.findById(id)
      .populate("organizationId")
      .lean();

    if (!resource) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...resource,
      publicationDate: resource.publicationDate ?? resource.contentPublishedAt ?? null,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load resource" },
      { status: 500 }
    );
  }
}
