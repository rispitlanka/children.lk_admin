"use client";

import React, { useEffect, useState } from "react";
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
  color: string;
  image: string;
  contactNumber: string;
  status: string;
  adminReason?: string;
  createdAt: string;
};

export default function OrganizerSuperHeroClient() {
  const [list, setList] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
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
        {/* <PlusActionLink href="/organizer/super-hero/new" label="Request Super Hero" /> */}
        <Button onClick={() => router.push("/organizer/super-hero/new")}>Request Super Hero</Button>
      </div>
      <ComponentCard title="My super hero requests">
        {loading ? <LoadingLottie variant="block" /> : (
          <div className="overflow-x-auto">
            <Table className="w-full text-left text-theme-sm">
              <TableHeader>
                <TableRow className="border-b border-gray-200 dark:border-gray-800">
                  <TableCell isHeader className="py-4 font-medium text-gray-700 dark:text-gray-300">Name</TableCell>
                  <TableCell isHeader className="py-4 font-medium text-gray-700 dark:text-gray-300">Color</TableCell>
                  <TableCell isHeader className="py-4 font-medium text-gray-700 dark:text-gray-300">Image</TableCell>
                  <TableCell isHeader className="py-4 font-medium text-gray-700 dark:text-gray-300">Contact Number</TableCell>
                  <TableCell isHeader className="py-4 font-medium text-gray-700 dark:text-gray-300">Status</TableCell>
                  <TableCell isHeader className="py-4 font-medium text-gray-700 dark:text-gray-300">Admin message</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((row) => (
                  <TableRow key={row._id} className="border-b border-gray-200 dark:border-gray-800">
                    <TableCell className="py-4 text-gray-800 dark:text-white/90">{row.name}</TableCell>
                    <TableCell className="py-4">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="h-4 w-4 rounded-full border border-gray-300 dark:border-gray-600"
                          style={{ backgroundColor: row.color || "#ffffff" }}
                        />
                        <span className="text-gray-600 dark:text-gray-400">{row.color || "—"}</span>
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      {row.image ? (
                        <img src={row.image} alt="" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="py-4 text-gray-600 dark:text-gray-400">{row.contactNumber}</TableCell>
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
