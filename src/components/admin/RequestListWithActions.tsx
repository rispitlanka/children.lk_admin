"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import TextArea from "@/components/form/input/TextArea";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import LoadingLottie from "@/components/common/LoadingLottie";
import toast from "react-hot-toast";
import Badge from "@/components/ui/badge/Badge";
import { CheckCircleIcon, CloseLineIcon, EyeIcon } from "@/icons";
import {
  formatAgeAudienceGroups,
  labelContentType,
  labelVisibility,
  taxonomyLine,
} from "@/lib/resource-display";
import { EVENT_CATEGORY_LABELS, type EventCategoryValue } from "@/lib/event-form-constants";

type RequestItem = {
  _id: string;
  status: string;
  adminReason?: string;
  reviewedAt?: string;
  organizationId?: { name: string };
  createdAt: string;
  [key: string]: unknown;
};

export type RequestType = "resource" | "media" | "event" | "super-hero";

type Props = {
  title: string;
  breadcrumb: string;
  requestType: RequestType;
  /** If set, View links to this path + /:id instead of opening modal (e.g. "/admin/resource-requests") */
  detailViewBasePath?: string;
};

function getColumns(requestType: RequestType): { key: string; label: string }[] {
  switch (requestType) {
    case "resource":
      return [
        { key: "name", label: "Title" },
        { key: "contentType", label: "Content type" },
        { key: "organizationId", label: "Organization" },
        { key: "createdAt", label: "Date" },
      ];
    case "media":
      return [
        { key: "name", label: "Name" },
        { key: "organizationId", label: "Organization" },
        { key: "createdAt", label: "Date" },
      ];
    case "event":
      return [
        { key: "name", label: "Name" },
        // { key: "eventCategory", label: "Category" },
        { key: "organizationId", label: "Organization" },
        { key: "createdAt", label: "Date" },
      ];
    case "super-hero":
      return [
        { key: "name", label: "Name" },
        { key: "contactNumber", label: "Contact Number" },
        { key: "organizationId", label: "Organization" },
        { key: "createdAt", label: "Date" },
      ];
    default:
      return [];
  }
}

function getCellValue(row: RequestItem, col: { key: string }): React.ReactNode {
  const key = col.key;
  if (key === "organizationId") return (row.organizationId as { name?: string })?.name ?? "—";
  if (key === "createdAt") return new Date(row.createdAt as string).toLocaleDateString();
  if (key === "categoryId") {
    const cat = row.categoryId as { name?: string } | undefined;
    const sub = row.subCategoryId as { name?: string } | undefined;
    return taxonomyLine(cat ?? null, sub ?? null);
  }
  if (key === "contentType") return labelContentType(row.contentType as string | undefined);
  if (key === "visibilityStatus") return labelVisibility(row.visibilityStatus as string | undefined);
  if (key === "eventCategory") {
    const v = row.eventCategory as string | undefined;
    if (!v?.trim()) return "—";
    return EVENT_CATEGORY_LABELS[v as EventCategoryValue] ?? v;
  }
  return String(row[key] ?? "—");
}

function renderSuperHeroDetail(row: RequestItem, org: { name?: string } | undefined): React.ReactNode {
  const imageContent = row.image
    ? <img src={String(row.image)} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700" />
    : null;
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700">
          {imageContent ?? "—"}
        </div>
        <h3 className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">{String(row.name ?? "—")}</h3>
        {org?.name && (
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{org.name}</p>
        )}
      </div>
      <div className="rounded-xl border border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/30 p-5 space-y-4">
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Contact Number</p>
            <a href={`tel:${row.contactNumber}`} className="mt-1 block font-medium text-gray-900 dark:text-white truncate">
              {String(row.contactNumber ?? "—")}
            </a>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Color</p>
            <span className="mt-1 inline-flex items-center gap-2 font-medium text-gray-900 dark:text-white">
              <span
                className="h-4 w-4 rounded-full border border-gray-300 dark:border-gray-600"
                style={{ backgroundColor: String(row.color ?? "#ffffff") }}
              />
              {String(row.color ?? "—")}
            </span>
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Description</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">{String(row.description ?? "—")}</p>
        </div>
      </div>
    </div>
  );
}

