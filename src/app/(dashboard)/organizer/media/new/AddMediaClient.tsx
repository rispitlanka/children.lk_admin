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
import { TrashBinIcon, VideoIcon, AudioIcon, FileIcon, DocsIcon, UserIcon, GroupIcon } from "@/icons";

type ContentType = "article" | "poem" | "video" | "audio" | "pictures" | "picture_story";
type MediaFile = { url: string; publicId: string; type: string; name?: string };
type TargetAudience = "children" | "people_work_for_children";
type AgeGroup = "1-5" | "5-10" | "11-15" | "15-18" | "above-18";

const CONTENT_TYPE_OPTIONS: { 
  value: ContentType; 
  label: string; 
  emoji: string;
  icon: React.ComponentType<{ className?: string }>;
  accept?: string;
  allowMultiple?: boolean;
  isText?: boolean;
  description: string;
}[] = [
  { 
    value: "article", 
    label: "Article", 
    emoji: "📝", 
    icon: DocsIcon,
    isText: true,
    description: "Written content like blog posts, news articles, or informative pieces"
  },
  { 
    value: "poem", 
    label: "Poem", 
    emoji: "📖", 
    icon: FileIcon,
    isText: true,
    description: "Poetry, verses, and creative written expressions"
  },
  { 
    value: "video", 
    label: "Video", 
    emoji: "🎬", 
    icon: VideoIcon,
    accept: "video/*", 
    allowMultiple: false,
    description: "Video content like tutorials, documentaries, or entertainment"
  },
  { 
    value: "audio", 
    label: "Audio", 
    emoji: "🎵", 
    icon: AudioIcon,
    accept: "audio/*", 
    allowMultiple: false,
    description: "Audio content like podcasts, music, or voice recordings"
  },
  { 
    value: "pictures", 
    label: "Pictures", 
    emoji: "🖼️", 
    icon: FileIcon,
    accept: "image/*", 
    allowMultiple: true,
    description: "Individual images or photo collections"
  },
  { 
    value: "picture_story", 
    label: "Picture Story", 
    emoji: "📚", 
    icon: FileIcon,
    accept: "image/*", 
    allowMultiple: true,
    description: "Sequential images that tell a story (minimum 2 images)"
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

function getCloudinaryResourceType(contentType: ContentType): "image" | "video" | "raw" {
  if (contentType === "video") return "video";
  if (contentType === "audio") return "video"; // Cloudinary uses 'video' for audio files
  if (contentType === "pictures" || contentType === "picture_story") return "image";
  return "raw"; // For text content like articles and poems
}

function getFileTypeFromContentType(contentType: ContentType, fileName?: string): "image" | "video" | "audio" {
  if (contentType === "video") return "video";
  if (contentType === "audio") return "audio";
  if (contentType === "pictures" || contentType === "picture_story") return "image";
  
  // Fallback: determine by file extension if needed
  if (fileName) {
    const ext = fileName.toLowerCase().split('.').pop();
    if (ext && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return "image";
    if (ext && ['mp4', 'avi', 'mov', 'wmv', 'flv'].includes(ext)) return "video";
    if (ext && ['mp3', 'wav', 'ogg', 'aac'].includes(ext)) return "audio";
  }
  
  return "image"; // Default fallback
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
  resourceType: "image" | "video" | "raw"
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
  const [form, setForm] = useState({ name: "", description: "", textContent: "" });
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [contentType, setContentType] = useState<ContentType>("article");
  const [targetAudience, setTargetAudience] = useState<TargetAudience>("children");
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("1-5");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;
    
    const currentOption = CONTENT_TYPE_OPTIONS.find(opt => opt.value === contentType);
    if (!currentOption?.allowMultiple && selectedFiles.length > 1) {
      setError("Only one file is allowed for this content type");
      toast.error("Only one file is allowed for this content type");
      return;
    }

    setError("");
    setUploading(true);
    
    try {
      const resourceType = getCloudinaryResourceType(contentType);
      const uploadPromises = selectedFiles.map(async (file) => {
        const result = await uploadFile(file, "childrenlk/media", resourceType);
        return { 
          url: result.url, 
          publicId: result.publicId, 
          type: getFileTypeFromContentType(contentType, file.name), 
          name: file.name 
        };
      });
      
      const uploadedFiles = await Promise.all(uploadPromises);
      
      if (currentOption?.allowMultiple) {
        setFiles((prev) => [...prev, ...uploadedFiles]);
      } else {
        setFiles(uploadedFiles);
      }
      
      toast.success(`${uploadedFiles.length} file(s) uploaded successfully`);
    } catch {
      setError("Failed to upload file(s)");
      toast.error("Failed to upload file(s)");
    }
    setUploading(false);
    e.target.value = "";
  };

  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validate based on content type
    const currentOption = CONTENT_TYPE_OPTIONS.find(opt => opt.value === contentType);
    
    if (currentOption?.isText) {
      // For text content (articles, poems), require text content
      if (!form.textContent.trim()) {
        setError(`Please enter the ${contentType} content.`);
        toast.error(`Please enter the ${contentType} content.`);
        return;
      }
    } else {
      // For file-based content, require files
      if (files.length === 0) {
        setError(`Please upload at least one file for ${contentType}.`);
        toast.error(`Please upload at least one file for ${contentType}.`);
        return;
      }
      
      // For picture story, require multiple images
      if (contentType === "picture_story" && files.length < 2) {
        setError("Picture story requires at least 2 images.");
        toast.error("Picture story requires at least 2 images.");
        return;
      }
    }
    
    setSubmitting(true);
    try {
      const res = await fetch("/api/organizer/media-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: form.name, 
          description: form.description, 
          contentType,
          textContent: form.textContent || undefined,
          files,
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
      toast.success("Media request submitted successfully");
      router.push("/organizer/media");
    } catch {
      setError("Something went wrong");
      toast.error("Something went wrong");
    }
    setSubmitting(false);
  };


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
        desc="Add a new media item for review. Choose from articles, poems, videos, audio, pictures, or picture stories."
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

          {/* Content Type Selection */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5 dark:border-gray-800 dark:bg-gray-800/30">
            <h4 className="text-sm font-medium text-gray-800 dark:text-white/90">Content Type</h4>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">What type of content are you submitting?</p>
            
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {CONTENT_TYPE_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = contentType === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setContentType(option.value);
                      setFiles([]); // Clear files when content type changes
                      setForm(f => ({ ...f, textContent: "" })); // Clear text content
                    }}
                    className={`group relative rounded-lg border-2 p-4 text-left transition-all hover:shadow-md ${
                      isSelected
                        ? "border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-500/10"
                        : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        isSelected 
                          ? "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400" 
                          : "bg-gray-100 text-gray-600 group-hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400"
                      }`}>
                        <span className="text-lg">{option.emoji}</span>
                      </div>
                      <div className="flex-1 min-w-0">
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

          {/* Text Content Section (for articles and poems) */}
          {CONTENT_TYPE_OPTIONS.find(opt => opt.value === contentType)?.isText && (
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5 dark:border-gray-800 dark:bg-gray-800/30">
              <h4 className="text-sm font-medium text-gray-800 dark:text-white/90">
                {contentType === "article" ? "Article Content" : "Poem Content"}
              </h4>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Enter the full {contentType} content below.
              </p>
              
              <div className="mt-4">
                <TextArea
                  value={form.textContent}
                  onChange={(v) => setForm((f) => ({ ...f, textContent: v }))}
                  rows={10}
                  placeholder={`Enter your ${contentType} content here...`}
                  required
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* Target Audience Section */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5 dark:border-gray-800 dark:bg-gray-800/30">
            <h4 className="text-sm font-medium text-gray-800 dark:text-white/90">Target Audience</h4>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Who is this media for?</p>
            
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

          {/* File Upload Section (for non-text content) */}
          {!CONTENT_TYPE_OPTIONS.find(opt => opt.value === contentType)?.isText && (
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5 dark:border-gray-800 dark:bg-gray-800/30">
              <h4 className="text-sm font-medium text-gray-800 dark:text-white/90">
                Upload {contentType === "picture_story" ? "Images for Story" : 
                       contentType === "pictures" ? "Images" : 
                       contentType.charAt(0).toUpperCase() + contentType.slice(1)}
              </h4>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {CONTENT_TYPE_OPTIONS.find(opt => opt.value === contentType)?.allowMultiple 
                  ? "You can upload multiple files." 
                  : "Upload a single file."}
              </p>
              
              <div className="mt-4">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {contentType === "picture_story" ? "Story Images" : "File(s)"}
                </Label>
                <input
                  type="file"
                  accept={CONTENT_TYPE_OPTIONS.find(opt => opt.value === contentType)?.accept}
                  multiple={CONTENT_TYPE_OPTIONS.find(opt => opt.value === contentType)?.allowMultiple}
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-500/10 dark:file:text-brand-400"
                />
              </div>
              
              {uploading && <p className="mt-2 text-xs text-gray-500">Uploading files...</p>}
              
              {files.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Uploaded Files ({files.length})
                  </h5>
                  <ul className="space-y-2">
                    {files.map((f, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50"
                      >
                        <span className="flex min-w-0 flex-1 items-center gap-3">
                          {(contentType === "pictures" || contentType === "picture_story") && (
                            <img src={f.url} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
                          )}
                          <div className="flex-1 min-w-0">
                            <a 
                              href={f.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="truncate text-sm font-medium text-brand-500 hover:text-brand-600 block"
                            >
                              {f.name ?? `${contentType} file`}
                            </a>
                            {contentType === "picture_story" && (
                              <p className="text-xs text-gray-500">Image {i + 1}</p>
                            )}
                          </div>
                          <Badge color="info" size="sm">
                            {contentType === "pictures" || contentType === "picture_story" ? "Image" : contentType}
                          </Badge>
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
                </div>
              )}
            </div>
          )}

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
