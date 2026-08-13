import type { Metadata } from "next";
import AddCourseClient from "./AddCourseClient";

export const metadata: Metadata = {
  title: "New Course | Admin",
};

export default function AddCoursePage() {
  return <AddCourseClient />;
}
