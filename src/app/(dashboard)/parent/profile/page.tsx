import type { Metadata } from "next";
import ProfilePage from "@/components/profile/ProfilePage";

export const metadata: Metadata = {
  title: "Profile | Parent",
};

export default function ParentProfilePage() {
  return <ProfilePage />;
}
