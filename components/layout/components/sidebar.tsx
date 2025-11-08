

// sidebar.tsx
import { SidebarPrimary } from "./sidebar-primary";
import { SidebarSecondary } from "./sidebar-secondary";

export function Sidebar() {
  return (
    <aside className="fixed top-[var(--header-height)] left-0 bottom-0 z-20 flex items-stretch transition-all duration-300 w-[var(--sidebar-width)] in-data-[sidebar-open=false]:w-[var(--sidebar-collapsed-width)] border-e border-border bg-background">
      <SidebarPrimary />
      <SidebarSecondary />
    </aside>
  );
}
