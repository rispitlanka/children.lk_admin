import type { Metadata } from "next";
import CreateOrganizerClient from "./CreateOrganizerClient";

export const metadata: Metadata = {
  title: "Create Organizer | Admin",
  description: "Create a new organizer",
};

export default function CreateOrganizerPage() {
  return <CreateOrganizerClient />;
}
