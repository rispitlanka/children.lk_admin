import type { Metadata } from "next";
import EditCourseClient from "./EditCourseClient";

export const metadata: Metadata = {
  title: "Edit Course | Admin",
};

export default function EditCoursePage() {
  return <EditCourseClient />;
}
