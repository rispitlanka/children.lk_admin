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
import Select from "@/components/form/Select";
import TagsSelect from "@/components/form/TagsSelect";
import ResourceDescriptionQuill from "@/components/form/ResourceDescriptionQuill";
import DashedDropzone from "@/components/form/input/DashedDropzone";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadImage(file: File): Promise<{ url: string; publicId: string }> {
  const base64 = await fileToBase64(file);
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      file: base64,
      folder: "childrenlk/learning-courses",
      resource_type: "image",
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed");
  return { url: data.url, publicId: data.publicId };
}

const AGE_GROUP_OPTIONS = [
  { value: "1-5", label: "1-5 years" },
  { value: "5-10", label: "5-10 years" },
  { value: "11-15", label: "11-15 years" },
  { value: "15-18", label: "15-18 years" },
  { value: "above-18", label: "18+ years" },
];

const TARGET_AUDIENCE_OPTIONS = [
  { value: "children", label: "Children" },
  { value: "people_work_for_children", label: "People Work for Children" },
];

const VISIBILITY_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const emptyForm = {
  name: "",
  shortDescription: "",
  description: "",
  coverImage: "",
  coverImagePublicId: "",
  tags: [] as string[],
  ageGroup: "",
  targetAudience: "",
  visibilityStatus: "draft",
};

export default function AddCourseClient() {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setError("");
    setUploadingImage(true);
    try {
      const result = await uploadImage(file);
      setForm((f) => ({
        ...f,
        coverImage: result.url,
        coverImagePublicId: result.publicId,
      }));
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
    if (!form.name.trim()) {
      const msg = "Please enter a course name";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (!form.shortDescription.trim()) {
      const msg = "Please enter a short description";
      setError(msg);
      toast.error(msg);
      return;
    }

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        shortDescription: form.shortDescription.trim(),
        description: form.description || undefined,
        coverImage: form.coverImage || undefined,
        coverImagePublicId: form.coverImagePublicId || undefined,
        tags: form.tags,
        ageGroup: form.ageGroup || undefined,
        targetAudience: form.targetAudience || undefined,
        visibilityStatus: form.visibilityStatus || "draft",
      };

      const res = await fetch("/api/admin/learning-courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error ?? "Failed to create course";
        setError(msg);
        toast.error(msg);
        setSubmitting(false);
        return;
      }
      toast.success("Course created successfully");
      router.push("/admin/learning-hub");
    } catch {
      setError("Something went wrong");
      toast.error("Something went wrong");
    }
    setSubmitting(false);
  };

  return (
    <div className="w-full space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageBreadcrumb
          pageTitle="Add Course"
          items={[
            { name: "Learning Hub", href: "/admin/learning-hub" },
            { name: "Add Course" },
          ]}
        />
        <Link href="/admin/learning-hub">
          <Button size="sm" variant="outline" className="h-10 px-4 text-xs">
            Back to list
          </Button>
        </Link>
      </div>

      <ComponentCard
        title="New Course"
        desc="Create a new learning course with cover, details, and audience settings."
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <p className="rounded-[10px] border border-rose-200 bg-rose-50/50 p-3.5 text-xs text-rose-600 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-400">
              {error}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <div className="sm:col-span-2">
              <Label>Course Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Child Protection Fundamentals"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <Label>Short Description *</Label>
              <TextArea
                value={form.shortDescription}
                onChange={(v) => setForm((f) => ({ ...f, shortDescription: v }))}
                rows={2}
                placeholder="Brief summary of the course for cards and search"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <Label>Cover Image</Label>
              {form.coverImage ? (
                <div className="flex items-center gap-3 rounded-[10px] border border-gray-200 bg-gray-50/50 p-3 dark:border-gray-800 dark:bg-gray-800/30">
                  <img
                    src={form.coverImage}
                    alt="Cover"
                    className="h-16 w-24 rounded object-cover ring-2 ring-gray-200 dark:ring-gray-700"
                  />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-900 dark:text-white">
                      Cover image uploaded
                    </p>
                    <p className="text-[11px] text-gray-400">Ready to display</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setForm((f) => ({ ...f, coverImage: "", coverImagePublicId: "" }))
                    }
                    className="h-8 text-xs"
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <DashedDropzone
                  onChange={handleImageUpload}
                  accept="image/*"
                  disabled={uploadingImage}
                  label={
                    uploadingImage
                      ? "Uploading cover image..."
                      : "Click or drag cover image to upload"
                  }
                  sublabel="PNG, JPG, or WEBP (max 5MB)"
                />
              )}
            </div>

            <div className="sm:col-span-2">
              <TagsSelect
                value={form.tags}
                onChange={(tags) => setForm((f) => ({ ...f, tags }))}
                label="Tags"
                placeholder="Select or type to add tags"
              />
            </div>

            <div>
              <Label>Age Group</Label>
              <Select
                key={form.ageGroup}
                defaultValue={form.ageGroup}
                options={AGE_GROUP_OPTIONS}
                placeholder="Select age group"
                onChange={(val) => setForm((f) => ({ ...f, ageGroup: val }))}
              />
            </div>

            <div>
              <Label>Target Audience</Label>
              <Select
                key={form.targetAudience}
                defaultValue={form.targetAudience}
                options={TARGET_AUDIENCE_OPTIONS}
                placeholder="Select target audience"
                onChange={(val) => setForm((f) => ({ ...f, targetAudience: val }))}
              />
            </div>

            <div className="sm:col-span-2">
              <Label>Visibility Status</Label>
              <Select
                key={form.visibilityStatus}
                defaultValue={form.visibilityStatus}
                options={VISIBILITY_STATUS_OPTIONS}
                placeholder="Select visibility status"
                onChange={(val) => setForm((f) => ({ ...f, visibilityStatus: val }))}
              />
            </div>

            <div className="sm:col-span-2">
              <Label>Full Description (Rich Text)</Label>
              <div className="rounded-[10px] border border-gray-200 bg-white p-1 dark:border-gray-800 dark:bg-gray-dark min-h-[160px]">
                <ResourceDescriptionQuill
                  value={form.description}
                  onChange={(html) => setForm((f) => ({ ...f, description: html }))}
                  placeholder="Detailed course curriculum description, objectives, and overview..."
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4 mt-6 dark:border-gray-800">
            <Link href="/admin/learning-hub">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 px-4 text-xs"
              >
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              size="sm"
              disabled={submitting || uploadingImage}
              className="h-10 px-4 text-xs"
            >
              {submitting ? "Creating..." : "Create Course"}
            </Button>
          </div>
        </form>
      </ComponentCard>
    </div>
  );
}
