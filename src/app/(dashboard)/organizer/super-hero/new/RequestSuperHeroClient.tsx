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
import { isValidPhone, PHONE_VALIDATION_MESSAGE } from "@/lib/validation";

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
    body: JSON.stringify({ file: base64, folder: "childrenlk/super-hero", resource_type: "image" }),
  });
  const data = await res.json();
  if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed");
  return { url: data.url, publicId: data.publicId };
}

const emptyForm = {
  name: "",
  icon: "",
  iconType: "emoji" as "emoji" | "image",
  iconPublicId: "",
  phone: "",
  shortDescription: "",
};

export default function RequestSuperHeroClient() {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleIconImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setError("");
    setUploadingIcon(true);
    try {
      const result = await uploadImage(file);
      setForm((f) => ({ ...f, icon: result.url, iconPublicId: result.publicId }));
    } catch {
      setError("Failed to upload image");
      toast.error("Failed to upload image");
    }
    setUploadingIcon(false);
    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.iconType === "image" && !form.icon) {
      const msg = "Please upload an image for the icon";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (!isValidPhone(form.phone)) {
      setError(PHONE_VALIDATION_MESSAGE);
      toast.error(PHONE_VALIDATION_MESSAGE);
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, string> = {
        name: form.name,
        icon: form.icon,
        iconType: form.iconType,
        phone: form.phone,
        shortDescription: form.shortDescription,
      };
      if (form.iconPublicId) body.iconPublicId = form.iconPublicId;
      const res = await fetch("/api/organizer/super-hero-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error ?? "Failed to submit request";
        setError(msg);
        toast.error(msg);
        setSubmitting(false);
        return;
      }
      toast.success("Super hero request submitted successfully");
      router.push("/organizer/super-hero");
    } catch {
      setError("Something went wrong");
      toast.error("Something went wrong");
    }
    setSubmitting(false);
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageBreadcrumb pageTitle="Request Super Hero" />
        <Link href="/organizer/super-hero">
          <Button size="sm" variant="outline">Back to Super Hero</Button>
        </Link>
      </div>

      <ComponentCard
        title="Request a super hero"
        desc="Submit a request to add a super hero. An emoji or image can be used as the icon."
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <p className="rounded-lg bg-error-50 px-4 py-2 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
              {error}
            </p>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Super hero name"
                required
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Icon type</Label>
              <select
                value={form.iconType}
                onChange={(e) => {
                  const v = e.target.value as "emoji" | "image";
                  setForm((f) => ({ ...f, iconType: v, icon: "", iconPublicId: "" }));
                }}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="emoji">Emoji</option>
                <option value="image">Image</option>
              </select>
            </div>
            {form.iconType === "emoji" ? (
              <div className="sm:col-span-2">
                <Label>Icon (emoji) *</Label>
                <Input
                  value={form.icon}
                  onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                  placeholder="e.g. 🦸"
                  required
                  className="mt-1"
                />
              </div>
            ) : (
              <div className="sm:col-span-2">
                <Label>Icon (upload image) *</Label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleIconImageUpload}
                  disabled={uploadingIcon}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-500/10 dark:file:text-brand-400"
                />
                {uploadingIcon && <p className="mt-1 text-xs text-gray-500">Uploading...</p>}
                {form.icon && (
                  <div className="mt-3 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50/50 p-3 dark:border-gray-700 dark:bg-gray-800/30">
                    <img src={form.icon} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Uploaded</span>
                  </div>
                )}
              </div>
            )}
            <div>
              <Label>Phone *</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+94771234567"
                className="mt-1"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">+94 followed by 9 digits</p>
            </div>
            <div className="sm:col-span-2">
              <Label>Short description *</Label>
              <TextArea
                value={form.shortDescription}
                onChange={(v) => setForm((f) => ({ ...f, shortDescription: v }))}
                rows={4}
                placeholder="Brief description of this super hero"
                required
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 border-t border-gray-200 pt-6 dark:border-gray-800">
            <Button type="submit" size="sm" disabled={submitting || uploadingIcon}>
              {submitting ? "Submitting..." : "Submit request"}
            </Button>
            <Link href="/organizer/super-hero">
              <Button type="button" variant="outline" size="sm">Cancel</Button>
            </Link>
          </div>
        </form>
      </ComponentCard>
    </div>
  );
}
