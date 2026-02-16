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
import Switch from "@/components/form/switch/Switch";

const emptyForm = {
  title: "",
  description: "",
  isLive: false,
};

export default function AddAnnouncementClient() {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim()) {
      const msg = "Title is required";
      setError(msg);
      toast.error(msg);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          isLive: form.isLive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error ?? "Failed to create announcement";
        setError(msg);
        toast.error(msg);
        setSubmitting(false);
        return;
      }
      toast.success("Announcement created successfully");
      router.push("/admin/announcements");
    } catch {
      setError("Something went wrong");
      toast.error("Something went wrong");
    }
    setSubmitting(false);
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageBreadcrumb pageTitle="Add Announcement" />
        <Link href="/admin/announcements">
          <Button size="sm" variant="outline">Back to list</Button>
        </Link>
      </div>

      <ComponentCard
        title="New Announcement"
        desc="Add an announcement. Use the toggle to make it live so it is visible to users."
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <p className="rounded-lg bg-error-50 px-4 py-2 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
              {error}
            </p>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Announcement title"
                required
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Announcement Description</Label>
              <TextArea
                value={form.description}
                onChange={(v) => setForm((f) => ({ ...f, description: v }))}
                rows={4}
                placeholder="Describe the announcement"
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-2 flex items-center gap-3">
              <Switch
                key={`live-${form.isLive}`}
                label="Make announcement live"
                defaultChecked={form.isLive}
                onChange={(checked) => setForm((f) => ({ ...f, isLive: checked }))}
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {form.isLive ? "Visible to users" : "Hidden"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 border-t border-gray-200 pt-6 dark:border-gray-800">
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Creating..." : "Create Announcement"}
            </Button>
            <Link href="/admin/announcements">
              <Button type="button" variant="outline" size="sm">Cancel</Button>
            </Link>
          </div>
        </form>
      </ComponentCard>
    </div>
  );
}
