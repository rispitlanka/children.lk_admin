import type { Metadata } from "next";
import ProfilePage from "@/components/profile/ProfilePage";

export const metadata: Metadata = {
  title: "Profile | Admin",
};

export default function AdminProfilePage() {
  return <ProfilePage />;
}
