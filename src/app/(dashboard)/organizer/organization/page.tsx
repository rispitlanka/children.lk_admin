import type { Metadata } from "next";
import OrganizerOrganizationClient from "./OrganizerOrganizationClient";

export const metadata: Metadata = {
  title: "Organization | Organizer",
};

export default function OrganizerOrganizationPage() {
  return <OrganizerOrganizationClient />;
}
