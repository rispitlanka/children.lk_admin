import type { Metadata } from "next";
import OrganizerMediaClient from "./OrganizerMediaClient";

export const metadata: Metadata = {
  title: "Media | Organizer",
};

export default function OrganizerMediaPage() {
  return <OrganizerMediaClient />;
}
