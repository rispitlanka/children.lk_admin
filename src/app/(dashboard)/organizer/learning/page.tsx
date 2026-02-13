import type { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Learning | Organizer",
};

export default function OrganizerLearningPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Learning" />
      <div className="flex items-center justify-center rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-white/[0.03]">
        <Image
          src="/images/under-dev/comming-soon.svg"
          alt="Coming Soon"
          width={600}
          height={400}
          className="w-full max-w-2xl h-auto"
          priority
        />
      </div>
    </div>
  );
}
