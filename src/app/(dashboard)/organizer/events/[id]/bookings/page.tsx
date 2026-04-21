import type { Metadata } from "next";
import EventBookingsClient from "./EventBookingsClient";

export const metadata: Metadata = {
  title: "Event Bookings | Organizer",
};

export default function EventBookingsPage() {
  return <EventBookingsClient />;
}
