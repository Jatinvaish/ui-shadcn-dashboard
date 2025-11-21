// components/layout/sidebar-secondary.tsx - DYNAMIC WITH MENU SWITCHING
import { SidebarSearch } from "./sidebar-search";
import { Badge } from "@/components/ui/badge";
import { usePathname, useRouter } from "next/navigation";
import { useState, useMemo, useEffect, useCallback, memo } from "react";
import {
  ChevronRight, ShieldAlertIcon, Shield, Key, Users, Menu as MenuIcon,
  ShieldCheck, UserCheck, LayoutDashboard, LockIcon, Settings,
  ChartPie, Building2, Package, FolderKanban, MessageSquare, Brain
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { usePermissionContext } from "@/contexts/permission-context";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLayout } from "./context";

const ICON_MAP: Record<string, any> = {
  Shield, Key, Users, Menu: MenuIcon, ShieldCheck, UserCheck, LayoutDashboard,
  Settings, ChartPie, Building2, Package, FolderKanban, MessageSquare, Brain
};

// Define all menu structures for different sections
const MENU_STRUCTURES: Record<string, any[]> = {
  

  'access-control': [
    {
      key: 'access-control.users',
      title: 'User Management',
      icon: 'Users',
      children: [
        {
          key: 'access-control.users.list',
          title: 'All Users',
          icon: 'Users',
          path: '/dashboard/access-control/users'
        },
      ],
    },
    {
      key: 'access-control.permissions-management',
      title: 'Permissions',
      icon: 'Key',
      children: [
        {
          key: 'access-control.permissions',
          title: 'All Permissions',
          icon: 'Key',
          path: '/dashboard/access-control/permissions'
        },
        {
          key: 'access-control.menu-permissions',
          title: 'Menu Permissions',
          icon: 'Menu',
          path: '/dashboard/access-control/menu-permissions'
        },
      ],
    },
    {
      key: 'access-control.roles',
      title: 'Roles',
      icon: 'Shield',
      path: '/dashboard/access-control/roles',
    },
  ],

   
};

const MenuItem = memo(function MenuItem({ item, pathname, router, canAccessMenu, blockedMenus }: any) {
  const [isOpen, setIsOpen] = useState(false);

  const isBlocked = useCallback((menuKey: string) => {
    return blockedMenus.some((blocked: any) => {
      const key = typeof blocked === 'string' ? blocked : blocked?.menu_key;
      return key === menuKey;
    });
  }, [blockedMenus]);

  const getBlockReason = useCallback((menuKey: string) => {
    const blocked = blockedMenus.find((b: any) => {
      const key = typeof b === 'string' ? b : b?.menu_key;
      return key === menuKey;
    });
    if (blocked && typeof blocked === 'object') {
      return blocked.block_reason || blocked.missing_permissions;
    }
    return null;
  }, [blockedMenus]);

  const accessibleChildren = useMemo(() => {
    if (!item.children) return [];
    return item.children.filter((child: any) =>
      canAccessMenu(child.key) && !isBlocked(child.key)
    );
  }, [item.children, canAccessMenu, isBlocked]);

  const hasSubmenu = accessibleChildren.length > 0;
  const isActive = pathname === item.path;
  const blocked = isBlocked(item.key);
  const blockReason = getBlockReason(item.key);

  useEffect(() => {
    if (hasSubmenu && accessibleChildren.some((child: any) => pathname.startsWith(child.path))) {
      setIsOpen(true);
    }
  }, [pathname, hasSubmenu, accessibleChildren]);

  const IconComponent = ICON_MAP[item.icon] || Shield;

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (blocked) {
      router.push('/dashboard/errors/403');
      return;
    }
    if (canAccessMenu(item.key)) {
      router.push(item.path);
    }
  }, [blocked, canAccessMenu, item.key, item.path, router]);

  if (!canAccessMenu(item.key) && !hasSubmenu) return null;

  if (hasSubmenu) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button className={cn("flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-normal transition-colors hover:bg-primary/10 hover:text-foreground text-foreground")}>
            <IconComponent className="size-4 shrink-0" />
            <span className="flex-1 text-left">{item.title}</span>
            <ChevronRight className={cn("size-4 shrink-0 transition-transform duration-200", isOpen && "rotate-90")} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-1 space-y-1 pl-6">
          {accessibleChildren.map((subItem: any) => (
            <MenuItem
              key={subItem.key}
              item={subItem}
              pathname={pathname}
              router={router}
              canAccessMenu={canAccessMenu}
              blockedMenus={blockedMenus}
            />
          ))}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  if (blocked) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              disabled
              className={cn("flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-normal transition-colors text-muted-foreground cursor-not-allowed opacity-50")}
            >
              <IconComponent className="size-4 shrink-0" />
              <span className="flex-1 text-left">{item.title}</span>
              <LockIcon className="size-3 shrink-0" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <p className="font-semibold text-xs mb-1">Access Restricted</p>
            <p className="text-xs">{blockReason || 'Missing required permissions'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={cn("flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-normal transition-colors hover:bg-primary/10 hover:text-foreground", isActive ? "bg-primary/10 text-foreground font-medium" : "text-foreground")}
    >
      <IconComponent className="size-4 shrink-0" />
      <span className="flex-1 text-left">{item.title}</span>
    </button>
  );
});

