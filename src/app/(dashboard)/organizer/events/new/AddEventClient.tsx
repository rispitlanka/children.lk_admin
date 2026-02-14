"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import TextArea from "@/components/form/input/TextArea";
import TagsSelect from "@/components/form/TagsSelect";
import { UserIcon, GroupIcon } from "@/icons";

type TargetAudience = "children" | "people_work_for_children";
type AgeGroup = "1-5" | "5-10" | "11-15" | "15-18" | "above-18";

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

const initialForm = {
  name: "",
  location: "",
  startDate: "",
  endDate: "",
  description: "",
  registrationLink: "",
  coverImage: "",
  coverImagePublicId: "",
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadImageToCloudinary(file: File): Promise<{ url: string; publicId: string }> {
  const base64 = await fileToBase64(file);
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      file: base64,
      folder: "childrenlk/events",
      resource_type: "image",
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed");
  return { url: data.url, publicId: data.publicId };
}

export default function AddEventClient() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [tags, setTags] = useState<string[]>([]);
  const [targetAudience, setTargetAudience] = useState<TargetAudience>("children");
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("1-5");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (PNG, JPG, etc.)");
      toast.error("Please select an image file (PNG, JPG, etc.)");
      return;
    }
    
    setError("");
    setUploadingImage(true);
    try {
      const result = await uploadImageToCloudinary(file);
      setForm((f) => ({ 
        ...f, 
        coverImage: result.url, 
        coverImagePublicId: result.publicId 
      }));
      toast.success("Cover image uploaded successfully");
    } catch {
      setError("Failed to upload cover image");
      toast.error("Failed to upload cover image");
    }
    setUploadingImage(false);
    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/organizer/event-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          location: form.location,
          startDate: form.startDate,
          endDate: form.endDate || undefined,
          description: form.description,
          tags,
          registrationLink: form.registrationLink || undefined,
          coverImage: form.coverImage || undefined,
          coverImagePublicId: form.coverImagePublicId || undefined,
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
      toast.success("Event request submitted successfully");
      router.push("/organizer/events");
    } catch {
      setError("Something went wrong");
      toast.error("Something went wrong");
    }
    setSubmitting(false);
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageBreadcrumb pageTitle="Add Event" />
        <Link href="/organizer/events">
          <Button size="sm" variant="outline">Back to Events</Button>
        </Link>
      </div>

      <ComponentCard
        title="Submit event request"
        desc="Add a new event for review. Provide name, location, dates, and description."
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <p className="rounded-lg bg-error-50 px-4 py-2 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
              {error}
            </p>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Event name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Children's Day Workshop"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label>Location *</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="Venue or address"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label>Registration link</Label>
              <Input
                type="url"
                value={form.registrationLink}
                onChange={(e) => setForm((f) => ({ ...f, registrationLink: e.target.value }))}
                placeholder="https://..."
                className="mt-1"
              />
            </div>
            <div>
              <Label>Start date & time *</Label>
              <Input
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label>End date & time</Label>
              <Input
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <TagsSelect
                label="Tags"
                value={tags}
                onChange={setTags}
                placeholder="Select or type to add tags (e.g. workshop, kids, free)"
              />
            </div>
          </div>

          {/* Target Audience Section */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5 dark:border-gray-800 dark:bg-gray-800/30">
            <h4 className="text-sm font-medium text-gray-800 dark:text-white/90">Target Audience</h4>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Who is this event for?</p>
            
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

          {/* Cover Image Upload Section */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5 dark:border-gray-800 dark:bg-gray-800/30">
            <h4 className="text-sm font-medium text-gray-800 dark:text-white/90">Cover Image</h4>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Optional. Upload a cover image for your event. This will be displayed in event listings.
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploadingImage}
              className="mt-3 block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-500/10 dark:file:text-brand-400"
            />
            {uploadingImage && (
              <p className="mt-1 text-xs text-gray-500">Uploading image...</p>
            )}
            {form.coverImage && (
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800/50">
                  <img
                    src={form.coverImage}
                    alt="Event cover"
                    className="h-16 w-20 rounded-lg object-cover ring-2 ring-gray-200 dark:ring-gray-700"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Cover image uploaded</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setForm((f) => ({ ...f, coverImage: "", coverImagePublicId: "" }))}
                >
                  Remove image
                </Button>
              </div>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-1">
            <div>
              <Label>Description *</Label>
              <TextArea
                value={form.description}
                onChange={(v) => setForm((f) => ({ ...f, description: v }))}
                rows={5}
                placeholder="Describe the event, agenda, and who it's for."
                required
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 border-t border-gray-200 pt-6 dark:border-gray-800">
            <Button type="submit" size="sm" disabled={submitting || uploadingImage}>
              {submitting ? "Submitting..." : uploadingImage ? "Uploading image..." : "Submit request"}
            </Button>
            <Link href="/organizer/events">
              <Button type="button" variant="outline" size="sm">Cancel</Button>
            </Link>
          </div>
        </form>
      </ComponentCard>
    </div>
  );
}
