import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Parent | Children.lk",
  description: "Parent dashboard",
};

export default function ParentDashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90">
        Parent Dashboard
      </h1>
      <p className="text-gray-500 dark:text-gray-400 max-w-md">
        This section is coming soon. You can update your profile in the meantime.
      </p>
    </div>
  );
}
