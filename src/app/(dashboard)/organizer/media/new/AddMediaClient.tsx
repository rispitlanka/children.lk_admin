"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import TextArea from "@/components/form/input/TextArea";
import DatePicker from "@/components/form/date-picker";
import TagsSelect from "@/components/form/TagsSelect";
import ResourceDescriptionQuill from "@/components/form/ResourceDescriptionQuill";
import { slugify } from "@/lib/slugify";

type ContentType = "artwork" | "story_poem" | "video";
type VisibilityStatus = "draft" | "published" | "archived";
type MediaFile = { url: string; publicId: string; type: "image"; name?: string };

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  artwork: "Artwork",
  story_poem: "Story / Poem",
  video: "Video",
};

const THEMES = [
  "Nature & Environment",
  "Family & Community",
  "Dreams & Future",
  "Identity & Culture",
  "Peace & Hope",
  "Fantasy & Imagination",
  "Everyday Life",
];

const MEDIUMS = ["Pen and Paper", "Watercolor", "Digital", "Sketch"];
const WRITTEN_WORK_TYPES = ["Story", "Poem", "Novel", "Essay", "Journal"];
const VIDEO_TYPES = ["Short Film", "Animation", "Interview", "Documentary"];
const LANGUAGES = ["Tamil", "Sinhala", "English"];
const ASPECT_RATIOS = ["Vertical", "Horizontal"];
const GENDERS = ["Male", "Female", "Other"];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadImage(file: File, folder = "childrenlk/media"): Promise<{ url: string; publicId: string }> {
  const base64 = await fileToBase64(file);
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file: base64, folder, resource_type: "image" }),
  });
  const data = await res.json();
  if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed");
  return { url: data.url, publicId: data.publicId };
}

