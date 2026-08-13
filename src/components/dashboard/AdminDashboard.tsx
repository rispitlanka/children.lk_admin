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
    <div className="flex flex-col gap-8">
      <div className="rounded-[10px] border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-dark">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
              Admin Dashboard
            </h1>
            <p className="mt-1 text-sm leading-snug text-gray-500 dark:text-gray-400">
              Review pending requests and jump to the most-used admin areas.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/organizers"
              className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-gray-200 bg-transparent px-3.5 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-100 dark:border-gray-800 dark:text-white dark:hover:bg-white/5"
            >
              <UserCircleIcon className="size-4 text-gray-500 dark:text-gray-400" />
              Organizers
            </Link>
            <Link
              href="/admin/super-hero"
              className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-gray-200 bg-transparent px-3.5 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-100 dark:border-gray-800 dark:text-white dark:hover:bg-white/5"
            >
              <ShootingStarIcon className="size-4 text-gray-500 dark:text-gray-400" />
              Super Heroes
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {cards.map(({ key, label, href, icon }) => (
          <Link
            key={key}
            href={href}
            className="group rounded-[10px] border border-gray-200 bg-white p-5 transition-all hover:border-gray-300 dark:border-gray-800 dark:bg-gray-dark dark:hover:border-gray-700"
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 min-w-0">
                  <span className="shrink-0 text-gray-500 dark:text-gray-400 [&>svg]:size-[18px]">
                    {icon}
                  </span>
                  <span className="truncate">{label}</span>
                </div>
                <ArrowRightIcon className="size-4 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
              </div>
              <div className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white">
                {stats ? stats[key] : "—"}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
