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

const initialForm = {
  name: "",
  location: "",
  startDate: "",
  endDate: "",
  description: "",
  registrationLink: "",
};

export default function AddEventClient() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/organizer/event-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          location: form.location,
          startDate: form.startDate,
          endDate: form.endDate || undefined,
          description: form.description,
          tags,
          registrationLink: form.registrationLink || undefined,
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
    <div className="w-full">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageBreadcrumb pageTitle="Add Event" />
        <Link href="/organizer/events">
          <Button size="sm" variant="outline">Back to Events</Button>
        </Link>
      </div>

      <ComponentCard
        title="Submit event request"
        desc="Add a new event for review. Provide name, location, dates, and description."
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <p className="rounded-lg bg-error-50 px-4 py-2 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
              {error}
            </p>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Event name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Children's Day Workshop"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label>Location *</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="Venue or address"
                required
                className="mt-1"
              />
            </div>
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
            <div>
              <Label>Start date & time *</Label>
              <Input
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label>End date & time</Label>
              <Input
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
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
            <div className="sm:col-span-2">
              <Label>Description *</Label>
              <TextArea
                value={form.description}
                onChange={(v) => setForm((f) => ({ ...f, description: v }))}
                rows={5}
                placeholder="Describe the event, agenda, and who it's for."
                required
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 border-t border-gray-200 pt-6 dark:border-gray-800">
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit request"}
            </Button>
            <Link href="/organizer/events">
              <Button type="button" variant="outline" size="sm">Cancel</Button>
            </Link>
          </div>
        </form>
      </ComponentCard>
    </div>
  );
}
