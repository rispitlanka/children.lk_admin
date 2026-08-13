"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import ComponentCard from "@/components/common/ComponentCard";
import PlusActionLink from "@/components/common/PlusActionLink";
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
import { PencilIcon, TrashBinIcon } from "@/icons";
import { useRouter } from "next/navigation";
type SuperHeroItem = {
  _id: string;
  name: string;
  color: string;
  contactNumber: string;
  image: string;
  imagePublicId?: string;
  description: string;
  organizationId?: { name: string };
};

export default function AdminSuperHeroClient() {
  const [list, setList] = useState<SuperHeroItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
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

  const [searchTerm, setSearchTerm] = useState("");

  const filteredList = list.filter((row) => {
    const searchLower = searchTerm.toLowerCase();
    const nameStr = row.name.toLowerCase();
    const orgStr = (row.organizationId?.name ?? "").toLowerCase();
    const contactStr = (row.contactNumber ?? "").toLowerCase();
    return !searchTerm || nameStr.includes(searchLower) || orgStr.includes(searchLower) || contactStr.includes(searchLower);
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <PageBreadcrumb pageTitle="Super Hero" />
        <Button onClick={() => router.push("/admin/super-hero/new")}>Add Super Hero</Button>
      </div>
      <ComponentCard title="Super Heroes">
        {loading ? (
          <LoadingLottie variant="block" />
        ) : (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <input
                type="text"
                placeholder="Search super heroes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 w-full min-w-[220px] sm:w-64 rounded-[10px] border border-gray-200 bg-white px-3.5 text-xs text-gray-800 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-dark dark:text-white/90 dark:placeholder:text-white/30"
              />
            </div>
            <div className="overflow-x-auto">
              <Table className="table-fixed w-full text-left text-theme-sm">
                <colgroup>
                  <col className="w-[56px]" />
                  <col className="w-[25%]" />
                  <col className="w-[15%]" />
                  <col className="w-[20%]" />
                  <col className="w-[25%]" />
                  <col className="w-[100px]" />
                </colgroup>
                <TableHeader>
                  <TableRow className="border-b border-gray-200 bg-transparent dark:border-gray-800">
                    <TableCell isHeader className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Image</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Name</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Color</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Contact Number</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Organization</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 text-right">Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredList.map((row) => (
                    <TableRow key={row._id} className="border-b border-gray-200 transition-colors hover:bg-gray-50/60 dark:border-gray-800 dark:hover:bg-white/[0.02]">
                      <TableCell className="px-4 py-3">
                        {row.image ? (
                          <img src={row.image} alt="" className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-xs text-gray-400">—</div>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-800 dark:text-white/90 font-medium">
                        <span className="block whitespace-normal line-clamp-2 break-words" title={row.name}>{row.name}</span>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="h-4 w-4 rounded-full border border-gray-300 dark:border-gray-600 shrink-0"
                            style={{ backgroundColor: row.color || "#ffffff" }}
                          />
                          <span className="text-gray-600 dark:text-gray-400">{row.color || "—"}</span>
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.contactNumber}</TableCell>
                      <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        <span className="block whitespace-normal line-clamp-2 break-words" title={row.organizationId?.name ?? "—"}>{row.organizationId?.name ?? "—"}</span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/admin/super-hero/${row._id}/edit`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] bg-transparent text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
                            title="Edit"
                          >
                            <PencilIcon className="size-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(row._id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] bg-transparent text-rose-500 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                            title="Delete"
                          >
                            <TrashBinIcon className="size-4" />
                          </button>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">No super heroes found</h4>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">There are no records matching your criteria.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </ComponentCard>

      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        className="max-w-sm w-full border border-gray-200 dark:border-gray-800"
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
