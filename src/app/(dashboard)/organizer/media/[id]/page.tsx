import type { Metadata } from "next";
import MediaViewClient from "./MediaViewClient";

export const metadata: Metadata = {
  title: "Media Details | Organizer",
};

export default function MediaViewPage() {
  return <MediaViewClient />;
}