function ModalDocPreview({ doc }: { doc: { url: string; type?: string; name?: string } }) {
  const type = (doc.type || "pdf").toLowerCase();
  const name = doc.name || `Document (${type})`;
  const isImage = type === "image";
  const isVideo = type === "video";
  const isAudio = type === "audio";
  const isPdf = type === "pdf";
  const isEmbeddable = isPdf || isVideo || isAudio;
  return (
    <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900/50 overflow-hidden">
      <div className="px-2 py-1.5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-1">
        <span className="text-xs font-medium text-gray-800 dark:text-white/90 truncate">{name}</span>
        <span className="shrink-0 rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300 capitalize">{type}</span>
      </div>
      <div className="min-h-[80px] bg-gray-50 dark:bg-gray-900/50 flex items-center justify-center">
        {isImage && (
          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="block w-full">
            <img src={doc.url} alt={name} className="h-28 w-full object-cover hover:opacity-95 transition" />
          </a>
        )}
        {isVideo && (
          <div className="w-full p-1">
            <video src={doc.url} controls className="w-full max-h-32 rounded" preload="metadata" />
          </div>
        )}
        {isAudio && (
          <div className="w-full p-2">
            <audio src={doc.url} controls className="w-full max-w-full" />
          </div>
        )}
        {isPdf && (
          <div className="w-full flex flex-col">
            <iframe src={doc.url} title={name} className="w-full h-36 border-0" />
            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="py-1.5 text-center text-xs font-medium text-brand-500 hover:text-brand-600 border-t border-gray-200 dark:border-gray-800">Open</a>
          </div>
        )}
        {!isImage && !isEmbeddable && (
          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center gap-1 p-4 text-gray-500 hover:text-brand-500 dark:text-gray-400 text-xs">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <span className="truncate max-w-[120px]">{name}</span>
          </a>
        )}
      </div>
    </div>
  );
}

function ModalMediaFilePreview({ file }: { file: { url: string; type: string; name?: string } }) {
  const type = file.type || "image";
  const name = file.name || `Media (${type})`;
  return (
    <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900/50 overflow-hidden">
      <div className="px-2 py-1.5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-1">
        <span className="text-xs font-medium text-gray-800 dark:text-white/90 truncate">{name}</span>
        <span className="shrink-0 rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300 capitalize">{type}</span>
      </div>
      <div className="min-h-[80px] bg-gray-50 dark:bg-gray-900/50 flex items-center justify-center">
        {type === "image" && (
          <a href={file.url} target="_blank" rel="noopener noreferrer" className="block w-full">
            <img src={file.url} alt={name} className="h-28 w-full object-cover hover:opacity-95 transition" />
          </a>
        )}
        {type === "video" && (
          <div className="w-full p-1">
            <video src={file.url} controls className="w-full max-h-32 rounded" preload="metadata" />
          </div>
        )}
        {type === "audio" && (
          <div className="w-full p-2">
            <audio src={file.url} controls className="w-full max-w-full" />
          </div>
        )}
      </div>
      <a href={file.url} target="_blank" rel="noopener noreferrer" className="block py-1 text-center text-xs font-medium text-brand-500 hover:text-brand-600 border-t border-gray-200 dark:border-gray-800">Open / download</a>
    </div>
  );
}

