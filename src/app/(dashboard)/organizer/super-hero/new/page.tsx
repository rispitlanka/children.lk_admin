import type { Metadata } from "next";
import RequestSuperHeroClient from "./RequestSuperHeroClient";

export const metadata: Metadata = {
  title: "Request Super Hero | Organizer",
  description: "Submit a super hero request",
};

export default function RequestSuperHeroPage() {
  return <RequestSuperHeroClient />;
}
