import type { Metadata } from "next";
import AdminAnnouncementsClient from "./AdminAnnouncementsClient";

export const metadata: Metadata = {
  title: "Announcements | Admin | Children.lk",
  description: "Manage announcements",
};

export default function AdminAnnouncementsPage() {
  return <AdminAnnouncementsClient />;
}
