"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import ComponentCard from "@/components/common/ComponentCard";
import LoadingLottie from "@/components/common/LoadingLottie";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Badge from "@/components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import PlusActionLink from "@/components/common/PlusActionLink";
import Button from "@/components/ui/button/Button";
import { useRouter } from "next/navigation";

type Item = {
  _id: string;
  name: string;
  startDate: string;
  status: string;
  visibilityStatus?: string;
  adminReason?: string;
  createdAt: string;
};

export default function OrganizerEventsClient() {
  const [list, setList] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const load = () => {
    fetch("/api/organizer/event-requests")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setList(Array.isArray(data) ? data : []);
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const statusBadge = (row: Item) => {
    if (row.visibilityStatus === "draft") return <Badge color="info">Draft</Badge>;
    if (row.status === "pending") return <Badge color="warning">Pending review</Badge>;
    if (row.status === "approved") return <Badge color="success">Approved</Badge>;
    return <Badge color="error">Denied</Badge>;
  };

  const canEdit = (row: Item) =>
    row.visibilityStatus === "draft" || row.status === "denied";

  return (
    <div>
      <PageBreadcrumb pageTitle="Events" />
      <div className="mb-4 flex justify-end">
        {/* <PlusActionLink href="/organizer/events/new" label="Add Event" /> */}
        <Button onClick={() => router.push("/organizer/events/new")}>Add Event</Button>
      </div>
      <ComponentCard title="My event requests">
        {loading ? <LoadingLottie variant="block" /> : (
          <div className="overflow-x-auto">
            <Table className="table-fixed w-full text-left text-theme-sm">
              <colgroup>
                <col className="w-[30%]" />
                <col className="w-[20%]" />
                <col className="w-[15%]" />
                <col className="w-[25%]" />
                <col className="w-[100px]" />
              </colgroup>
              <TableHeader>
                <TableRow className="border-b border-gray-200 dark:border-gray-800">
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Name</TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Start</TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Status</TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Admin message</TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300 text-right">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((row) => (
                  <TableRow key={row._id} className="border-b border-gray-200 dark:border-gray-800">
                    <TableCell className="px-4 py-3 text-gray-800 dark:text-white/90 font-medium">
                      <Link
                        href={`/organizer/events/${row._id}`}
                        className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 block whitespace-normal line-clamp-3 break-words"
                        title={row.name}
                      >
                        {row.name}
                      </Link>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.startDate ? new Date(row.startDate).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Colombo" }) : "—"}</TableCell>
                    <TableCell className="px-4 py-3">{statusBadge(row)}</TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {row.status === "denied" && row.adminReason ? (
                        <span className="block whitespace-normal line-clamp-2 break-words" title={row.adminReason}>{row.adminReason}</span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      {canEdit(row) && (
                        <div className="flex items-center justify-end">
                          <Link
                            href={`/organizer/events/new?edit=${row._id}`}
                            className="inline-flex h-8 items-center justify-center rounded-md border border-gray-200 px-3 text-xs font-medium text-gray-700 transition hover:bg-gray-50 hover:text-brand-600 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                          >
                            Edit
                          </Link>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {list.length === 0 && <p className="py-8 text-center text-gray-500 dark:text-gray-400">No event requests yet.</p>}
          </div>
        )}
      </ComponentCard>
    </div>
  );
}
