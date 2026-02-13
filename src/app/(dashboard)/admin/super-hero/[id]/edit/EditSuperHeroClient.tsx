"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import LoadingLottie from "@/components/common/LoadingLottie";
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

export default function EditSuperHeroClient() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [form, setForm] = useState({
    name: "",
    icon: "",
    iconType: "emoji" as "emoji" | "image",
    iconPublicId: "",
    phone: "",
    shortDescription: "",
  });
  const [loading, setLoading] = useState(true);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch("/api/admin/super-hero")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        const list = Array.isArray(data) ? data : [];
        const item = list.find((x: { _id: string }) => x._id === id);
        if (!item) throw new Error("Not found");
        setForm({
          name: item.name ?? "",
          icon: item.icon ?? "",
          iconType: item.iconType ?? "emoji",
          iconPublicId: item.iconPublicId ?? "",
          phone: item.phone ?? "",
          shortDescription: item.shortDescription ?? "",
        });
      })
      .catch(() => {
        setError("Failed to load");
        toast.error("Failed to load super hero");
      })
      .finally(() => setLoading(false));
  }, [id]);

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
    if (!id) return;
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
      const body: Record<string, unknown> = {
        name: form.name,
        icon: form.icon,
        iconType: form.iconType,
        phone: form.phone,
        shortDescription: form.shortDescription,
      };
      if (form.iconPublicId) body.iconPublicId = form.iconPublicId;
      const res = await fetch(`/api/admin/super-hero/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error ?? "Failed to update";
        setError(msg);
        toast.error(msg);
        setSubmitting(false);
        return;
      }
      toast.success("Super hero updated successfully");
      router.push("/admin/super-hero");
    } catch {
      setError("Something went wrong");
      toast.error("Something went wrong");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="w-full">
        <PageBreadcrumb pageTitle="Edit Super Hero" />
        <LoadingLottie variant="block" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageBreadcrumb pageTitle="Edit Super Hero" />
        <Link href="/admin/super-hero">
          <Button size="sm" variant="outline">Back to list</Button>
        </Link>
      </div>

      <ComponentCard
        title="Edit Super Hero"
        desc="Update the super hero details below."
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
                    <span className="text-sm text-gray-600 dark:text-gray-400">Current / uploaded</span>
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
                required
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 border-t border-gray-200 pt-6 dark:border-gray-800">
            <Button type="submit" size="sm" disabled={submitting || uploadingIcon}>
              {submitting ? "Saving..." : "Update Super Hero"}
            </Button>
            <Link href="/admin/super-hero">
              <Button type="button" variant="outline" size="sm">Cancel</Button>
            </Link>
          </div>
        </form>
      </ComponentCard>
    </div>
  );
}
