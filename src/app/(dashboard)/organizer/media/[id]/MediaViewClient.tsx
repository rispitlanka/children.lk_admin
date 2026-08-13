"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ComponentCard from "@/components/common/ComponentCard";
import LoadingLottie from "@/components/common/LoadingLottie";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";

type MediaFile = { url: string; publicId: string; type: "image" | "video" | "audio"; name?: string };
type Media = {
  _id: string;
  name: string;
  description: string;
  contentType: "artwork" | "story_poem" | "video" | string;
  visibilityStatus?: "draft" | "published" | "archived";
  status: "pending" | "approved" | "denied" | string;
  adminReason?: string;
  childInfo?: { fullName?: string; age?: string; gender?: string; city?: string; country?: string };
  artwork?: { title?: string; description?: string; medium?: string; theme?: string; artwork?: MediaFile };
  storyPoem?: {
    title?: string;
    writtenWorkType?: string;
    language?: string;
    article?: string;
    theme?: string;
    coverImage?: MediaFile;
  };
  video?: {
    title?: string;
    videoType?: string;
    duration?: string;
    language?: string;
    aspectRatio?: string;
    synopsis?: string;
    youtubeLink?: string;
    theme?: string;
    thumbnail?: MediaFile;
  };
  files?: MediaFile[];
  createdAt: string;
};

const typeLabel = (type: string) =>
  type === "artwork" ? "Artwork" : type === "story_poem" ? "Story / Poem" : type === "video" ? "Video" : "Media";

const statusBadge = (media: Media) => {
  if (media.visibilityStatus === "draft") return <Badge color="info">Draft</Badge>;
  if (media.visibilityStatus === "archived") return <Badge color="warning">Archived</Badge>;
  if (media.status === "pending") return <Badge color="warning">Pending</Badge>;
  if (media.status === "approved") return <Badge color="success">Approved</Badge>;
  return <Badge color="error">Denied</Badge>;
};

export default function MediaViewClient() {
  const params = useParams();
  const router = useRouter();
  const [media, setMedia] = useState<Media | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/organizer/media-requests/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setMedia(data);
      })
      .catch((err) => {
        setError(err.message || "Failed to load media");
        setMedia(null);
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <LoadingLottie variant="block" />;
  if (error || !media) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Media Details" />
        <ComponentCard title="Error">
          <p className="py-8 text-center text-gray-500 dark:text-gray-400">{error || "Media not found"}</p>
        </ComponentCard>
      </div>
    );
  }

  const mainImage =
    media.contentType === "artwork"
      ? media.artwork?.artwork
      : media.contentType === "story_poem"
        ? media.storyPoem?.coverImage
        : media.video?.thumbnail;

  return (
    <div className="space-y-6">
      <div className="mb-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageBreadcrumb pageTitle="Media Details" />
        <div className="flex items-center gap-2">
          {media.visibilityStatus === "draft" && (
            <Link href={`/organizer/media/new?edit=${media._id}`}>
              <Button size="sm">Edit</Button>
            </Link>
          )}
          <Button size="sm" variant="outline" onClick={() => router.push("/organizer/media")}>
            Back to Media
          </Button>
        </div>
      </div>

      <ComponentCard title={media.name}>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {statusBadge(media)}
            <Badge color="info">{typeLabel(media.contentType)}</Badge>
            <span className="text-xs text-gray-500">{new Date(media.createdAt).toLocaleDateString()}</span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">{media.description}</p>
          {mainImage?.url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mainImage.url} alt={mainImage.name ?? media.name} className="h-64 w-full rounded-lg object-cover" />
          )}
          {media.status === "denied" && media.adminReason && (
            <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-300">
              {media.adminReason}
            </div>
          )}
        </div>
      </ComponentCard>

      <ComponentCard title="Child Information">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-5 text-sm md:grid-cols-2 min-[1200px]:grid-cols-3">
          <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Full Name</dt><dd className="mt-1 font-medium text-gray-800 dark:text-white/90">{media.childInfo?.fullName || "—"}</dd></div>
          <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Age</dt><dd className="mt-1 text-gray-800 dark:text-white/90">{media.childInfo?.age || "—"}</dd></div>
          <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Gender</dt><dd className="mt-1 text-gray-800 dark:text-white/90">{media.childInfo?.gender || "—"}</dd></div>
          <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">City</dt><dd className="mt-1 text-gray-800 dark:text-white/90">{media.childInfo?.city || "—"}</dd></div>
          <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Country</dt><dd className="mt-1 text-gray-800 dark:text-white/90">{media.childInfo?.country || "—"}</dd></div>
        </dl>
      </ComponentCard>

      <ComponentCard title="Content Details">
        {media.contentType === "artwork" && (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-5 text-sm md:grid-cols-2 min-[1200px]:grid-cols-3">
            <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Title</dt><dd className="mt-1 font-medium text-gray-800 dark:text-white/90">{media.artwork?.title || "—"}</dd></div>
            <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Medium</dt><dd className="mt-1 text-gray-800 dark:text-white/90">{media.artwork?.medium || "—"}</dd></div>
            <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Theme</dt><dd className="mt-1 text-gray-800 dark:text-white/90">{media.artwork?.theme || "—"}</dd></div>
          </dl>
        )}
        {media.contentType === "story_poem" && (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-5 text-sm md:grid-cols-2 min-[1200px]:grid-cols-3">
            <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Title</dt><dd className="mt-1 font-medium text-gray-800 dark:text-white/90">{media.storyPoem?.title || "—"}</dd></div>
            <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Work Type</dt><dd className="mt-1 text-gray-800 dark:text-white/90">{media.storyPoem?.writtenWorkType || "—"}</dd></div>
            <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Language</dt><dd className="mt-1 text-gray-800 dark:text-white/90">{media.storyPoem?.language || "—"}</dd></div>
            <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Theme</dt><dd className="mt-1 text-gray-800 dark:text-white/90">{media.storyPoem?.theme || "—"}</dd></div>
          </dl>
        )}
        {media.contentType === "video" && (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-5 text-sm md:grid-cols-2 min-[1200px]:grid-cols-3">
            <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Title</dt><dd className="mt-1 font-medium text-gray-800 dark:text-white/90">{media.video?.title || "—"}</dd></div>
            <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Video Type</dt><dd className="mt-1 text-gray-800 dark:text-white/90">{media.video?.videoType || "—"}</dd></div>
            <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Duration</dt><dd className="mt-1 text-gray-800 dark:text-white/90">{media.video?.duration || "—"}</dd></div>
            <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Language</dt><dd className="mt-1 text-gray-800 dark:text-white/90">{media.video?.language || "—"}</dd></div>
            <div className="col-span-1 md:col-span-2 min-[1200px]:col-span-3"><dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">YouTube</dt><dd className="mt-1 text-gray-800 dark:text-white/90 break-all">{media.video?.youtubeLink || "—"}</dd></div>
          </dl>
        )}
      </ComponentCard>
    </div>
  );
}
