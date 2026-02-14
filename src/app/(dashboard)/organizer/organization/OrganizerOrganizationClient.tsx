"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import ComponentCard from "@/components/common/ComponentCard";
import LoadingLottie from "@/components/common/LoadingLottie";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
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

type Org = {
  _id: string;
  name: string;
  shortDescription: string;
  logo?: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  website?: string;
};

export default function OrganizerOrganizationClient() {
  const [org, setOrg] = useState<Org | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    shortDescription: "",
    logo: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    website: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/organizer/organization")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setOrg(data);
        setForm({
          name: data.name ?? "",
          shortDescription: data.shortDescription ?? "",
          logo: data.logo ?? "",
          contactEmail: data.contactEmail ?? "",
          contactPhone: data.contactPhone ?? "",
          address: data.address ?? "",
          website: data.website ?? "",
        });
      })
      .catch(() => setOrg(null))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!isValidPhone(form.contactPhone)) {
      setError(PHONE_VALIDATION_MESSAGE);
      toast.error(PHONE_VALIDATION_MESSAGE);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/organizer/organization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error ?? "Failed to save";
        setError(msg);
        toast.error(msg);
        setSaving(false);
        return;
      }
      setOrg((prev) => (prev ? { ...prev, ...form } : null));
      setIsEditing(false);
      toast.success("Organization updated successfully");
    } catch {
      setError("Something went wrong");
      toast.error("Something went wrong");
    }
    setSaving(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setError("");
    // Reset form to original org data
    if (org) {
      setForm({
        name: org.name ?? "",
        shortDescription: org.shortDescription ?? "",
        logo: org.logo ?? "",
        contactEmail: org.contactEmail ?? "",
        contactPhone: org.contactPhone ?? "",
        address: org.address ?? "",
        website: org.website ?? "",
      });
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setError("");
    setUploadingLogo(true);
    try {
      const url = await uploadLogoToCloudinary(file);
      setForm((f) => ({ ...f, logo: url }));
    } catch {
      setError("Failed to upload logo");
      toast.error("Failed to upload logo");
    }
    setUploadingLogo(false);
    e.target.value = "";
  };

  if (loading) return <LoadingLottie variant="block" />;
  if (!org) return <p className="py-4 text-gray-500">No organization found.</p>;

  return (
    <div>
      <PageBreadcrumb pageTitle="Organization" />
      
      {!isEditing ? (
        // Details View
        <ComponentCard 
          title="Organization Details"
          action={
            <Button 
              size="sm" 
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
          }
        >
          <div className="space-y-6 max-w-2xl">
            {/* Logo */}
            {org.logo && (
              <div className="flex items-center gap-4">
                <img
                  src={org.logo}
                  alt="Organization logo"
                  className="h-20 w-20 rounded-lg object-contain ring-2 ring-gray-200 dark:ring-gray-700"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Organization Logo</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Current logo</p>
                </div>
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Name</p>
                <p className="text-gray-700 dark:text-gray-300">{org.name}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Contact Email</p>
                <p className="text-gray-700 dark:text-gray-300">{org.contactEmail}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Contact Phone</p>
                <p className="text-gray-700 dark:text-gray-300">{org.contactPhone}</p>
              </div>
              
              {org.website && (
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Website</p>
                  <a 
                    href={org.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                  >
                    {org.website}
                  </a>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Description</p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{org.shortDescription}</p>
            </div>

            {/* Address */}
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Address</p>
              <p className="text-gray-700 dark:text-gray-300">{org.address}</p>
            </div>
          </div>
        </ComponentCard>
      ) : (
        // Edit View
        <ComponentCard 
          title="Edit Organization"
          action={
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCancelEdit}
            >
              Cancel
            </Button>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
            {error && <p className="text-sm text-error-500">{error}</p>}
            <div>
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>Summary *</Label>
              <TextArea
                value={form.shortDescription}
                onChange={(v) => setForm((f) => ({ ...f, shortDescription: v }))}
                rows={3}
              />
            </div>
            <div>
              <Label>Logo</Label>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Upload your organization logo. It will be stored on Cloudinary.
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={uploadingLogo}
                className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-500/10 dark:file:text-brand-400"
              />
              {uploadingLogo && <p className="mt-1 text-xs text-gray-500">Uploading...</p>}
              {form.logo && (
                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50/50 p-3 dark:border-gray-700 dark:bg-gray-800/30">
                    <img
                      src={form.logo}
                      alt="Organization logo"
                      className="h-16 w-16 rounded-lg object-contain ring-2 ring-gray-200 dark:ring-gray-700"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Current logo</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setForm((f) => ({ ...f, logo: "" }))}
                  >
                    Remove logo
                  </Button>
                </div>
              )}
            </div>
            <div>
              <Label>Contact email *</Label>
              <Input
                type="email"
                value={form.contactEmail}
                onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>Contact phone *</Label>
              <Input
                value={form.contactPhone}
                onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
                placeholder="+94771234567"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">+94 followed by 9 digits</p>
            </div>
            <div>
              <Label>Address *</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>Website</Label>
              <Input
                type="url"
                value={form.website}
                onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" size="sm" disabled={saving || uploadingLogo}>
                {saving ? "Saving..." : uploadingLogo ? "Uploading logo..." : "Save Changes"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={handleCancelEdit}
                disabled={saving || uploadingLogo}
              >
                Cancel
              </Button>
            </div>
          </form>
        </ComponentCard>
      )}
    </div>
  );
}
