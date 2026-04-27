import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
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

function isFutureDate(d: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d > today;
}

function cleanTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return tags
    .filter((t): t is string => typeof t === "string")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "organizer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await connectDB();
    const user = await User.findOne({ _id: session.user.id }).select("organizationId").lean();
    if (!user?.organizationId) return NextResponse.json([]);
    const list = await MediaRequest.find({ organizationId: user.organizationId })
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json(list);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "organizer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await connectDB();
    const user = await User.findOne({ _id: session.user.id }).select("organizationId").lean();
    if (!user?.organizationId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const body = await req.json();
    const source = typeof body.source === "string" && body.source.trim() ? body.source.trim() : undefined;
    const contentType = body.contentType as "artwork" | "story_poem" | "video" | undefined;
    const visibilityStatus = (body.visibilityStatus ?? "draft") as VisibilityStatus;
    if (!contentType || !["artwork", "story_poem", "video"].includes(contentType)) {
      return NextResponse.json({ error: "Valid content type is required" }, { status: 400 });
    }
    if (!["draft", "published", "archived"].includes(visibilityStatus)) {
      return NextResponse.json({ error: "Invalid visibility status" }, { status: 400 });
    }

    const childInfo = body.childInfo ?? {};
    if (
      !childInfo.fullName?.trim() ||
      !childInfo.age?.trim() ||
      !childInfo.gender?.trim() ||
      !childInfo.city?.trim() ||
      !childInfo.country?.trim()
    ) {
      return NextResponse.json(
        { error: "Child information fields are required" },
        { status: 400 }
      );
    }
    const guardianContact = body.guardianContact ?? {};
    if (
      !guardianContact.guardianName?.trim() ||
      !guardianContact.phone?.trim() ||
      !guardianContact.relationshipToChild?.trim()
    ) {
      return NextResponse.json(
        { error: "Guardian contact fields are required" },
        { status: 400 }
      );
    }

    let name = "";
    let description = "";
    let files: Array<{ url: string; publicId: string; type: "image" | "video" | "audio"; name?: string }> = [];

    const base = {
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
      organizationId: user.organizationId,
      source,
      status: visibilityStatus === "published" ? "pending" : "approved",
      tags: cleanTags(body.tags),
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
      const dateCreated = parseDateOrUndefined(artwork.dateCreated);
      if (dateCreated && isFutureDate(dateCreated)) {
        return NextResponse.json({ error: "Date Created cannot be a future date" }, { status: 400 });
      }
      name = String(artwork.title).trim();
      description = String(artwork.description).trim();
      files = [
        {
          url: String(artwork.artwork.url),
          publicId: String(artwork.artwork.publicId),
          type: "image",
          name: artwork.artwork.name ? String(artwork.artwork.name) : undefined,
        },
      ];
      await MediaRequest.create({
        ...base,
        name,
        description,
        files,
        artwork: {
          title: name,
          description,
          medium: String(artwork.medium).trim(),
          dateCreated,
          theme: String(artwork.theme).trim(),
          tags: cleanTags(artwork.tags),
          artwork: files[0],
        },
      });
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
      const dateWritten = parseDateOrUndefined(storyPoem.dateWritten);
      if (dateWritten && isFutureDate(dateWritten)) {
        return NextResponse.json({ error: "Date Written cannot be a future date" }, { status: 400 });
      }
      name = String(storyPoem.title).trim();
      description = String(storyPoem.article).trim().slice(0, 500);
      if (storyPoem.coverImage?.url && storyPoem.coverImage?.publicId) {
        files.push({
          url: String(storyPoem.coverImage.url),
          publicId: String(storyPoem.coverImage.publicId),
          type: "image",
          name: storyPoem.coverImage.name ? String(storyPoem.coverImage.name) : undefined,
        });
      }
      await MediaRequest.create({
        ...base,
        name,
        description,
        files,
        storyPoem: {
          title: name,
          writtenWorkType: String(storyPoem.writtenWorkType).trim(),
          language: String(storyPoem.language).trim(),
          dateWritten,
          article: String(storyPoem.article).trim(),
          theme: String(storyPoem.theme).trim(),
          tags: cleanTags(storyPoem.tags),
          coverImage: files[0],
        },
      });
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
      const releasedDate = parseDateOrUndefined(video.releasedDate);
      if (releasedDate && isFutureDate(releasedDate)) {
        return NextResponse.json({ error: "Released Date cannot be a future date" }, { status: 400 });
      }
      name = String(video.title).trim();
      description = String(video.synopsis ?? "").trim() || name;
      files = [
        {
          url: String(video.thumbnail.url),
          publicId: String(video.thumbnail.publicId),
          type: "image",
          name: video.thumbnail.name ? String(video.thumbnail.name) : undefined,
        },
      ];
      await MediaRequest.create({
        ...base,
        name,
        description,
        files,
        video: {
          title: name,
          videoType: String(video.videoType).trim(),
          duration: String(video.duration).trim(),
          releasedDate,
          language: String(video.language).trim(),
          aspectRatio: String(video.aspectRatio).trim(),
          synopsis: typeof video.synopsis === "string" ? video.synopsis.trim() : undefined,
          youtubeLink: String(video.youtubeLink).trim(),
          thumbnail: files[0],
          theme: String(video.theme).trim(),
          tags: cleanTags(video.tags),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}
