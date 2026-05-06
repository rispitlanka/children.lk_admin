/**
 * Assigns URL slugs to Media documents that are missing one.
 * Run from repo root: npx tsx --env-file=.env scripts/backfill-media-slugs.ts
 */
import mongoose from "mongoose";
import { connectDB } from "../src/lib/db";
import { slugify } from "../src/lib/slugify";
import { Media } from "../src/models/Media";

async function collectUsedSlugs(): Promise<Set<string>> {
  const used = new Set<string>();
  const media = await Media.find({ slug: { $regex: /\S/ } })
    .select("slug")
    .lean();
  for (const m of media) {
    if (typeof m.slug === "string" && m.slug.trim()) used.add(m.slug.trim());
  }
  return used;
}

function nextCandidate(base: string, n: number): string {
  return n === 0 ? base : `${base}-${n}`;
}

async function allocateSlug(name: string, used: Set<string>): Promise<string> {
  const baseRaw = slugify(name.trim()) || "media";
  let n = 0;
  for (;;) {
    const candidate = nextCandidate(baseRaw, n);
    if (!used.has(candidate) && !(await Media.exists({ slug: candidate }))) {
      used.add(candidate);
      return candidate;
    }
    n += 1;
  }
}

async function main() {
  await connectDB();
  const used = await collectUsedSlugs();

  const missing = await Media.find({
    $nor: [{ slug: { $regex: /\S/ } }],
  })
    .select("_id name slug")
    .lean();

  let updated = 0;
  for (const row of missing) {
    const slug = await allocateSlug(row.name ?? "media", used);
    await Media.updateOne({ _id: row._id }, { $set: { slug } });
    updated += 1;
    console.log(`Media ${row._id}: slug -> ${slug}`);
  }

  console.log(JSON.stringify({ mediaUpdated: updated }, null, 2));
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
