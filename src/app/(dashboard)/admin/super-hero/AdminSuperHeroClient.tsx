"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import ComponentCard from "@/components/common/ComponentCard";
import LoadingLottie from "@/components/common/LoadingLottie";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusIcon, PencilIcon, TrashBinIcon } from "@/icons";

type SuperHeroItem = {
  _id: string;
  name: string;
  icon: string;
  iconType: string;
  iconPublicId?: string;
  phone: string;
  shortDescription: string;
  organizationId?: { name: string };
};

export default function AdminSuperHeroClient() {
  const [list, setList] = useState<SuperHeroItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    fetch("/api/admin/super-hero")
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

  const handleDeleteClick = (id: string) => setDeleteId(id);
  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/super-hero/${deleteId}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setDeleteId(null);
        load();
        toast.success("Super hero deleted");
      } else {
        toast.error(data.error ?? "Failed to delete");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Super Hero" />
      <div className="mb-4 flex justify-end">
        <Link
          href="/admin/super-hero/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
        >
          <PlusIcon className="size-5" />
          Add Super Hero
        </Link>
      </div>
      <ComponentCard title="Super Heroes">
        {loading ? (
          <LoadingLottie variant="block" />
        ) : (
          <div className="overflow-x-auto">
            <Table className="w-full text-left text-theme-sm">
              <TableHeader>
                <TableRow className="border-b border-gray-200 dark:border-gray-800">
                  <TableCell isHeader className="py-4 font-medium text-gray-700 dark:text-gray-300">Name</TableCell>
                  <TableCell isHeader className="py-4 font-medium text-gray-700 dark:text-gray-300">Icon</TableCell>
                  <TableCell isHeader className="py-4 font-medium text-gray-700 dark:text-gray-300">Phone</TableCell>
                  <TableCell isHeader className="py-4 font-medium text-gray-700 dark:text-gray-300">Organization</TableCell>
                  <TableCell isHeader className="py-4 font-medium text-gray-700 dark:text-gray-300">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((row) => (
                  <TableRow key={row._id} className="border-b border-gray-200 dark:border-gray-800">
                    <TableCell className="py-4 text-gray-800 dark:text-white/90">{row.name}</TableCell>
                    <TableCell className="py-4">
                      {row.iconType === "image" && row.icon ? (
                        <img src={row.icon} alt="" className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <span className="text-2xl">{row.icon}</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4 text-gray-600 dark:text-gray-400">{row.phone}</TableCell>
                    <TableCell className="py-4 text-gray-600 dark:text-gray-400">{row.organizationId?.name ?? "—"}</TableCell>
                    <TableCell className="py-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/super-hero/${row._id}/edit`}
                          className="inline-flex items-center justify-center font-medium rounded-lg transition px-4 py-3 text-sm bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03]"
                        >
                          <PencilIcon className="size-4" />
                        </Link>
                        <Button size="sm" variant="outline" onClick={() => handleDeleteClick(row._id)}>
                          <TrashBinIcon className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {list.length === 0 && (
              <p className="py-8 text-center text-gray-500 dark:text-gray-400">No super heroes yet.</p>
            )}
          </div>
        )}
      </ComponentCard>

      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        className="max-w-sm w-full shadow-xl border border-gray-200 dark:border-gray-800"
      >
        <div className="p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Delete Super Hero?</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">This action cannot be undone.</p>
          <div className="mt-6 flex gap-2 justify-center">
            <Button size="sm" variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleDeleteConfirm} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
