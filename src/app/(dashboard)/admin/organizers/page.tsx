import type { Metadata } from "next";
import AdminOrganizersClient from "./AdminOrganizersClient";

export const metadata: Metadata = {
  title: "Organizers | Admin",
  description: "Manage organizers",
};

export default function AdminOrganizersPage() {
  return <AdminOrganizersClient />;
}
