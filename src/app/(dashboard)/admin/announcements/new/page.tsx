import type { Metadata } from "next";
import AddAnnouncementClient from "./AddAnnouncementClient";

export const metadata: Metadata = {
  title: "Add Announcement | Admin | Children.lk",
  description: "Add a new announcement",
};

export default function AddAnnouncementPage() {
  return <AddAnnouncementClient />;
}
