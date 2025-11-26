"use client";

import { LayoutProvider } from "@/components/layout/components/context";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <LayoutProvider
      bodyClassName="overflow-hidden"
      style={{
        '--sidebar-width': '0px',
        '--content-padding': '0px',
      } as React.CSSProperties}
    >
      <div className="fixed inset-0 pt-[var(--header-height)] lg:pl-[var(--sidebar-collapsed-width)]">
        {children}
      </div>
    </LayoutProvider>
  );
}
