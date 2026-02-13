import type { Metadata } from "next";
import MediaRequestDetailClient from "./MediaRequestDetailClient";

export const metadata: Metadata = {
  title: "Media Request | Admin",
  description: "View and review media request",
};

export default function MediaRequestDetailPage() {
  return <MediaRequestDetailClient />;
}
