import type { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

export const metadata: Metadata = {
  title: "Learning | Organizer",
};

export default function OrganizerLearningPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Learning" />
      <div className="rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-white/[0.03] text-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">Coming Soon</h2>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Learning section is under development.</p>
      </div>
    </div>
  );
}
