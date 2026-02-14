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
import { TrashBinIcon, VideoIcon, AudioIcon, FileIcon, DocsIcon, UserIcon, GroupIcon } from "@/icons";

type DocType = "pdf" | "video" | "audio" | "docx" | "ppt";
type DocumentFile = { url: string; publicId: string; type: DocType; name?: string };

const DOC_TYPE_OPTIONS: { 
  value: DocType; 
  label: string; 
  emoji: string;
  icon: React.ComponentType<{ className?: string }>;
  accept: string;
  description: string;
}[] = [
  { 
    value: "pdf", 
    label: "PDF", 
    emoji: "📄", 
    icon: DocsIcon,
    accept: ".pdf,application/pdf",
    description: "Portable Document Format files"
  },
  { 
    value: "docx", 
    label: "Word", 
    emoji: "📝", 
    icon: FileIcon,
    accept: ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    description: "Microsoft Word documents"
  },
  { 
    value: "ppt", 
    label: "PowerPoint", 
    emoji: "📊", 
    icon: FileIcon,
    accept: ".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation",
    description: "Microsoft PowerPoint presentations"
  },
  { 
    value: "audio", 
    label: "Audio", 
    emoji: "🎵", 
    icon: AudioIcon,
    accept: "audio/*",
    description: "Audio files and recordings"
  },
  { 
    value: "video", 
    label: "Video", 
    emoji: "🎬", 
    icon: VideoIcon,
    accept: "video/*",
    description: "Video files and recordings"
  },
];

const AUDIENCE_OPTIONS = [
  {
    value: "children" as TargetAudience,
    label: "Children",
    emoji: "👶",
    icon: UserIcon,
    description: "Content designed for children"
  },
  {
    value: "people_work_for_children" as TargetAudience,
    label: "Professionals",
    emoji: "👨‍💼",
    icon: GroupIcon,
    description: "Content for people who work with children"
  }
];

const AGE_GROUP_OPTIONS = [
  { value: "1-5" as AgeGroup, label: "1-5 years", emoji: "🍼", description: "Toddlers and early childhood" },
  { value: "5-10" as AgeGroup, label: "5-10 years", emoji: "🎒", description: "Elementary school age" },
  { value: "11-15" as AgeGroup, label: "11-15 years", emoji: "📚", description: "Middle school and early teens" },
  { value: "15-18" as AgeGroup, label: "15-18 years", emoji: "🎓", description: "High school teenagers" },
  { value: "above-18" as AgeGroup, label: "Above 18 years", emoji: "🎯", description: "Young adults and above" },
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

type TargetAudience = "children" | "people_work_for_children";
type AgeGroup = "1-5" | "5-10" | "11-15" | "15-18" | "above-18";

export default function AddResourceClient() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    shortDescription: "",
    picture: "",
    picturePublicId: "",
  });
  const [tags, setTags] = useState<string[]>([]);
  const [targetAudience, setTargetAudience] = useState<TargetAudience>("children");
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("1-5");
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
          targetAudience,
          ageGroup: targetAudience === "children" ? ageGroup : undefined,
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

          {/* Target Audience Section */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5 dark:border-gray-800 dark:bg-gray-800/30">
            <h4 className="text-sm font-medium text-gray-800 dark:text-white/90">Target Audience</h4>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Who is this resource for?</p>
            
            <div className="mt-4 space-y-4">
              {/* Audience Type Selection */}
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">Audience Type *</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {AUDIENCE_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isSelected = targetAudience === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setTargetAudience(option.value)}
                        className={`group relative rounded-lg border-2 p-4 text-left transition-all hover:shadow-md ${
                          isSelected
                            ? "border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-500/10"
                            : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                            isSelected 
                              ? "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400" 
                              : "bg-gray-100 text-gray-600 group-hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400"
                          }`}>
                            <span className="text-lg">{option.emoji}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h5 className={`font-medium ${
                                isSelected 
                                  ? "text-brand-900 dark:text-brand-100" 
                                  : "text-gray-900 dark:text-white"
                              }`}>
                                {option.label}
                              </h5>
                              <Icon className={`h-4 w-4 ${
                                isSelected 
                                  ? "text-brand-600 dark:text-brand-400" 
                                  : "text-gray-500 dark:text-gray-400"
                              }`} />
                            </div>
                            <p className={`mt-1 text-xs ${
                              isSelected 
                                ? "text-brand-700 dark:text-brand-300" 
                                : "text-gray-500 dark:text-gray-400"
                            }`}>
                              {option.description}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white dark:bg-brand-400">
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Age Group Selection */}
              {targetAudience === "children" && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">Age Group *</Label>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {AGE_GROUP_OPTIONS.map((option) => {
                      const isSelected = ageGroup === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setAgeGroup(option.value)}
                          className={`group relative rounded-lg border-2 p-3 text-left transition-all hover:shadow-sm ${
                            isSelected
                              ? "border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-500/10"
                              : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                              isSelected 
                                ? "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400" 
                                : "bg-gray-100 text-gray-600 group-hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400"
                            }`}>
                              <span className="text-sm">{option.emoji}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className={`text-sm font-medium ${
                                isSelected 
                                  ? "text-brand-900 dark:text-brand-100" 
                                  : "text-gray-900 dark:text-white"
                              }`}>
                                {option.label}
                              </h5>
                              <p className={`text-xs ${
                                isSelected 
                                  ? "text-brand-700 dark:text-brand-300" 
                                  : "text-gray-500 dark:text-gray-400"
                              }`}>
                                {option.description}
                              </p>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-white dark:bg-brand-400">
                              <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
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
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Select document type, then upload. You can add multiple files.</p>
            
            {/* Document Type Selection */}
            <div className="mt-4">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">Document Type *</Label>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {DOC_TYPE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isSelected = documentType === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setDocumentType(option.value)}
                      className={`group relative rounded-lg border-2 p-3 text-left transition-all hover:shadow-sm ${
                        isSelected
                          ? "border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-500/10"
                          : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          isSelected 
                            ? "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400" 
                            : "bg-gray-100 text-gray-600 group-hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400"
                        }`}>
                          <span className="text-sm">{option.emoji}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h5 className={`text-sm font-medium ${
                              isSelected 
                                ? "text-brand-900 dark:text-brand-100" 
                                : "text-gray-900 dark:text-white"
                            }`}>
                              {option.label}
                            </h5>
                            <Icon className={`h-3 w-3 ${
                              isSelected 
                                ? "text-brand-600 dark:text-brand-400" 
                                : "text-gray-500 dark:text-gray-400"
                            }`} />
                          </div>
                          <p className={`text-xs ${
                            isSelected 
                              ? "text-brand-700 dark:text-brand-300" 
                              : "text-gray-500 dark:text-gray-400"
                          }`}>
                            {option.description}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-white dark:bg-brand-400">
                          <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* File Upload */}
            <div className="mt-4">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Upload File</Label>
              <input
                type="file"
                accept={docAccept}
                onChange={handleDocumentUpload}
                disabled={uploadingDocs}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-500/10 dark:file:text-brand-400"
              />
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
