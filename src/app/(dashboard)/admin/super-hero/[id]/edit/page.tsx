import type { Metadata } from "next";
import EditSuperHeroClient from "./EditSuperHeroClient";

export const metadata: Metadata = {
  title: "Edit Super Hero | Admin",
  description: "Edit super hero",
};

export default function EditSuperHeroPage() {
  return <EditSuperHeroClient />;
}
