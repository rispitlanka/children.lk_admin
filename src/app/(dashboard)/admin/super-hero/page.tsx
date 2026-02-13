import type { Metadata } from "next";
import AdminSuperHeroClient from "./AdminSuperHeroClient";

export const metadata: Metadata = {
  title: "Super Hero | Admin",
};

export default function SuperHeroPage() {
  return <AdminSuperHeroClient />;
}
