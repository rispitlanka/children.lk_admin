import type { Metadata } from "next";
import ResourceRequestDetailClient from "./ResourceRequestDetailClient";

export const metadata: Metadata = {
  title: "Resource Request | Admin",
  description: "View and review resource request",
};

export default function ResourceRequestDetailPage() {
  return <ResourceRequestDetailClient />;
}
