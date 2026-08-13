"use client";

import React, { useEffect, useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import LoadingLottie from "@/components/common/LoadingLottie";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Item = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  createdAt: string;
};

export default function AdminOrganizerRequestsClient() {
  const [list, setList] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/organizer-requests")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setList(Array.isArray(data) ? data : []);
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString();
    } catch {
      return d;
    }
  };

  const [searchTerm, setSearchTerm] = useState("");

  const filteredList = list.filter((row) => {
    const searchLower = searchTerm.toLowerCase();
    const nameStr = row.name.toLowerCase();
    const emailStr = row.email.toLowerCase();
    const messageStr = (row.message ?? "").toLowerCase();
    return !searchTerm || nameStr.includes(searchLower) || emailStr.includes(searchLower) || messageStr.includes(searchLower);
  });

  return (
    <div className="space-y-8">
      <PageBreadcrumb pageTitle="Organizer Requests" />
      <ComponentCard title="Organizer Requests">
        {loading ? (
          <LoadingLottie variant="block" />
        ) : (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <input
                type="text"
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 w-full min-w-[220px] sm:w-64 rounded-[10px] border border-gray-200 bg-white px-3.5 text-xs text-gray-800 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-dark dark:text-white/90 dark:placeholder:text-white/30"
              />
            </div>
            <div className="overflow-x-auto">
              <Table className="table-fixed w-full text-left text-theme-sm">
                <colgroup>
                  <col className="w-[30%]" />
                  <col className="w-[35%]" />
                  <col className="w-[20%]" />
                  <col className="w-[15%]" />
                </colgroup>
                <TableHeader>
                  <TableRow className="border-b border-gray-200 bg-transparent dark:border-gray-800">
                    <TableCell isHeader className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Name</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Email</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Phone</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Date</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredList.map((row) => (
                    <TableRow key={row._id} className="border-b border-gray-200 transition-colors hover:bg-gray-50/60 dark:border-gray-800 dark:hover:bg-white/[0.02]">
                      <TableCell className="px-4 py-3 text-gray-800 dark:text-white/90 font-medium">
                        <span className="block whitespace-normal line-clamp-2 break-words" title={row.name}>{row.name}</span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        <span className="block whitespace-normal line-clamp-2 break-words" title={row.email}>{row.email}</span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.phone ?? "—"}</TableCell>
                      <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-400">{formatDate(row.createdAt)}</TableCell>
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
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">There are no organizer requests matching your criteria.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </ComponentCard>
    </div>
  );
}
