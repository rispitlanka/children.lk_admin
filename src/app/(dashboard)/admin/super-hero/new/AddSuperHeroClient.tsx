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
import {
  isValidSuperHeroContact,
  SUPER_HERO_CONTACT_VALIDATION_MESSAGE,
} from "@/lib/validation";

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
    body: JSON.stringify({ file: base64, folder: "childrenlk/super-hero", resource_type: "image" }),
  });
  const data = await res.json();
  if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed");
  return { url: data.url, publicId: data.publicId };
}

const emptyForm = {
  name: "",
  color: "#ff0000",
  contactNumber: "",
  image: "",
  imagePublicId: "",
  description: "",
};

export default function AddSuperHeroClient() {
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
      setForm((f) => ({ ...f, image: result.url, imagePublicId: result.publicId }));
    } catch {
      setError("Failed to upload image");
      toast.error("Failed to upload image");
    }
    setUploadingImage(false);
    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.image) {
      const msg = "Please upload a super hero image";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (!isValidSuperHeroContact(form.contactNumber)) {
      setError(SUPER_HERO_CONTACT_VALIDATION_MESSAGE);
      toast.error(SUPER_HERO_CONTACT_VALIDATION_MESSAGE);
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        name: form.name,
        color: form.color,
        contactNumber: form.contactNumber,
        image: form.image,
        description: form.description,
      };
      if (form.imagePublicId) body.imagePublicId = form.imagePublicId;
      const res = await fetch("/api/admin/super-hero", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error ?? "Failed to create super hero";
        setError(msg);
        toast.error(msg);
        setSubmitting(false);
        return;
      }
      toast.success("Super hero created successfully");
      router.push("/admin/super-hero");
    } catch {
      setError("Something went wrong");
      toast.error("Something went wrong");
    }
    setSubmitting(false);
  };

  return (
    <div className="w-full space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageBreadcrumb pageTitle="Add Super Hero" />
        <Link href="/admin/super-hero">
          <Button size="sm" variant="outline" className="h-10 px-4 text-xs">Back to list</Button>
        </Link>
      </div>

      <ComponentCard
        title="New Super Hero"
        desc="Add a super hero with basic details."
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <p className="rounded-[10px] border border-rose-200 bg-rose-50/50 p-3.5 text-xs text-rose-600 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-400">
              {error}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <div className="sm:col-span-2">
              <Label>Super Hero Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Fire and Rescue"
                required
              />
            </div>
            <div>
              <Label>Super Hero Color *</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  required
                  className="h-10 w-12 cursor-pointer rounded-[10px] border border-gray-200 bg-white p-1 dark:border-gray-800 dark:bg-gray-dark"
                />
                <Input
                  value={form.color}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  placeholder="#ff0000"
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label>Contact Number *</Label>
              <Input
                value={form.contactNumber}
                onChange={(e) => setForm((f) => ({ ...f, contactNumber: e.target.value }))}
                placeholder="e.g. 199 or +94775921581"
              />
              <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                Short code or full number format
              </p>
            </div>
            <div className="sm:col-span-2">
              <Label>Super Hero Image *</Label>
              {form.image ? (
                <div className="flex items-center gap-3 rounded-[10px] border border-gray-200 bg-gray-50/50 p-3 dark:border-gray-800 dark:bg-gray-800/30">
                  <img src={form.image} alt="" className="h-14 w-14 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-900 dark:text-white">Super hero image uploaded</p>
                    <p className="text-[11px] text-gray-400">Ready to use</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setForm((f) => ({ ...f, image: "", imagePublicId: "" }))}
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
                  label={uploadingImage ? "Uploading image..." : "Click or drag super hero image to upload"}
                  sublabel="PNG, JPG, or WEBP (max 5MB)"
                />
              )}
            </div>
            <div className="sm:col-span-2">
              <Label>Description *</Label>
              <TextArea
                value={form.description}
                onChange={(v) => setForm((f) => ({ ...f, description: v }))}
                rows={4}
                placeholder="Enter super hero description"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4 mt-6 dark:border-gray-800">
            <Link href="/admin/super-hero">
              <Button type="button" variant="outline" size="sm" className="h-10 px-4 text-xs">
                Cancel
              </Button>
            </Link>
            <Button type="submit" size="sm" disabled={submitting || uploadingImage} className="h-10 px-4 text-xs">
              {submitting ? "Creating..." : "Create Super Hero"}
            </Button>
          </div>
        </form>
      </ComponentCard>
    </div>
  );
}
