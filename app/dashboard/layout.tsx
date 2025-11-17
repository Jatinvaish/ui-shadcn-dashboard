// ============================================
// FILE 3: app/dashboard/layout.tsx - WRAPS WITH PROVIDER
// ============================================
"use client";

import React from "react";
import { RouteGuard } from "@/components/guards/route-guard";
import { Layout14 } from "@/components/layout";
import { RbacErrorBoundary } from "@/components/guards/rbac-error-boundary";
import { PermissionProvider } from "@/contexts/permission-context";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionProvider>
      <Layout14>
        <RbacErrorBoundary>
          {/* <RouteGuard> */}
            {children}
          {/* </RouteGuard> */}
        </RbacErrorBoundary>
      </Layout14>
    </PermissionProvider>
  );
}