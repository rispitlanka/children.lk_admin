import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { MediaRequest } from "@/models/MediaRequest";
type VisibilityStatus = "draft" | "published" | "archived";

function parseDateOrUndefined(value: unknown): Date | undefined {
  if (!value || typeof value !== "string") return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function cleanTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return tags
    .filter((t): t is string => typeof t === "string")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

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
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID parameter" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ _id: session.user.id }).select("organizationId").lean();
    if (!user?.organizationId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const mediaRequest = await MediaRequest.findOne({
      _id: id,
      organizationId: user.organizationId,
    }).lean();

    if (!mediaRequest) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }
    return NextResponse.json(mediaRequest);
  } catch (error) {
    console.error("Error fetching media request:", error);
    return NextResponse.json(
      { error: "Failed to fetch media request" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "organizer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams?.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID parameter" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ _id: session.user.id }).select("organizationId").lean();
    if (!user?.organizationId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }
    const existing = await MediaRequest.findOne({ _id: id, organizationId: user.organizationId }).lean();
    if (!existing) return NextResponse.json({ error: "Media not found" }, { status: 404 });
    if (existing.visibilityStatus !== "draft" && existing.visibilityStatus !== "archived") {
      return NextResponse.json(
        { error: "Only draft/archived media can be edited" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const contentType = body.contentType as "artwork" | "story_poem" | "video" | undefined;
    const visibilityStatus = (body.visibilityStatus ?? "draft") as VisibilityStatus;
    if (!contentType || !["artwork", "story_poem", "video"].includes(contentType)) {
      return NextResponse.json({ error: "Valid content type is required" }, { status: 400 });
    }
    if (!["draft", "published", "archived"].includes(visibilityStatus)) {
      return NextResponse.json({ error: "Invalid visibility status" }, { status: 400 });
    }

    const childInfo = body.childInfo ?? {};
    const guardianContact = body.guardianContact ?? {};
    if (
      !childInfo.fullName?.trim() ||
      !childInfo.age?.trim() ||
      !childInfo.gender?.trim() ||
      !childInfo.city?.trim() ||
      !childInfo.country?.trim() ||
      !guardianContact.guardianName?.trim() ||
      !guardianContact.phone?.trim() ||
      !guardianContact.relationshipToChild?.trim()
    ) {
      return NextResponse.json({ error: "Child and guardian fields are required" }, { status: 400 });
    }

    const update: Record<string, unknown> = {
      contentType,
      visibilityStatus,
      childInfo: {
        fullName: String(childInfo.fullName).trim(),
        age: String(childInfo.age).trim(),
        gender: String(childInfo.gender).trim(),
        city: String(childInfo.city).trim(),
        country: String(childInfo.country).trim(),
      },
      guardianContact: {
        guardianName: String(guardianContact.guardianName).trim(),
        phone: String(guardianContact.phone).trim(),
        relationshipToChild: String(guardianContact.relationshipToChild).trim(),
      },
      tags: cleanTags(body.tags),
      status: visibilityStatus === "published" ? "pending" : "approved",
      adminReason: undefined,
      reviewedAt: undefined,
      reviewedBy: undefined,
      artwork: undefined,
      storyPoem: undefined,
      video: undefined,
      files: [],
    };

    if (contentType === "artwork") {
      const artwork = body.artwork ?? {};
      if (
        !artwork.title?.trim() ||
        !artwork.description?.trim() ||
        !artwork.medium?.trim() ||
        !artwork.theme?.trim() ||
        !artwork.artwork?.url ||
        !artwork.artwork?.publicId
      ) {
        return NextResponse.json({ error: "Artwork fields are required" }, { status: 400 });
      }
      const file = {
        url: String(artwork.artwork.url),
        publicId: String(artwork.artwork.publicId),
        type: "image",
        name: artwork.artwork.name ? String(artwork.artwork.name) : undefined,
      };
      update.name = String(artwork.title).trim();
      update.description = String(artwork.description).trim();
      update.files = [file];
      update.artwork = {
        title: String(artwork.title).trim(),
        description: String(artwork.description).trim(),
        medium: String(artwork.medium).trim(),
        dateCreated: parseDateOrUndefined(artwork.dateCreated),
        theme: String(artwork.theme).trim(),
        tags: cleanTags(artwork.tags),
        artwork: file,
      };
    } else if (contentType === "story_poem") {
      const storyPoem = body.storyPoem ?? {};
      if (
        !storyPoem.title?.trim() ||
        !storyPoem.writtenWorkType?.trim() ||
        !storyPoem.language?.trim() ||
        !storyPoem.article?.trim() ||
        !storyPoem.theme?.trim()
      ) {
        return NextResponse.json({ error: "Story/Poem fields are required" }, { status: 400 });
      }
      const cover =
        storyPoem.coverImage?.url && storyPoem.coverImage?.publicId
          ? {
              url: String(storyPoem.coverImage.url),
              publicId: String(storyPoem.coverImage.publicId),
              type: "image",
              name: storyPoem.coverImage.name ? String(storyPoem.coverImage.name) : undefined,
            }
          : undefined;
      update.name = String(storyPoem.title).trim();
      update.description = String(storyPoem.article).trim().slice(0, 500);
      update.files = cover ? [cover] : [];
      update.storyPoem = {
        title: String(storyPoem.title).trim(),
        writtenWorkType: String(storyPoem.writtenWorkType).trim(),
        language: String(storyPoem.language).trim(),
        dateWritten: parseDateOrUndefined(storyPoem.dateWritten),
        article: String(storyPoem.article).trim(),
        theme: String(storyPoem.theme).trim(),
        tags: cleanTags(storyPoem.tags),
        coverImage: cover,
      };
    } else {
      const video = body.video ?? {};
      if (
        !video.title?.trim() ||
        !video.videoType?.trim() ||
        !video.duration?.trim() ||
        !video.language?.trim() ||
        !video.aspectRatio?.trim() ||
        !video.youtubeLink?.trim() ||
        !video.theme?.trim() ||
        !video.thumbnail?.url ||
        !video.thumbnail?.publicId
      ) {
        return NextResponse.json({ error: "Video fields are required" }, { status: 400 });
      }
      const file = {
        url: String(video.thumbnail.url),
        publicId: String(video.thumbnail.publicId),
        type: "image",
        name: video.thumbnail.name ? String(video.thumbnail.name) : undefined,
      };
      update.name = String(video.title).trim();
      update.description = String(video.synopsis ?? "").trim() || String(video.title).trim();
      update.files = [file];
      update.video = {
        title: String(video.title).trim(),
        videoType: String(video.videoType).trim(),
        duration: String(video.duration).trim(),
        releasedDate: parseDateOrUndefined(video.releasedDate),
        language: String(video.language).trim(),
        aspectRatio: String(video.aspectRatio).trim(),
        synopsis: typeof video.synopsis === "string" ? video.synopsis.trim() : undefined,
        youtubeLink: String(video.youtubeLink).trim(),
        thumbnail: file,
        theme: String(video.theme).trim(),
        tags: cleanTags(video.tags),
      };
    }

    await MediaRequest.updateOne({ _id: id, organizationId: user.organizationId }, update);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating media request:", error);
    return NextResponse.json(
      { error: "Failed to update media request" },
      { status: 500 }
    );
  }
}
