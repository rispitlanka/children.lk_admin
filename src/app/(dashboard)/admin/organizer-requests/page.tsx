import type { Metadata } from "next";
import AdminOrganizerRequestsClient from "./AdminOrganizerRequestsClient";

export const metadata: Metadata = {
  title: "Organizer Requests | Admin",
  description: "View organizer requests",
};

export default function AdminOrganizerRequestsPage() {
  return <AdminOrganizerRequestsClient />;
}
