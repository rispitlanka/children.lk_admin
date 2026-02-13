import type { Metadata } from "next";
import OrganizerEventsClient from "./OrganizerEventsClient";

export const metadata: Metadata = {
  title: "Events | Organizer",
};

export default function OrganizerEventsPage() {
  return <OrganizerEventsClient />;
}
