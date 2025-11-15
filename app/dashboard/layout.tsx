// app/dashboard/layout.tsx - STREAMLINED VERSION
"use client";

import React from "react";
import { RouteGuard } from "@/components/guards/route-guard";
import { Layout14 } from "@/components/layout";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // No initialization logic here - parent handles it
  // Just wrap in layout and route guard
  
  return (
    <Layout14>
      <RouteGuard>
        {children}
      </RouteGuard>
    </Layout14>
  );
}