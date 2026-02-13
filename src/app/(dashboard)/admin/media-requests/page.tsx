import type { Metadata } from "next";
import RequestListWithActions from "@/components/admin/RequestListWithActions";

export const metadata: Metadata = {
  title: "Media Requests | Admin",
};

export default function MediaRequestsPage() {
  return (
    <RequestListWithActions
      title="Media Requests"
      breadcrumb="Media Requests"
      requestType="media"
      detailViewBasePath="/admin/media-requests"
    />
  );
}
