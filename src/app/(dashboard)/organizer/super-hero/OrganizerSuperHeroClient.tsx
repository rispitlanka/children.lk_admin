"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import ComponentCard from "@/components/common/ComponentCard";
import LoadingLottie from "@/components/common/LoadingLottie";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Badge from "@/components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { PlusIcon } from "@/icons";

type Item = { _id: string; name: string; icon: string; iconType: string; phone: string; status: string; adminReason?: string; createdAt: string };

export default function OrganizerSuperHeroClient() {
  const [list, setList] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch("/api/organizer/super-hero-requests")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setList(Array.isArray(data) ? data : []);
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const statusBadge = (s: string) => {
    if (s === "pending") return <Badge color="warning">Pending</Badge>;
    if (s === "approved") return <Badge color="success">Approved</Badge>;
    return <Badge color="error">Denied</Badge>;
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Super Hero" />
      <div className="mb-4 flex justify-end">
        <Link
          href="/organizer/super-hero/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
        >
          <PlusIcon className="size-5" /> Request Super Hero
        </Link>
      </div>
      <ComponentCard title="My super hero requests">
        {loading ? <LoadingLottie variant="block" /> : (
          <div className="overflow-x-auto">
            <Table className="w-full text-left text-theme-sm">
              <TableHeader>
                <TableRow className="border-b border-gray-200 dark:border-gray-800">
                  <TableCell isHeader className="py-4 font-medium text-gray-700 dark:text-gray-300">Name</TableCell>
                  <TableCell isHeader className="py-4 font-medium text-gray-700 dark:text-gray-300">Icon</TableCell>
                  <TableCell isHeader className="py-4 font-medium text-gray-700 dark:text-gray-300">Phone</TableCell>
                  <TableCell isHeader className="py-4 font-medium text-gray-700 dark:text-gray-300">Status</TableCell>
                  <TableCell isHeader className="py-4 font-medium text-gray-700 dark:text-gray-300">Admin message</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((row) => (
                  <TableRow key={row._id} className="border-b border-gray-200 dark:border-gray-800">
                    <TableCell className="py-4 text-gray-800 dark:text-white/90">{row.name}</TableCell>
                    <TableCell className="py-4">
                      {row.iconType === "image" && row.icon ? (
                        <img src={row.icon} alt="" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <span className="text-xl">{row.icon}</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4 text-gray-600 dark:text-gray-400">{row.phone}</TableCell>
                    <TableCell className="py-4">{statusBadge(row.status)}</TableCell>
                    <TableCell className="py-4 max-w-[280px] text-sm text-gray-600 dark:text-gray-400">
                      {row.status === "denied" && row.adminReason ? (
                        <span className="block" title={row.adminReason}>{row.adminReason}</span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {list.length === 0 && <p className="py-8 text-center text-gray-500 dark:text-gray-400">No super hero requests yet.</p>}
          </div>
        )}
      </ComponentCard>
    </div>
  );
}
