import type { Metadata } from "next";
import AddResourceClient from "./AddResourceClient";

export const metadata: Metadata = {
  title: "Add Resource | Organizer",
  description: "Submit a new resource request",
};

export default function AddResourcePage() {
  return <AddResourceClient />;
}
