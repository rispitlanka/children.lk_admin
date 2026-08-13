import type { Metadata } from "next";
import LessonsClient from "./LessonsClient";

export const metadata: Metadata = {
  title: "Course Lessons | Admin",
};

export default function CourseLessonsPage() {
  return <LessonsClient />;
}
