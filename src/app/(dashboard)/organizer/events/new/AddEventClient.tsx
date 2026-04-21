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
import ResourceDescriptionQuill from "@/components/form/ResourceDescriptionQuill";
import { EVENT_CATEGORY_LABELS, EVENT_CATEGORY_VALUES, type EventCategoryValue } from "@/lib/event-form-constants";
import { parseLatLngFromGoogleMapsUrl } from "@/lib/google-maps-url";
import { isRichTextEmpty } from "@/lib/rich-text";
import { UserIcon, GroupIcon } from "@/icons";

type TargetAudience = "children" | "people_work_for_children";
type AgeGroup = "1-5" | "5-10" | "11-15" | "15-18" | "above-18";

const AUDIENCE_OPTIONS = [
  {
    value: "children" as TargetAudience,
    label: "Children",
    emoji: "👶",
    icon: UserIcon,
    description: "Content designed for children",
  },
  {
    value: "people_work_for_children" as TargetAudience,
    label: "Professionals",
    emoji: "👨‍💼",
    icon: GroupIcon,
    description: "Content for people who work with children",
  },
];

const AGE_GROUP_OPTIONS = [
  { value: "1-5" as AgeGroup, label: "1-5 years", emoji: "🍼", description: "Toddlers and early childhood" },
  { value: "5-10" as AgeGroup, label: "5-10 years", emoji: "🎒", description: "Elementary school age" },
  { value: "11-15" as AgeGroup, label: "11-15 years", emoji: "📚", description: "Middle school and early teens" },
  { value: "15-18" as AgeGroup, label: "15-18 years", emoji: "🎓", description: "High school teenagers" },
  { value: "above-18" as AgeGroup, label: "Above 18 years", emoji: "🎯", description: "Young adults and above" },
];

const selectClass =
  "mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

const descriptionEditorClass = [
  "resource-description-editor mt-1 rounded-lg border border-gray-300 shadow-theme-xs overflow-hidden",
  "dark:border-gray-700",
  "[&_.ql-toolbar]:rounded-t-lg [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-gray-200 [&_.ql-toolbar]:bg-gray-50",
  "dark:[&_.ql-toolbar]:border-gray-700 dark:[&_.ql-toolbar]:bg-gray-800/80",
  "[&_.ql-container]:rounded-b-lg [&_.ql-container]:border-0 [&_.ql-container]:bg-transparent dark:[&_.ql-container]:bg-gray-900",
  "[&_.ql-editor]:min-h-[200px] [&_.ql-editor]:px-3 [&_.ql-editor]:py-2.5 [&_.ql-editor]:text-sm",
  "text-gray-800 dark:[&_.ql-editor]:text-white/90",
  "[&_.ql-stroke]:stroke-gray-600 dark:[&_.ql-stroke]:stroke-gray-400",
  "[&_.ql-fill]:fill-gray-600 dark:[&_.ql-fill]:fill-gray-400",
].join(" ");

