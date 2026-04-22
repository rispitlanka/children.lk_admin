import "@/models/Organization";
import { SuperHero } from "@/models/SuperHero";
import { SuperHeroRequest } from "@/models/SuperHeroRequest";

export type SuperHeroCreationSource = "admin" | "organizer_request";

/** Organization ref may be an ObjectId or a populated `{ _id, ... }`. */
export function orgIdStringFromRef(organizationId: unknown): string {
  if (organizationId == null) return "";
  if (typeof organizationId === "object" && "_id" in (organizationId as object)) {
    return String((organizationId as { _id: unknown })._id);
  }
  return String(organizationId);
}

function normContact(value: unknown): string {
  return String(value ?? "").trim();
}

function normName(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

type PendingShape = {
  name?: unknown;
  contactNumber?: unknown;
  organizationId?: unknown;
};

type HeroShape = {
  name?: unknown;
  contactNumber?: unknown;
  organizationId?: unknown;
  sourceRequestId?: unknown;
  creationSource?: unknown;
};

/**
 * True when a super hero row looks like the same entry as a pending organizer request
 * (same hotline + name, and org overlap rules).
 * Used to hide admin-created / legacy heroes from the public list while a matching request is still pending.
 */
export function superHeroOverlapsPendingRequest(hero: HeroShape, pending: PendingShape): boolean {
  if (normContact(hero.contactNumber) !== normContact(pending.contactNumber)) return false;
  if (normName(hero.name) !== normName(pending.name)) return false;
  const hOrg = orgIdStringFromRef(hero.organizationId);
  const pOrg = orgIdStringFromRef(pending.organizationId);
  if (hOrg && pOrg) return hOrg === pOrg;
  return true;
}

export function isSuperHeroPubliclyVisible(
  hero: HeroShape,
  pendingRequests: PendingShape[],
  requestStatusById: Map<string, string>
): boolean {
  const sourceId = hero.sourceRequestId ? String(hero.sourceRequestId) : "";
  if (sourceId) {
    const st = requestStatusById.get(sourceId);
    if (st !== "approved") return false;
    return true;
  }
  for (const pr of pendingRequests) {
    if (superHeroOverlapsPendingRequest(hero, pr)) return false;
  }
  return true;
}

/**
 * Admin catalog: explicit admin-created rows, or organizer rows created from an approved request.
 * Legacy rows (no creationSource) use the same overlap / request-status rules as the public list.
 */
export function isSuperHeroInAdminCatalog(
  hero: HeroShape,
  pendingRequests: PendingShape[],
  requestStatusById: Map<string, string>
): boolean {
  const cs = hero.creationSource as SuperHeroCreationSource | undefined;
  if (cs === "admin") return true;
  if (cs === "organizer_request") {
    const sid = hero.sourceRequestId ? String(hero.sourceRequestId) : "";
    return Boolean(sid) && requestStatusById.get(sid) === "approved";
  }
  return isSuperHeroPubliclyVisible(hero, pendingRequests, requestStatusById);
}

export function buildRequestStatusMap(
  rows: { _id: unknown; status: string }[]
): Map<string, string> {
  const m = new Map<string, string>();
  for (const r of rows) {
    m.set(String(r._id), r.status);
  }
  return m;
}

export async function listSuperHeroesForCatalog(
  organizationPopulateSelect: string,
  visibility: "public" | "admin"
) {
  const [list, pendingRequests, rawSourceIds] = await Promise.all([
    SuperHero.find({})
      .populate("organizationId", organizationPopulateSelect)
      .sort({ createdAt: -1 })
      .lean(),
    SuperHeroRequest.find({ status: "pending" })
      .select("name contactNumber organizationId")
      .lean(),
    SuperHero.distinct("sourceRequestId", {
      sourceRequestId: { $exists: true, $ne: null },
    }),
  ]);

  const sourceIds = rawSourceIds.filter((id) => id != null);
  const sourceRows =
    sourceIds.length > 0
      ? await SuperHeroRequest.find({ _id: { $in: sourceIds } })
          .select("_id status")
          .lean()
      : [];
  const requestStatusById = buildRequestStatusMap(sourceRows);

  const keep =
    visibility === "admin" ? isSuperHeroInAdminCatalog : isSuperHeroPubliclyVisible;
  return list.filter((row) => keep(row, pendingRequests, requestStatusById));
}
