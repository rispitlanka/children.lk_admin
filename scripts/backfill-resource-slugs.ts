/**
 * Assigns URL slugs to ResourceRequest and Resource documents that are missing one.
 * Run from repo root: npx tsx --env-file=.env scripts/backfill-resource-slugs.ts
 */
import mongoose from "mongoose";
import { connectDB } from "../src/lib/db";
import { slugify } from "../src/lib/slugify";
import { ResourceRequest } from "../src/models/ResourceRequest";
import { Resource } from "../src/models/Resource";

async function collectUsedSlugs(): Promise<Set<string>> {
  const used = new Set<string>();
  const reqs = await ResourceRequest.find({ slug: { $regex: /\S/ } })
    .select("slug")
    .lean();
  for (const r of reqs) {
    if (typeof r.slug === "string" && r.slug.trim()) used.add(r.slug.trim());
  }
  const resources = await Resource.find({ slug: { $regex: /\S/ } })
    .select("slug")
    .lean();
  for (const r of resources) {
    if (typeof r.slug === "string" && r.slug.trim()) used.add(r.slug.trim());
  }
  return used;
}

function nextCandidate(base: string, n: number): string {
  return n === 0 ? base : `${base}-${n}`;
}

async function allocateSlug(
  name: string,
  used: Set<string>
): Promise<string> {
  const baseRaw = slugify(name.trim()) || "resource";
  let n = 0;
  for (;;) {
    const candidate = nextCandidate(baseRaw, n);
    if (
      !used.has(candidate) &&
      !(await ResourceRequest.exists({ slug: candidate })) &&
      !(await Resource.exists({ slug: candidate }))
    ) {
      used.add(candidate);
      return candidate;
    }
    n += 1;
  }
}

async function main() {
  await connectDB();
  const used = await collectUsedSlugs();

  const reqMissing = await ResourceRequest.find({
    $nor: [{ slug: { $regex: /\S/ } }],
  })
    .select("_id name slug")
    .lean();

  let reqUpdated = 0;
  for (const row of reqMissing) {
    const slug = await allocateSlug(row.name ?? "resource", used);
    await ResourceRequest.updateOne({ _id: row._id }, { $set: { slug } });
    reqUpdated += 1;
    console.log(`ResourceRequest ${row._id}: slug -> ${slug}`);
  }

  const resMissing = await Resource.find({
    $nor: [{ slug: { $regex: /\S/ } }],
  })
    .select("_id name slug")
    .lean();

  let resUpdated = 0;
  for (const row of resMissing) {
    const slug = await allocateSlug(row.name ?? "resource", used);
    await Resource.updateOne({ _id: row._id }, { $set: { slug } });
    resUpdated += 1;
    console.log(`Resource ${row._id}: slug -> ${slug}`);
  }

  console.log(
    JSON.stringify(
      { resourceRequestsUpdated: reqUpdated, resourcesUpdated: resUpdated },
      null,
      2
    )
  );
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
