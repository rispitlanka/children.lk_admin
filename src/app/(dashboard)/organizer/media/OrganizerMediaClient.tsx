"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import ComponentCard from "@/components/common/ComponentCard";
import LoadingLottie from "@/components/common/LoadingLottie";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Badge from "@/components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import PlusActionLink from "@/components/common/PlusActionLink";

type Item = {
  _id: string;
  name: string;
  description: string;
  status: string;
  visibilityStatus?: "draft" | "published" | "archived";
  contentType?: "artwork" | "story_poem" | "video" | string;
  adminReason?: string;
  createdAt: string;
};

export default function OrganizerMediaClient() {
  const [list, setList] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch("/api/organizer/media-requests")
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
  }, []);

  const statusBadge = (row: Item) => {
    if (row.visibilityStatus === "draft") return <Badge color="info">Draft</Badge>;
    if (row.visibilityStatus === "archived") return <Badge color="warning">Archived</Badge>;
    if (row.status === "pending") return <Badge color="warning">Pending</Badge>;
    if (row.status === "approved") return <Badge color="success">Approved</Badge>;
    return <Badge color="error">Denied</Badge>;
  };

  const contentTypeLabel = (row: Item) => {
    if (row.contentType === "artwork") return "Artwork";
    if (row.contentType === "story_poem") return "Story / Poem";
    if (row.contentType === "video") return "Video";
    return "Media";
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Media" />
      <div className="mb-4 flex justify-end">
        <PlusActionLink href="/organizer/media/new" label="Add Media" />
      </div>
      <ComponentCard title="My media requests">
        {loading ? (
          <LoadingLottie variant="block" />
        ) : (
          <div className="overflow-x-auto">
            <Table className="w-full text-left text-theme-sm">
              <TableHeader>
                <TableRow className="border-b border-gray-200 dark:border-gray-800">
                  <TableCell isHeader className="py-4 font-medium text-gray-700 dark:text-gray-300">Name</TableCell>
                  <TableCell isHeader className="py-4 font-medium text-gray-700 dark:text-gray-300">Type</TableCell>
                  <TableCell isHeader className="py-4 font-medium text-gray-700 dark:text-gray-300">Status</TableCell>
                  <TableCell isHeader className="py-4 font-medium text-gray-700 dark:text-gray-300">Admin message</TableCell>
                  <TableCell isHeader className="py-4 font-medium text-gray-700 dark:text-gray-300">Date</TableCell>
                  <TableCell isHeader className="py-4 font-medium text-gray-700 dark:text-gray-300">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((row) => (
                  <TableRow key={row._id} className="border-b border-gray-200 dark:border-gray-800">
                    <TableCell className="py-4 text-gray-800 dark:text-white/90">
                      <Link 
                        href={`/organizer/media/${row._id}`}
                        className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-medium"
                      >
                        {row.name}
                      </Link>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge color={row.contentType === "video" ? "success" : "info"} size="sm">
                        {contentTypeLabel(row)}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">{statusBadge(row)}</TableCell>
                    <TableCell className="py-4 max-w-[280px] text-sm text-gray-600 dark:text-gray-400">
                      {row.status === "denied" && row.adminReason ? (
                        <span className="block" title={row.adminReason}>{row.adminReason}</span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="py-4 text-gray-600 dark:text-gray-400">
                      {new Date(row.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="py-4">
                      {row.visibilityStatus === "draft" && (
                        <Link
                          href={`/organizer/media/new?edit=${row._id}`}
                          className="inline-flex rounded-md border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 hover:text-brand-600 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          Edit
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {list.length === 0 && (
              <p className="py-8 text-center text-gray-500 dark:text-gray-400">No media requests yet.</p>
            )}
          </div>
        )}
      </ComponentCard>
    </div>
  );
}
