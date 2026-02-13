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
import TagsSelect from "@/components/form/TagsSelect";
import Badge from "@/components/ui/badge/Badge";
import { TrashBinIcon } from "@/icons";

type DocType = "pdf" | "video" | "audio" | "docx" | "ppt";
type DocumentFile = { url: string; publicId: string; type: DocType; name?: string };

const DOC_TYPE_OPTIONS: { value: DocType; label: string; accept: string }[] = [
  { value: "pdf", label: "PDF", accept: ".pdf,application/pdf" },
  { value: "docx", label: "Word (docx)", accept: ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
  { value: "ppt", label: "PowerPoint (ppt)", accept: ".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation" },
  { value: "audio", label: "Audio", accept: "audio/*" },
  { value: "video", label: "Video", accept: "video/*" },
];

function getCloudinaryResourceType(docType: DocType): "image" | "video" | "raw" {
  if (docType === "video" || docType === "audio") return "video";
  return "raw";
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadFile(file: File, folder: string, resourceType: "image" | "video" | "raw"): Promise<{ url: string; publicId: string }> {
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

export default function AddResourceClient() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    shortDescription: "",
    picture: "",
    picturePublicId: "",
  });
  const [tags, setTags] = useState<string[]>([]);
  const [picturePreview, setPicturePreview] = useState<{ url: string; publicId: string } | null>(null);
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [documentType, setDocumentType] = useState<DocType>("pdf");
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handlePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (PNG, JPG, etc.)");
      toast.error("Please select an image file (PNG, JPG, etc.)");
      return;
    }
    setError("");
    setUploadingPicture(true);
    try {
      const result = await uploadFile(file, "childrenlk/resources/pictures", "image");
      setPicturePreview(result);
      setForm((f) => ({ ...f, picture: result.url, picturePublicId: result.publicId }));
    } catch {
      setError("Failed to upload picture");
      toast.error("Failed to upload picture");
    }
    setUploadingPicture(false);
    e.target.value = "";
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploadingDocs(true);
    try {
      const resourceType = getCloudinaryResourceType(documentType);
      const result = await uploadFile(file, "childrenlk/resources/documents", resourceType);
      setDocuments((prev) => [...prev, { url: result.url, publicId: result.publicId, type: documentType, name: file.name }]);
    } catch {
      setError("Failed to upload document");
      toast.error("Failed to upload document");
    }
    setUploadingDocs(false);
    e.target.value = "";
  };

  const removeDocument = (index: number) => setDocuments((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/organizer/resource-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          shortDescription: form.shortDescription,
          picture: form.picture || undefined,
          picturePublicId: form.picturePublicId || undefined,
          documents,
          tags,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error ?? "Failed to submit";
        setError(msg);
        toast.error(msg);
        setSubmitting(false);
        return;
      }
      toast.success("Resource request submitted successfully");
      router.push("/organizer/resources");
    } catch {
      setError("Something went wrong");
      toast.error("Something went wrong");
    }
    setSubmitting(false);
  };

  const docAccept = DOC_TYPE_OPTIONS.find((o) => o.value === documentType)?.accept ?? "";

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageBreadcrumb pageTitle="Add Resource" />
        <Button size="sm" variant="outline" onClick={() => router.push("/organizer/resources")}>
          Back to Resources
        </Button>
      </div>

      <ComponentCard
        title="Submit resource request"
        desc="Add a new resource for review. Include a name, description, optional cover picture, and documents (PDF, Word, etc.)."
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <p className="rounded-lg bg-error-50 px-4 py-2 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
              {error}
            </p>
          )}

          <div className="grid gap-6 sm:grid-cols-1">
            <div>
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Resource title"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label>Short description *</Label>
              <TextArea
                value={form.shortDescription}
                onChange={(v) => setForm((f) => ({ ...f, shortDescription: v }))}
                rows={4}
                placeholder="Describe the resource"
                required
                className="mt-1"
              />
            </div>
            <div>
              <TagsSelect
                label="Tags"
                value={tags}
                onChange={setTags}
                placeholder="Select or type to add tags (e.g. math, grade 5)"
              />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5 dark:border-gray-800 dark:bg-gray-800/30">
            <h4 className="text-sm font-medium text-gray-800 dark:text-white/90">Cover picture</h4>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Optional. Upload an image for the resource.</p>
            <input
              type="file"
              accept="image/*"
              onChange={handlePictureChange}
              disabled={uploadingPicture}
              className="mt-3 block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-500/10 dark:file:text-brand-400"
            />
            {uploadingPicture && <p className="mt-1 text-xs text-gray-500">Uploading...</p>}
            {picturePreview && (
              <div className="mt-3 flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800/50">
                <img src={picturePreview.url} alt="Preview" className="h-20 w-20 rounded-lg object-cover ring-2 ring-gray-200 dark:ring-gray-700" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Uploaded</span>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5 dark:border-gray-800 dark:bg-gray-800/30">
            <h4 className="text-sm font-medium text-gray-800 dark:text-white/90">Documents</h4>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Select type, then upload. You can add multiple files.</p>
            <div className="mt-4 flex flex-wrap items-end gap-4">
              <div className="min-w-[140px]">
                <Label className="text-xs text-gray-500 dark:text-gray-400">Type</Label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value as DocType)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  {DOC_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-0">
                <Label className="text-xs text-gray-500 dark:text-gray-400">File</Label>
                <input
                  type="file"
                  accept={docAccept}
                  onChange={handleDocumentUpload}
                  disabled={uploadingDocs}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-500/10 dark:file:text-brand-400"
                />
              </div>
            </div>
            {uploadingDocs && <p className="mt-2 text-xs text-gray-500">Uploading...</p>}
            {documents.length > 0 && (
              <ul className="mt-4 space-y-2">
                {documents.map((doc, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50"
                  >
                    <span className="flex min-w-0 flex-1 items-center gap-3">
                      <Badge color="info" size="sm">{doc.type}</Badge>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="truncate text-sm font-medium text-brand-500 hover:text-brand-600">
                        {doc.name ?? doc.type}
                      </a>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeDocument(i)}
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
            <Button type="submit" size="sm" disabled={submitting || uploadingPicture || uploadingDocs}>
              {submitting ? "Submitting..." : "Submit request"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => router.push("/organizer/resources")}>
              Cancel
            </Button>
          </div>
        </form>
      </ComponentCard>
    </div>
  );
}
