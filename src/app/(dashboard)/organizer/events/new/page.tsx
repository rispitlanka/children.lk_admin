import type { Metadata } from "next";
import AddEventClient from "./AddEventClient";

export const metadata: Metadata = {
  title: "Add Event | Organizer",
  description: "Submit a new event request",
};

export default function AddEventPage() {
  return <AddEventClient />;
}
