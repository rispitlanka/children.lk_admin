"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import TextArea from "@/components/form/input/TextArea";
import LoadingLottie from "@/components/common/LoadingLottie";
import toast from "react-hot-toast";
import Badge from "@/components/ui/badge/Badge";

type MediaFile = { url: string; publicId: string; type: "video" | "audio" | "image"; name?: string };

type MediaRequestDetail = {
  _id: string;
  name: string;
  description: string;
  files: MediaFile[];
  organizationId?: { name: string; contactEmail?: string; contactPhone?: string };
  status: string;
  adminReason?: string;
  reviewedAt?: string;
  createdAt: string;
};

export default function MediaRequestDetailClient() {
  const params = useParams();
  const id = params?.id as string;
  const [request, setRequest] = useState<MediaRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<"approve" | "deny" | null>(null);
  const [denyReason, setDenyReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/media-requests/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setRequest(data);
      })
      .catch(() => setRequest(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleApprove = async () => {
    if (!id) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/media-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error ?? "Failed to approve";
        setError(msg);
        toast.error(msg);
        setSubmitting(false);
        return;
      }
      setRequest((prev) => (prev ? { ...prev, status: "approved" } : null));
      setAction(null);
      toast.success("Media request approved");
    } catch {
      setError("Something went wrong");
      toast.error("Something went wrong");
    }
    setSubmitting(false);
  };

  const handleDeny = async () => {
    if (!id || !denyReason.trim()) {
      setError("Reason is required when denying");
      toast.error("Reason is required when denying");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/media-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "denied", adminReason: denyReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error ?? "Failed to deny";
        setError(msg);
        toast.error(msg);
        setSubmitting(false);
        return;
      }
      setRequest((prev) => (prev ? { ...prev, status: "denied", adminReason: denyReason.trim() } : null));
      setAction(null);
      setDenyReason("");
      toast.success("Media request denied");
    } catch {
      setError("Something went wrong");
      toast.error("Something went wrong");
    }
    setSubmitting(false);
  };

  const statusBadge = (status: string) => {
    if (status === "pending") return <Badge color="warning">Pending</Badge>;
    if (status === "approved") return <Badge color="success">Approved</Badge>;
    return <Badge color="error">Denied</Badge>;
  };

  if (loading) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Media Request" />
        <LoadingLottie variant="block" />
      </div>
    );
  }

  if (!request) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Media Request" />
        <ComponentCard title="Not found">
          <p className="py-6 text-center text-gray-500 dark:text-gray-400">Request not found.</p>
          <Link href="/admin/media-requests">
            <Button size="sm" variant="outline">Back to list</Button>
          </Link>
        </ComponentCard>
      </div>
    );
  }

  const isPending = request.status === "pending";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageBreadcrumb pageTitle={request.name} />
        <div className="flex items-center gap-2">
          {statusBadge(request.status)}
          <Link href="/admin/media-requests">
            <Button size="sm" variant="outline">Back to list</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <ComponentCard title="Overview">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Description</p>
                <p className="mt-1 text-gray-800 dark:text-white/90">{request.description}</p>
              </div>
              <div className="flex flex-wrap gap-4 border-t border-gray-200 pt-4 dark:border-gray-800">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Organization</p>
                  <p className="mt-1 font-medium text-gray-800 dark:text-white/90">{request.organizationId?.name ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Submitted</p>
                  <p className="mt-1 text-gray-800 dark:text-white/90">
                    {new Date(request.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                  </p>
                </div>
              </div>
            </div>
          </ComponentCard>

          {request.files?.length > 0 && (
            <ComponentCard title="Media files">
              <div className="grid gap-4 sm:grid-cols-2">
                {request.files.map((file, i) => (
                  <MediaFilePreview key={i} file={file} />
                ))}
              </div>
            </ComponentCard>
          )}
        </div>

        <div className="space-y-6">
          {isPending && (
            <ComponentCard title="Actions">
              {error && <p className="mb-3 text-sm text-error-500">{error}</p>}
              {!action && (
                <div className="flex flex-col gap-2">
                  <Button size="sm" onClick={() => { setAction("approve"); setError(""); }}>
                    Approve request
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setAction("deny"); setError(""); setDenyReason(""); }}>
                    Deny request
                  </Button>
                </div>
              )}
              {action === "approve" && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Approve this media request?</p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleApprove} disabled={submitting}>
                      {submitting ? "Saving..." : "Confirm approve"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setAction(null)} disabled={submitting}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
              {action === "deny" && (
                <div className="space-y-3">
                  <Label>Reason for denial *</Label>
                  <TextArea
                    value={denyReason}
                    onChange={(v) => setDenyReason(v)}
                    rows={3}
                    placeholder="Provide a reason for the requester"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleDeny} disabled={submitting || !denyReason.trim()}>
                      {submitting ? "Saving..." : "Confirm deny"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setAction(null); setDenyReason(""); }} disabled={submitting}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </ComponentCard>
          )}

          {!isPending && request.adminReason && (
            <ComponentCard title="Admin note">
              <p className="text-sm text-gray-700 dark:text-gray-300">{request.adminReason}</p>
              {request.reviewedAt && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Reviewed {new Date(request.reviewedAt).toLocaleString()}
                </p>
              )}
            </ComponentCard>
          )}
        </div>
      </div>
    </div>
  );
}

function MediaFilePreview({ file }: { file: MediaFile }) {
  const type = file.type || "image";
  const name = file.name || `Media (${type})`;

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900/50 overflow-hidden">
      <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-gray-800 dark:text-white/90 truncate">{name}</span>
        <span className="shrink-0 rounded bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300 capitalize">
          {type}
        </span>
      </div>
      <div className="min-h-[120px] bg-gray-50 dark:bg-gray-900/50 flex items-center justify-center">
        {type === "image" && (
          <a href={file.url} target="_blank" rel="noopener noreferrer" className="block w-full focus:ring-2 focus:ring-brand-500 rounded-b-xl overflow-hidden">
            <img src={file.url} alt={name} className="h-48 w-full object-cover hover:opacity-95 transition" />
          </a>
        )}
        {type === "video" && (
          <div className="w-full p-2">
            <video
              src={file.url}
              controls
              className="w-full max-h-52 rounded-lg"
              preload="metadata"
            >
              <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-brand-500 text-sm">Download video</a>
            </video>
          </div>
        )}
        {type === "audio" && (
          <div className="w-full p-4">
            <audio src={file.url} controls className="w-full">
              <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-brand-500 text-sm">Download audio</a>
            </audio>
          </div>
        )}
      </div>
      <div className="border-t border-gray-200 px-4 py-2 dark:border-gray-800">
        <a
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-brand-500 hover:text-brand-600"
        >
          Open / download →
        </a>
      </div>
    </div>
  );
}
