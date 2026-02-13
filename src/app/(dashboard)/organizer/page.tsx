import type { Metadata } from "next";
import OrganizerDashboard from "@/components/dashboard/OrganizerDashboard";

export const metadata: Metadata = {
  title: "Organizer Dashboard | Children.lk",
  description: "Organizer dashboard",
};

export default function OrganizerDashboardPage() {
  return <OrganizerDashboard />;
}
