import type { Metadata } from "next";
import RequestListWithActions from "@/components/admin/RequestListWithActions";

export const metadata: Metadata = {
  title: "Super Hero Requests | Admin",
};

export default function SuperHeroRequestsPage() {
  return (
    <RequestListWithActions
      title="Super Hero Requests"
      breadcrumb="Super Hero Requests"
      requestType="super-hero"
    />
  );
}
