import type { Metadata } from "next";
import RequestOrganizerForm from "@/components/public/RequestOrganizerForm";

export const metadata: Metadata = {
  title: "Request to become an Organizer | Children.lk",
  description: "Submit your request to become an organizer",
};

export default function RequestOrganizerPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-md mx-auto">
        <h1 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
          Request to become an Organizer
        </h1>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Fill in your details. An admin will review organizer requests.
        </p>
        <RequestOrganizerForm />
      </div>
    </div>
  );
}
