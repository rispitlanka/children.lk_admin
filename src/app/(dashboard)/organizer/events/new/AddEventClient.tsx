"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import LoadingLottie from "@/components/common/LoadingLottie";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import TextArea from "@/components/form/input/TextArea";
import DatePicker from "@/components/form/date-picker";
import TagsSelect from "@/components/form/TagsSelect";
import ResourceDescriptionQuill from "@/components/form/ResourceDescriptionQuill";
import {
  EVENT_CATEGORY_LABELS,
  EVENT_CATEGORY_VALUES,
  EVENT_VISIBILITY_STATUS_LABELS,
  EVENT_VISIBILITY_STATUS_VALUES,
  type EventCategoryValue,
  type EventVisibilityStatusValue,
} from "@/lib/event-form-constants";
import { parseLatLngFromGoogleMapsUrl } from "@/lib/google-maps-url";
import { getRichTextPlainText } from "@/lib/rich-text";
import { slugify } from "@/lib/slugify";

const selectClass =
  "mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

const DESCRIPTION_MIN_LENGTH = 30;

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
  slug: "",
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
  pricingType: "free" as "free" | "paid",
  ticketOptions: [{ ticketType: "", ticketPrice: "" }],
  registrationMode: "external" as "internal" | "external",
  registrationExternalUrl: "",
  coverImage: "",
  coverImagePublicId: "",
  highlight1: "",
  highlight2: "",
  highlight3: "",
  whoCanJoin: ["For Students"],
  visibilityStatus: "published" as EventVisibilityStatusValue,
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
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = Boolean(editId);

  const [form, setForm] = useState(initialForm);
  const [tags, setTags] = useState<string[]>([]);
  const [slugEditedManually, setSlugEditedManually] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [error, setError] = useState("");
  const [dateRangeError, setDateRangeError] = useState("");

  useEffect(() => {
    if (slugEditedManually) return;
    setForm((f) => ({ ...f, slug: slugify(f.name) }));
  }, [form.name, slugEditedManually]);

  useEffect(() => {
    if (!editId) return;
    setLoadingExisting(true);
    fetch(`/api/organizer/event-requests/${editId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setSlugEditedManually(true);
        setTags(Array.isArray(data.tags) ? data.tags : []);
        setForm({
          name: data.name ?? "",
          slug: data.slug ?? "",
          eventCategory: data.eventCategory ?? "",
          startDate: data.startDate ? new Date(data.startDate).toISOString().slice(0, 16) : "",
          endDate: data.endDate ? new Date(data.endDate).toISOString().slice(0, 16) : "",
          googleMapsUrl: "",
          locationLatitude: data.locationLatitude != null ? String(data.locationLatitude) : "",
          locationLongitude: data.locationLongitude != null ? String(data.locationLongitude) : "",
          locationName: data.locationName ?? "",
          locationAddress: data.locationAddress ?? "",
          locationContact: data.locationContact ?? "",
          description: data.description ?? "",
          pricingType: data.pricingType === "paid" ? "paid" : "free",
          ticketOptions:
            Array.isArray(data.ticketOptions) && data.ticketOptions.length > 0
              ? data.ticketOptions.map((t: { ticketType: string; ticketPrice: number }) => ({
                  ticketType: t.ticketType,
                  ticketPrice: String(t.ticketPrice),
                }))
              : [{ ticketType: "", ticketPrice: "" }],
          registrationMode: data.registrationMode === "internal" ? "internal" : "external",
          registrationExternalUrl: data.registrationExternalUrl ?? "",
          coverImage: data.coverImage ?? "",
          coverImagePublicId: data.coverImagePublicId ?? "",
          highlight1: data.highlight1 ?? "",
          highlight2: data.highlight2 ?? "",
          highlight3: data.highlight3 ?? "",
          whoCanJoin: Array.isArray(data.whoCanJoin) && data.whoCanJoin.length > 0 ? data.whoCanJoin : ["For Students"],
          visibilityStatus:
            data.visibilityStatus === "draft" ? "draft" : "published",
        });
      })
      .catch(() => {
        toast.error("Failed to load event");
      })
      .finally(() => setLoadingExisting(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;

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
    if (dateRangeError) {
      toast.error(dateRangeError);
      return;
    }
    if (!form.eventCategory) {
      setError("Select an event category.");
      toast.error("Select an event category.");
      return;
    }
    if (getRichTextPlainText(form.description).length < DESCRIPTION_MIN_LENGTH) {
      setError(`Event description must be at least ${DESCRIPTION_MIN_LENGTH} characters.`);
      toast.error(`Event description must be at least ${DESCRIPTION_MIN_LENGTH} characters.`);
      return;
    }
    if (!form.locationName.trim() || !form.locationAddress.trim() || !form.locationContact.trim()) {
      setError("Location name, address, and contact are required.");
      toast.error("Location name, address, and contact are required.");
      return;
    }
    const startDateTime = form.startDate ? new Date(form.startDate) : null;
    const endDateTime = form.endDate ? new Date(form.endDate) : null;
    if (!startDateTime || Number.isNaN(startDateTime.getTime())) {
      setError("Enter a valid start date and time.");
      toast.error("Enter a valid start date and time.");
      return;
    }
    const startDay = new Date(startDateTime.getFullYear(), startDateTime.getMonth(), startDateTime.getDate());
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (startDay < todayStart) {
      setError("Start date cannot be in the past.");
      toast.error("Start date cannot be in the past.");
      return;
    }
    if (endDateTime && Number.isNaN(endDateTime.getTime())) {
      setError("Enter a valid end date and time.");
      toast.error("Enter a valid end date and time.");
      return;
    }
    if (endDateTime && endDateTime.getTime() === startDateTime.getTime()) {
      setError("Start and end date & time cannot be the same.");
      toast.error("Start and end date & time cannot be the same.");
      return;
    }
    if (endDateTime && endDateTime < startDateTime) {
      setError("End date and time must be after the start date and time.");
      toast.error("End date and time must be after the start date and time.");
      return;
    }
    if (form.pricingType === "paid") {
      const validTicketOptions = form.ticketOptions
        .map((item) => ({ ticketType: item.ticketType.trim(), ticketPrice: Number(item.ticketPrice) }))
        .filter((item) => item.ticketType && Number.isFinite(item.ticketPrice) && item.ticketPrice >= 0);
      if (validTicketOptions.length === 0) {
        setError("Add at least one valid ticket type and price for paid events.");
        toast.error("Add at least one valid ticket type and price for paid events.");
        return;
      }
    }
    if (form.registrationMode === "external" && !form.registrationExternalUrl.trim()) {
      setError("External registration URL is required.");
      toast.error("External registration URL is required.");
      return;
    }
    const whoCanJoin = form.whoCanJoin.map((x) => x.trim()).filter(Boolean);
    if (whoCanJoin.length === 0) {
      setError("Add at least one audience in Who can join.");
      toast.error("Add at least one audience in Who can join.");
      return;
    }
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
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
      pricingType: form.pricingType,
      ticketOptions:
        form.pricingType === "paid"
          ? form.ticketOptions
              .map((item) => ({ ticketType: item.ticketType.trim(), ticketPrice: Number(item.ticketPrice) }))
              .filter((item) => item.ticketType && Number.isFinite(item.ticketPrice) && item.ticketPrice >= 0)
          : [],
      registrationMode: form.registrationMode,
      registrationExternalUrl:
        form.registrationMode === "external" ? form.registrationExternalUrl.trim() || undefined : undefined,
      internalRegistrationFields:
        form.registrationMode === "internal" ? ["name", "email", "phone"] : [],
      whoCanJoin,
      coverImage: form.coverImage || undefined,
      coverImagePublicId: form.coverImagePublicId || undefined,
      highlight1: form.highlight1.trim() || undefined,
      highlight2: form.highlight2.trim() || undefined,
      highlight3: form.highlight3.trim() || undefined,
      visibilityStatus: form.visibilityStatus,
    };

    setSubmitting(true);
    try {
      const url = isEditMode
        ? `/api/organizer/event-requests/${editId}`
        : "/api/organizer/event-requests";
      const method = isEditMode ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
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
        form.visibilityStatus === "draft"
          ? isEditMode ? "Event updated as draft" : "Event saved as draft"
          : isEditMode ? "Event request submitted for review" : "Event request submitted successfully"
      );
      router.push("/organizer/events");
    } catch {
      setError("Something went wrong");
      toast.error("Something went wrong");
    }
    setSubmitting(false);
  };

  if (loadingExisting) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <LoadingLottie variant="block" />
      </div>
    );
  }

  const primaryActionLabel =
    form.visibilityStatus === "draft"
      ? isEditMode ? "Update draft" : "Save as draft"
      : isEditMode ? "Submit for review" : "Submit request";

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageBreadcrumb pageTitle={isEditMode ? "Edit Event" : "Add Event"} />
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
                  <Label>Slug (optional)</Label>
                  <Input
                    value={form.slug}
                    onChange={(e) => {
                      const next = e.target.value;
                      setSlugEditedManually(next.trim().length > 0);
                      setForm((f) => ({ ...f, slug: slugify(next) }));
                    }}
                    placeholder="Leave empty to auto-generate from title"
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
                    <DatePicker
                      id="event-start-date"
                      label="Start date & time *"
                      value={form.startDate}
                      onChange={(nextDate) => {
                        setForm((f) => ({ ...f, startDate: nextDate }));
                        setDateRangeError(
                          nextDate && form.endDate && nextDate === form.endDate
                            ? "Start and end date & time cannot be the same."
                            : ""
                        );
                      }}
                      minDate={minDate}
                      enableTime
                      required
                    />
                  </div>
                  <div>
                    <DatePicker
                      id="event-end-date"
                      label="End date & time"
                      value={form.endDate}
                      onChange={(nextDate) => {
                        setForm((f) => ({ ...f, endDate: nextDate }));
                        setDateRangeError(
                          nextDate && form.startDate && nextDate === form.startDate
                            ? "Start and end date & time cannot be the same."
                            : ""
                        );
                      }}
                      minDate={form.startDate || minDate}
                      enableTime
                    />
                  </div>
                </div>
                {dateRangeError && (
                  <p className="text-sm text-error-600 dark:text-error-400">{dateRangeError}</p>
                )}

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

            <ComponentCard title="Tags" desc="Optional tags for search and grouping.">
              <div className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <TagsSelect
                      label="Tags"
                      value={tags}
                      onChange={setTags}
                      placeholder="Select or type to add tags (e.g. workshop, kids, free)"
                    />
                  </div>
                </div>
              </div>
            </ComponentCard>

            <ComponentCard
              title="Status"
              desc="Draft saves without sending to admin. Published submits the event for admin review."
            >
              <div>
                <Label>Status</Label>
                <select
                  value={form.visibilityStatus}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      visibilityStatus: e.target.value as EventVisibilityStatusValue,
                    }))
                  }
                  className={selectClass}
                >
                  {EVENT_VISIBILITY_STATUS_VALUES.map((v) => (
                    <option key={v} value={v}>
                      {EVENT_VISIBILITY_STATUS_LABELS[v]}
                    </option>
                  ))}
                </select>
                {form.visibilityStatus === "draft" && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    This event will be saved as a draft and will not be sent to the admin for review.
                  </p>
                )}
                {form.visibilityStatus === "published" && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    This event will be submitted to the admin for review. Once approved, it will be publicly available.
                  </p>
                )}
              </div>
            </ComponentCard>
          </div>

          <div className="space-y-6">
            <ComponentCard title="About the event" desc="Description, cover image, and three highlight points.">
              <div className="space-y-6">
                <div>
                  <ResourceDescriptionQuill
                    value={form.description}
                    onChange={(html) => setForm((f) => ({ ...f, description: html }))}
                    placeholder="Describe the event, agenda, and who it is for."
                    className={descriptionEditorClass}
                  />
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-800/30">
                  <Label className="mb-2 block">Pricing & ticketing</Label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>Free or paid *</Label>
                      <select
                        value={form.pricingType}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            pricingType: e.target.value as "free" | "paid",
                            ticketOptions:
                              e.target.value === "paid"
                                ? f.ticketOptions.length > 0
                                  ? f.ticketOptions
                                  : [{ ticketType: "", ticketPrice: "" }]
                                : [{ ticketType: "", ticketPrice: "" }],
                          }))
                        }
                        className={selectClass}
                      >
                        <option value="free">Free</option>
                        <option value="paid">Paid</option>
                      </select>
                    </div>
                    {form.pricingType === "paid" && (
                      <div className="sm:col-span-2 space-y-3">
                        <Label>Ticket categories & prices *</Label>
                        {form.ticketOptions.map((item, index) => (
                          <div key={index} className="grid gap-3 sm:grid-cols-[1fr_160px_auto] sm:items-end">
                            <div>
                              <Label>Ticket category</Label>
                              <Input
                                value={item.ticketType}
                                onChange={(e) =>
                                  setForm((f) => ({
                                    ...f,
                                    ticketOptions: f.ticketOptions.map((opt, i) =>
                                      i === index ? { ...opt, ticketType: e.target.value } : opt
                                    ),
                                  }))
                                }
                                placeholder="General / VIP / Early bird"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label>Price</Label>
                              <Input
                                value={item.ticketPrice}
                                onChange={(e) =>
                                  setForm((f) => ({
                                    ...f,
                                    ticketOptions: f.ticketOptions.map((opt, i) =>
                                      i === index ? { ...opt, ticketPrice: e.target.value } : opt
                                    ),
                                  }))
                                }
                                placeholder="0.00"
                                className="mt-1"
                              />
                            </div>
                            {form.ticketOptions.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setForm((f) => ({
                                    ...f,
                                    ticketOptions: f.ticketOptions.filter((_, i) => i !== index),
                                  }))
                                }
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              ticketOptions: [...f.ticketOptions, { ticketType: "", ticketPrice: "" }],
                            }))
                          }
                        >
                          Add ticket category
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-800/30">
                  <Label className="mb-2 block">Registration mode</Label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>Register internal or external *</Label>
                      <select
                        value={form.registrationMode}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, registrationMode: e.target.value as "internal" | "external" }))
                        }
                        className={selectClass}
                      >
                        <option value="external">External</option>
                        <option value="internal">Internal</option>
                      </select>
                    </div>
                    {form.registrationMode === "external" ? (
                      <div>
                        <Label>External URL *</Label>
                        <Input
                          type="url"
                          value={form.registrationExternalUrl}
                          onChange={(e) => setForm((f) => ({ ...f, registrationExternalUrl: e.target.value }))}
                          placeholder="https://..."
                          className="mt-1"
                        />
                      </div>
                    ) : (
                      <div>
                        <Label>Internal fields</Label>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Name, Email, Phone Number</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-800/30">
                  <Label className="mb-2 block">Who can join *</Label>
                  <div className="space-y-3">
                    {form.whoCanJoin.map((value, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={value}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              whoCanJoin: f.whoCanJoin.map((item, i) => (i === index ? e.target.value : item)),
                            }))
                          }
                          placeholder="For Students / For Children / For Teachers"
                          className="mt-0"
                        />
                        {form.whoCanJoin.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setForm((f) => ({
                                ...f,
                                whoCanJoin: f.whoCanJoin.filter((_, i) => i !== index),
                              }))
                            }
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          whoCanJoin: [...f.whoCanJoin, ""],
                        }))
                      }
                    >
                      Add audience
                    </Button>
                  </div>
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

        <div className="flex flex-wrap gap-3 rounded-2xl border border-gray-200 bg-white px-6 py-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <Button type="submit" size="sm" disabled={submitting || uploadingImage || loadingExisting}>
            {submitting ? "Submitting…" : uploadingImage ? "Uploading image…" : primaryActionLabel}
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
