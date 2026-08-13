"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import ComponentCard from "@/components/common/ComponentCard";
import LoadingLottie from "@/components/common/LoadingLottie";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Badge from "@/components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PlusActionLink from "@/components/common/PlusActionLink";
import { EyeIcon } from "@/icons";
import { labelContentType, labelVisibility, taxonomyLine } from "@/lib/resource-display";
import Button from "@/components/ui/button/Button";
import { useRouter } from "next/navigation";
type PopulatedName = { _id?: string; name?: string };

type Item = {
  _id: string;
  name: string;
  shortDescription: string;
  status: string;
  adminReason?: string;
  createdAt: string;
  contentType?: string;
  visibilityStatus?: string;
  featured?: boolean;
  categoryId?: PopulatedName | string;
  subCategoryId?: PopulatedName | string;
};

export default function OrganizerResourcesClient() {
  const [list, setList] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const load = () => {
    fetch("/api/organizer/resource-requests")
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

  const statusBadge = (row: Item) => {
    if (row.visibilityStatus === "draft") return <Badge color="info">Draft</Badge>;
    if (row.visibilityStatus === "archived") return <Badge color="warning">Archived</Badge>;
    if (row.status === "pending") return <Badge color="warning">Pending review</Badge>;
    if (row.status === "approved") return <Badge color="success">Approved</Badge>;
    return <Badge color="error">Denied</Badge>;
  };

  const categoryCell = (row: Item) => {
    const cat = typeof row.categoryId === "object" && row.categoryId ? row.categoryId : null;
    const sub = typeof row.subCategoryId === "object" && row.subCategoryId ? row.subCategoryId : null;
    return taxonomyLine(cat, sub);
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Resources" />
      <div className="mb-4 flex justify-end">
        {/* <PlusActionLink href="/organizer/resources/new" label="Add Resource" /> */}
        <Button onClick={() => router.push("/organizer/resources/new")}>Add Resource</Button>
      </div>
      <ComponentCard title="My resource requests">
        {loading ? (
          <LoadingLottie variant="block" />
        ) : (
          <div className="overflow-x-auto">
            <Table className="table-fixed w-full text-left text-theme-sm">
              <colgroup>
                <col className="w-[25%]" />
                <col className="w-[18%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
                <col className="w-[13%]" />
                <col className="w-[20%]" />
                <col className="w-[10%]" />
                <col className="w-[100px]" />
              </colgroup>
              <TableHeader>
                <TableRow className="border-b border-gray-200 dark:border-gray-800">
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                    Title
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                    Category
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                    Content type
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                    Visibility
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                    Review
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                    Admin message
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                    Submitted
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300 text-right">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((row) => (
                  <TableRow key={row._id} className="border-b border-gray-200 dark:border-gray-800">
                    <TableCell className="px-4 py-3 text-gray-800 dark:text-white/90">
                      <div className="flex flex-col gap-1">
                        <Link
                          href={`/organizer/resources/${row._id}`}
                          className="block whitespace-normal line-clamp-3 break-words font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                          title={row.name}
                        >
                          {row.name}
                        </Link>
                        {row.featured && (
                          <Badge color="warning" size="sm">
                            Featured
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      <span className="block whitespace-normal line-clamp-2 break-words">{categoryCell(row)}</span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {labelContentType(row.contentType)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {labelVisibility(row.visibilityStatus)}
                    </TableCell>
                    <TableCell className="px-4 py-3">{statusBadge(row)}</TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {row.status === "denied" && row.adminReason ? (
                        <span className="block whitespace-normal line-clamp-2 break-words" title={row.adminReason}>
                          {row.adminReason}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {new Date(row.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/organizer/resources/${row._id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                          aria-label="View resource request"
                          title="View"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        {(row.visibilityStatus === "draft" || row.visibilityStatus === "archived") && (
                          <Link
                            href={`/organizer/resources/new?edit=${row._id}`}
                            className="inline-flex h-8 items-center justify-center rounded-md border border-gray-200 px-3 text-xs font-medium text-gray-700 transition hover:bg-gray-50 hover:text-brand-600 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                          >
                            Edit
                          </Link>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {list.length === 0 && (
              <p className="py-8 text-center text-gray-500 dark:text-gray-400">No resource requests yet.</p>
            )}
          </div>
        )}
      </ComponentCard>
    </div>
  );
}
