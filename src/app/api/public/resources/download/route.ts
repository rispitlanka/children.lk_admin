import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ResourceRequest } from "@/models/ResourceRequest";
import { DocumentDownloadCount } from "@/models/DocumentDownloadCount";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { resourceId, documentPublicId } = body;

    if (!resourceId || !documentPublicId) {
      return NextResponse.json(
        { error: "resourceId and documentPublicId are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const resource = await ResourceRequest.findOne({
      _id: resourceId,
      status: "approved",
    })
      .select("documents")
      .lean();

    if (!resource) {
      return NextResponse.json(
        { error: "Resource not found or not approved" },
        { status: 404 }
      );
    }

    const hasDocument = resource.documents?.some(
      (doc: { publicId: string }) => doc.publicId === documentPublicId
    );
    if (!hasDocument) {
      return NextResponse.json(
        { error: "Document not found in this resource" },
        { status: 404 }
      );
    }

    const result = await DocumentDownloadCount.findOneAndUpdate(
      { resourceId, documentPublicId },
      { $inc: { count: 1 } },
      { new: true, upsert: true }
    ).lean();

    return NextResponse.json({
      success: true,
      count: result.count,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to record download" },
      { status: 500 }
    );
  }
}