export function SidebarSecondary() {
  const pathname = usePathname();
  const router = useRouter();
  const { activeSecondaryMenu } = useLayout();

  const {
    isLoading,
    canAccessMenu,
    isSystemAdmin,
    blockedMenus,
  } = usePermissionContext();

  // Get current menu structure based on active primary menu
  const currentMenuStructure = useMemo(() => {
    return MENU_STRUCTURES[activeSecondaryMenu] || [];
  }, [activeSecondaryMenu]);

  // Build accessible menu structure
  const accessibleMenuStructure = useMemo(() => {
    if (isLoading) return [];

    return currentMenuStructure.map(menu => {
      const accessibleChildren = menu.children?.filter((child: any) =>
        canAccessMenu(child.key)
      ) || [];

      const hasParentAccess = canAccessMenu(menu.key);

      if (hasParentAccess || accessibleChildren.length > 0) {
        return { ...menu, children: accessibleChildren };
      }
      return null;
    }).filter(Boolean);
  }, [isLoading, canAccessMenu, currentMenuStructure]);

  // Get section title
  const sectionTitle = useMemo(() => {
    const titles: Record<string, string> = {
      'dashboard': 'Dashboards',
      'access-control': 'Access Control',
      'apps': 'Applications',
      'ai-apps': 'AI Tools',
      'pages': 'Pages',
      'chat': 'Messages',
    };
    return titles[activeSecondaryMenu] || 'Menu';
  }, [activeSecondaryMenu]);

  // Hide sidebar for chat
  if (activeSecondaryMenu === 'chat') {
    return null;
  }

  // Show loading skeleton
  if (isLoading) {
    return (
      <div className="flex h-full flex-1 flex-col overflow-hidden">
        <div className="shrink-0 pt-2.5"><SidebarSearch /></div>
        <div className="flex-1 overflow-y-auto py-2.5">
          <div className="space-y-2 px-2.5">
            <Skeleton className="h-6 w-32 mb-4" />
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-9 w-full" />)}
          </div>
        </div>
      </div>
    );
  }

  // Show empty state if no accessible menus
  if (accessibleMenuStructure.length === 0) {
    return (
      <div className="flex h-full flex-1 flex-col overflow-hidden">
        <div className="shrink-0 pt-2.5"><SidebarSearch /></div>
        <div className="flex-1 overflow-y-auto py-2.5">
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <ShieldAlertIcon className="size-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">No accessible menus</p>
            <p className="text-xs text-muted-foreground">Contact administrator</p>
          </div>
        </div>
      </div>
    );
  }

  // Render menu
  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <div className="shrink-0 pt-2.5"><SidebarSearch /></div>
      <div className="flex-1 overflow-y-auto py-2.5">
        <div className="space-y-1 px-2.5">
          <div className="text-muted-foreground mb-3 px-2.5 text-xs font-normal flex items-center justify-between">
            {/* <span>{sectionTitle}</span>
            {isSystemAdmin && <Badge variant="outline" size="sm" className="text-[10px]">Admin</Badge>} */}
          </div>
          <div className="space-y-1">
            {accessibleMenuStructure.map((item: any) => (
              <MenuItem
                key={item.key}
                item={item}
                pathname={pathname}
                router={router}
                canAccessMenu={canAccessMenu}
                blockedMenus={blockedMenus}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}