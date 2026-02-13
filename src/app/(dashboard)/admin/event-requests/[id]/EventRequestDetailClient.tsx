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

type EventRequestDetail = {
  _id: string;
  name: string;
  location: string;
  startDate: string;
  endDate?: string;
  description: string;
  tags: string[];
  registrationLink?: string;
  organizationId?: { name: string; contactEmail?: string; contactPhone?: string };
  status: string;
  adminReason?: string;
  reviewedAt?: string;
  createdAt: string;
};

export default function EventRequestDetailClient() {
  const params = useParams();
  const id = params?.id as string;
  const [request, setRequest] = useState<EventRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<"approve" | "deny" | null>(null);
  const [denyReason, setDenyReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/event-requests/${id}`)
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
      const res = await fetch(`/api/admin/event-requests/${id}`, {
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
      toast.success("Event request approved");
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
      const res = await fetch(`/api/admin/event-requests/${id}`, {
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
      toast.success("Event request denied");
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

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(undefined, { dateStyle: "medium" });
  const formatDateTime = (d: string) =>
    new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

  if (loading) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Event Request" />
        <LoadingLottie variant="block" />
      </div>
    );
  }

  if (!request) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Event Request" />
        <ComponentCard title="Not found">
          <p className="py-6 text-center text-gray-500 dark:text-gray-400">Request not found.</p>
          <Link href="/admin/event-requests">
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
          <Link href="/admin/event-requests">
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
              <div className="grid gap-4 border-t border-gray-200 pt-4 dark:border-gray-800 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Location</p>
                  <p className="mt-1 font-medium text-gray-800 dark:text-white/90">{request.location}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Start date</p>
                  <p className="mt-1 text-gray-800 dark:text-white/90">{formatDateTime(request.startDate)}</p>
                </div>
                {request.endDate && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">End date</p>
                    <p className="mt-1 text-gray-800 dark:text-white/90">{formatDateTime(request.endDate)}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Organization</p>
                  <p className="mt-1 font-medium text-gray-800 dark:text-white/90">{request.organizationId?.name ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Submitted</p>
                  <p className="mt-1 text-gray-800 dark:text-white/90">{formatDate(request.createdAt)}</p>
                </div>
              </div>
              {request.registrationLink && (
                <div className="border-t border-gray-200 pt-4 dark:border-gray-800">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Registration link</p>
                  <a
                    href={request.registrationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-brand-500 hover:text-brand-600 font-medium break-all"
                  >
                    {request.registrationLink}
                  </a>
                </div>
              )}
              {request.tags?.length > 0 && (
                <div className="border-t border-gray-200 pt-4 dark:border-gray-800">
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
          </ComponentCard>
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">Approve this event request?</p>
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
