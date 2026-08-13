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
import { EVENT_CATEGORY_LABELS, type EventCategoryValue } from "@/lib/event-form-constants";

type EventRequestDetail = {
  _id: string;
  name: string;
  location: string;
  eventCategory?: string;
  locationName?: string;
  locationAddress?: string;
  locationContact?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  startDate: string;
  endDate?: string;
  description: string;
  tags: string[];
  slug?: string;
  pricingType?: "free" | "paid";
  ticketOptions?: { ticketType: string; ticketPrice: number }[];
  ticketType?: string;
  ticketPrice?: number;
  registrationMode?: "internal" | "external";
  registrationExternalUrl?: string;
  internalRegistrationFields?: string[];
  whoCanJoin?: string[];
  coverImage?: string;
  highlight1?: string;
  highlight2?: string;
  highlight3?: string;
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
    if (status === "pending")
      return <span className="inline-flex items-center rounded-[6px] bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">Pending</span>;
    if (status === "approved")
      return <span className="inline-flex items-center rounded-[6px] bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">Approved</span>;
    return <span className="inline-flex items-center rounded-[6px] bg-rose-500/10 px-2.5 py-0.5 text-xs font-medium text-rose-600 dark:text-rose-400">Denied</span>;
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(undefined, { dateStyle: "medium" });
  const formatDateTime = (d: string) =>
    new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Colombo" });

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
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageBreadcrumb pageTitle={request.name} />
        <div className="flex items-center gap-2">
          {statusBadge(request.status)}
          <Link href="/admin/event-requests">
            <Button size="sm" variant="outline">Back to list</Button>
          </Link>
        </div>
      </div>

      <div className="space-y-8">
        {isPending && (
          <ComponentCard title="Actions">
            {error && <p className="mb-3 text-sm text-error-500">{error}</p>}
            {!action && (
              <div className="flex flex-col gap-2 sm:flex-row">
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

        <ComponentCard title="Overview">
          <div className="space-y-4">
            {request.eventCategory && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Category</p>
                <p className="mt-1 font-medium text-gray-800 dark:text-white/90">
                  {EVENT_CATEGORY_LABELS[request.eventCategory as EventCategoryValue] ?? request.eventCategory}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Description</p>
              <div
                className="prose prose-sm dark:prose-invert mt-1 max-w-none text-gray-800 dark:text-white/90"
                dangerouslySetInnerHTML={{ __html: request.description || "—" }}
              />
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 border-t border-gray-200 pt-4 text-sm dark:border-gray-800 md:grid-cols-2 min-[1200px]:grid-cols-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Location (summary)</p>
                <p className="mt-1 font-medium text-gray-800 dark:text-white/90">{request.location}</p>
              </div>
              {request.locationName && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Venue name</p>
                  <p className="mt-1 text-gray-800 dark:text-white/90">{request.locationName}</p>
                </div>
              )}
              {request.locationContact && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Venue contact</p>
                  <p className="mt-1 text-gray-800 dark:text-white/90">{request.locationContact}</p>
                </div>
              )}
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
              {request.locationAddress && (
                <div className="col-span-1 md:col-span-2 min-[1200px]:col-span-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Address</p>
                  <p className="mt-1 whitespace-pre-wrap text-gray-800 dark:text-white/90">{request.locationAddress}</p>
                </div>
              )}
            </div>
            {(request.pricingType || request.registrationMode) && (
              <div className="border-t border-gray-200 pt-4 dark:border-gray-800">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Pricing & ticketing</p>
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 text-sm md:grid-cols-2 min-[1200px]:grid-cols-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Pricing</p>
                    <p className="mt-1 font-medium text-gray-800 dark:text-white/90 capitalize">{request.pricingType ?? "free"}</p>
                  </div>
                  {request.pricingType === "paid" && (
                    <>
                      {(request.ticketOptions ?? []).length > 0 ? (
                        <div className="col-span-1 md:col-span-2 min-[1200px]:col-span-2">
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Ticket categories</p>
                          <p className="mt-1 text-gray-800 dark:text-white/90">
                            {(request.ticketOptions ?? [])
                              .map((ticket) => `${ticket.ticketType}: ${ticket.ticketPrice}`)
                              .join(", ")}
                          </p>
                        </div>
                      ) : (
                        <>
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Ticket type</p>
                            <p className="mt-1 text-gray-800 dark:text-white/90">{request.ticketType || "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Ticket price</p>
                            <p className="mt-1 text-gray-800 dark:text-white/90">{request.ticketPrice ?? "—"}</p>
                          </div>
                        </>
                      )}
                    </>
                  )}
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Registration mode</p>
                    <p className="mt-1 text-gray-800 dark:text-white/90 capitalize">{request.registrationMode ?? "external"}</p>
                  </div>
                  {request.registrationMode === "external" && request.registrationExternalUrl && (
                    <div className="col-span-1 md:col-span-2 min-[1200px]:col-span-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">External URL</p>
                      <a href={request.registrationExternalUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block font-medium text-brand-500 hover:text-brand-600 break-all">
                        {request.registrationExternalUrl}
                      </a>
                    </div>
                  )}
                  {request.registrationMode === "internal" && (
                    <div className="col-span-1 md:col-span-2 min-[1200px]:col-span-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Internal fields</p>
                      <p className="mt-1 text-gray-800 dark:text-white/90">{(request.internalRegistrationFields ?? []).join(", ") || "name, email, phone"}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            {(request.whoCanJoin ?? []).length > 0 && (
              <div className="border-t border-gray-200 pt-4 dark:border-gray-800">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Who can join</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-800 dark:text-white/90">
                  {(request.whoCanJoin ?? []).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
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
            {request.coverImage && (
              <div className="border-t border-gray-200 pt-4 dark:border-gray-800">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Cover image</p>
                <a href={request.coverImage} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={request.coverImage}
                    alt="Cover"
                    className="max-h-48 rounded-[10px] border border-gray-200 object-cover dark:border-gray-800"
                  />
                </a>
              </div>
            )}
            {request.locationLatitude != null &&
              request.locationLongitude != null &&
              Number.isFinite(request.locationLatitude) &&
              Number.isFinite(request.locationLongitude) && (
                <div className="border-t border-gray-200 pt-4 dark:border-gray-800">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Map</p>
                  <div className="mt-2 overflow-hidden rounded-[10px] border border-gray-200 dark:border-gray-800">
                    <iframe
                      title="Venue map"
                      src={`https://www.google.com/maps?q=${encodeURIComponent(String(request.locationLatitude))},${encodeURIComponent(String(request.locationLongitude))}&z=15&output=embed`}
                      className="h-56 w-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                </div>
              )}
            {[request.highlight1, request.highlight2, request.highlight3].some((h) => h?.trim()) && (
              <div className="border-t border-gray-200 pt-4 dark:border-gray-800">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Highlights</p>
                <ul className="mt-2 list-decimal space-y-2 pl-5 text-sm text-gray-800 dark:text-white/90">
                  {[request.highlight1, request.highlight2, request.highlight3].map((h, i) =>
                    h?.trim() ? <li key={i}>{h}</li> : null
                  )}
                </ul>
              </div>
            )}
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}
