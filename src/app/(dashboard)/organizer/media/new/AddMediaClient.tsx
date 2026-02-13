"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import TextArea from "@/components/form/input/TextArea";
import Badge from "@/components/ui/badge/Badge";
import { TrashBinIcon } from "@/icons";

type MediaFileType = "video" | "audio" | "image";
type MediaFile = { url: string; publicId: string; type: MediaFileType; name?: string };

const MEDIA_TYPE_OPTIONS: { value: MediaFileType; label: string; accept: string }[] = [
  { value: "image", label: "Picture", accept: "image/*" },
  { value: "video", label: "Video", accept: "video/*" },
  { value: "audio", label: "Audio", accept: "audio/*" },
];

function getCloudinaryResourceType(mediaType: MediaFileType): "image" | "video" {
  return mediaType === "image" ? "image" : "video";
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadFile(
  file: File,
  folder: string,
  resourceType: "image" | "video"
): Promise<{ url: string; publicId: string }> {
  const base64 = await fileToBase64(file);
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file: base64, folder, resource_type: resourceType }),
  });
  const data = await res.json();
  if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed");
  return { url: data.url, publicId: data.publicId };
}

export default function AddMediaClient() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", description: "" });
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [mediaType, setMediaType] = useState<MediaFileType>("image");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const resourceType = getCloudinaryResourceType(mediaType);
      const result = await uploadFile(file, "childrenlk/media", resourceType);
      setFiles((prev) => [...prev, { url: result.url, publicId: result.publicId, type: mediaType, name: file.name }]);
    } catch {
      setError("Failed to upload file");
      toast.error("Failed to upload file");
    }
    setUploading(false);
    e.target.value = "";
  };

  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/organizer/media-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, description: form.description, files }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error ?? "Failed to submit";
        setError(msg);
        toast.error(msg);
        setSubmitting(false);
        return;
      }
      toast.success("Media request submitted successfully");
      router.push("/organizer/media");
    } catch {
      setError("Something went wrong");
      toast.error("Something went wrong");
    }
    setSubmitting(false);
  };

  const mediaAccept = MEDIA_TYPE_OPTIONS.find((o) => o.value === mediaType)?.accept ?? "";

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageBreadcrumb pageTitle="Add Media" />
        <Button size="sm" variant="outline" onClick={() => router.push("/organizer/media")}>
          Back to Media
        </Button>
      </div>

      <ComponentCard
        title="Submit media request"
        desc="Add a new media item for review. Include a name, description, and upload files (images, video, or audio)."
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <p className="rounded-lg bg-error-50 px-4 py-2 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">{error}</p>}

          <div className="grid gap-6 sm:grid-cols-1">
            <div>
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Media title"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label>Description *</Label>
              <TextArea
                value={form.description}
                onChange={(v) => setForm((f) => ({ ...f, description: v }))}
                rows={4}
                placeholder="Describe your media content"
                className="mt-1"
              />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5 dark:border-gray-800 dark:bg-gray-800/30">
            <h4 className="text-sm font-medium text-gray-800 dark:text-white/90">Upload files</h4>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Select type, then choose a file. You can add multiple files.</p>
            <div className="mt-4 flex flex-wrap items-end gap-4">
              <div className="min-w-[140px]">
                <Label className="text-xs text-gray-500 dark:text-gray-400">Type</Label>
                <select
                  value={mediaType}
                  onChange={(e) => setMediaType(e.target.value as MediaFileType)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  {MEDIA_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-0">
                <Label className="text-xs text-gray-500 dark:text-gray-400">File</Label>
                <input
                  type="file"
                  accept={mediaAccept}
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-500/10 dark:file:text-brand-400"
                />
              </div>
            </div>
            {uploading && <p className="mt-2 text-xs text-gray-500">Uploading...</p>}
            {files.length > 0 && (
              <ul className="mt-4 space-y-2">
                {files.map((f, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50"
                  >
                    <span className="flex min-w-0 flex-1 items-center gap-3">
                      {f.type === "image" && <img src={f.url} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />}
                      <a href={f.url} target="_blank" rel="noopener noreferrer" className="truncate text-sm font-medium text-brand-500 hover:text-brand-600">
                        {f.name ?? f.type}
                      </a>
                      <Badge color="info" size="sm">{f.type}</Badge>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="shrink-0 rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-error-500 dark:hover:bg-gray-700"
                      aria-label="Remove"
                    >
                      <TrashBinIcon className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap gap-3 border-t border-gray-200 pt-6 dark:border-gray-800">
            <Button type="submit" size="sm" disabled={submitting || uploading}>
              {submitting ? "Submitting..." : "Submit request"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => router.push("/organizer/media")}>
              Cancel
            </Button>
          </div>
        </form>
      </ComponentCard>
    </div>
  );
}
