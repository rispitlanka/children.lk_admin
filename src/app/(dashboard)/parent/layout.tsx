"use client";

import AppHeader from "@/layout/AppHeader";
import React from "react";

export default function ParentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <AppHeader profileBasePath="/parent" />
      <div className="p-6 mx-auto max-w-(--breakpoint-2xl)">{children}</div>
    </div>
  );
}
