import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ResourceRequest } from "@/models/ResourceRequest";
import { DocumentDownloadCount } from "@/models/DocumentDownloadCount";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: resourceId } = await params;
    if (!resourceId) {
      return NextResponse.json(
        { error: "Resource ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const resource = await ResourceRequest.findOne({
      _id: resourceId,
      status: "approved",
    })
      .select("_id")
      .lean();

    if (!resource) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );
    }

    const counts = await DocumentDownloadCount.find({ resourceId })
      .select("documentPublicId count")
      .lean();

    const byDocument = counts.map((c) => ({
      documentPublicId: c.documentPublicId,
      count: c.count,
    }));
    const total = counts.reduce((sum, c) => sum + c.count, 0);

    return NextResponse.json({
      resourceId,
      total,
      byDocument,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load download counts" },
      { status: 500 }
    );
  }
}
