"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { isValidPhone, PHONE_VALIDATION_MESSAGE } from "@/lib/validation";
import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
const PASSWORD_LENGTH = 14;

function generatePassword(): string {
  let result = "";
  const bytes = new Uint8Array(PASSWORD_LENGTH);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < PASSWORD_LENGTH; i++) {
    result += CHARS[bytes[i] % CHARS.length];
  }
  return result;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadLogoToCloudinary(file: File): Promise<string> {
  const base64 = await fileToBase64(file);
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      file: base64,
      folder: "childrenlk/organization",
      resource_type: "image",
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed");
  return data.url;
}

const initialForm = {
  name: "",
  email: "",
  password: "",
  organizationName: "",
  shortDescription: "",
  logo: "",
  contactEmail: "",
  contactPhone: "",
  address: "",
  website: "",
};

export default function CreateOrganizerClient() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    
    setUploadingLogo(true);
    try {
      const logoUrl = await uploadLogoToCloudinary(file);
      setForm((f) => ({ ...f, logo: logoUrl }));
      toast.success("Logo uploaded successfully");
    } catch (error) {
      console.error("Logo upload failed:", error);
      toast.error("Failed to upload logo");
    }
    setUploadingLogo(false);
    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.password.trim() ||
      !form.organizationName.trim() ||
      !form.shortDescription.trim() ||
      !form.contactEmail.trim() ||
      !form.contactPhone.trim() ||
      !form.address.trim()
    ) {
      const msg = "Please fill in all required fields.";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (!isValidPhone(form.contactPhone)) {
      setError(PHONE_VALIDATION_MESSAGE);
      toast.error(PHONE_VALIDATION_MESSAGE);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/organizers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error ?? "Failed to create organizer";
        setError(msg);
        toast.error(msg);
        setSubmitting(false);
        return;
      }
      toast.success("Organizer created successfully");
      router.push("/admin/organizers");
    } catch {
      setError("Something went wrong");
      toast.error("Something went wrong");
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Create Organizer" />
      <ComponentCard title="New Organizer">
        <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
          {error && <p className="text-sm text-error-500">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label>Password *</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeCloseIcon className="h-5 w-5 fill-current" />
                  ) : (
                    <EyeIcon className="h-5 w-5 fill-current" />
                  )}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, password: generatePassword() }))}
                className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 whitespace-nowrap"
              >
                Generate password
              </button>
            </div>
          </div>
          <div>
            <Label>Organization Name *</Label>
            <Input
              value={form.organizationName}
              onChange={(e) => setForm((f) => ({ ...f, organizationName: e.target.value }))}
            />
          </div>
          <div>
            <Label>Summary *</Label>
            <TextArea
              value={form.shortDescription}
              onChange={(value) => setForm((f) => ({ ...f, shortDescription: value }))}
              rows={2}
            />
          </div>
          
          {/* Logo Upload Section */}
          <div>
            <Label>Organization Logo</Label>
            <div className="mt-2 space-y-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={uploadingLogo}
                className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-500/10 dark:file:text-brand-400"
              />
              {uploadingLogo && (
                <p className="text-sm text-gray-500">Uploading logo...</p>
              )}
              {form.logo && (
                <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
                  <img
                    src={form.logo}
                    alt="Organization logo"
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Logo uploaded</p>
                    <p className="text-xs text-gray-500">Ready to use</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setForm((f) => ({ ...f, logo: "" }))}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Contact Email *</Label>
              <Input
                type="email"
                value={form.contactEmail}
                onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
              />
            </div>
            <div>
              <Label>Contact Phone *</Label>
              <Input
                value={form.contactPhone}
                onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
                placeholder="+94771234567"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Must start with +94 followed by 9 digits
              </p>
            </div>
          </div>
          <div>
            <Label>Address *</Label>
            <Input
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />
          </div>
          <div>
            <Label>Website</Label>
            <Input
              type="url"
              value={form.website}
              onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
              placeholder="https://"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Creating..." : "Create Organizer"}
            </button>
            <Link
              href="/admin/organizers"
              className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300"
            >
              Cancel
            </Link>
          </div>
        </form>
      </ComponentCard>
    </div>
  );
}
