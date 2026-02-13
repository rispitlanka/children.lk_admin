import type { Metadata } from "next";
import OrganizerResourcesClient from "./OrganizerResourcesClient";

export const metadata: Metadata = {
  title: "Resources | Organizer",
};

export default function OrganizerResourcesPage() {
  return <OrganizerResourcesClient />;
}
