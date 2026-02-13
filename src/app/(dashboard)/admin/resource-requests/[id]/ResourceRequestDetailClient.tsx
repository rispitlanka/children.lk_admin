"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import TextArea from "@/components/form/input/TextArea";
import LoadingLottie from "@/components/common/LoadingLottie";
import toast from "react-hot-toast";
import Badge from "@/components/ui/badge/Badge";

type DocFile = { url: string; publicId: string; type: string; name?: string };

type ResourceRequestDetail = {
  _id: string;
  name: string;
  shortDescription: string;
  picture?: string;
  documents: DocFile[];
  tags: string[];
  organizationId?: { name: string; contactEmail?: string; contactPhone?: string };
  status: string;
  adminReason?: string;
  reviewedAt?: string;
  createdAt: string;
};

export default function ResourceRequestDetailClient() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [request, setRequest] = useState<ResourceRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<"approve" | "deny" | null>(null);
  const [denyReason, setDenyReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/resource-requests/${id}`)
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
      const res = await fetch(`/api/admin/resource-requests/${id}`, {
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
      toast.success("Resource request approved");
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
      const res = await fetch(`/api/admin/resource-requests/${id}`, {
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
      toast.success("Resource request denied");
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
        <PageBreadcrumb pageTitle="Resource Request" />
        <LoadingLottie variant="block" />
      </div>
    );
  }

  if (!request) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Resource Request" />
        <ComponentCard title="Not found">
          <p className="py-6 text-center text-gray-500 dark:text-gray-400">Request not found.</p>
          <Link href="/admin/resource-requests">
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
          <Link href="/admin/resource-requests">
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
                <p className="mt-1 text-gray-800 dark:text-white/90">{request.shortDescription}</p>
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
                {request.tags?.length > 0 && (
                  <div className="w-full">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Tags</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {request.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ComponentCard>

          {request.picture && (
            <ComponentCard title="Cover picture">
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50">
                <a
                  href={request.picture}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 rounded-xl"
                >
                  <img
                    src={request.picture}
                    alt="Resource cover"
                    className="h-auto w-full max-h-[400px] object-contain"
                  />
                </a>
                <div className="border-t border-gray-200 px-4 py-2 dark:border-gray-800">
                  <a
                    href={request.picture}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-brand-500 hover:text-brand-600"
                  >
                    Open full size →
                  </a>
                </div>
              </div>
            </ComponentCard>
          )}

          {request.documents?.length > 0 && (
            <ComponentCard title="Documents &amp; media">
              <div className="grid gap-4 sm:grid-cols-2">
                {request.documents.map((doc, i) => (
                  <DocumentPreview key={i} doc={doc} />
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">Approve this resource request?</p>
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

function DocumentPreview({ doc }: { doc: DocFile }) {
  const type = (doc.type || "pdf").toLowerCase();
  const name = doc.name || `Document (${type})`;
  const isImage = type === "image";
  const isVideo = type === "video";
  const isAudio = type === "audio";
  const isPdf = type === "pdf";
  const isEmbeddable = isPdf || isVideo || isAudio;

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900/50 overflow-hidden">
      <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-gray-800 dark:text-white/90 truncate">{name}</span>
        <span className="shrink-0 rounded bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300 capitalize">
          {type}
        </span>
      </div>
      <div className="min-h-[120px] bg-gray-50 dark:bg-gray-900/50 flex items-center justify-center">
        {isImage && (
          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="block w-full focus:ring-2 focus:ring-brand-500 rounded-b-xl overflow-hidden">
            <img src={doc.url} alt={name} className="h-48 w-full object-cover hover:opacity-95 transition" />
          </a>
        )}
        {isVideo && (
          <div className="w-full p-2">
            <video
              src={doc.url}
              controls
              className="w-full max-h-52 rounded-lg"
              preload="metadata"
            >
              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-brand-500 text-sm">Download video</a>
            </video>
          </div>
        )}
        {isAudio && (
          <div className="w-full p-4">
            <audio src={doc.url} controls className="w-full">
              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-brand-500 text-sm">Download audio</a>
            </audio>
          </div>
        )}
        {isPdf && (
          <div className="w-full h-64 flex flex-col">
            <iframe
              src={doc.url}
              title={name}
              className="flex-1 w-full min-h-[200px] border-0"
            />
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center py-2 text-sm font-medium text-brand-500 hover:text-brand-600 border-t border-gray-200 dark:border-gray-800"
            >
              Open in new tab
            </a>
          </div>
        )}
        {!isImage && !isEmbeddable && (
          <a
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-2 p-6 text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400"
          >
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm font-medium">{name}</span>
            <span className="text-xs">Click to download</span>
          </a>
        )}
      </div>
    </div>
  );
}