function renderDetail(requestType: RequestType, row: RequestItem): React.ReactNode {
  const org = row.organizationId as { name?: string } | undefined;
  switch (requestType) {
    case "resource":
      const docs = Array.isArray(row.documents)
        ? (row.documents as { url: string; type?: string; name?: string; fileFormat?: string; languages?: string[]; fileSizeBytes?: number; isPrimary?: boolean }[])
        : [];
      const cat = row.categoryId as { name?: string } | undefined;
      const sub = row.subCategoryId as { name?: string } | undefined;
      const co = row.coPublisherOrganizationIds as { name?: string }[] | undefined;
      return (
        <div className="space-y-4">
          <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
            <p><strong>Title:</strong> {String(row.name ?? "—")}</p>
            <p><strong>Summary:</strong> {String(row.shortDescription ?? "—")}</p>
            {typeof row.description === "string" && row.description.trim() ? (
              <p><strong>Full description:</strong> {row.description}</p>
            ) : null}
            <p><strong>Organization:</strong> {org?.name ?? "—"}</p>
            <p><strong>Category:</strong> {taxonomyLine(cat ?? null, sub ?? null)}</p>
            <p><strong>Content type:</strong> {labelContentType(row.contentType as string | undefined)}</p>
            <p><strong>Age / audience:</strong> {formatAgeAudienceGroups(row.ageAudienceGroups as string[] | undefined)}</p>
            <p><strong>Visibility:</strong> {labelVisibility(row.visibilityStatus as string | undefined)}</p>
            <p><strong>Featured:</strong> {row.featured === true ? "Yes" : "No"}</p>
            {typeof row.mainPublisherName === "string" && row.mainPublisherName.trim() ? (
              <p><strong>Main publisher:</strong> {row.mainPublisherName}</p>
            ) : null}
            {row.hasCoPublishers === true && co?.length ? (
              <p><strong>Co-publishers:</strong> {co.map((o) => o.name).filter(Boolean).join(", ")}</p>
            ) : null}
            {typeof row.rightsNotice === "string" && row.rightsNotice.trim() ? (
              <p><strong>Rights / ©:</strong> {row.rightsNotice}</p>
            ) : null}
            {Array.isArray(row.countries) && (row.countries as string[]).length > 0 && (
              <p><strong>Countries:</strong> {(row.countries as string[]).join(", ")}</p>
            )}
            {Array.isArray(row.regions) && (row.regions as string[]).length > 0 && (
              <p><strong>Regions:</strong> {(row.regions as string[]).join(", ")}</p>
            )}
            {typeof row.externalDownloadUrl === "string" && row.externalDownloadUrl.trim() ? (
              <p>
                <strong>External URL:</strong>{" "}
                <a href={row.externalDownloadUrl} target="_blank" rel="noopener noreferrer" className="text-brand-500">
                  Link
                </a>
              </p>
            ) : null}
            {typeof row.slug === "string" && row.slug.trim() ? (
              <p><strong>Slug:</strong> {row.slug}</p>
            ) : null}
            <p><strong>Tags:</strong> {Array.isArray(row.tags) ? (row.tags as string[]).join(", ") : "—"}</p>
          </div>
          {(() => {
            const picture = row.picture;
            if (!picture) return null;
            const pictureStr = String(picture).trim();
            if (!pictureStr) return null;
            return (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Cover picture</p>
                <a href={pictureStr} target="_blank" rel="noopener noreferrer" className="block rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden bg-gray-50 dark:bg-gray-900/50">
                  <img src={pictureStr} alt="Cover" className="h-40 w-full object-contain" />
                </a>
                <a href={pictureStr} target="_blank" rel="noopener noreferrer" className="mt-0.5 text-xs font-medium text-brand-500 hover:text-brand-600">Open full size</a>
              </div>
            );
          })()}
          {docs.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Documents &amp; media</p>
              <div className="grid grid-cols-2 gap-2">
                {docs.map((d, i) => (
                  <ModalDocPreview key={i} doc={d} />
                ))}
              </div>
            </div>
          )}
        </div>
      );
    case "media":
      const files = Array.isArray(row.files) ? (row.files as { url: string; type: string; name?: string }[]) : [];
      return (
        <div className="space-y-4">
          <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
            <p><strong>Name:</strong> {String(row.name ?? "—")}</p>
            <p><strong>Description:</strong> {String(row.description ?? "—")}</p>
            <p><strong>Organization:</strong> {org?.name ?? "—"}</p>
          </div>
          {files.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Media files</p>
              <div className="grid grid-cols-2 gap-2">
                {files.map((f, i) => (
                  <ModalMediaFilePreview key={i} file={f} />
                ))}
              </div>
            </div>
          )}
        </div>
      );
    case "event":
      return (
        <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
          <p><strong>Name:</strong> {String(row.name ?? "—")}</p>
          {typeof row.eventCategory === "string" && row.eventCategory.trim() ? (
            <p><strong>Category:</strong> {row.eventCategory}</p>
          ) : null}
          <p><strong>Location (summary):</strong> {String(row.location ?? "—")}</p>
          {typeof row.locationName === "string" && row.locationName.trim() ? (
            <p><strong>Venue name:</strong> {row.locationName}</p>
          ) : null}
          {typeof row.locationAddress === "string" && row.locationAddress.trim() ? (
            <p><strong>Address:</strong> {row.locationAddress}</p>
          ) : null}
          {typeof row.locationContact === "string" && row.locationContact.trim() ? (
            <p><strong>Venue contact:</strong> {row.locationContact}</p>
          ) : null}
          <p><strong>Start:</strong> {row.startDate ? new Date(String(row.startDate)).toLocaleString() : "—"}</p>
          {row.endDate ? (
            <p><strong>End:</strong> {new Date(String(row.endDate)).toLocaleString()}</p>
          ) : null}
          <div>
            <p className="font-medium text-gray-800 dark:text-white/90">Description</p>
            <div
              className="prose prose-sm dark:prose-invert mt-1 max-w-none text-gray-700 dark:text-gray-300"
              dangerouslySetInnerHTML={{ __html: String(row.description ?? "") || "—" }}
            />
          </div>
          {[1, 2, 3].map((n) => {
            const h = row[`highlight${n}` as "highlight1"] as string | undefined;
            if (!h || !String(h).trim()) return null;
            return (
              <p key={n}><strong>Highlight {n}:</strong> {h}</p>
            );
          })}
          <p><strong>Organization:</strong> {org?.name ?? "—"}</p>
          <p><strong>Tags:</strong> {Array.isArray(row.tags) ? (row.tags as string[]).join(", ") : "—"}</p>
          {row.pricingType ? <p><strong>Pricing:</strong> {String(row.pricingType)}</p> : null}
          {row.pricingType === "paid" ? (
            <>
              {Array.isArray(row.ticketOptions) && (row.ticketOptions as { ticketType?: string; ticketPrice?: number }[]).length > 0 ? (
                <p>
                  <strong>Ticket categories:</strong>{" "}
                  {(row.ticketOptions as { ticketType?: string; ticketPrice?: number }[])
                    .map((ticket) => `${ticket.ticketType ?? "—"}: ${ticket.ticketPrice ?? "—"}`)
                    .join(", ")}
                </p>
              ) : (
                <>
                  <p><strong>Ticket type:</strong> {String(row.ticketType ?? "—")}</p>
                  <p><strong>Ticket price:</strong> {String(row.ticketPrice ?? "—")}</p>
                </>
              )}
            </>
          ) : null}
          {row.registrationMode ? <p><strong>Registration mode:</strong> {String(row.registrationMode)}</p> : null}
          {row.registrationMode === "external" && row.registrationExternalUrl ? (
            <p>
              <strong>External registration:</strong>{" "}
              <a href={String(row.registrationExternalUrl)} target="_blank" rel="noopener noreferrer" className="text-brand-500">
                Link
              </a>
            </p>
          ) : null}
          {row.registrationMode === "internal" ? (
            <p>
              <strong>Internal fields:</strong>{" "}
              {Array.isArray(row.internalRegistrationFields)
                ? (row.internalRegistrationFields as string[]).join(", ")
                : "name, email, phone"}
            </p>
          ) : null}
          {Array.isArray(row.whoCanJoin) && (row.whoCanJoin as string[]).length > 0 ? (
            <p><strong>Who can join:</strong> {(row.whoCanJoin as string[]).join(", ")}</p>
          ) : null}
        </div>
      );
    case "super-hero":
      return renderSuperHeroDetail(row, org);
    default:
      return null;
  }
}

