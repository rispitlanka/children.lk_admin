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

  return (
    <div>
      <PageBreadcrumb pageTitle="Organizer Requests" />
      <ComponentCard title="Organizer Requests">
        {loading ? (
          <LoadingLottie variant="block" />
        ) : (
          <div className="overflow-x-auto">
            <Table className="w-full text-left text-theme-sm">
              <TableHeader>
                <TableRow className="border-b border-gray-200 dark:border-gray-800">
                  <TableCell isHeader className="py-4 font-medium text-gray-700 dark:text-gray-300">Name</TableCell>
                  <TableCell isHeader className="py-4 font-medium text-gray-700 dark:text-gray-300">Email</TableCell>
                  <TableCell isHeader className="py-4 font-medium text-gray-700 dark:text-gray-300">Phone</TableCell>
                  <TableCell isHeader className="py-4 font-medium text-gray-700 dark:text-gray-300">Message</TableCell>
                  <TableCell isHeader className="py-4 font-medium text-gray-700 dark:text-gray-300">Date</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((row) => (
                  <TableRow key={row._id} className="border-b border-gray-200 dark:border-gray-800">
                    <TableCell className="py-4 text-gray-800 dark:text-white/90">{row.name}</TableCell>
                    <TableCell className="py-4 text-gray-600 dark:text-gray-400">{row.email}</TableCell>
                    <TableCell className="py-4 text-gray-600 dark:text-gray-400">{row.phone ?? "—"}</TableCell>
                    <TableCell className="py-4 text-gray-600 dark:text-gray-400 max-w-xs truncate">{row.message ?? "—"}</TableCell>
                    <TableCell className="py-4 text-gray-600 dark:text-gray-400">{formatDate(row.createdAt)}</TableCell>
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
    </div>
  );
}
