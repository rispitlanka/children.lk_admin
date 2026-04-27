"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ComponentCard from "@/components/common/ComponentCard";
import LoadingLottie from "@/components/common/LoadingLottie";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import {
  DocsIcon,
  VideoIcon,
  AudioIcon,
  FileIcon,
  UserIcon,
  GroupIcon,
  CalenderIcon,
  CheckCircleIcon,
  AlertIcon,
  CloseLineIcon,
} from "@/icons";
import {
  formatAgeAudienceGroups,
  labelContentType,
  labelVisibility,
  taxonomyLine,
} from "@/lib/resource-display";
import { LANGUAGE_OPTIONS } from "@/lib/resource-form-constants";
import { isRichTextEmpty, sanitizeRichTextHtml } from "@/lib/rich-text";

type PopulatedName = { _id?: string; name?: string };

type DocumentFile = {
  url: string;
  publicId: string;
  type: "pdf" | "video" | "audio" | "docx" | "ppt" | "image" | string;
  name?: string;
  fileFormat?: string;
  languages?: string[];
  fileSizeBytes?: number;
  isPrimary?: boolean;
};

function sanitizeDownloadName(name: string): string {
  return name.replace(/[^\w.\- ]+/g, "").trim() || "resource-file";
}

function ensureExtension(name: string, type: DocumentFile["type"], fileFormat?: string): string {
  if (/\.[a-z0-9]{2,8}$/i.test(name)) return name;
  const ext = (fileFormat || (type === "pdf" ? "pdf" : "")).toLowerCase();
  return ext ? `${name}.${ext}` : name;
}

function getCloudinaryAttachmentUrl(doc: DocumentFile): string {
  if (!doc.publicId) return doc.url;
  const fileName = ensureExtension(sanitizeDownloadName(doc.name || "resource-file"), doc.type, doc.fileFormat);
  const format = (doc.fileFormat || (doc.type === "pdf" ? "pdf" : "bin")).toLowerCase();
  return `/api/public/files/cloudinary-download?publicId=${encodeURIComponent(doc.publicId)}&format=${encodeURIComponent(format)}&fileName=${encodeURIComponent(fileName)}`;
}

type Resource = {
  _id: string;
  name: string;
  shortDescription: string;
  description?: string;
  publicationDate?: string;
  picture?: string;
  documents: DocumentFile[];
  tags: string[];
  targetAudience?: "children" | "people_work_for_children";
  ageGroup?: "1-5" | "5-10" | "11-15" | "15-18" | "above-18";
  ageAudienceGroups?: string[];
  categoryId?: PopulatedName | string;
  subCategoryId?: PopulatedName | string;
  contentType?: string;
  mainPublisherName?: string;
  hasCoPublishers?: boolean;
  coPublisherOrganizationIds?: PopulatedName[] | string[];
  rightsNotice?: string;
  externalDownloadUrl?: string;
  countries?: string[];
  regions?: string[];
  visibilityStatus?: string;
  contentPublishedAt?: string;
  featured?: boolean;
  slug?: string;
  status: string;
  adminReason?: string;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  source?: string;
};

function langLabel(code: string): string {
  const o = LANGUAGE_OPTIONS.find((l) => l.value === code);
  return o?.label ?? code;
}

