import type { Metadata } from "next";
import ProfilePage from "@/components/profile/ProfilePage";

export const metadata: Metadata = {
  title: "Profile | Organizer",
};

export default function OrganizerProfilePage() {
  return <ProfilePage />;
}
