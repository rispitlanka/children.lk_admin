"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import TextArea from "@/components/form/input/TextArea";
import LoadingLottie from "@/components/common/LoadingLottie";
import toast from "react-hot-toast";
import Badge from "@/components/ui/badge/Badge";
import { isRichTextEmpty, sanitizeRichTextHtml } from "@/lib/rich-text";

type MediaFile = { url: string; publicId: string; type: "video" | "audio" | "image"; name?: string };

type MediaRequestDetail = {
  _id: string;
  name: string;
  description: string;
  contentType: "artwork" | "story_poem" | "video" | string;
  visibilityStatus?: "draft" | "published" | "archived";
  tags?: string[];
  childInfo?: {
    fullName?: string;
    age?: string;
    gender?: string;
    city?: string;
    country?: string;
  };
  guardianContact?: {
    guardianName?: string;
    phone?: string;
    relationshipToChild?: string;
  };
  artwork?: {
    title?: string;
    description?: string;
    medium?: string;
    dateCreated?: string;
    theme?: string;
    tags?: string[];
    artwork?: MediaFile;
  };
  storyPoem?: {
    title?: string;
    writtenWorkType?: string;
    language?: string;
    dateWritten?: string;
    article?: string;
    theme?: string;
    tags?: string[];
    coverImage?: MediaFile;
  };
  video?: {
    title?: string;
    videoType?: string;
    duration?: string;
    releasedDate?: string;
    language?: string;
    aspectRatio?: string;
    synopsis?: string;
    youtubeLink?: string;
    thumbnail?: MediaFile;
    theme?: string;
    tags?: string[];
  };
  files: MediaFile[];
  organizationId?: { name: string; contactEmail?: string; contactPhone?: string };
  source?: string;
  status: string;
  adminReason?: string;
  reviewedAt?: string;
  createdAt: string;
};

function renderRichHtml(value?: string) {
  const html = value ?? "";
  if (isRichTextEmpty(html)) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">—</p>;
  }
  return (
    <div
      className="prose prose-sm max-w-none text-gray-800 dark:prose-invert dark:text-gray-200"
      dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(html) }}
    />
  );
}

function mediaTypeLabel(contentType?: string) {
  if (contentType === "artwork") return "Artwork";
  if (contentType === "story_poem") return "Story / Poem";
  if (contentType === "video") return "Video";
  return "Media";
}

