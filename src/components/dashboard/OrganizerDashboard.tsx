"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import LoadingLottie from "@/components/common/LoadingLottie";
import {
  DocsIcon,
  VideoIcon,
  CalenderIcon,
  ShootingStarIcon,
  ArrowRightIcon,
  UserCircleIcon,
} from "@/icons";

type Counts = {
  resourcesPending: number;
  resourcesApproved: number;
  mediaPending: number;
  mediaApproved: number;
  eventsPending: number;
  eventsApproved: number;
  superHeroPending: number;
  superHeroApproved: number;
};

const cards: {
  key: "organization" | "resources" | "media" | "events" | "superHero";
  label: string;
  href: string;
  icon: React.ReactNode;
  description: (c: Counts) => string;
}[] = [
  {
    key: "organization",
    label: "Organization",
    href: "/organizer/organization",
    icon: <UserCircleIcon className="size-6" />,
    description: () => "Update your organization profile",
  },
  {
    key: "resources",
    label: "Resources",
    href: "/organizer/resources",
    icon: <DocsIcon className="size-6" />,
    description: (c) => `Pending: ${c.resourcesPending} · Approved: ${c.resourcesApproved}`,
  },
  {
    key: "media",
    label: "Media",
    href: "/organizer/media",
    icon: <VideoIcon className="size-6" />,
    description: (c) => `Pending: ${c.mediaPending} · Approved: ${c.mediaApproved}`,
  },
  {
    key: "events",
    label: "Events",
    href: "/organizer/events",
    icon: <CalenderIcon className="size-6" />,
    description: (c) => `Pending: ${c.eventsPending} · Approved: ${c.eventsApproved}`,
  },
  {
    key: "superHero",
    label: "Super Heroes",
    href: "/organizer/super-hero",
    icon: <ShootingStarIcon className="size-6" />,
    description: (c) => `Pending: ${c.superHeroPending} · Approved: ${c.superHeroApproved}`,
  },
];

export default function OrganizerDashboard() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/organizer/dashboard-stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setCounts(data);
      })
      .catch(() => setCounts(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <LoadingLottie variant="block" />
      </div>
    );
  }

  const c = counts ?? {
    resourcesPending: 0,
    resourcesApproved: 0,
    mediaPending: 0,
    mediaApproved: 0,
    eventsPending: 0,
    eventsApproved: 0,
    superHeroPending: 0,
    superHeroApproved: 0,
  };

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-semibold text-gray-800 text-title-sm dark:text-white/90">
                Organizer Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Track your submissions and manage your organization in one place.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/organizer/resources/new"
                className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
              >
                Add Resource
              </Link>
              <Link
                href="/organizer/media/new"
                className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
              >
                Add Media
              </Link>
              <Link
                href="/organizer/events/new"
                className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
              >
                Add Event
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="col-span-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 md:gap-6">
        {cards.map((card) => (
          <Link
            key={card.key}
            href={card.href}
            className="rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-brand-300 hover:shadow-sm dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-700 md:p-6"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800">
              <span className="text-gray-800 dark:text-white/90 [&>svg]:size-6">
                {card.icon}
              </span>
            </div>
            <div className="mt-5 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {card.label}
                </span>
                <p className="mt-2 font-medium text-gray-800 dark:text-white/90 truncate">
                  {card.description(c)}
                </p>
              </div>
              <ArrowRightIcon className="size-5 text-gray-400 shrink-0" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
