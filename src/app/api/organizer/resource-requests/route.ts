import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ensureTags } from "@/lib/tags";
import { slugify } from "@/lib/slugify";
import {
  FILE_FORMAT_VALUES,
  VISIBILITY_STATUS_VALUES,
} from "@/lib/resource-form-constants";
import { User } from "@/models/User";
import { ResourceRequest } from "@/models/ResourceRequest";
import { ResourceSubCategory } from "@/models/ResourceSubCategory";
import { ResourceCategory } from "@/models/ResourceCategory";

const DOC_TYPES = ["pdf", "video", "audio", "docx", "ppt", "image"] as const;

async function uniqueResourceSlug(base: string): Promise<string> {
  let slug = base || "resource";
  let n = 0;
  while (await ResourceRequest.exists({ slug })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
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
    const list = await ResourceRequest.find({ organizationId: user.organizationId })
      .populate("categoryId", "name slug")
      .populate("subCategoryId", "name slug")
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
    const {
      name,
      description,
      shortDescription: bodyShort,
      publicationDate,
      picture,
      picturePublicId,
      documents,
      tags,
      categoryId,
      subCategoryId,
      contentType,
      ageAudienceGroups,
      targetAudience,
      ageGroup: legacyAgeGroup,
      mainPublisherName,
      hasCoPublishers,
      coPublisherOrganizationIds,
      rightsNotice,
      externalDownloadUrl,
      countries,
      regions,
      visibilityStatus,
      contentPublishedAt,
      featured,
      slug: slugInput,
    } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const desc =
      typeof description === "string" && description.trim()
        ? description.trim()
        : typeof bodyShort === "string" && bodyShort.trim()
          ? bodyShort.trim()
          : "";
    if (!desc) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }

    const shortDescription = desc.length > 500 ? desc.slice(0, 500) : desc;

    if (!categoryId || !mongoose.Types.ObjectId.isValid(String(categoryId))) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }
    if (!subCategoryId || !mongoose.Types.ObjectId.isValid(String(subCategoryId))) {
      return NextResponse.json({ error: "Sub category is required" }, { status: 400 });
    }

    const cat = await ResourceCategory.findOne({ _id: categoryId, isActive: true }).lean();
    if (!cat) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    const sub = await ResourceSubCategory.findOne({
      _id: subCategoryId,
      categoryId,
      isActive: true,
    }).lean();
    if (!sub) {
      return NextResponse.json(
        { error: "Sub category must belong to the selected category" },
        { status: 400 }
      );
    }

    if (!contentType || typeof contentType !== "string" || !contentType.trim()) {
      return NextResponse.json({ error: "Content type is required" }, { status: 400 });
    }
    const normalizedContentType = contentType.trim();

    const ageGroups = Array.isArray(ageAudienceGroups)
      ? ageAudienceGroups
          .filter((a: unknown): a is string => typeof a === "string")
          .map((a) => a.trim())
          .filter((a) => a.length > 0)
      : [];
    const ageOk = ageGroups.length > 0;
    if (!ageOk || ageGroups.length === 0) {
      return NextResponse.json(
        { error: "Select at least one age group / audience" },
        { status: 400 }
      );
    }

    if (!mainPublisherName || typeof mainPublisherName !== "string" || !mainPublisherName.trim()) {
      return NextResponse.json({ error: "Main publisher is required" }, { status: 400 });
    }

    const docList = Array.isArray(documents) ? documents : [];
    type DocT = (typeof DOC_TYPES)[number];
    const normalizedDocs = docList.map((d: Record<string, unknown>) => {
      const langs = Array.isArray(d.languages)
        ? d.languages.filter((x): x is string => typeof x === "string")
        : [];
      const rawType = d.type;
      const docType: DocT = DOC_TYPES.includes(rawType as DocT) ? (rawType as DocT) : "pdf";
      const rawFmt = d.fileFormat;
      const fileFormat =
        rawFmt && FILE_FORMAT_VALUES.includes(rawFmt as (typeof FILE_FORMAT_VALUES)[number])
          ? (rawFmt as (typeof FILE_FORMAT_VALUES)[number])
          : undefined;
      return {
        url: String(d.url ?? ""),
        publicId: String(d.publicId ?? ""),
        type: docType,
        name: d.name ? String(d.name) : undefined,
        fileFormat,
        languages: langs.length ? langs : ["en"],
        fileSizeBytes: typeof d.fileSizeBytes === "number" ? d.fileSizeBytes : Number(d.fileSizeBytes) || undefined,
        isPrimary: Boolean(d.isPrimary),
      };
    });

    const primaryCount = normalizedDocs.filter((d) => d.isPrimary).length;
    if (normalizedDocs.length === 0 || primaryCount !== 1) {
      return NextResponse.json(
        { error: "Upload exactly one primary file" },
        { status: 400 }
      );
    }
    for (const d of normalizedDocs) {
      if (!d.url || !d.publicId) {
        return NextResponse.json({ error: "Each document needs url and publicId" }, { status: 400 });
      }
      if (!d.fileFormat) {
        return NextResponse.json({ error: "File format is required for uploaded files" }, { status: 400 });
      }
    }

    const hasSecondary = Boolean(hasCoPublishers);
    let coIds: mongoose.Types.ObjectId[] = [];
    if (hasSecondary) {
      const raw = Array.isArray(coPublisherOrganizationIds) ? coPublisherOrganizationIds : [];
      coIds = raw
        .filter((id: unknown) => mongoose.Types.ObjectId.isValid(String(id)))
        .map((id: unknown) => new mongoose.Types.ObjectId(String(id)));
    }

    const vis =
      visibilityStatus && VISIBILITY_STATUS_VALUES.includes(visibilityStatus)
        ? visibilityStatus
        : "draft";

    const slugBase = slugInput && typeof slugInput === "string" && slugInput.trim()
      ? slugify(slugInput.trim())
      : slugify(name.trim());
    const slug = await uniqueResourceSlug(slugBase);

    const tagList = Array.isArray(tags) ? tags.filter((t: unknown): t is string => typeof t === "string") : [];

    const pubDate = publicationDate ? new Date(publicationDate) : undefined;
    const contentPub = contentPublishedAt ? new Date(contentPublishedAt) : undefined;
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (!publicationDate || !pubDate || Number.isNaN(pubDate.getTime())) {
      return NextResponse.json({ error: "Publication date is required" }, { status: 400 });
    }
    if (!contentPublishedAt || !contentPub || Number.isNaN(contentPub.getTime())) {
      return NextResponse.json({ error: "Published date is required" }, { status: 400 });
    }
    if (pubDate > todayStart) {
      return NextResponse.json(
        { error: "Publication date cannot be in the future" },
        { status: 400 }
      );
    }
    if (contentPub < todayStart) {
      return NextResponse.json(
        { error: "Published date must be today or a future date" },
        { status: 400 }
      );
    }
    if (contentPub < pubDate) {
      return NextResponse.json(
        { error: "Published date must be on or after publication date" },
        { status: 400 }
      );
    }

    await ResourceRequest.create({
      name: name.trim(),
      shortDescription,
      description: desc,
      publicationDate: pubDate,
      picture: picture || undefined,
      picturePublicId: picturePublicId || undefined,
      documents: normalizedDocs,
      tags: tagList,
      categoryId,
      subCategoryId,
      contentType: normalizedContentType,
      ageAudienceGroups: ageGroups,
      targetAudience: targetAudience === "people_work_for_children" ? "people_work_for_children" : "children",
      ageGroup:
        targetAudience === "children" && legacyAgeGroup
          ? legacyAgeGroup
          : undefined,
      mainPublisherName: mainPublisherName.trim(),
      hasCoPublishers: hasSecondary,
      coPublisherOrganizationIds: hasSecondary ? coIds : [],
      rightsNotice: typeof rightsNotice === "string" ? rightsNotice.trim() : undefined,
      externalDownloadUrl:
        typeof externalDownloadUrl === "string" && externalDownloadUrl.trim()
          ? externalDownloadUrl.trim()
          : undefined,
      countries: Array.isArray(countries) ? countries.filter((c): c is string => typeof c === "string") : [],
      regions: Array.isArray(regions) ? regions.filter((c): c is string => typeof c === "string") : [],
      visibilityStatus: vis,
      contentPublishedAt: contentPub,
      featured: Boolean(featured),
      slug,
      organizationId: user.organizationId,
      status: vis === "published" ? "pending" : "approved",
    });
    await ensureTags(tagList);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}
