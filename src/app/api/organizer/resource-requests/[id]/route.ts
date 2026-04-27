import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ensureTags } from "@/lib/tags";
import { slugify } from "@/lib/slugify";
import { FILE_FORMAT_VALUES, VISIBILITY_STATUS_VALUES } from "@/lib/resource-form-constants";
import { User } from "@/models/User";
import { ResourceRequest } from "@/models/ResourceRequest";

const DOC_TYPES = ["pdf", "video", "audio", "docx", "ppt", "image"] as const;

async function uniqueResourceSlug(base: string, currentId: string): Promise<string> {
  let slug = base || "resource";
  let n = 0;
  while (await ResourceRequest.exists({ slug, _id: { $ne: currentId } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
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
    if (!id) {
      return NextResponse.json({ error: "ID parameter is required" }, { status: 400 });
    }
    if (!/^[a-f\d]{24}$/i.test(id)) {
      return NextResponse.json({ error: "Invalid resource ID" }, { status: 400 });
    }

    await connectDB();

    if (!/^[a-f\d]{24}$/i.test(session.user.id)) {
      return NextResponse.json({ error: "Invalid user session" }, { status: 401 });
    }

    const user = await User.findOne({ _id: session.user.id }).select("organizationId").lean();
    if (!user?.organizationId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const resourceRequest = await ResourceRequest.findOne({
      _id: id,
      organizationId: user.organizationId,
    })
      .populate("categoryId", "name slug")
      .populate("subCategoryId", "name slug")
      .populate("coPublisherOrganizationIds", "name")
      .lean();

    if (!resourceRequest) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    return NextResponse.json(resourceRequest);
  } catch (error) {
    console.error("Error fetching resource request:", error);
    return NextResponse.json(
      { error: "Failed to fetch resource request" },
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
    if (!id || !/^[a-f\d]{24}$/i.test(id)) {
      return NextResponse.json({ error: "Invalid resource ID" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ _id: session.user.id }).select("organizationId").lean();
    if (!user?.organizationId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const existing = await ResourceRequest.findOne({ _id: id, organizationId: user.organizationId }).lean();
    if (!existing) return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    if (existing.status === "pending") {
      return NextResponse.json(
        { error: "Cannot edit while request is awaiting admin review" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const {
      name,
      description,
      publicationDate,
      picture,
      picturePublicId,
      documents,
      tags,
      categoryId,
      subCategoryId,
      contentType,
      ageAudienceGroups,
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
      source,
    } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!description || typeof description !== "string" || !description.trim()) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }
    if (!categoryId || !mongoose.Types.ObjectId.isValid(String(categoryId))) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }
    if (!subCategoryId || !mongoose.Types.ObjectId.isValid(String(subCategoryId))) {
      return NextResponse.json({ error: "Sub category is required" }, { status: 400 });
    }
    if (!contentType || typeof contentType !== "string" || !contentType.trim()) {
      return NextResponse.json({ error: "Content type is required" }, { status: 400 });
    }
    const ageGroups = Array.isArray(ageAudienceGroups)
      ? ageAudienceGroups
          .filter((a: unknown): a is string => typeof a === "string")
          .map((a) => a.trim())
          .filter((a) => a.length > 0)
      : [];
    if (ageGroups.length === 0) {
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
    const externalUrl = typeof externalDownloadUrl === "string" ? externalDownloadUrl.trim() : "";
    const primaryCount = normalizedDocs.filter((d) => d.isPrimary).length;
    if (normalizedDocs.length === 0 && !externalUrl) {
      return NextResponse.json(
        { error: "Upload a file or provide an external download URL" },
        { status: 400 }
      );
    }
    if (normalizedDocs.length > 0 && primaryCount !== 1) {
      return NextResponse.json({ error: "Exactly one primary file is required" }, { status: 400 });
    }

    const vis =
      visibilityStatus && VISIBILITY_STATUS_VALUES.includes(visibilityStatus)
        ? visibilityStatus
        : "draft";
    const slugBase = slugInput && typeof slugInput === "string" && slugInput.trim()
      ? slugify(slugInput.trim())
      : slugify(name.trim());
    const slug = await uniqueResourceSlug(slugBase, id);
    const tagList = Array.isArray(tags) ? tags.filter((t: unknown): t is string => typeof t === "string") : [];
    const hasSecondary = Boolean(hasCoPublishers);
    const coIds = hasSecondary
      ? (Array.isArray(coPublisherOrganizationIds) ? coPublisherOrganizationIds : [])
          .filter((x: unknown) => mongoose.Types.ObjectId.isValid(String(x)))
          .map((x: unknown) => new mongoose.Types.ObjectId(String(x)))
      : [];
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

    await ResourceRequest.updateOne(
      { _id: id, organizationId: user.organizationId },
      {
        name: name.trim(),
        shortDescription: description.trim().slice(0, 500),
        description: description.trim(),
        publicationDate: pubDate,
        picture: picture || undefined,
        picturePublicId: picturePublicId || undefined,
        documents: normalizedDocs,
        tags: tagList,
        categoryId,
        subCategoryId,
        contentType: contentType.trim(),
        ageAudienceGroups: ageGroups,
        mainPublisherName: mainPublisherName.trim(),
        hasCoPublishers: hasSecondary,
        coPublisherOrganizationIds: hasSecondary ? coIds : [],
        rightsNotice: typeof rightsNotice === "string" ? rightsNotice.trim() : undefined,
        externalDownloadUrl: externalUrl || undefined,
        countries: Array.isArray(countries) ? countries.filter((c): c is string => typeof c === "string") : [],
        regions: Array.isArray(regions) ? regions.filter((c): c is string => typeof c === "string") : [],
        visibilityStatus: vis,
        contentPublishedAt: contentPub,
        featured: Boolean(featured),
        slug,
        source: typeof source === "string" && source.trim() ? source.trim() : undefined,
        status: vis === "published" ? "pending" : "approved",
        adminReason: undefined,
        reviewedAt: undefined,
        reviewedBy: undefined,
      }
    );
    await ensureTags(tagList);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating resource request:", error);
    return NextResponse.json({ error: "Failed to update resource request" }, { status: 500 });
  }
}
