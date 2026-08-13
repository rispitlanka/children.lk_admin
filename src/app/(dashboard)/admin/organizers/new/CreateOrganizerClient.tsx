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
import DashedDropzone from "@/components/form/input/DashedDropzone";
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
    <div className="space-y-8">
      <PageBreadcrumb pageTitle="Create Organizer" />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        {error && (
          <p className="rounded-[10px] border border-rose-200 bg-rose-50/50 p-3.5 text-xs text-rose-600 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-400">
            {error}
          </p>
        )}

        <ComponentCard title="Account Credentials" desc="Set up the primary administrator account for this organization.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Full name"
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="admin@organization.org"
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Password *</Label>
              <div className="flex items-center gap-3">
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
                      <EyeCloseIcon className="h-4 w-4 fill-current" />
                    ) : (
                      <EyeIcon className="h-4 w-4 fill-current" />
                    )}
                  </button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setForm((f) => ({ ...f, password: generatePassword() }))}
                  className="h-10 shrink-0 text-xs"
                >
                  Generate password
                </Button>
              </div>
            </div>
          </div>
        </ComponentCard>

        <ComponentCard title="Organization Details" desc="Public information displayed on resources and event listings.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <div className="sm:col-span-2">
              <Label>Organization Name *</Label>
              <Input
                value={form.organizationName}
                onChange={(e) => setForm((f) => ({ ...f, organizationName: e.target.value }))}
                placeholder="Organization name"
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Summary *</Label>
              <TextArea
                value={form.shortDescription}
                onChange={(value) => setForm((f) => ({ ...f, shortDescription: value }))}
                rows={3}
                placeholder="Brief summary of the organization"
              />
            </div>
            
            {/* Logo Upload Section */}
            <div className="sm:col-span-2">
              <Label>Organization Logo</Label>
              {form.logo ? (
                <div className="flex items-center gap-3 rounded-[10px] border border-gray-200 bg-gray-50/50 p-3 dark:border-gray-800 dark:bg-gray-800/30">
                  <img
                    src={form.logo}
                    alt="Organization logo"
                    className="h-12 w-12 rounded-[10px] object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-900 dark:text-white">Logo uploaded</p>
                    <p className="text-[11px] text-gray-400">Ready to use</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setForm((f) => ({ ...f, logo: "" }))}
                    className="h-8 text-xs"
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <DashedDropzone
                  onChange={handleLogoUpload}
                  accept="image/*"
                  disabled={uploadingLogo}
                  label={uploadingLogo ? "Uploading logo..." : "Click or drag logo to upload"}
                  sublabel="PNG, JPG, or WEBP (max 5MB)"
                />
              )}
            </div>
            
            <div>
              <Label>Contact Email *</Label>
              <Input
                type="email"
                value={form.contactEmail}
                onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
                placeholder="contact@organization.org"
              />
            </div>
            <div>
              <Label>Contact Phone *</Label>
              <Input
                value={form.contactPhone}
                onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
                placeholder="+94771234567"
              />
              <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                Format: +94 followed by 9 digits
              </p>
            </div>
            <div className="sm:col-span-2">
              <Label>Address *</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Physical address"
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Website</Label>
              <Input
                type="url"
                value={form.website}
                onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                placeholder="https://organization.org"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
            <Link href="/admin/organizers">
              <Button type="button" variant="outline" size="sm" className="h-10 px-4 text-xs">
                Cancel
              </Button>
            </Link>
            <Button type="submit" size="sm" disabled={submitting || uploadingLogo} className="h-10 px-4 text-xs">
              {submitting ? "Creating..." : "Create Organizer"}
            </Button>
          </div>
        </ComponentCard>
      </form>
    </div>
  );
}