const initialForm = {
  name: "",
  eventCategory: "" as EventCategoryValue | "",
  startDate: "",
  endDate: "",
  googleMapsUrl: "",
  locationLatitude: "",
  locationLongitude: "",
  locationName: "",
  locationAddress: "",
  locationContact: "",
  description: "",
  registrationLink: "",
  coverImage: "",
  coverImagePublicId: "",
  highlight1: "",
  highlight2: "",
  highlight3: "",
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

  const applyGoogleMapsLink = () => {
    const parsed = parseLatLngFromGoogleMapsUrl(form.googleMapsUrl);
    if (!parsed) {
      toast.error("Could not read coordinates from that link. Try a maps.google.com link that contains @lat,lng.");
      return;
    }
    setForm((f) => ({
      ...f,
      locationLatitude: String(parsed.lat),
      locationLongitude: String(parsed.lng),
    }));
    toast.success("Map position applied");
  };

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
        coverImagePublicId: result.publicId,
      }));
      toast.success("Cover image uploaded successfully");
    } catch {
      setError("Failed to upload cover image");
      toast.error("Failed to upload cover image");
    }
    setUploadingImage(false);
    e.target.value = "";
  };

  const mapEmbedUrl =
    form.locationLatitude &&
    form.locationLongitude &&
    Number.isFinite(Number(form.locationLatitude)) &&
    Number.isFinite(Number(form.locationLongitude))
      ? `https://www.google.com/maps?q=${encodeURIComponent(form.locationLatitude)},${encodeURIComponent(form.locationLongitude)}&z=15&output=embed`
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.eventCategory) {
      setError("Select an event category.");
      toast.error("Select an event category.");
      return;
    }
    if (isRichTextEmpty(form.description)) {
      setError("Enter an event description.");
      toast.error("Enter an event description.");
      return;
    }
    if (!form.locationName.trim() || !form.locationAddress.trim() || !form.locationContact.trim()) {
      setError("Location name, address, and contact are required.");
      toast.error("Location name, address, and contact are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/organizer/event-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          eventCategory: form.eventCategory,
          locationName: form.locationName.trim(),
          locationAddress: form.locationAddress.trim(),
          locationContact: form.locationContact.trim(),
          locationLatitude: form.locationLatitude.trim() || undefined,
          locationLongitude: form.locationLongitude.trim() || undefined,
          startDate: form.startDate,
          endDate: form.endDate || undefined,
          description: form.description.trim(),
          tags,
          registrationLink: form.registrationLink.trim() || undefined,
          coverImage: form.coverImage || undefined,
          coverImagePublicId: form.coverImagePublicId || undefined,
          highlight1: form.highlight1.trim() || undefined,
          highlight2: form.highlight2.trim() || undefined,
          highlight3: form.highlight3.trim() || undefined,
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
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageBreadcrumb pageTitle="Add Event" />
        <Link href="/organizer/events">
          <Button size="sm" variant="outline">
            Back to Events
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <p className="rounded-lg bg-error-50 px-4 py-2 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="space-y-6">
            <ComponentCard
              title="Basic information"
              desc="Event title, category, schedule, map position, and venue contact details."
            >
              <div className="space-y-6">
                <div>
                  <Label>Event title *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Children's Day Workshop"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Event category *</Label>
                  <select
                    required
                    value={form.eventCategory}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, eventCategory: e.target.value as EventCategoryValue }))
                    }
                    className={selectClass}
                  >
                    <option value="">Select category</option>
                    {EVENT_CATEGORY_VALUES.map((v) => (
                      <option key={v} value={v}>
                        {EVENT_CATEGORY_LABELS[v]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <Label>Start date &amp; time *</Label>
                    <Input
                      type="datetime-local"
                      value={form.startDate}
                      onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>End date &amp; time</Label>
                    <Input
                      type="datetime-local"
                      value={form.endDate}
                      onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-800/30">
                  <Label>Location (Google Maps)</Label>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    Paste a Google Maps link (browser URL often contains <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">@lat,lng</code>
                    ), then use &quot;Apply from link&quot;. You can also type latitude and longitude manually.
                  </p>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end">
                    <Input
                      value={form.googleMapsUrl}
                      onChange={(e) => setForm((f) => ({ ...f, googleMapsUrl: e.target.value }))}
                      placeholder="https://www.google.com/maps/..."
                      className="mt-0 flex-1 sm:mt-0"
                    />
                    <Button type="button" size="sm" variant="outline" onClick={applyGoogleMapsLink}>
                      Apply from link
                    </Button>
                  </div>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>Latitude (optional)</Label>
                      <Input
                        value={form.locationLatitude}
                        onChange={(e) => setForm((f) => ({ ...f, locationLatitude: e.target.value }))}
                        placeholder="6.9271"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Longitude (optional)</Label>
                      <Input
                        value={form.locationLongitude}
                        onChange={(e) => setForm((f) => ({ ...f, locationLongitude: e.target.value }))}
                        placeholder="79.8612"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  {mapEmbedUrl && (
                    <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                      <iframe
                        title="Venue map preview"
                        src={mapEmbedUrl}
                        className="h-56 w-full border-0"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <Label>Location name *</Label>
                  <Input
                    value={form.locationName}
                    onChange={(e) => setForm((f) => ({ ...f, locationName: e.target.value }))}
                    placeholder="Venue or place name"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Location address *</Label>
                  <TextArea
                    value={form.locationAddress}
                    onChange={(v) => setForm((f) => ({ ...f, locationAddress: v }))}
                    rows={3}
                    placeholder="Street, city, postal code"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Location contact *</Label>
                  <Input
                    value={form.locationContact}
                    onChange={(e) => setForm((f) => ({ ...f, locationContact: e.target.value }))}
                    placeholder="Phone or email for this venue"
                    required
                    className="mt-1"
                  />
                </div>
              </div>
            </ComponentCard>
          </div>

          <div className="space-y-6">
            <ComponentCard title="About the event" desc="Description, cover image, and three highlight points.">
              <div className="space-y-6">
                <div>
                  <Label>Description *</Label>
                  <ResourceDescriptionQuill
                    value={form.description}
                    onChange={(html) => setForm((f) => ({ ...f, description: html }))}
                    placeholder="Describe the event, agenda, and who it is for."
                    className={descriptionEditorClass}
                  />
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-800/30">
                  <Label>Cover image</Label>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    Optional. Shown in event listings when approved.
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-500/10 dark:file:text-brand-400"
                  />
                  {uploadingImage && <p className="mt-1 text-xs text-gray-500">Uploading image…</p>}
                  {form.coverImage && (
                    <div className="mt-3 flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800/50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={form.coverImage}
                          alt="Event cover"
                          className="h-16 w-20 rounded-lg object-cover ring-2 ring-gray-200 dark:ring-gray-700"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Cover uploaded</span>
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

                <div>
                  <Label className="mb-2 block">Highlights</Label>
                  <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">Up to three short points (optional).</p>
                  <div className="grid gap-4">
                    {([1, 2, 3] as const).map((n) => {
                      const key = `highlight${n}` as "highlight1" | "highlight2" | "highlight3";
                      return (
                        <div
                          key={n}
                          className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900/40"
                        >
                          <p className="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">
                            {n}
                            <span className="ml-2 font-normal text-gray-500 dark:text-gray-400">— description</span>
                          </p>
                          <TextArea
                            value={form[key]}
                            onChange={(v) => setForm((f) => ({ ...f, [key]: v }))}
                            rows={3}
                            placeholder={`Highlight ${n}`}
                            className="mt-0"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </ComponentCard>
          </div>
        </div>

        <ComponentCard title="Audience, tags & registration" desc="Who the event is for and how people can register.">
          <div className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
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
              <div className="sm:col-span-2">
                <TagsSelect
                  label="Tags"
                  value={tags}
                  onChange={setTags}
                  placeholder="Select or type to add tags (e.g. workshop, kids, free)"
                />
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5 dark:border-gray-800 dark:bg-gray-800/30">
              <h4 className="text-sm font-medium text-gray-800 dark:text-white/90">Target audience</h4>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Who is this event for?</p>

              <div className="mt-4 space-y-4">
                <div>
                  <Label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Audience type *
                  </Label>
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
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                                isSelected
                                  ? "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400"
                                  : "bg-gray-100 text-gray-600 group-hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400"
                              }`}
                            >
                              <span className="text-lg">{option.emoji}</span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h5
                                  className={`font-medium ${
                                    isSelected
                                      ? "text-brand-900 dark:text-brand-100"
                                      : "text-gray-900 dark:text-white"
                                  }`}
                                >
                                  {option.label}
                                </h5>
                                <Icon
                                  className={`h-4 w-4 ${
                                    isSelected
                                      ? "text-brand-600 dark:text-brand-400"
                                      : "text-gray-500 dark:text-gray-400"
                                  }`}
                                />
                              </div>
                              <p
                                className={`mt-1 text-xs ${
                                  isSelected
                                    ? "text-brand-700 dark:text-brand-300"
                                    : "text-gray-500 dark:text-gray-400"
                                }`}
                              >
                                {option.description}
                              </p>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white dark:bg-brand-400">
                              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {targetAudience === "children" && (
                  <div className="animate-in slide-in-from-top-2 duration-200">
                    <Label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Age group *
                    </Label>
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
                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                                  isSelected
                                    ? "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400"
                                    : "bg-gray-100 text-gray-600 group-hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400"
                                }`}
                              >
                                <span className="text-sm">{option.emoji}</span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <h5
                                  className={`text-sm font-medium ${
                                    isSelected
                                      ? "text-brand-900 dark:text-brand-100"
                                      : "text-gray-900 dark:text-white"
                                  }`}
                                >
                                  {option.label}
                                </h5>
                                <p
                                  className={`text-xs ${
                                    isSelected
                                      ? "text-brand-700 dark:text-brand-300"
                                      : "text-gray-500 dark:text-gray-400"
                                  }`}
                                >
                                  {option.description}
                                </p>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-white dark:bg-brand-400">
                                <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
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
          </div>
        </ComponentCard>

        <div className="flex flex-wrap gap-3 rounded-2xl border border-gray-200 bg-white px-6 py-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <Button type="submit" size="sm" disabled={submitting || uploadingImage}>
            {submitting ? "Submitting…" : uploadingImage ? "Uploading image…" : "Submit request"}
          </Button>
          <Link href="/organizer/events">
            <Button type="button" variant="outline" size="sm">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
