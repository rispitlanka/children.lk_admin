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

  return (
    <div>
      <PageBreadcrumb pageTitle="Organizers" />
      <div className="mb-4 flex justify-end">
        <Link href="/admin/organizers/new">
          <Button size="sm">
            <PlusIcon className="size-5" />
            Create Organizer
          </Button>
        </Link>
      </div>
      <ComponentCard title="Organizers">
        {loading ? (
          <LoadingLottie variant="block" />
        ) : (
          <div className="overflow-x-auto">
            <Table className="w-full text-left text-theme-sm">
              <TableHeader>
                <TableRow className="border-b border-gray-200 dark:border-gray-800">
                  <TableCell isHeader className="py-4 font-medium text-gray-700 dark:text-gray-300">Name</TableCell>
                  <TableCell isHeader className="py-4 font-medium text-gray-700 dark:text-gray-300">Email</TableCell>
                  <TableCell isHeader className="py-4 font-medium text-gray-700 dark:text-gray-300">Organization</TableCell>
                  <TableCell isHeader className="py-4 font-medium text-gray-700 dark:text-gray-300">Contact</TableCell>
                  <TableCell isHeader className="py-4 font-medium text-gray-700 dark:text-gray-300">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((row) => (
                  <TableRow key={row._id} className="border-b border-gray-200 dark:border-gray-800">
                    <TableCell className="py-4 text-gray-800 dark:text-white/90">{row.name}</TableCell>
                    <TableCell className="py-4 text-gray-600 dark:text-gray-400">{row.email}</TableCell>
                    <TableCell className="py-4 text-gray-600 dark:text-gray-400">
                      {row.organizationId?.name ?? "—"}
                    </TableCell>
                    <TableCell className="py-4 text-gray-600 dark:text-gray-400">
                      {row.organizationId?.contactPhone ?? row.organizationId?.contactEmail ?? "—"}
                    </TableCell>
                    <TableCell className="py-4">
                      <Link href={`/admin/organizers/${row._id}`}>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {list.length === 0 && (
              <p className="py-8 text-center text-gray-500 dark:text-gray-400">No organizers yet.</p>
            )}
          </div>
        )}
      </ComponentCard>
    </div>
  );
}
