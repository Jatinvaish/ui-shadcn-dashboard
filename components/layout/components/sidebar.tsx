// sidebar.tsx - CONDITIONAL SECONDARY SIDEBAR
import { SidebarPrimary } from "./sidebar-primary";
import { SidebarSecondary } from "./sidebar-secondary";
import { useLayout } from "./context";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { showSecondarySidebar, isSidebarOpen } = useLayout();

  return (
    <aside 
      className={cn(
        "fixed top-[var(--header-height)] left-0 bottom-0 z-20 flex items-stretch transition-all duration-300 border-e border-border bg-background",
        showSecondarySidebar 
          ? "w-[var(--sidebar-width)] in-data-[sidebar-open=false]:w-[var(--sidebar-collapsed-width)]"
          : "w-[var(--sidebar-collapsed-width)]"
      )}
    >
      <SidebarPrimary />
      {showSecondarySidebar && <SidebarSecondary />}
    </aside>
  );
}