"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardPageSkeleton } from "@/components/common/PageSkeleton";
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
    return <DashboardPageSkeleton />;
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
    <div className="flex flex-col gap-4">
      <div className="rounded-[10px] border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-dark">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
              Organizer Dashboard
            </h1>
            <p className="mt-1 text-sm leading-snug text-gray-500 dark:text-gray-400">
              Track your submissions and manage your organization in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/organizer/resources/new"
              className="inline-flex items-center justify-center rounded-[10px] border border-brand-500 bg-brand-500 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-brand-600 hover:border-brand-600"
            >
              Add Resource
            </Link>
            <Link
              href="/organizer/media/new"
              className="inline-flex items-center justify-center rounded-[10px] border border-brand-500 bg-brand-500 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-brand-600 hover:border-brand-600"
            >
              Add Media
            </Link>
            <Link
              href="/organizer/events/new"
              className="inline-flex items-center justify-center rounded-[10px] border border-brand-500 bg-brand-500 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-brand-600 hover:border-brand-600"
            >
              Add Event
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card) => (
          <Link
            key={card.key}
            href={card.href}
            className="group rounded-[10px] border border-gray-200 bg-white p-5 transition-all hover:border-gray-300 dark:border-gray-800 dark:bg-gray-dark dark:hover:border-gray-700"
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 min-w-0">
                  <span className="shrink-0 text-gray-500 dark:text-gray-400 [&>svg]:size-[18px]">
                    {card.icon}
                  </span>
                  <span className="truncate">{card.label}</span>
                </div>
                <ArrowRightIcon className="size-4 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {card.description(c)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
