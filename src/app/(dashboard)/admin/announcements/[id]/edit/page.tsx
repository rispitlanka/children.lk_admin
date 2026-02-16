import type { Metadata } from "next";
import EditAnnouncementClient from "./EditAnnouncementClient";

export const metadata: Metadata = {
  title: "Edit Announcement | Admin | Children.lk",
  description: "Edit announcement",
};

export default function EditAnnouncementPage() {
  return <EditAnnouncementClient />;
}