export default function AddMediaClient() {
  const richTextEditorClass = [
    "resource-description-editor mt-1 rounded-lg border border-gray-300 shadow-theme-xs overflow-hidden",
    "dark:border-gray-700",
    "[&_.ql-toolbar]:rounded-t-lg [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-gray-200 [&_.ql-toolbar]:bg-gray-50",
    "dark:[&_.ql-toolbar]:border-gray-700 dark:[&_.ql-toolbar]:bg-gray-800/80",
    "[&_.ql-container]:rounded-b-lg [&_.ql-container]:border-0 [&_.ql-container]:bg-transparent dark:[&_.ql-container]:bg-gray-900",
    "[&_.ql-editor]:min-h-[180px] [&_.ql-editor]:px-3 [&_.ql-editor]:py-2.5 [&_.ql-editor]:text-sm",
    "text-gray-800 dark:[&_.ql-editor]:text-white/90",
    "[&_.ql-stroke]:stroke-gray-600 dark:[&_.ql-stroke]:stroke-gray-400",
    "[&_.ql-fill]:fill-gray-600 dark:[&_.ql-fill]:fill-gray-400",
  ].join(" ");

  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = Boolean(editId);
  const [contentType, setContentType] = useState<ContentType>("artwork");
  const [visibilityStatus, setVisibilityStatus] = useState<VisibilityStatus>("draft");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [error, setError] = useState("");

  const [childInfo, setChildInfo] = useState({
    fullName: "",
    age: "",
    gender: "",
    city: "",
    country: "",
  });
  const [guardianContact, setGuardianContact] = useState({
    guardianName: "",
    phone: "",
    relationshipToChild: "",
  });

  const [artwork, setArtwork] = useState({
    title: "",
    description: "",
    medium: MEDIUMS[0],
    dateCreated: "",
    theme: THEMES[0],
  });
  const [storyPoem, setStoryPoem] = useState({
    title: "",
    writtenWorkType: WRITTEN_WORK_TYPES[0],
    language: LANGUAGES[0],
    dateWritten: "",
    article: "",
    theme: THEMES[0],
  });
  const [video, setVideo] = useState({
    title: "",
    videoType: VIDEO_TYPES[0],
    duration: "",
    releasedDate: "",
    language: LANGUAGES[0],
    aspectRatio: ASPECT_RATIOS[0],
    synopsis: "",
    youtubeLink: "",
    theme: THEMES[0],
  });

  const [source, setSource] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEditedManually, setSlugEditedManually] = useState(false);
  const [commonTags, setCommonTags] = useState<string[]>([]);
  const [artworkTags, setArtworkTags] = useState<string[]>([]);
  const [storyPoemTags, setStoryPoemTags] = useState<string[]>([]);
  const [videoTags, setVideoTags] = useState<string[]>([]);
  const [artworkFile, setArtworkFile] = useState<MediaFile | null>(null);
  const [storyCoverImage, setStoryCoverImage] = useState<MediaFile | null>(null);
  const [videoThumbnail, setVideoThumbnail] = useState<MediaFile | null>(null);

  const primaryActionLabel =
    visibilityStatus === "published"
      ? isEditMode
        ? "Update and submit for review"
        : "Submit request"
      : visibilityStatus === "archived"
        ? isEditMode
          ? "Update archived"
          : "Save as archived"
        : isEditMode
          ? "Update draft"
          : "Save as draft";

  const selectedTypeLabel = useMemo(() => CONTENT_TYPE_LABELS[contentType], [contentType]);

  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingExisting(true);
        const res = await fetch(`/api/organizer/media-requests/${editId}`);
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error ?? "Failed to load media");
        if (cancelled) return;
        setContentType((data.contentType as ContentType) || "artwork");
        setVisibilityStatus((data.visibilityStatus as VisibilityStatus) || "draft");
        setChildInfo({
          fullName: data.childInfo?.fullName ?? "",
          age: data.childInfo?.age ?? "",
          gender: data.childInfo?.gender ?? "",
          city: data.childInfo?.city ?? "",
          country: data.childInfo?.country ?? "",
        });
        setGuardianContact({
          guardianName: data.guardianContact?.guardianName ?? "",
          phone: data.guardianContact?.phone ?? "",
          relationshipToChild: data.guardianContact?.relationshipToChild ?? "",
        });
        setSource(data.source ?? "");
        setSlug(String(data.slug ?? ""));
        setSlugEditedManually(Boolean(String(data.slug ?? "").trim()));
        setCommonTags(Array.isArray(data.tags) ? data.tags : []);
        if (data.artwork) {
          setArtwork({
            title: data.artwork.title ?? "",
            description: data.artwork.description ?? "",
            medium: data.artwork.medium ?? MEDIUMS[0],
            dateCreated: data.artwork.dateCreated ? String(data.artwork.dateCreated).slice(0, 10) : "",
            theme: data.artwork.theme ?? THEMES[0],
          });
          setArtworkTags(Array.isArray(data.artwork.tags) ? data.artwork.tags : []);
          if (data.artwork.artwork?.url && data.artwork.artwork?.publicId) {
            setArtworkFile({
              url: data.artwork.artwork.url,
              publicId: data.artwork.artwork.publicId,
              type: "image",
              name: data.artwork.artwork.name,
            });
          }
        }
        if (data.storyPoem) {
          setStoryPoem({
            title: data.storyPoem.title ?? "",
            writtenWorkType: data.storyPoem.writtenWorkType ?? WRITTEN_WORK_TYPES[0],
            language: data.storyPoem.language ?? LANGUAGES[0],
            dateWritten: data.storyPoem.dateWritten ? String(data.storyPoem.dateWritten).slice(0, 10) : "",
            article: data.storyPoem.article ?? "",
            theme: data.storyPoem.theme ?? THEMES[0],
          });
          setStoryPoemTags(Array.isArray(data.storyPoem.tags) ? data.storyPoem.tags : []);
          if (data.storyPoem.coverImage?.url && data.storyPoem.coverImage?.publicId) {
            setStoryCoverImage({
              url: data.storyPoem.coverImage.url,
              publicId: data.storyPoem.coverImage.publicId,
              type: "image",
              name: data.storyPoem.coverImage.name,
            });
          }
        }
        if (data.video) {
          setVideo({
            title: data.video.title ?? "",
            videoType: data.video.videoType ?? VIDEO_TYPES[0],
            duration: data.video.duration ?? "",
            releasedDate: data.video.releasedDate ? String(data.video.releasedDate).slice(0, 10) : "",
            language: data.video.language ?? LANGUAGES[0],
            aspectRatio: data.video.aspectRatio ?? ASPECT_RATIOS[0],
            synopsis: data.video.synopsis ?? "",
            youtubeLink: data.video.youtubeLink ?? "",
            theme: data.video.theme ?? THEMES[0],
          });
          setVideoTags(Array.isArray(data.video.tags) ? data.video.tags : []);
          if (data.video.thumbnail?.url && data.video.thumbnail?.publicId) {
            setVideoThumbnail({
              url: data.video.thumbnail.url,
              publicId: data.video.thumbnail.publicId,
              type: "image",
              name: data.video.thumbnail.name,
            });
          }
        }
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : "Failed to load media";
          setError(msg);
          toast.error(msg);
        }
      } finally {
        if (!cancelled) setLoadingExisting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editId]);

  const activeTitle =
    contentType === "artwork"
      ? artwork.title
      : contentType === "story_poem"
        ? storyPoem.title
        : video.title;

  useEffect(() => {
    if (slugEditedManually) return;
    setSlug(slugify(activeTitle));
  }, [activeTitle, slugEditedManually]);

  const uploadOneImage = async (
    file: File | undefined,
    setter: React.Dispatch<React.SetStateAction<MediaFile | null>>
  ) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      toast.error("Please select an image file");
      return;
    }
    setUploading(true);
    try {
      const result = await uploadImage(file);
      setter({ url: result.url, publicId: result.publicId, type: "image", name: file.name });
      toast.success("Image uploaded");
    } catch {
      setError("Failed to upload image");
      toast.error("Failed to upload image");
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (
      !childInfo.fullName.trim() ||
      !childInfo.age.trim() ||
      !childInfo.gender.trim() ||
      !childInfo.city.trim() ||
      !childInfo.country.trim()
    ) {
      setError("Complete all child information fields");
      return;
    }
    if (
      !guardianContact.guardianName.trim() ||
      !guardianContact.phone.trim() ||
      !guardianContact.relationshipToChild.trim()
    ) {
      setError("Complete all guardian contact fields");
      return;
    }

    const payload: Record<string, unknown> = {
      contentType,
      visibilityStatus,
      childInfo,
      guardianContact,
      tags: commonTags,
      source: source.trim() || undefined,
      slug: slug.trim() || undefined,
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (contentType === "artwork") {
      if (!artwork.title.trim() || !artwork.description.trim() || !artworkFile) {
        setError("Artwork title, description, and artwork image are required");
        return;
      }
      if (artwork.dateCreated && new Date(artwork.dateCreated) > today) {
        setError("Date Created cannot be a future date");
        return;
      }
      payload.artwork = {
        ...artwork,
        dateCreated: artwork.dateCreated || undefined,
        tags: artworkTags,
        artwork: artworkFile,
      };
    } else if (contentType === "story_poem") {
      if (!storyPoem.title.trim() || !storyPoem.article.trim()) {
        setError("Story/Poem title and article are required");
        return;
      }
      if (storyPoem.dateWritten && new Date(storyPoem.dateWritten) > today) {
        setError("Date Written cannot be a future date");
        return;
      }
      payload.storyPoem = {
        ...storyPoem,
        dateWritten: storyPoem.dateWritten || undefined,
        tags: storyPoemTags,
        coverImage: storyCoverImage || undefined,
      };
    } else {
      if (!video.title.trim() || !video.youtubeLink.trim() || !videoThumbnail) {
        setError("Video title, YouTube link, and thumbnail are required");
        return;
      }
      if (video.releasedDate && new Date(video.releasedDate) > today) {
        setError("Released Date cannot be a future date");
        return;
      }
      payload.video = {
        ...video,
        releasedDate: video.releasedDate || undefined,
        synopsis: video.synopsis.trim() || undefined,
        tags: videoTags,
        thumbnail: videoThumbnail,
      };
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        editId ? `/api/organizer/media-requests/${editId}` : "/api/organizer/media-requests",
        {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error ?? "Failed to submit";
        setError(msg);
        toast.error(msg);
        setSubmitting(false);
        return;
      }
      toast.success(
        visibilityStatus === "published"
          ? editId
            ? "Media updated and submitted for review"
            : "Media request submitted"
          : visibilityStatus === "archived"
            ? editId
              ? "Media updated as archived"
              : "Media saved as archived"
            : editId
              ? "Media updated as draft"
              : "Media saved as draft"
      );
      router.push("/organizer/media");
    } catch {
      setError("Something went wrong");
      toast.error("Something went wrong");
    }
    setSubmitting(false);
  };

  return (
    <div className="w-full space-y-6">
      <div className="mb-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageBreadcrumb pageTitle={isEditMode ? "Edit Media" : "Add Media"} />
        <Button size="sm" variant="outline" onClick={() => router.push("/organizer/media")}>
          Back to Media
        </Button>
      </div>

      {loadingExisting && (
        <ComponentCard title="Loading media">
          <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        </ComponentCard>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <p className="rounded-lg bg-error-50 px-4 py-2 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
            {error}
          </p>
        )}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="space-y-6">
            <ComponentCard title="Children Information">
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>Full Name *</Label><Input className="mt-1" value={childInfo.fullName} onChange={(e)=>setChildInfo((p)=>({...p,fullName:e.target.value}))} /></div>
                <div><Label>Age *</Label><Input className="mt-1" value={childInfo.age} onChange={(e)=>setChildInfo((p)=>({...p,age:e.target.value}))} /></div>
                <div>
                  <Label>Gender *</Label>
                  <select className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900" value={childInfo.gender} onChange={(e)=>setChildInfo((p)=>({...p,gender:e.target.value}))}>
                    <option value="">Select</option>{GENDERS.map((g)=><option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div><Label>City *</Label><Input className="mt-1" value={childInfo.city} onChange={(e)=>setChildInfo((p)=>({...p,city:e.target.value}))} /></div>
                <div><Label>Country *</Label><Input className="mt-1" value={childInfo.country} onChange={(e)=>setChildInfo((p)=>({...p,country:e.target.value}))} /></div>
              </div>
            </ComponentCard>

            <ComponentCard title="Guardian Contact" desc="This will not be shown in frontend">
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>Guardian Name *</Label><Input className="mt-1" value={guardianContact.guardianName} onChange={(e)=>setGuardianContact((p)=>({...p,guardianName:e.target.value}))} /></div>
                <div><Label>Phone *</Label><Input className="mt-1" value={guardianContact.phone} onChange={(e)=>setGuardianContact((p)=>({...p,phone:e.target.value}))} /></div>
                <div><Label>Relationship to Child *</Label><Input className="mt-1" value={guardianContact.relationshipToChild} onChange={(e)=>setGuardianContact((p)=>({...p,relationshipToChild:e.target.value}))} /></div>
              </div>
            </ComponentCard>

            <ComponentCard title="Publishing & visibility">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Status</Label>
                  <select className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900" value={visibilityStatus} onChange={(e)=>setVisibilityStatus(e.target.value as VisibilityStatus)}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {visibilityStatus === "published"
                      ? `${selectedTypeLabel} will be sent for admin review.`
                      : `${selectedTypeLabel} will be saved without admin review.`}
                  </p>
                </div>
                <div>
                  <Label>Source</Label>
                  <Input
                    className="mt-1"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="Source of the media"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>URL slug (optional)</Label>
                  <Input
                    className="mt-1"
                    value={slug}
                    onChange={(e) => {
                      const next = e.target.value;
                      setSlugEditedManually(next.trim().length > 0);
                      setSlug(slugify(next));
                    }}
                    placeholder="Leave blank to auto-generate from title"
                  />
                </div>
              </div>
            </ComponentCard>
          </div>

          <div className="space-y-6">
            <ComponentCard title="Content">
              <div className="space-y-5">
                <div>
                  <Label>Content Type *</Label>
                  <select className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900" value={contentType} onChange={(e)=>setContentType(e.target.value as ContentType)}>
                    {Object.entries(CONTENT_TYPE_LABELS).map(([value,label])=><option key={value} value={value}>{label}</option>)}
                  </select>
                </div>

                {contentType === "artwork" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><Label>Title of the Artwork *</Label><Input className="mt-1" value={artwork.title} onChange={(e)=>setArtwork((p)=>({...p,title:e.target.value}))} /></div>
                    <div>
                      <DatePicker
                        id="media-artwork-date-created"
                        label="Date Created"
                        value={artwork.dateCreated}
                        maxDate={new Date().toISOString().slice(0, 10)}
                        onChange={(nextDate) => setArtwork((p) => ({ ...p, dateCreated: nextDate }))}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Description *</Label>
                      <ResourceDescriptionQuill
                        value={artwork.description}
                        onChange={(html) => setArtwork((p) => ({ ...p, description: html }))}
                        placeholder="Describe the artwork"
                        className={richTextEditorClass}
                      />
                    </div>
                    <div><Label>Medium *</Label><select className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900" value={artwork.medium} onChange={(e)=>setArtwork((p)=>({...p,medium:e.target.value}))}>{MEDIUMS.map((x)=><option key={x} value={x}>{x}</option>)}</select></div>
                    <div><Label>Theme *</Label><select className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900" value={artwork.theme} onChange={(e)=>setArtwork((p)=>({...p,theme:e.target.value}))}>{THEMES.map((x)=><option key={x} value={x}>{x}</option>)}</select></div>
                    <div className="sm:col-span-2"><TagsSelect label="Tags" value={artworkTags} onChange={setArtworkTags} placeholder="Add tags" /></div>
                    <div className="sm:col-span-2">
                      <Label>Artwork *</Label>
                      <input type="file" accept="image/*" disabled={uploading} onChange={(e)=>uploadOneImage(e.target.files?.[0], setArtworkFile)} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-700" />
                      {artworkFile && <p className="mt-2 text-xs text-gray-500">{artworkFile.name ?? "Artwork uploaded"}</p>}
                    </div>
                  </div>
                )}

                {contentType === "story_poem" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><Label>Title *</Label><Input className="mt-1" value={storyPoem.title} onChange={(e)=>setStoryPoem((p)=>({...p,title:e.target.value}))} /></div>
                    <div>
                      <DatePicker
                        id="media-story-date-written"
                        label="Date Written"
                        value={storyPoem.dateWritten}
                        maxDate={new Date().toISOString().slice(0, 10)}
                        onChange={(nextDate) => setStoryPoem((p) => ({ ...p, dateWritten: nextDate }))}
                      />
                    </div>
                    <div><Label>Written Work Type *</Label><select className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900" value={storyPoem.writtenWorkType} onChange={(e)=>setStoryPoem((p)=>({...p,writtenWorkType:e.target.value}))}>{WRITTEN_WORK_TYPES.map((x)=><option key={x} value={x}>{x}</option>)}</select></div>
                    <div><Label>Language *</Label><select className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900" value={storyPoem.language} onChange={(e)=>setStoryPoem((p)=>({...p,language:e.target.value}))}>{LANGUAGES.map((x)=><option key={x} value={x}>{x}</option>)}</select></div>
                    <div className="sm:col-span-2">
                      <Label>Article (Rich Text) *</Label>
                      <ResourceDescriptionQuill
                        value={storyPoem.article}
                        onChange={(html) => setStoryPoem((p) => ({ ...p, article: html }))}
                        placeholder="Write story/poem content"
                        className={richTextEditorClass}
                      />
                    </div>
                    <div><Label>Theme *</Label><select className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900" value={storyPoem.theme} onChange={(e)=>setStoryPoem((p)=>({...p,theme:e.target.value}))}>{THEMES.map((x)=><option key={x} value={x}>{x}</option>)}</select></div>
                    <div className="sm:col-span-2"><TagsSelect label="Tags" value={storyPoemTags} onChange={setStoryPoemTags} placeholder="Add tags" /></div>
                    <div className="sm:col-span-2">
                      <Label>Cover Image (optional)</Label>
                      <input type="file" accept="image/*" disabled={uploading} onChange={(e)=>uploadOneImage(e.target.files?.[0], setStoryCoverImage)} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-700" />
                      {storyCoverImage && <p className="mt-2 text-xs text-gray-500">{storyCoverImage.name ?? "Cover image uploaded"}</p>}
                    </div>
                  </div>
                )}

                {contentType === "video" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><Label>Video Title *</Label><Input className="mt-1" value={video.title} onChange={(e)=>setVideo((p)=>({...p,title:e.target.value}))} /></div>
                    <div><Label>Duration *</Label><Input className="mt-1" placeholder="e.g. 3m 20s" value={video.duration} onChange={(e)=>setVideo((p)=>({...p,duration:e.target.value}))} /></div>
                    <div><Label>Video Type *</Label><select className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900" value={video.videoType} onChange={(e)=>setVideo((p)=>({...p,videoType:e.target.value}))}>{VIDEO_TYPES.map((x)=><option key={x} value={x}>{x}</option>)}</select></div>
                    <div>
                      <DatePicker
                        id="media-video-released-date"
                        label="Released Date"
                        value={video.releasedDate}
                        maxDate={new Date().toISOString().slice(0, 10)}
                        onChange={(nextDate) => setVideo((p) => ({ ...p, releasedDate: nextDate }))}
                      />
                    </div>
                    <div><Label>Language *</Label><select className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900" value={video.language} onChange={(e)=>setVideo((p)=>({...p,language:e.target.value}))}>{LANGUAGES.map((x)=><option key={x} value={x}>{x}</option>)}</select></div>
                    <div><Label>Aspect Ratio *</Label><select className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900" value={video.aspectRatio} onChange={(e)=>setVideo((p)=>({...p,aspectRatio:e.target.value}))}>{ASPECT_RATIOS.map((x)=><option key={x} value={x}>{x}</option>)}</select></div>
                    <div className="sm:col-span-2"><Label>YouTube Link *</Label><Input className="mt-1" value={video.youtubeLink} onChange={(e)=>setVideo((p)=>({...p,youtubeLink:e.target.value}))} placeholder="https://youtube.com/..." /></div>
                    <div className="sm:col-span-2">
                      <Label>Synopsis (optional)</Label>
                      <ResourceDescriptionQuill
                        value={video.synopsis}
                        onChange={(html) => setVideo((p) => ({ ...p, synopsis: html }))}
                        placeholder="Enter synopsis"
                        className={richTextEditorClass}
                      />
                    </div>
                    <div><Label>Theme *</Label><select className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900" value={video.theme} onChange={(e)=>setVideo((p)=>({...p,theme:e.target.value}))}>{THEMES.map((x)=><option key={x} value={x}>{x}</option>)}</select></div>
                    <div className="sm:col-span-2"><TagsSelect label="Tags" value={videoTags} onChange={setVideoTags} placeholder="Add tags" /></div>
                    <div className="sm:col-span-2">
                      <Label>Thumbnail *</Label>
                      <input type="file" accept="image/*" disabled={uploading} onChange={(e)=>uploadOneImage(e.target.files?.[0], setVideoThumbnail)} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-700" />
                      {videoThumbnail && <p className="mt-2 text-xs text-gray-500">{videoThumbnail.name ?? "Thumbnail uploaded"}</p>}
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                  <TagsSelect label="Common tags (optional)" value={commonTags} onChange={setCommonTags} placeholder="Add tags for all media types" />
                </div>
              </div>
            </ComponentCard>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 rounded-2xl border border-gray-200 bg-white px-6 py-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <Button type="submit" size="sm" disabled={loadingExisting || submitting || uploading}>
            {submitting ? "Submitting..." : primaryActionLabel}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => router.push("/organizer/media")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
