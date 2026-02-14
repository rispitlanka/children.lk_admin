import type { Metadata } from "next";
import ResourceViewClient from "./ResourceViewClient";

export const metadata: Metadata = {
  title: "Resource Details | Organizer",
};

export default function ResourceViewPage() {
  return <ResourceViewClient />;
}