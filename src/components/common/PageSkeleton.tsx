import React from "react";

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-200 dark:bg-white/[0.08] ${className}`} />;
}

export function DashboardPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <SkeletonBlock className="h-8 w-56" />
        <SkeletonBlock className="h-4 w-80 max-w-full" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SkeletonBlock className="h-28 w-full" />
        <SkeletonBlock className="h-28 w-full" />
        <SkeletonBlock className="h-28 w-full" />
        <SkeletonBlock className="h-28 w-full" />
      </div>

      <SkeletonBlock className="h-80 w-full" />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SkeletonBlock className="h-64 w-full" />
        <SkeletonBlock className="h-64 w-full" />
      </div>
    </div>
  );
}

export function FullWidthPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-(--breakpoint-2xl) space-y-6 p-4 md:p-6">
      <div className="space-y-3">
        <SkeletonBlock className="h-8 w-64" />
        <SkeletonBlock className="h-4 w-96 max-w-full" />
      </div>
      <SkeletonBlock className="h-64 w-full" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SkeletonBlock className="h-40 w-full" />
        <SkeletonBlock className="h-40 w-full" />
        <SkeletonBlock className="h-40 w-full" />
      </div>
    </div>
  );
}

export function AuthPageSkeleton() {
  return (
    <div className="relative flex h-screen w-full flex-col justify-center bg-white p-6 dark:bg-gray-900 sm:p-0 lg:flex-row">
      <div className="mx-auto w-full max-w-md space-y-4 rounded-2xl border border-gray-200 p-6 dark:border-white/10">
        <SkeletonBlock className="h-8 w-40" />
        <SkeletonBlock className="h-4 w-64 max-w-full" />
        <SkeletonBlock className="h-11 w-full" />
        <SkeletonBlock className="h-11 w-full" />
        <SkeletonBlock className="h-11 w-full" />
      </div>
      <div className="hidden h-full w-1/2 bg-brand-950/90 lg:block" />
    </div>
  );
}
