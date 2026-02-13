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
        { key: "name", label: "Name" },
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
        { key: "location", label: "Location" },
        { key: "organizationId", label: "Organization" },
        { key: "createdAt", label: "Date" },
      ];
    case "super-hero":
      return [
        { key: "name", label: "Name" },
        { key: "phone", label: "Phone" },
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
  return String(row[key] ?? "—");
}

function renderSuperHeroDetail(row: RequestItem, org: { name?: string } | undefined): React.ReactNode {
  const iconType = row.iconType as string | undefined;
  const isEmoji = iconType === "emoji";
  const iconContent = isEmoji
    ? (row.icon ? <span className="text-4xl">{String(row.icon)}</span> : "—")
    : row.icon
      ? <img src={String(row.icon)} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700" />
      : null;
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700">
          {iconContent ?? "—"}
        </div>
        <h3 className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">{String(row.name ?? "—")}</h3>
        {org?.name && (
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{org.name}</p>
        )}
      </div>
      <div className="rounded-xl border border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/30 p-4 space-y-3">
        <div className="flex justify-between gap-2 text-sm">
          <span className="text-gray-500 dark:text-gray-400">Phone</span>
          <a href={`tel:${row.phone}`} className="font-medium text-gray-900 dark:text-white truncate">{String(row.phone ?? "—")}</a>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Short description</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">{String(row.shortDescription ?? "—")}</p>
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
      const docs = Array.isArray(row.documents) ? (row.documents as { url: string; type?: string; name?: string }[]) : [];
      return (
        <div className="space-y-4">
          <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
            <p><strong>Name:</strong> {String(row.name ?? "—")}</p>
            <p><strong>Description:</strong> {String(row.shortDescription ?? "—")}</p>
            <p><strong>Organization:</strong> {org?.name ?? "—"}</p>
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
        <>
          <p><strong>Name:</strong> {String(row.name ?? "—")}</p>
          <p><strong>Location:</strong> {String(row.location ?? "—")}</p>
          <p><strong>Start:</strong> {row.startDate ? new Date(String(row.startDate)).toLocaleString() : "—"}</p>
          {row.endDate && <p><strong>End:</strong> {new Date(String(row.endDate)).toLocaleString()}</p>}
          <p><strong>Description:</strong> {String(row.description ?? "—")}</p>
          <p><strong>Organization:</strong> {org?.name ?? "—"}</p>
          <p><strong>Tags:</strong> {Array.isArray(row.tags) ? (row.tags as string[]).join(", ") : "—"}</p>
          {row.registrationLink && (
            <p><strong>Registration:</strong> <a href={String(row.registrationLink)} target="_blank" rel="noopener noreferrer" className="text-brand-500">Link</a></p>
          )}
        </>
      );
    case "super-hero":
      return renderSuperHeroDetail(row, org);
    default:
      return null;
  }
}

export default function RequestListWithActions({
  title,
  breadcrumb,
  requestType,
  detailViewBasePath,
}: Props) {
  const fetchUrl = `/api/admin/${requestType}-requests`;
  const patchUrl = (id: string) => `/api/admin/${requestType}-requests/${id}`;
  const columns = getColumns(requestType);
  const viewHref = detailViewBasePath ? (row: RequestItem) => `${detailViewBasePath}/${row._id}` : null;

  const [list, setList] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<RequestItem | null>(null);
  const [actionModal, setActionModal] = useState(false);
  const [denyReason, setDenyReason] = useState("");
  const [actionStatus, setActionStatus] = useState<"approved" | "denied" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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
    if (status === "pending") return <Badge color="warning">Pending</Badge>;
    if (status === "approved") return <Badge color="success">Approved</Badge>;
    return <Badge color="error">Denied</Badge>;
  };

  return (
    <div>
      <PageBreadcrumb pageTitle={breadcrumb} />
      <ComponentCard title={title}>
        {loading ? (
          <LoadingLottie variant="block" />
        ) : (
          <div className="overflow-x-auto">
            <Table className="w-full text-left text-theme-sm">
              <TableHeader>
                <TableRow className="border-b border-gray-200 dark:border-gray-800">
                  {columns.map((col) => (
                    <TableCell key={col.key} isHeader className="py-4 font-medium text-gray-700 dark:text-gray-300">
                      {col.label}
                    </TableCell>
                  ))}
                  <TableCell isHeader className="py-4 font-medium text-gray-700 dark:text-gray-300">Status</TableCell>
                  <TableCell isHeader className="py-4 font-medium text-gray-700 dark:text-gray-300">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((row) => (
                  <TableRow key={row._id} className="border-b border-gray-200 dark:border-gray-800">
                    {columns.map((col) => (
                      <TableCell key={col.key} className="py-4 text-gray-800 dark:text-white/90">
                        {getCellValue(row, col)}
                      </TableCell>
                    ))}
                    <TableCell className="py-4">{statusBadge(row.status)}</TableCell>
                    <TableCell className="py-4">
                      {viewHref ? (
                        <>
                          <Link
                            href={viewHref(row)}
                            className="inline-flex items-center justify-center font-medium rounded-lg transition px-4 py-3 text-sm bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03]"
                          >
                            View
                          </Link>
                          {row.status === "pending" && (
                            <>
                              <Button size="sm" onClick={() => openApprove(row)} className="ml-2">
                                Approve
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => openDeny(row)} className="ml-2">
                                Deny
                              </Button>
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          {row.status === "pending" && (
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => { setSelected(row); setActionModal(false); }}>
                                View
                              </Button>
                              <Button size="sm" onClick={() => openApprove(row)}>
                                Approve
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => openDeny(row)}>
                                Deny
                              </Button>
                            </div>
                          )}
                          {row.status !== "pending" && (
                            <Button size="sm" variant="outline" onClick={() => { setSelected(row); setActionModal(false); }}>
                              View
                            </Button>
                          )}
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {list.length === 0 && (
              <p className="py-8 text-center text-gray-500 dark:text-gray-400">No requests yet.</p>
            )}
          </div>
        )}
      </ComponentCard>

      <Modal
        isOpen={!!selected || actionModal}
        onClose={() => {
          setSelected(null);
          setActionModal(false);
        }}
        className="max-w-md w-full shadow-xl border border-gray-200 dark:border-gray-800"
      >
        <div className="max-h-[90vh] overflow-y-auto p-6">
          {selected && (
            <>
              {requestType !== "super-hero" && (
                <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">Request details</h2>
              )}
              <div className={requestType === "super-hero" ? "" : "space-y-3 text-sm text-gray-700 dark:text-gray-300"}>
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
