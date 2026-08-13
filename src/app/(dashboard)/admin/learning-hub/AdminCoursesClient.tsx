"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import ComponentCard from "@/components/common/ComponentCard";
import LoadingLottie from "@/components/common/LoadingLottie";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { Modal } from "@/components/ui/modal";
import Pagination from "@/components/tables/Pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PencilIcon, TrashBinIcon, DocsIcon } from "@/icons";

type CourseItem = {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description?: string;
  coverImage?: string;
  coverImagePublicId?: string;
  tags?: string[];
  ageGroup?: string;
  targetAudience?: string;
  visibilityStatus: "draft" | "published" | "archived";
  lessonCount?: number;
  createdAt: string;
  updatedAt: string;
};

const PAGE_SIZE = 10;

export default function AdminCoursesClient() {
  const [list, setList] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  const load = () => {
    fetch("/api/admin/learning-courses")
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
      const res = await fetch(`/api/admin/learning-courses/${deleteId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setDeleteId(null);
        load();
        toast.success("Course deleted successfully");
      } else {
        toast.error(data.error ?? "Failed to delete course");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleting(false);
    }
  };

  const filteredList = list.filter((row) => {
    const searchLower = searchTerm.toLowerCase();
    const nameStr = (row.name ?? "").toLowerCase();
    const descStr = (row.shortDescription ?? "").toLowerCase();
    const tagsStr = (row.tags ?? []).join(" ").toLowerCase();
    return (
      !searchTerm ||
      nameStr.includes(searchLower) ||
      descStr.includes(searchLower) ||
      tagsStr.includes(searchLower)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const paginatedList = filteredList.slice(
    (validCurrentPage - 1) * PAGE_SIZE,
    validCurrentPage * PAGE_SIZE
  );

  const getBadgeColor = (status: CourseItem["visibilityStatus"]) => {
    switch (status) {
      case "published":
        return "success";
      case "draft":
        return "warning";
      case "archived":
        return "light";
      default:
        return "primary";
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <PageBreadcrumb
          pageTitle="Learning Hub"
          items={[{ name: "Learning Hub" }]}
        />
        <Button onClick={() => router.push("/admin/learning-hub/new")}>
          New Course
        </Button>
      </div>

      <ComponentCard title="Courses">
        {loading ? (
          <LoadingLottie variant="block" />
        ) : (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-10 w-full min-w-[220px] sm:w-64 rounded-[10px] border border-gray-200 bg-white px-3.5 text-xs text-gray-800 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-dark dark:text-white/90 dark:placeholder:text-white/30"
              />
            </div>
            <div className="overflow-x-auto">
              <Table className="table-fixed w-full text-left text-theme-sm">
                <colgroup>
                  <col className="w-[64px]" />
                  <col className="w-[22%]" />
                  <col className="w-[18%]" />
                  <col className="w-[12%]" />
                  <col className="w-[12%]" />
                  <col className="w-[14%]" />
                  <col className="w-[12%]" />
                  <col className="w-[120px]" />
                </colgroup>
                <TableHeader>
                  <TableRow className="border-b border-gray-200 bg-transparent dark:border-gray-800">
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      Cover
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      Name
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      Tags
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      Age Group
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      Lessons
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      Status
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      Updated At
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 text-right"
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedList.map((row) => (
                    <TableRow
                      key={row._id}
                      className="border-b border-gray-200 transition-colors hover:bg-gray-50/60 dark:border-gray-800 dark:hover:bg-white/[0.02]"
                    >
                      <TableCell className="px-4 py-3">
                        {row.coverImage ? (
                          <img
                            src={row.coverImage}
                            alt={row.name}
                            className="h-10 w-12 rounded object-cover"
                          />
                        ) : (
                          <div className="w-12 h-10 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center text-xs text-gray-400">
                            —
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-800 dark:text-white/90 font-medium">
                        <span
                          className="block font-semibold whitespace-normal line-clamp-1 break-words"
                          title={row.name}
                        >
                          {row.name}
                        </span>
                        <span
                          className="block text-xs font-normal text-gray-500 dark:text-gray-400 line-clamp-1"
                          title={row.shortDescription}
                        >
                          {row.shortDescription}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {row.tags && row.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {row.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="inline-block rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[11px] text-gray-600 dark:text-gray-300"
                              >
                                {tag}
                              </span>
                            ))}
                            {row.tags.length > 3 && (
                              <span className="text-[11px] text-gray-400">
                                +{row.tags.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">
                        {row.ageGroup || "—"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">
                        <span className="font-medium text-gray-800 dark:text-white/90">
                          {row.lessonCount ?? 0}
                        </span>{" "}
                        lessons
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge size="sm" color={getBadgeColor(row.visibilityStatus)}>
                          {row.visibilityStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                        {row.updatedAt
                          ? new Date(row.updatedAt).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/learning-hub/${row._id}/lessons`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] bg-transparent text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
                            title="Manage Lessons"
                          >
                            <DocsIcon className="size-4" />
                          </Link>
                          <Link
                            href={`/admin/learning-hub/${row._id}/edit`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] bg-transparent text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
                            title="Edit Course"
                          >
                            <PencilIcon className="size-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(row._id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] bg-transparent text-rose-500 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                            title="Delete Course"
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
                    <DocsIcon className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    No courses found
                  </h4>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    There are no courses matching your criteria.
                  </p>
                </div>
              )}
            </div>
            {filteredList.length > PAGE_SIZE && (
              <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-800">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Showing {(validCurrentPage - 1) * PAGE_SIZE + 1} to{" "}
                  {Math.min(validCurrentPage * PAGE_SIZE, filteredList.length)}{" "}
                  of {filteredList.length} courses
                </span>
                <Pagination
                  currentPage={validCurrentPage}
                  totalPages={totalPages}
                  onPageChange={(p) => setCurrentPage(p)}
                />
              </div>
            )}
          </div>
        )}
      </ComponentCard>

      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        className="max-w-sm w-full border border-gray-200 dark:border-gray-800"
      >
        <div className="p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Delete Course?
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            This action cannot be undone. All lessons in this course will also be deleted.
          </p>
          <div className="mt-6 flex gap-2 justify-center">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDeleteId(null)}
              disabled={deleting}
            >
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
