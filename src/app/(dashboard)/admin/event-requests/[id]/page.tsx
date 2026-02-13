import type { Metadata } from "next";
import EventRequestDetailClient from "./EventRequestDetailClient";

export const metadata: Metadata = {
  title: "Event Request | Admin",
  description: "View and review event request",
};

export default function EventRequestDetailPage() {
  return <EventRequestDetailClient />;
}
