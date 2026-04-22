import React from "react";

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-200 dark:bg-white/[0.08] ${className}`} />;
}

export function DashboardPageSkeleton() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <SkeletonBlock className="h-7 w-56" />
              <SkeletonBlock className="h-4 w-96 max-w-full" />
            </div>
            <div className="flex flex-wrap gap-2">
              <SkeletonBlock className="h-10 w-28 rounded-lg" />
              <SkeletonBlock className="h-10 w-24 rounded-lg" />
              <SkeletonBlock className="h-10 w-24 rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      <div className="col-span-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 md:gap-6">
        <SkeletonBlock className="h-40 w-full" />
        <SkeletonBlock className="h-40 w-full" />
        <SkeletonBlock className="h-40 w-full" />
        <SkeletonBlock className="h-40 w-full" />
        <SkeletonBlock className="h-40 w-full" />
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
