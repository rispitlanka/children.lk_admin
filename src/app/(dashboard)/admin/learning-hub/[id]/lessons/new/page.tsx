import type { Metadata } from "next";
import AddLessonClient from "../AddLessonClient";

export const metadata: Metadata = {
  title: "Add Lesson | Admin",
};

export default function AddLessonPage() {
  return <AddLessonClient />;
}
