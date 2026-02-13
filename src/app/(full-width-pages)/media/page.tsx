import type { Metadata } from "next";
import PublicMediaClient from "@/components/public/PublicMediaClient";

export const metadata: Metadata = {
  title: "Media | Children.lk",
  description: "Public media gallery",
};

export default function PublicMediaPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
          Media
        </h1>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Approved media from organizers.
        </p>
        <PublicMediaClient />
      </div>
    </div>
  );
}
