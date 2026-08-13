import type { Metadata } from "next";
import AdminCoursesClient from "./AdminCoursesClient";

export const metadata: Metadata = {
  title: "Learning Hub - Courses | Admin",
};

export default function LearningHubPage() {
  return <AdminCoursesClient />;
}
