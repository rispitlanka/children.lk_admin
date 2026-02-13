import type { Metadata } from "next";
import AdminDashboard from "@/components/dashboard/AdminDashboard";

export const metadata: Metadata = {
  title: "Admin Dashboard | Children.lk",
  description: "Admin dashboard",
};

export default function AdminDashboardPage() {
  return <AdminDashboard />;
}
