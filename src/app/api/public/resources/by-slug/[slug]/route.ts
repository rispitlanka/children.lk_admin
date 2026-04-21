import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import "@/models/Organization";
import { Resource } from "@/models/Resource";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: raw } = await params;
    const slug = decodeURIComponent(raw ?? "").trim();
    if (!slug) {
      return NextResponse.json(
        { error: "Resource slug is required" },
        { status: 400 }
      );
    }
    await connectDB();
    const resource = await Resource.findOne({ slug })
      .populate("organizationId", "name logo shortDescription")
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
