import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import "@/models/Organization";
import "@/models/ResourceCategory";
import "@/models/ResourceSubCategory";
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
      .populate("organizationId")
      .populate("categoryId", "name slug")
      .populate("subCategoryId", "name slug")
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
      coverImage: resource.picture ?? null,
      coverImagePublicId: resource.picturePublicId ?? null,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load resource" },
      { status: 500 }
    );
  }
}
