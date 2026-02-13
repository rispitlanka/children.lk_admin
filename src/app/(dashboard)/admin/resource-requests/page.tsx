import type { Metadata } from "next";
import RequestListWithActions from "@/components/admin/RequestListWithActions";

export const metadata: Metadata = {
  title: "Resource Requests | Admin",
};

export default function ResourceRequestsPage() {
  return (
    <RequestListWithActions
      title="Resource Requests"
      breadcrumb="Resource Requests"
      requestType="resource"
      detailViewBasePath="/admin/resource-requests"
    />
  );
}
