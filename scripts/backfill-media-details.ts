/**
 * Backfills old Media documents with the new media schema fields
 * from approved MediaRequest records.
 *
 * Run from repo root:
 * npx tsx --env-file=.env scripts/backfill-media-details.ts
 */
import mongoose from "mongoose";
import { connectDB } from "../src/lib/db";
import { Media } from "../src/models/Media";
import { MediaRequest } from "../src/models/MediaRequest";

type LeanMedia = {
  _id: mongoose.Types.ObjectId;
  name?: string;
  description?: string;
  files?: Array<{ url?: string | null }>;
  organizationId?: mongoose.Types.ObjectId;
  contentType?: "artwork" | "story_poem" | "video";
  visibilityStatus?: "draft" | "published" | "archived";
};

type LeanMediaRequest = {
  _id: mongoose.Types.ObjectId;
  name?: string;
  description?: string;
  files?: Array<{ url?: string | null }>;
  organizationId?: mongoose.Types.ObjectId;
  status: "pending" | "approved" | "denied";
  contentType?: "artwork" | "story_poem" | "video";
  visibilityStatus?: "draft" | "published" | "archived";
  tags?: string[];
  childInfo?: unknown;
  artwork?: unknown;
  storyPoem?: unknown;
  video?: unknown;
  updatedAt?: Date;
  reviewedAt?: Date;
};

function normalizeText(value?: string): string {
  return (value ?? "").trim().toLowerCase();
}

function normalizeObjectId(value?: mongoose.Types.ObjectId): string {
  return value ? String(value) : "";
}

function firstFileUrl(value?: Array<{ url?: string | null }>): string {
  if (!Array.isArray(value) || value.length === 0) return "";
  return (value[0]?.url ?? "").trim();
}

function requestSortTime(request: LeanMediaRequest): number {
  if (request.reviewedAt instanceof Date) return request.reviewedAt.getTime();
  if (request.updatedAt instanceof Date) return request.updatedAt.getTime();
  return 0;
}

function chooseBestMatch(
  media: LeanMedia,
  candidates: LeanMediaRequest[]
): LeanMediaRequest | null {
  if (candidates.length === 0) return null;

  const mediaOrg = normalizeObjectId(media.organizationId);
  const mediaName = normalizeText(media.name);
  const mediaDescription = normalizeText(media.description);
  const mediaFirstUrl = firstFileUrl(media.files);

  const scored = candidates.map((candidate) => {
    let score = 0;
    if (normalizeObjectId(candidate.organizationId) === mediaOrg) score += 4;
    if (normalizeText(candidate.name) === mediaName) score += 3;
    if (normalizeText(candidate.description) === mediaDescription) score += 2;
    if (firstFileUrl(candidate.files) && firstFileUrl(candidate.files) === mediaFirstUrl) {
      score += 5;
    }
    return { candidate, score };
  });

  const maxScore = Math.max(...scored.map((x) => x.score));
  if (maxScore <= 0) return null;

  const top = scored
    .filter((x) => x.score === maxScore)
    .map((x) => x.candidate)
    .sort((a, b) => requestSortTime(b) - requestSortTime(a));

  return top[0] ?? null;
}

async function main() {
  await connectDB();

  const approvedRequests = (await MediaRequest.find({ status: "approved" })
    .select(
      "_id name description files organizationId status contentType visibilityStatus tags childInfo artwork storyPoem video updatedAt reviewedAt"
    )
    .lean()) as LeanMediaRequest[];

  const oldMedia = (await Media.find({
    $or: [{ contentType: { $exists: false } }, { childInfo: { $exists: false } }],
  })
    .select("_id name description files organizationId contentType visibilityStatus")
    .lean()) as LeanMedia[];

  let updated = 0;
  let skippedNoMatch = 0;
  let skippedAlreadyComplete = 0;

  for (const media of oldMedia) {
    if (media.contentType && media.visibilityStatus) {
      skippedAlreadyComplete += 1;
      continue;
    }

    const match = chooseBestMatch(media, approvedRequests);
    if (!match) {
      skippedNoMatch += 1;
      console.log(`Skip ${media._id}: no approved request match found`);
      continue;
    }

    await Media.updateOne(
      { _id: media._id },
      {
        $set: {
          contentType: match.contentType,
          visibilityStatus: match.visibilityStatus ?? "published",
          tags: match.tags ?? [],
          childInfo: match.childInfo,
          artwork: match.artwork,
          storyPoem: match.storyPoem,
          video: match.video,
        },
      }
    );

    updated += 1;
    console.log(`Updated ${media._id} from MediaRequest ${match._id}`);
  }

  console.log(
    JSON.stringify(
      {
        approvedRequests: approvedRequests.length,
        oldMediaFound: oldMedia.length,
        updated,
        skippedNoMatch,
        skippedAlreadyComplete,
      },
      null,
      2
    )
  );

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
