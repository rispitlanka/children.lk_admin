import type { Metadata } from "next";
import AddMediaClient from "./AddMediaClient";

export const metadata: Metadata = {
  title: "Add Media | Organizer",
  description: "Submit a new media request",
};

export default function AddMediaPage() {
  return <AddMediaClient />;
}
