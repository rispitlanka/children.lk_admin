"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import LoadingLottie from "@/components/common/LoadingLottie";
import {
  DocsIcon,
  VideoIcon,
  CalenderIcon,
  ShootingStarIcon,
  UserCircleIcon,
  ListIcon,
  ArrowRightIcon,
} from "@/icons";

type Stats = {
  resourceRequests: number;
  mediaRequests: number;
  eventRequests: number;
  superHeroRequests: number;
  organizerRequests: number;
};

const cards: { key: keyof Stats; label: string; href: string; icon: React.ReactNode }[] = [
  { key: "resourceRequests", label: "Resource Requests", href: "/admin/resource-requests", icon: <DocsIcon /> },
  { key: "mediaRequests", label: "Media Requests", href: "/admin/media-requests", icon: <VideoIcon /> },
  { key: "eventRequests", label: "Event Requests", href: "/admin/event-requests", icon: <CalenderIcon /> },
  { key: "superHeroRequests", label: "Super Hero Requests", href: "/admin/super-hero-requests", icon: <ShootingStarIcon /> },
  { key: "organizerRequests", label: "Organizer Requests", href: "/admin/organizer-requests", icon: <ListIcon /> },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard-stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setStats(data);
      })
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <LoadingLottie variant="block" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-semibold text-gray-800 text-title-sm dark:text-white/90">
                Admin Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Review pending requests and jump to the most-used admin areas.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/organizers"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-800 transition hover:bg-gray-200 dark:bg-gray-800 dark:text-white/90 dark:hover:bg-gray-700"
              >
                <UserCircleIcon className="size-5" />
                Organizers
              </Link>
              <Link
                href="/admin/super-hero"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-800 transition hover:bg-gray-200 dark:bg-gray-800 dark:text-white/90 dark:hover:bg-gray-700"
              >
                <ShootingStarIcon className="size-5" />
                Super Heroes
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="col-span-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 md:gap-6">
        {cards.map(({ key, label, href, icon }) => (
          <Link
            key={key}
            href={href}
            className="rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-brand-300 hover:shadow-sm dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-700 md:p-6"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800">
              <span className="text-gray-800 dark:text-white/90 [&>svg]:size-6">
                {icon}
              </span>
            </div>
            <div className="mt-5 flex items-end justify-between">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {label}
                </span>
                <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                  {stats ? stats[key] : "—"}
                </h4>
              </div>
              <ArrowRightIcon className="mb-1 size-5 text-gray-400" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
