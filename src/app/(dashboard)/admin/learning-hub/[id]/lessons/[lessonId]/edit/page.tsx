import type { Metadata } from "next";
import EditLessonClient from "./EditLessonClient";

export const metadata: Metadata = {
  title: "Edit Lesson | Admin",
};

export default function EditLessonPage() {
  return <EditLessonClient />;
}
