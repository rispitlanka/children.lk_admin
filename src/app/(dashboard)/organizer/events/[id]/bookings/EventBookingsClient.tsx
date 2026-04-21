"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import LoadingLottie from "@/components/common/LoadingLottie";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";

type Booking = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  ticketType?: string;
  ticketPrice?: number;
  createdAt: string;
};

type Payload = {
  event: { _id: string; name: string; slug: string; pricingType: "free" | "paid" };
  total: number;
  bookings: Booking[];
};

export default function EventBookingsClient() {
  const params = useParams();
  const id = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<Payload | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/organizer/event-requests/${id}/bookings`)
      .then((res) => res.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setData(json);
      })
      .catch((e) => {
        setError(e?.message || "Failed to load bookings");
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageBreadcrumb pageTitle="Event Bookings" />
        <Link href={`/organizer/events/${id}`}>
          <Button size="sm" variant="outline">Back to Event</Button>
        </Link>
      </div>

      <ComponentCard title={data ? `${data.event.name} bookings` : "Bookings"}>
        {loading ? (
          <LoadingLottie variant="block" />
        ) : error ? (
          <p className="py-8 text-center text-sm text-error-500">{error}</p>
        ) : !data ? (
          <p className="py-8 text-center text-gray-500 dark:text-gray-400">No data found.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge color="info">Total bookings: {data.total}</Badge>
              <Badge color={data.event.pricingType === "paid" ? "warning" : "success"}>
                Pricing: {data.event.pricingType}
              </Badge>
            </div>
            <div className="overflow-x-auto">
              <Table className="w-full text-left text-theme-sm">
                <TableHeader>
                  <TableRow className="border-b border-gray-200 dark:border-gray-800">
                    <TableCell isHeader className="py-4 font-medium text-gray-700 dark:text-gray-300">Name</TableCell>
                    <TableCell isHeader className="py-4 font-medium text-gray-700 dark:text-gray-300">Email</TableCell>
                    <TableCell isHeader className="py-4 font-medium text-gray-700 dark:text-gray-300">Phone</TableCell>
                    <TableCell isHeader className="py-4 font-medium text-gray-700 dark:text-gray-300">Ticket Type</TableCell>
                    <TableCell isHeader className="py-4 font-medium text-gray-700 dark:text-gray-300">Ticket Price</TableCell>
                    <TableCell isHeader className="py-4 font-medium text-gray-700 dark:text-gray-300">Booked At</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.bookings.map((b) => (
                    <TableRow key={b._id} className="border-b border-gray-200 dark:border-gray-800">
                      <TableCell className="py-4 text-gray-800 dark:text-white/90">{b.name}</TableCell>
                      <TableCell className="py-4 text-gray-600 dark:text-gray-400">{b.email}</TableCell>
                      <TableCell className="py-4 text-gray-600 dark:text-gray-400">{b.phone}</TableCell>
                      <TableCell className="py-4 text-gray-600 dark:text-gray-400">{b.ticketType || "—"}</TableCell>
                      <TableCell className="py-4 text-gray-600 dark:text-gray-400">
                        {typeof b.ticketPrice === "number" ? b.ticketPrice : "—"}
                      </TableCell>
                      <TableCell className="py-4 text-gray-600 dark:text-gray-400">
                        {new Date(b.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {data.bookings.length === 0 && (
                <p className="py-8 text-center text-gray-500 dark:text-gray-400">No bookings yet.</p>
              )}
            </div>
          </div>
        )}
      </ComponentCard>
    </div>
  );
}
