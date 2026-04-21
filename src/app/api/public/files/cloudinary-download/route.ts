import { NextRequest, NextResponse } from "next/server";
import { getSignedCloudinaryRawDownloadUrl } from "@/lib/cloudinary";

export async function GET(req: NextRequest) {
  try {
    const publicId = req.nextUrl.searchParams.get("publicId")?.trim();
    const format = req.nextUrl.searchParams.get("format")?.trim()?.toLowerCase() || "pdf";

    if (!publicId) {
      return NextResponse.json({ error: "publicId is required" }, { status: 400 });
    }

    const signedUrl = getSignedCloudinaryRawDownloadUrl(publicId, format);
    return NextResponse.redirect(signedUrl, { status: 302 });
  } catch (error) {
    console.error("Failed to create Cloudinary signed download URL:", error);
    return NextResponse.json({ error: "Failed to create download link" }, { status: 500 });
  }
}