export default function ResourceViewClient() {
  const params = useParams();
  const router = useRouter();
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.id) return;

    fetch(`/api/organizer/resource-requests/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setResource(data);
      })
      .catch((err) => {
        setError(err.message || "Failed to load resource");
        setResource(null);
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  const getStatusBadge = (status: string, visibilityStatus?: string) => {
    if (visibilityStatus === "draft") return <Badge color="info">Draft</Badge>;
    if (visibilityStatus === "archived") return <Badge color="warning">Archived</Badge>;
    if (status === "pending") return <Badge color="warning">Pending</Badge>;
    if (status === "approved") return <Badge color="success">Approved</Badge>;
    return <Badge color="error">Denied</Badge>;
  };

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return { emoji: "📄", icon: DocsIcon, color: "text-red-600 dark:text-red-400" };
      case "video":
        return { emoji: "🎥", icon: VideoIcon, color: "text-blue-600 dark:text-blue-400" };
      case "audio":
        return { emoji: "🎵", icon: AudioIcon, color: "text-green-600 dark:text-green-400" };
      case "docx":
        return { emoji: "📝", icon: FileIcon, color: "text-blue-600 dark:text-blue-400" };
      case "ppt":
        return { emoji: "📊", icon: FileIcon, color: "text-orange-600 dark:text-orange-400" };
      case "image":
        return { emoji: "🖼", icon: FileIcon, color: "text-purple-600 dark:text-purple-400" };
      default:
        return { emoji: "📎", icon: FileIcon, color: "text-gray-600 dark:text-gray-400" };
    }
  };

  const getAudienceInfo = (audience: string, ageGroup?: string) => {
    if (audience === "children") {
      return {
        emoji: "👶",
        icon: UserIcon,
        label: "Children",
        ageLabel: ageGroup ? getAgeGroupLabel(ageGroup) : undefined,
      };
    }
    return {
      emoji: "👨‍💼",
      icon: GroupIcon,
      label: "Professionals",
      ageLabel: undefined,
    };
  };

  const getAgeGroupLabel = (ageGroup: string) => {
    const ageEmojis: Record<string, string> = {
      "1-5": "🍼",
      "5-10": "🎒",
      "11-15": "📚",
      "15-18": "🎓",
      "above-18": "🎯",
    };
    return {
      emoji: ageEmojis[ageGroup] || "👶",
      label: ageGroup === "above-18" ? "Above 18 years" : `${ageGroup} years`,
    };
  };

  const getStatusInfo = (status: string, visibilityStatus?: string) => {
    if (visibilityStatus === "draft") {
      return {
        icon: FileIcon,
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-50 dark:bg-blue-500/10",
        borderColor: "border-blue-200 dark:border-blue-500/20",
      };
    }
    if (visibilityStatus === "archived") {
      return {
        icon: AlertIcon,
        color: "text-gray-600 dark:text-gray-300",
        bgColor: "bg-gray-50 dark:bg-gray-700/30",
        borderColor: "border-gray-200 dark:border-gray-600/50",
      };
    }
    switch (status) {
      case "approved":
        return {
          icon: CheckCircleIcon,
          color: "text-green-600 dark:text-green-400",
          bgColor: "bg-green-50 dark:bg-green-500/10",
          borderColor: "border-green-200 dark:border-green-500/20",
        };
      case "denied":
        return {
          icon: CloseLineIcon,
          color: "text-red-600 dark:text-red-400",
          bgColor: "bg-red-50 dark:bg-red-500/10",
          borderColor: "border-red-200 dark:border-red-500/20",
        };
      default:
        return {
          icon: AlertIcon,
          color: "text-yellow-600 dark:text-yellow-400",
          bgColor: "bg-yellow-50 dark:bg-yellow-500/10",
          borderColor: "border-yellow-200 dark:border-yellow-500/20",
        };
    }
  };

  if (loading) return <LoadingLottie variant="block" />;

  if (error || !resource) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Resource Details" />
        <ComponentCard title="Error">
          <div className="py-8 text-center">
            <p className="mb-4 text-gray-500 dark:text-gray-400">{error || "Resource not found"}</p>
            <Button variant="outline" size="sm" onClick={() => router.push("/organizer/resources")}>
              Back to Resources
            </Button>
          </div>
        </ComponentCard>
      </div>
    );
  }

  const cat = typeof resource.categoryId === "object" ? resource.categoryId : null;
  const sub = typeof resource.subCategoryId === "object" ? resource.subCategoryId : null;
  const coNames =
    resource.hasCoPublishers && Array.isArray(resource.coPublisherOrganizationIds)
      ? resource.coPublisherOrganizationIds
          .map((o) => (typeof o === "object" && o?.name ? o.name : null))
          .filter(Boolean)
      : [];
  const richDescription = resource.description ?? "";
  const safeDescriptionHtml = !isRichTextEmpty(richDescription)
    ? sanitizeRichTextHtml(richDescription)
    : "";

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageBreadcrumb pageTitle="Resource Details" />
        <div className="flex items-center gap-2">
          {(resource.visibilityStatus === "draft" || resource.visibilityStatus === "archived") && (
            <Link href={`/organizer/resources/new?edit=${resource._id}`}>
              <Button size="sm">Edit</Button>
            </Link>
          )}
          <Button size="sm" variant="outline" onClick={() => router.push("/organizer/resources")}>
            Back to Resources
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        <div className="relative">
          {resource.picture && (
            <div className="relative mb-6 h-80 overflow-hidden rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resource.picture} alt={resource.name} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <h1 className="mb-2 text-3xl font-bold text-white">{resource.name}</h1>
                <div className="flex flex-wrap items-center gap-3">
                  {getStatusBadge(resource.status, resource.visibilityStatus)}
                  {resource.featured && <Badge color="warning">Featured</Badge>}
                  <div className="flex items-center gap-1 text-white/90">
                    <CalenderIcon className="h-4 w-4" />
                    <span className="text-sm">{new Date(resource.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!resource.picture && (
            <div className="mb-6 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 p-8 text-white">
              <h1 className="mb-3 text-3xl font-bold">{resource.name}</h1>
              <div className="flex flex-wrap items-center gap-3">
                {getStatusBadge(resource.status, resource.visibilityStatus)}
                {resource.featured && <Badge color="warning">Featured</Badge>}
                <div className="flex items-center gap-1 text-white/90">
                  <CalenderIcon className="h-4 w-4" />
                  <span className="text-sm">{new Date(resource.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <ComponentCard title="Description">
              {safeDescriptionHtml ? (
                <div
                  className="prose prose-sm max-w-none leading-relaxed text-gray-700 dark:prose-invert dark:text-gray-300"
                  // eslint-disable-next-line react/no-danger -- sanitized rich-text HTML
                  dangerouslySetInnerHTML={{ __html: safeDescriptionHtml }}
                />
              ) : (
                <p className="whitespace-pre-wrap leading-relaxed text-gray-700 dark:text-gray-300">
                  {resource.shortDescription}
                </p>
              )}
            </ComponentCard>

            {(resource.publicationDate || resource.contentPublishedAt) && (
              <ComponentCard title="Dates">
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  {resource.publicationDate && (
                    <>
                      <dt className="text-gray-500 dark:text-gray-400">Publication date</dt>
                      <dd className="font-medium text-gray-900 dark:text-white">
                        {new Date(resource.publicationDate).toLocaleDateString()}
                      </dd>
                    </>
                  )}
                  {resource.contentPublishedAt && (
                    <>
                      <dt className="text-gray-500 dark:text-gray-400">Published (visibility)</dt>
                      <dd className="font-medium text-gray-900 dark:text-white">
                        {new Date(resource.contentPublishedAt).toLocaleDateString()}
                      </dd>
                    </>
                  )}
                </dl>
              </ComponentCard>
            )}

            {resource.source && (
              <ComponentCard title="Source">
                <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{resource.source}</p>
              </ComponentCard>
            )}

            {resource.rightsNotice && (
              <ComponentCard title="Rights / © notice">
                <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{resource.rightsNotice}</p>
              </ComponentCard>
            )}

            {resource.status === "denied" && resource.adminReason && (
              <div
                className={`rounded-xl border p-6 ${getStatusInfo(resource.status, resource.visibilityStatus).bgColor} ${getStatusInfo(resource.status, resource.visibilityStatus).borderColor}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 ${getStatusInfo(resource.status, resource.visibilityStatus).color}`}>
                    <CloseLineIcon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className={`mb-2 text-lg font-semibold ${getStatusInfo(resource.status, resource.visibilityStatus).color}`}>
                      Admin feedback
                    </h3>
                    <p className="text-gray-800 dark:text-gray-200">{resource.adminReason}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <ComponentCard title="Review status">
              <div
                className={`rounded-lg border p-4 ${getStatusInfo(resource.status, resource.visibilityStatus).bgColor} ${getStatusInfo(resource.status, resource.visibilityStatus).borderColor}`}
              >
                <div className="flex items-center gap-3">
                  <div className={getStatusInfo(resource.status, resource.visibilityStatus).color}>
                    {React.createElement(getStatusInfo(resource.status, resource.visibilityStatus).icon, { className: "h-6 w-6" })}
                  </div>
                  <div>
                    <p className={`font-semibold capitalize ${getStatusInfo(resource.status, resource.visibilityStatus).color}`}>
                      {resource.visibilityStatus === "draft"
                        ? "draft"
                        : resource.visibilityStatus === "archived"
                          ? "archived"
                          : resource.status}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {resource.visibilityStatus === "draft"
                        ? "Saved as draft (not sent for admin review)"
                        : resource.visibilityStatus === "archived"
                          ? "Saved as archived (not sent for admin review)"
                          : resource.status === "approved"
                            ? "Approved by admin"
                            : resource.status === "denied"
                              ? "Not approved"
                              : "Awaiting admin review"}
                    </p>
                  </div>
                </div>
              </div>
            </ComponentCard>

            <ComponentCard title="Classification">
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Category</dt>
                  <dd className="mt-0.5 font-medium text-gray-900 dark:text-white">{taxonomyLine(cat, sub)}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Content type</dt>
                  <dd className="mt-0.5 font-medium text-gray-900 dark:text-white">
                    {labelContentType(resource.contentType)}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Visibility</dt>
                  <dd className="mt-0.5 font-medium text-gray-900 dark:text-white">
                    {labelVisibility(resource.visibilityStatus)}
                  </dd>
                </div>
                {resource.slug && (
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">Slug</dt>
                    <dd className="mt-0.5 font-mono text-xs text-gray-800 dark:text-gray-200">{resource.slug}</dd>
                  </div>
                )}
              </dl>
            </ComponentCard>

            <ComponentCard title="Audience">
              {resource.ageAudienceGroups && resource.ageAudienceGroups.length > 0 ? (
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  {formatAgeAudienceGroups(resource.ageAudienceGroups)}
                </p>
              ) : resource.targetAudience ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                    <span className="text-lg">{getAudienceInfo(resource.targetAudience).emoji}</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {getAudienceInfo(resource.targetAudience).label}
                      </p>
                    </div>
                    {React.createElement(getAudienceInfo(resource.targetAudience).icon, {
                      className: "h-4 w-4 text-brand-600 dark:text-brand-400",
                    })}
                  </div>
                  {resource.targetAudience === "children" && resource.ageGroup && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Age band: {getAgeGroupLabel(resource.ageGroup).label}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">—</p>
              )}
            </ComponentCard>

            <ComponentCard title="Publishers">
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Main</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {resource.mainPublisherName ?? "—"}
                  </dd>
                </div>
                {coNames.length > 0 && (
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">Co-publishers</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{coNames.join(", ")}</dd>
                  </div>
                )}
              </dl>
            </ComponentCard>

            {(resource.countries?.length || resource.regions?.length) ? (
              <ComponentCard title="Geography">
                {!!resource.countries?.length && (
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    <span className="text-gray-500">Countries: </span>
                    {resource.countries.join(", ")}
                  </p>
                )}
                {!!resource.regions?.length && (
                  <p className="mt-2 text-sm text-gray-800 dark:text-gray-200">
                    <span className="text-gray-500">Regions: </span>
                    {resource.regions.join(", ")}
                  </p>
                )}
              </ComponentCard>
            ) : null}

            {resource.tags && resource.tags.length > 0 && (
              <ComponentCard title="Tags">
                <div className="flex flex-wrap gap-2">
                  {resource.tags.map((tag, index) => (
                    <Badge key={index} color="info" size="sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </ComponentCard>
            )}
          </div>
        </div>

        {resource.externalDownloadUrl && (
          <ComponentCard title="External download">
            <a
              href={resource.externalDownloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              {resource.externalDownloadUrl}
            </a>
          </ComponentCard>
        )}

        {resource.documents && resource.documents.length > 0 && (
          <ComponentCard title="Documents & files">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {resource.documents.map((doc, index) => {
                const docInfo = getDocumentTypeIcon(doc.type);
                const Icon = docInfo.icon;
                return (
                  <div
                    key={index}
                    className="group relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-brand-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-brand-500"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-700/50 ${docInfo.color}`}
                        >
                          <span className="text-xl">{docInfo.emoji}</span>
                        </div>
                        <div className="flex flex-1 flex-col gap-1">
                          <Badge color="info" size="sm">
                            {String(doc.type).toUpperCase()}
                          </Badge>
                          {doc.isPrimary && (
                            <Badge color="warning" size="sm">
                              Primary
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Icon className={`h-5 w-5 ${docInfo.color}`} />
                    </div>
                    <h4 className="mb-2 truncate font-medium text-gray-900 dark:text-white">
                      {doc.name || `${doc.type} file`}
                    </h4>
                    <div className="mb-3 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                      {doc.fileFormat && <p>Format: {doc.fileFormat}</p>}
                      {doc.languages?.length ? (
                        <p>Languages: {doc.languages.map(langLabel).join(", ")}</p>
                      ) : null}
                      {doc.fileSizeBytes != null && (
                        <p>Size: {(doc.fileSizeBytes / 1024).toFixed(1)} KB</p>
                      )}
                    </div>
                    <Link
                      href={doc.type === "pdf" ? getCloudinaryAttachmentUrl(doc) : doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                    >
                      Open file
                    </Link>
                  </div>
                );
              })}
            </div>
          </ComponentCard>
        )}

        <ComponentCard title="Submission timeline">
          <div className="relative space-y-6">
            <div className="absolute bottom-0 left-4 top-8 w-px bg-gray-200 dark:bg-gray-700" />
            <div className="relative flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-500/20">
                <CalenderIcon className="h-4 w-4 text-brand-600 dark:text-brand-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 dark:text-white">Submitted</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(resource.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            {resource.updatedAt !== resource.createdAt && (
              <div className="relative flex items-start gap-4">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${getStatusInfo(resource.status, resource.visibilityStatus).bgColor}`}
                >
                  {React.createElement(getStatusInfo(resource.status, resource.visibilityStatus).icon, {
                    className: `h-4 w-4 ${getStatusInfo(resource.status, resource.visibilityStatus).color}`,
                  })}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">Last updated</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(resource.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
            <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
              <code className="rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {resource._id}
              </code>
            </div>
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}
