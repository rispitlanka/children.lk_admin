import type { Metadata } from "next";
import RequestListWithActions from "@/components/admin/RequestListWithActions";

export const metadata: Metadata = {
  title: "Event Requests | Admin",
};

export default function EventRequestsPage() {
  return (
    <RequestListWithActions
      title="Event Requests"
      breadcrumb="Event Requests"
      requestType="event"
      detailViewBasePath="/admin/event-requests"
    />
  );
}
