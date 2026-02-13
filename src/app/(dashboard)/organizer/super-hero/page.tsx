import type { Metadata } from "next";
import OrganizerSuperHeroClient from "./OrganizerSuperHeroClient";

export const metadata: Metadata = {
  title: "Super Hero | Organizer",
};

export default function OrganizerSuperHeroPage() {
  return <OrganizerSuperHeroClient />;
}