function getColumnWidthClass(key: string): string {
  switch (key) {
    case "name":
      return "min-w-[200px]";
    case "contentType":
      return "min-w-[130px]";
    case "contactNumber":
      return "min-w-[140px]";
    case "organizationId":
      return "min-w-[160px]";
    case "createdAt":
      return "w-28";
    default:
      return "";
  }
}

function renderColGroup(requestType: RequestType) {
  switch (requestType) {
    case "resource":
      return (
        <colgroup>
          <col className="w-[30%]" />
          <col className="w-[15%]" />
          <col className="w-[25%]" />
          <col className="w-[10%]" />
          <col className="w-[10%]" />
          <col className="w-[100px]" />
        </colgroup>
      );
    case "media":
    case "event":
      return (
        <colgroup>
          <col className="w-[35%]" />
          <col className="w-[35%]" />
          <col className="w-[10%]" />
          <col className="w-[10%]" />
          <col className="w-[100px]" />
        </colgroup>
      );
    case "super-hero":
      return (
        <colgroup>
          <col className="w-[25%]" />
          <col className="w-[20%]" />
          <col className="w-[25%]" />
          <col className="w-[10%]" />
          <col className="w-[10%]" />
          <col className="w-[100px]" />
        </colgroup>
      );
  }
}

export default function RequestListWithActions({
  title,
  breadcrumb,
  requestType,
  detailViewBasePath,
}: Props) {
  const [list, setList] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<RequestItem | null>(null);
  const [actionStatus, setActionStatus] = useState<"approved" | "denied" | null>(null);
  const [actionModal, setActionModal] = useState(false);
  const [denyReason, setDenyReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchUrl = `/api/admin/${requestType}-requests`;
  const patchUrl = (id: string) => `/api/admin/${requestType}-requests/${id}`;
  const columns = getColumns(requestType);
  const viewHref = detailViewBasePath ? (row: RequestItem) => `${detailViewBasePath}/${row._id}` : null;

  const load = () => {
    fetch(fetchUrl)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setList(Array.isArray(data) ? data : []);
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load is stable relative to requestType; adding it causes infinite re-fetch
  }, [requestType]);

  const openApprove = (row: RequestItem) => {
    setSelected(row);
    setActionStatus("approved");
    setActionModal(true);
    setDenyReason("");
    setError("");
  };

  const openDeny = (row: RequestItem) => {
    setSelected(row);
    setActionStatus("denied");
    setActionModal(true);
    setDenyReason("");
    setError("");
  };

  const submitAction = async () => {
    if (!selected || !actionStatus) return;
    if (actionStatus === "denied" && !denyReason.trim()) {
      setError("Reason is required when denying");
      toast.error("Reason is required when denying");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(patchUrl(selected._id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: actionStatus,
          adminReason: actionStatus === "denied" ? denyReason.trim() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error ?? "Failed";
        setError(msg);
        toast.error(msg);
        setSubmitting(false);
        return;
      }
      setActionModal(false);
      setSelected(null);
      load();
      toast.success(actionStatus === "approved" ? "Request approved" : "Request denied");
    } catch {
      setError("Something went wrong");
      toast.error("Something went wrong");
    }
    setSubmitting(false);
  };

  const statusBadge = (status: string) => {
    if (status === "pending")
      return (
        <span className="inline-flex items-center rounded-[6px] bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
          Pending
        </span>
      );
    if (status === "approved")
      return (
        <span className="inline-flex items-center rounded-[6px] bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          Approved
        </span>
      );
    return (
      <span className="inline-flex items-center rounded-[6px] bg-rose-500/10 px-2.5 py-0.5 text-xs font-medium text-rose-600 dark:text-rose-400">
        Denied
      </span>
    );
  };

  const ghostActionClass =
    "inline-flex h-8 w-8 items-center justify-center rounded-[6px] bg-transparent text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white";

  const filteredList = list.filter((item) => {
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const nameStr = String(item.name ?? "").toLowerCase();
    const orgStr = String((item.organizationId as { name?: string })?.name ?? "").toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || nameStr.includes(searchLower) || orgStr.includes(searchLower);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-8">
      <PageBreadcrumb pageTitle={breadcrumb} />
      <ComponentCard title={title}>
        {loading ? (
          <LoadingLottie variant="block" />
        ) : (
          <div>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10 w-full min-w-[220px] sm:w-64 rounded-[10px] border border-gray-200 bg-white px-3.5 text-xs text-gray-800 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-dark dark:text-white/90 dark:placeholder:text-white/30"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 rounded-[10px] border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-dark dark:text-gray-300"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="denied">Denied</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table className="table-fixed w-full text-left text-theme-sm">
                {renderColGroup(requestType)}
                <TableHeader>
                  <TableRow className="border-b border-gray-200 bg-transparent dark:border-gray-800">
                    {columns.map((col) => (
                      <TableCell key={col.key} isHeader className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        {col.label}
                      </TableCell>
                    ))}
                    <TableCell isHeader className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 text-right">Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredList.map((row) => (
                    <TableRow key={row._id} className="border-b border-gray-200 transition-colors hover:bg-gray-50/60 dark:border-gray-800 dark:hover:bg-white/[0.02]">
                      {columns.map((col) => (
                        <TableCell key={col.key} className="px-4 py-3 text-gray-800 dark:text-white/90">
                          {col.key === "name" ? (
                            <span className="block whitespace-normal line-clamp-3 break-words font-medium" title={String(row.name ?? "")}>
                              {String(row.name ?? "—")}
                            </span>
                          ) : (
                            <span className="block whitespace-normal line-clamp-2 break-words">
                              {getCellValue(row, col)}
                            </span>
                          )}
                        </TableCell>
                      ))}
                      <TableCell className="px-4 py-3">{statusBadge(row.status)}</TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        {viewHref ? (
                          <div className="flex items-center justify-end gap-3">
                            <Link
                              href={viewHref(row)}
                              className={ghostActionClass}
                              aria-label="View request"
                              title="View"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Link>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setSelected(row);
                                setActionModal(false);
                              }}
                              className={ghostActionClass}
                              aria-label="View request"
                              title="View"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            {row.status === "pending" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openApprove(row)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] bg-transparent text-emerald-600 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                                  aria-label="Approve request"
                                  title="Approve"
                                >
                                  <CheckCircleIcon className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openDeny(row)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] bg-transparent text-rose-500 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                                  aria-label="Deny request"
                                  title="Deny"
                                >
                                  <CloseLineIcon className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredList.length === 0 && (
                <div className="py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800/50 text-gray-400 dark:text-gray-600 mb-3">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">No requests found</h4>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">There are no records matching your criteria.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </ComponentCard>

      <Modal
        isOpen={!!selected || actionModal}
        onClose={() => {
          setSelected(null);
          setActionModal(false);
        }}
        className="max-w-2xl w-full border border-gray-200 dark:border-gray-800"
      >
        <div className="max-h-[90vh] overflow-y-auto p-6">
          {selected && (
            <>
              {requestType !== "super-hero" && (
                <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">Request details</h2>
              )}
              <div className={requestType === "super-hero" ? "" : "space-y-4 text-sm text-gray-700 dark:text-gray-300"}>
                {renderDetail(requestType, selected)}
              </div>
              {selected.status === "pending" && actionModal && (
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <h3 className="mb-2 font-medium text-gray-800 dark:text-white/90">
                    {actionStatus === "approved" ? "Approve" : "Deny"} this request
                  </h3>
                  {actionStatus === "denied" && (
                    <div className="mb-3">
                      <Label>Reason for denial *</Label>
                      <TextArea
                        value={denyReason}
                        onChange={(v) => setDenyReason(v)}
                        rows={3}
                        placeholder="Provide a reason for the requester"
                      />
                    </div>
                  )}
                  {error && <p className="mb-2 text-sm text-error-500">{error}</p>}
                  <div className="flex gap-2">
                    <Button size="sm" onClick={submitAction} disabled={submitting}>
                      {submitting ? "Saving..." : "Confirm"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setActionModal(false);
                        setActionStatus(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
              {selected.status !== "pending" && selected.adminReason && (
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  <strong>Admin reason:</strong> {selected.adminReason}
                </p>
              )}
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
