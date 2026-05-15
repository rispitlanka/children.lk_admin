import React from "react";
import EditNewsMediaClient from "./EditNewsMediaClient";

export const metadata = {
  title: "Edit News Media",
};

export default function EditNewsMediaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <EditNewsMediaClient idPromise={params.then((p) => p.id)} />;
}
