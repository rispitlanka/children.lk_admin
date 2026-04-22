"use client";

import React from "react";
import { usePathname } from "next/navigation";
import {
  AuthPageSkeleton,
  DashboardPageSkeleton,
  FullWidthPageSkeleton,
} from "@/components/common/PageSkeleton";

type LoadingLottieVariant = "full" | "block" | "inline";

interface LoadingLottieProps {
  /** "full" = centered full viewport, "block" = centered in container with padding, "inline" = small for buttons */
  variant?: LoadingLottieVariant;
  className?: string;
  /** Override size (width/height in px). variant sets default size. */
  size?: number;
}

const variantStyles: Record<
  LoadingLottieVariant,
  { wrapper: string; size: number }
> = {
  full: {
    wrapper: "flex min-h-screen items-center justify-center",
    size: 200,
  },
  block: {
    wrapper: "flex items-center justify-center py-12",
    size: 120,
  },
  inline: {
    wrapper: "inline-flex items-center justify-center",
    size: 32,
  },
};

function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-200 dark:bg-white/[0.08] ${className}`} />;
}

function TablePageSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Pulse className="h-8 w-52" />
        <Pulse className="h-10 w-36" />
      </div>
      <Pulse className="h-11 w-full" />
      <div className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-white/[0.08]">
        <Pulse className="h-10 w-full" />
        <Pulse className="h-10 w-full" />
        <Pulse className="h-10 w-full" />
        <Pulse className="h-10 w-full" />
        <Pulse className="h-10 w-full" />
      </div>
    </div>
  );
}

function FormPageSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <div className="space-y-6 xl:col-span-8">
        <Pulse className="h-10 w-full" />
        <Pulse className="h-56 w-full" />
        <Pulse className="h-56 w-full" />
      </div>
      <div className="space-y-6 xl:col-span-4">
        <Pulse className="h-44 w-full" />
        <Pulse className="h-44 w-full" />
      </div>
    </div>
  );
}

function DetailPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Pulse className="h-8 w-64" />
        <Pulse className="h-10 w-32" />
      </div>
      <Pulse className="h-48 w-full" />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Pulse className="h-52 w-full" />
        <Pulse className="h-52 w-full" />
      </div>
    </div>
  );
}

function getRouteSkeleton(pathname: string | null) {
  const path = pathname ?? "";

  if (path.startsWith("/signin") || path.startsWith("/signup") || path.startsWith("/forgot-password") || path.startsWith("/reset-password")) {
    return <AuthPageSkeleton />;
  }

  if (path.startsWith("/media") || path.startsWith("/request-organizer")) {
    return <FullWidthPageSkeleton />;
  }

  if (path.endsWith("/new") || path.includes("/edit")) {
    return <FormPageSkeleton />;
  }

  if (/\/(resources|media|events|organizers|announcements|requests)\/[^/]+$/.test(path)) {
    return <DetailPageSkeleton />;
  }

  if (
    path.endsWith("/resources") ||
    path.endsWith("/media") ||
    path.endsWith("/events") ||
    path.endsWith("/super-hero") ||
    path.endsWith("/organizers") ||
    path.endsWith("/announcements") ||
    path.endsWith("/resource-requests") ||
    path.endsWith("/media-requests") ||
    path.endsWith("/event-requests") ||
    path.endsWith("/organizer-requests")
  ) {
    return <TablePageSkeleton />;
  }

  return <DashboardPageSkeleton />;
}

export default function LoadingLottie({
  variant = "block",
  className = "",
  size,
}: LoadingLottieProps) {
  const pathname = usePathname();
  const { wrapper, size: defaultSize } = variantStyles[variant];
  const s = size ?? defaultSize;

  if (variant === "inline") {
    return (
      <span className={`${wrapper} ${className}`} aria-hidden="true">
        <span
          className="animate-pulse rounded-md bg-gray-200 dark:bg-white/[0.10]"
          style={{ width: s, height: s }}
        />
      </span>
    );
  }

  return (
    <div className={`${wrapper} ${className}`} aria-hidden="true">
      <div className="w-full max-w-(--breakpoint-2xl)">{getRouteSkeleton(pathname)}</div>
    </div>
  );
}
