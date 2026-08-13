"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import ComponentCard from "@/components/common/ComponentCard";
import LoadingLottie from "@/components/common/LoadingLottie";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusIcon } from "@/icons";
import { useRouter } from "next/navigation";
type Organizer = {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  organizationId?: { name: string; contactEmail: string; contactPhone: string };
};

export default function AdminOrganizersClient() {
  const [list, setList] = useState<Organizer[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const load = () => {
    fetch("/api/admin/organizers")
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

  const [searchTerm, setSearchTerm] = useState("");

  const filteredList = list.filter((row) => {
    const searchLower = searchTerm.toLowerCase();
    const nameStr = row.name.toLowerCase();
    const emailStr = row.email.toLowerCase();
    const orgStr = (row.organizationId?.name ?? "").toLowerCase();
    return !searchTerm || nameStr.includes(searchLower) || emailStr.includes(searchLower) || orgStr.includes(searchLower);
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <PageBreadcrumb pageTitle="Organizers" />
        <Link href="/admin/organizers/new">
          <Button size="sm" startIcon={<PlusIcon className="size-4 shrink-0" />}>Create Organizer</Button>
        </Link>
      </div>
      <ComponentCard title="Organizers">
        {loading ? (
          <LoadingLottie variant="block" />
        ) : (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <input
                type="text"
                placeholder="Search organizers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 w-full min-w-[220px] sm:w-64 rounded-[10px] border border-gray-200 bg-white px-3.5 text-xs text-gray-800 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-dark dark:text-white/90 dark:placeholder:text-white/30"
              />
            </div>
            <div className="overflow-x-auto">
              <Table className="table-fixed w-full text-left text-theme-sm">
                <colgroup>
                  <col className="w-[25%]" />
                  <col className="w-[25%]" />
                  <col className="w-[25%]" />
                  <col className="w-[15%]" />
                  <col className="w-[100px]" />
                </colgroup>
                <TableHeader>
                  <TableRow className="border-b border-gray-200 bg-transparent dark:border-gray-800">
                    <TableCell isHeader className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Name</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Email</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Organization</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Contact</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 text-right">Actions</TableCell>
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
                      <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        <span className="block whitespace-normal line-clamp-2 break-words" title={row.organizationId?.name ?? "—"}>
                          {row.organizationId?.name ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {row.organizationId?.contactPhone ?? row.organizationId?.contactEmail ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end">
                          <Link
                            href={`/admin/organizers/${row._id}`}
                            className="inline-flex h-8 items-center justify-center rounded-[6px] bg-transparent px-3 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
                          >
                            View Details
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredList.length === 0 && (
                <div className="py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800/50 text-gray-400 dark:text-gray-600 mb-3">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">No organizers found</h4>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">There are no organizers matching your criteria.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </ComponentCard>
    </div>
  );
}