export default function MediaRequestDetailClient() {
  const params = useParams();
  const id = params?.id as string;
  const [request, setRequest] = useState<MediaRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<"approve" | "deny" | null>(null);
  const [denyReason, setDenyReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/media-requests/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setRequest(data);
      })
      .catch(() => setRequest(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleApprove = async () => {
    if (!id) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/media-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error ?? "Failed to approve";
        setError(msg);
        toast.error(msg);
        setSubmitting(false);
        return;
      }
      setRequest((prev) => (prev ? { ...prev, status: "approved" } : null));
      setAction(null);
      toast.success("Media request approved");
    } catch {
      setError("Something went wrong");
      toast.error("Something went wrong");
    }
    setSubmitting(false);
  };

  const handleDeny = async () => {
    if (!id || !denyReason.trim()) {
      setError("Reason is required when denying");
      toast.error("Reason is required when denying");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/media-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "denied", adminReason: denyReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error ?? "Failed to deny";
        setError(msg);
        toast.error(msg);
        setSubmitting(false);
        return;
      }
      setRequest((prev) => (prev ? { ...prev, status: "denied", adminReason: denyReason.trim() } : null));
      setAction(null);
      setDenyReason("");
      toast.success("Media request denied");
    } catch {
      setError("Something went wrong");
      toast.error("Something went wrong");
    }
    setSubmitting(false);
  };

  const statusBadge = (status: string, visibilityStatus?: string) => {
    if (visibilityStatus === "draft")
      return <span className="inline-flex items-center rounded-[6px] bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">Draft</span>;
    if (visibilityStatus === "archived")
      return <span className="inline-flex items-center rounded-[6px] bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">Archived</span>;
    if (status === "pending")
      return <span className="inline-flex items-center rounded-[6px] bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">Pending</span>;
    if (status === "approved")
      return <span className="inline-flex items-center rounded-[6px] bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">Approved</span>;
    return <span className="inline-flex items-center rounded-[6px] bg-rose-500/10 px-2.5 py-0.5 text-xs font-medium text-rose-600 dark:text-rose-400">Denied</span>;
  };

  if (loading) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Media Request" />
        <LoadingLottie variant="block" />
      </div>
    );
  }

  if (!request) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Media Request" />
        <ComponentCard title="Not found">
          <p className="py-6 text-center text-gray-500 dark:text-gray-400">Request not found.</p>
          <Link href="/admin/media-requests">
            <Button size="sm" variant="outline">Back to list</Button>
          </Link>
        </ComponentCard>
      </div>
    );
  }

  const isPending = request.status === "pending";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageBreadcrumb pageTitle={request.name} />
        <div className="flex items-center gap-2">
          {statusBadge(request.status, request.visibilityStatus)}
          <Badge color="info">{mediaTypeLabel(request.contentType)}</Badge>
          <Link href="/admin/media-requests">
            <Button size="sm" variant="outline">Back to list</Button>
          </Link>
        </div>
      </div>

      <div className="space-y-8">
        {isPending && (
          <ComponentCard title="Actions">
            {error && <p className="mb-3 text-sm text-error-500">{error}</p>}
            {!action && (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button size="sm" onClick={() => { setAction("approve"); setError(""); }}>
                  Approve request
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setAction("deny"); setError(""); setDenyReason(""); }}>
                  Deny request
                </Button>
              </div>
            )}
            {action === "approve" && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">Approve this media request?</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleApprove} disabled={submitting}>
                    {submitting ? "Saving..." : "Confirm approve"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setAction(null)} disabled={submitting}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            {action === "deny" && (
              <div className="space-y-3">
                <Label>Reason for denial *</Label>
                <TextArea
                  value={denyReason}
                  onChange={(v) => setDenyReason(v)}
                  rows={3}
                  placeholder="Provide a reason for the requester"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleDeny} disabled={submitting || !denyReason.trim()}>
                    {submitting ? "Saving..." : "Confirm deny"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setAction(null); setDenyReason(""); }} disabled={submitting}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </ComponentCard>
        )}

        {!isPending && request.adminReason && (
          <ComponentCard title="Admin note">
            <p className="text-sm text-gray-700 dark:text-gray-300">{request.adminReason}</p>
            {request.reviewedAt && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Reviewed {new Date(request.reviewedAt).toLocaleString()}
              </p>
            )}
          </ComponentCard>
        )}

        <ComponentCard title="Overview">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Description</p>
              <div className="mt-1">{renderRichHtml(request.description)}</div>
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 border-t border-gray-200 pt-4 text-sm dark:border-gray-800 md:grid-cols-2 min-[1200px]:grid-cols-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Organization</p>
                <p className="mt-1 font-medium text-gray-800 dark:text-white/90">{request.organizationId?.name ?? "—"}</p>
              </div>
              {request.source && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Source</p>
                  <p className="mt-1 text-gray-800 dark:text-white/90">{request.source}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Submitted</p>
                <p className="mt-1 text-gray-800 dark:text-white/90">
                  {new Date(request.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                </p>
              </div>
            </div>
          </div>
        </ComponentCard>

        <ComponentCard title="Children Information">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-5 text-sm md:grid-cols-2 min-[1200px]:grid-cols-3">
            <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Full Name</dt><dd className="mt-1 font-medium text-gray-800 dark:text-white/90">{request.childInfo?.fullName || "—"}</dd></div>
            <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Age</dt><dd className="mt-1 text-gray-800 dark:text-white/90">{request.childInfo?.age || "—"}</dd></div>
            <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Gender</dt><dd className="mt-1 text-gray-800 dark:text-white/90">{request.childInfo?.gender || "—"}</dd></div>
            <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">City</dt><dd className="mt-1 text-gray-800 dark:text-white/90">{request.childInfo?.city || "—"}</dd></div>
            <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Country</dt><dd className="mt-1 text-gray-800 dark:text-white/90">{request.childInfo?.country || "—"}</dd></div>
          </dl>
        </ComponentCard>

        <ComponentCard title="Guardian Contact (private)">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-5 text-sm md:grid-cols-2 min-[1200px]:grid-cols-3">
            <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Guardian Name</dt><dd className="mt-1 font-medium text-gray-800 dark:text-white/90">{request.guardianContact?.guardianName || "—"}</dd></div>
            <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Phone</dt><dd className="mt-1 text-gray-800 dark:text-white/90">{request.guardianContact?.phone || "—"}</dd></div>
            <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Relationship</dt><dd className="mt-1 text-gray-800 dark:text-white/90">{request.guardianContact?.relationshipToChild || "—"}</dd></div>
          </dl>
        </ComponentCard>

        {request.contentType === "artwork" && request.artwork && (
          <ComponentCard title="Artwork Details">
            <div className="space-y-4">
              <dl className="grid grid-cols-1 gap-x-6 gap-y-5 text-sm md:grid-cols-2 min-[1200px]:grid-cols-3">
                <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Title</dt><dd className="mt-1 font-medium text-gray-800 dark:text-white/90">{request.artwork.title || "—"}</dd></div>
                <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Medium</dt><dd className="mt-1 text-gray-800 dark:text-white/90">{request.artwork.medium || "—"}</dd></div>
                <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Date Created</dt><dd className="mt-1 text-gray-800 dark:text-white/90">{request.artwork.dateCreated ? new Date(request.artwork.dateCreated).toLocaleDateString() : "—"}</dd></div>
                <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Theme</dt><dd className="mt-1 text-gray-800 dark:text-white/90">{request.artwork.theme || "—"}</dd></div>
              </dl>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Description</p>
                <div className="mt-1">{renderRichHtml(request.artwork.description)}</div>
              </div>
              {request.artwork.tags && request.artwork.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {request.artwork.tags.map((tag) => <Badge key={tag} color="light">{tag}</Badge>)}
                </div>
              )}
              {request.artwork.artwork && <MediaFilePreview file={request.artwork.artwork} />}
            </div>
          </ComponentCard>
        )}

        {request.contentType === "story_poem" && request.storyPoem && (
          <ComponentCard title="Story / Poem Details">
            <div className="space-y-4">
              <dl className="grid grid-cols-1 gap-x-6 gap-y-5 text-sm md:grid-cols-2 min-[1200px]:grid-cols-3">
                <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Title</dt><dd className="mt-1 font-medium text-gray-800 dark:text-white/90">{request.storyPoem.title || "—"}</dd></div>
                <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Written Work Type</dt><dd className="mt-1 text-gray-800 dark:text-white/90">{request.storyPoem.writtenWorkType || "—"}</dd></div>
                <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Language</dt><dd className="mt-1 text-gray-800 dark:text-white/90">{request.storyPoem.language || "—"}</dd></div>
                <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Date Written</dt><dd className="mt-1 text-gray-800 dark:text-white/90">{request.storyPoem.dateWritten ? new Date(request.storyPoem.dateWritten).toLocaleDateString() : "—"}</dd></div>
                <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Theme</dt><dd className="mt-1 text-gray-800 dark:text-white/90">{request.storyPoem.theme || "—"}</dd></div>
              </dl>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Article</p>
                <div className="mt-1">{renderRichHtml(request.storyPoem.article)}</div>
              </div>
              {request.storyPoem.tags && request.storyPoem.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {request.storyPoem.tags.map((tag) => <Badge key={tag} color="light">{tag}</Badge>)}
                </div>
              )}
              {request.storyPoem.coverImage && <MediaFilePreview file={request.storyPoem.coverImage} />}
            </div>
          </ComponentCard>
        )}

        {request.contentType === "video" && request.video && (
          <ComponentCard title="Video Details">
            <div className="space-y-4">
              <dl className="grid grid-cols-1 gap-x-6 gap-y-5 text-sm md:grid-cols-2 min-[1200px]:grid-cols-3">
                <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Title</dt><dd className="mt-1 font-medium text-gray-800 dark:text-white/90">{request.video.title || "—"}</dd></div>
                <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Video Type</dt><dd className="mt-1 text-gray-800 dark:text-white/90">{request.video.videoType || "—"}</dd></div>
                <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Duration</dt><dd className="mt-1 text-gray-800 dark:text-white/90">{request.video.duration || "—"}</dd></div>
                <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Released Date</dt><dd className="mt-1 text-gray-800 dark:text-white/90">{request.video.releasedDate ? new Date(request.video.releasedDate).toLocaleDateString() : "—"}</dd></div>
                <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Language</dt><dd className="mt-1 text-gray-800 dark:text-white/90">{request.video.language || "—"}</dd></div>
                <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Aspect Ratio</dt><dd className="mt-1 text-gray-800 dark:text-white/90">{request.video.aspectRatio || "—"}</dd></div>
                <div className="col-span-1 md:col-span-2 min-[1200px]:col-span-3"><dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">YouTube Link</dt><dd className="mt-1 text-gray-800 dark:text-white/90 break-all">{request.video.youtubeLink || "—"}</dd></div>
                <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Theme</dt><dd className="mt-1 text-gray-800 dark:text-white/90">{request.video.theme || "—"}</dd></div>
              </dl>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Synopsis</p>
                <div className="mt-1">{renderRichHtml(request.video.synopsis)}</div>
              </div>
              {request.video.tags && request.video.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {request.video.tags.map((tag) => <Badge key={tag} color="light">{tag}</Badge>)}
                </div>
              )}
              {request.video.thumbnail && <MediaFilePreview file={request.video.thumbnail} />}
            </div>
          </ComponentCard>
        )}

        {request.tags && request.tags.length > 0 && (
          <ComponentCard title="Common Tags">
            <div className="flex flex-wrap gap-2">
              {request.tags.map((tag) => <Badge key={tag} color="light">{tag}</Badge>)}
            </div>
          </ComponentCard>
        )}
      </div>
    </div>
  );
}

function MediaFilePreview({ file }: { file: MediaFile }) {
  const type = file.type || "image";
  const name = file.name || `Media (${type})`;

  return (
    <div className="rounded-[10px] border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-dark overflow-hidden">
      <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-gray-800 dark:text-white/90 truncate">{name}</span>
        <span className="shrink-0 rounded bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300 capitalize">
          {type}
        </span>
      </div>
      <div className="min-h-[120px] bg-gray-50 dark:bg-gray-900/50 flex items-center justify-center">
        {type === "image" && (
          <a href={file.url} target="_blank" rel="noopener noreferrer" className="block w-full focus:ring-2 focus:ring-brand-500 rounded-b-xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={file.url} alt={name} className="h-48 w-full object-cover hover:opacity-95 transition" />
          </a>
        )}
      </div>
      <div className="border-t border-gray-200 px-4 py-2 dark:border-gray-800">
        <a
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-brand-500 hover:text-brand-600"
        >
          Open / download →
        </a>
      </div>
    </div>
  );
}
