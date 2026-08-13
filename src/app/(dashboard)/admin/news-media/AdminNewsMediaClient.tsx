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
import Switch from "@/components/form/switch/Switch";
import { PencilIcon, TrashBinIcon } from "@/icons";
import { useRouter } from "next/navigation";
import Image from "next/image";

type NewsMediaItem = {
  _id: string;
  title: string;
  content: string;
  featuredImage?: string;
  files?: string[];
  createdAt: string;
  updatedAt: string;
};

export default function AdminNewsMediaClient() {
  const [list, setList] = useState<NewsMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const load = () => {
    fetch("/api/admin/news-media")
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
      const res = await fetch(`/api/admin/news-media/${deleteId}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setDeleteId(null);
        load();
        toast.success("News Media deleted");
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
    const titleStr = row.title.toLowerCase();
    const contentStr = (row.content ?? "").toLowerCase();
    return !searchTerm || titleStr.includes(searchLower) || contentStr.includes(searchLower);
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <PageBreadcrumb pageTitle="News Media" />
        <Button onClick={() => router.push("/admin/news-media/new")}>Add News Media</Button>
      </div>
      <ComponentCard title="News Media">
        {loading ? (
          <LoadingLottie variant="block" />
        ) : (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <input
                type="text"
                placeholder="Search news media..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 w-full min-w-[220px] sm:w-64 rounded-[10px] border border-gray-200 bg-white px-3.5 text-xs text-gray-800 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-dark dark:text-white/90 dark:placeholder:text-white/30"
              />
            </div>
            <div className="overflow-x-auto">
              <Table className="table-fixed w-full text-left text-theme-sm">
                <colgroup>
                  <col className="w-[90px]" />
                  <col className="w-auto" />
                  <col className="w-[100px]" />
                </colgroup>
                <TableHeader>
                  <TableRow className="border-b border-gray-200 bg-transparent dark:border-gray-800">
                    <TableCell isHeader className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Image</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Title</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 text-right">Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredList.map((row) => (
                    <TableRow key={row._id} className="border-b border-gray-200 transition-colors hover:bg-gray-50/60 dark:border-gray-800 dark:hover:bg-white/[0.02]">
                      <TableCell className="px-4 py-3">
                        {row.featuredImage ? (
                          <Image src={row.featuredImage} alt={row.title} width={64} height={64} className="rounded-xl object-cover w-16 h-16 aspect-square shrink-0" />
                        ) : (
                          <div className="w-16 h-16 aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-xs text-gray-400 shrink-0">No Img</div>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 font-medium text-gray-800 dark:text-white/90">
                        <span className="block whitespace-normal line-clamp-3 break-words" title={row.title}>{row.title}</span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/admin/news-media/${row._id}/edit`}
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">No news media found</h4>
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
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Delete News Media?</h3>
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
