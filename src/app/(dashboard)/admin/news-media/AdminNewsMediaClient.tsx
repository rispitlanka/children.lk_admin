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

  return (
    <div>
      <PageBreadcrumb pageTitle="News Media" />
      <div className="mb-4 flex justify-end">
        <Button onClick={() => router.push("/admin/news-media/new")}>Add News Media</Button>
      </div>
      <ComponentCard title="News Media">
        {loading ? (
          <LoadingLottie variant="block" />
        ) : (
          <div className="overflow-x-auto">
            <Table className="w-full text-left text-theme-sm">
              <TableHeader>
                <TableRow className="border-b border-gray-200 dark:border-gray-800">
                  <TableCell isHeader className="py-4 font-medium text-gray-700 dark:text-gray-300">Image</TableCell>
                  <TableCell isHeader className="py-4 font-medium text-gray-700 dark:text-gray-300">Title</TableCell>
                  <TableCell isHeader className="py-4 font-medium text-gray-700 dark:text-gray-300">Content</TableCell>
                  <TableCell isHeader className="py-4 font-medium text-gray-700 dark:text-gray-300">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((row) => (
                  <TableRow key={row._id} className="border-b border-gray-200 dark:border-gray-800">
                    <TableCell className="py-4">
                      {row.featuredImage ? (
                        <Image src={row.featuredImage} alt={row.title} width={40} height={40} className="rounded-lg object-cover w-10 h-10" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400">No Img</div>
                      )}
                    </TableCell>
                    <TableCell className="py-4 font-medium text-gray-800 dark:text-white/90">{row.title}</TableCell>
                    <TableCell className="py-4 max-w-xs text-gray-600 dark:text-gray-400">
                      <span className="block truncate" title={row.content}>
                        {row.content || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/news-media/${row._id}/edit`}
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
              <p className="py-8 text-center text-gray-500 dark:text-gray-400">No news media yet.</p>
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
