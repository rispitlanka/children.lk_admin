import type { Metadata } from "next";
import EventViewClient from "./EventViewClient";

export const metadata: Metadata = {
  title: "Event Details | Organizer",
};

export default function EventViewPage() {
  return <EventViewClient />;
}