import type { Metadata } from "next";
import AddSuperHeroClient from "./AddSuperHeroClient";

export const metadata: Metadata = {
  title: "Add Super Hero | Admin",
  description: "Add a new super hero",
};

export default function AddSuperHeroPage() {
  return <AddSuperHeroClient />;
}
