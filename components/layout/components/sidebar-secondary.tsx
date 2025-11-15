// components/layout/sidebar-secondary.tsx - COMPLETE WITH BLOCKED MENU HANDLING
import { SidebarSearch } from "./sidebar-search";
import { Badge } from "@/components/ui/badge";
import { usePathname, useRouter } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { ChevronRight, ShieldAlertIcon, Shield, Key, Users, Menu as MenuIcon, ShieldCheck, UserCheck, LayoutDashboard, Loader2, LockIcon } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useMenuPermissions } from "@/hooks/use-menu-permissions";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const ICON_MAP: Record<string, any> = {
  Shield, Key, Users, Menu: MenuIcon, ShieldCheck, UserCheck, LayoutDashboard
};

const MENU_STRUCTURE = [
  {
    key: 'dashboard',
    title: 'Dashboard',
    icon: 'LayoutDashboard',
    path: '/dashboard',
  },
  {
    key: 'access-control',
    title: 'Access Control',
    icon: 'Shield',
    path: '/dashboard/access-control',
    children: [
      { key: 'access-control.roles', title: 'Roles', icon: 'Shield', path: '/dashboard/access-control/roles' },
      { key: 'access-control.permissions', title: 'Permissions', icon: 'Key', path: '/dashboard/access-control/permissions' },
      { key: 'access-control.role-permissions', title: 'Role Permissions', icon: 'ShieldCheck', path: '/dashboard/access-control/role-permissions' },
      { key: 'access-control.user-roles', title: 'User Roles', icon: 'UserCheck', path: '/dashboard/access-control/user-roles' },
      { key: 'access-control.menu-permissions', title: 'Menu Permissions', icon: 'Menu', path: '/dashboard/access-control/menu-permissions' },
      { key: 'access-control.attributes', title: 'Attributes', icon: 'Shield', path: '/dashboard/access-control/attributes' },
      { key: 'access-control.policies', title: 'Policies', icon: 'Shield', path: '/dashboard/access-control/policies' },
      { key: 'access-control.policy-evaluation', title: 'Policy Evaluation', icon: 'Shield', path: '/dashboard/access-control/policy-evaluation' },
      { key: 'access-control.resource-attributes', title: 'Resource Attributes', icon: 'Shield', path: '/dashboard/access-control/resource-attributes' },
    ],
  },
];

function MenuItem({ item, pathname, router, canAccessMenu, isBlocked, getBlockReason }: any) {
  const [isOpen, setIsOpen] = useState(false);
  
  const accessibleChildren = useMemo(() => {
    if (!item.children) return [];
    return item.children.filter((child: any) => {
      const hasAccess = canAccessMenu(child.key);
      const blocked = isBlocked(child.key);
      return hasAccess && !blocked;
    });
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

  if (!canAccessMenu(item.key) && !hasSubmenu) return null;

  const handleClick = (e: React.MouseEvent, path: string, key: string) => {
    e.preventDefault();
    if (isBlocked(key)) {
      router.push('/dashboard/errors/403');
      return;
    }
    if (canAccessMenu(key)) {
      router.push(path);
    }
  };

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
          {accessibleChildren.map((subItem: any, idx: number) => (
            <MenuItem key={idx} item={subItem} pathname={pathname} router={router} canAccessMenu={canAccessMenu} isBlocked={isBlocked} getBlockReason={getBlockReason} />
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
      onClick={(e) => handleClick(e, item.path, item.key)}
      className={cn("flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-normal transition-colors hover:bg-primary/10 hover:text-foreground", isActive ? "bg-primary/10 text-foreground font-medium" : "text-foreground")}
    >
      <IconComponent className="size-4 shrink-0" />
      <span className="flex-1 text-left">{item.title}</span>
    </button>
  );
}

export function SidebarSecondary() {
  const pathname = usePathname();
  const router = useRouter();
  
  const { loading, isInitialized, canAccessMenu, isSystemAdmin, accessibleMenus, blockedMenus } = useMenuPermissions();

  const isBlocked = (menuKey: string) => {
    return blockedMenus.some(blocked => {
      const key = typeof blocked === 'string' ? blocked : blocked.menu_key;
      return key === menuKey;
    });
  };

  const getBlockReason = (menuKey: string) => {
    const blocked = blockedMenus.find(b => {
      const key = typeof b === 'string' ? b : b.menu_key;
      return key === menuKey;
    });
    if (blocked && typeof blocked === 'object') {
      return blocked.block_reason || blocked.missing_permissions;
    }
    return null;
  };

  const accessibleMenuStructure = useMemo(() => {
    if (!isInitialized) return [];

    return MENU_STRUCTURE.map(menu => {
      const accessibleChildren = menu.children?.filter((child: any) => {
        const hasAccess = canAccessMenu(child.key);
        return hasAccess; // Show all accessible, blocked will be shown disabled
      }) || [];

      const hasParentAccess = canAccessMenu(menu.key);

      if (hasParentAccess || accessibleChildren.length > 0) {
        return { ...menu, children: accessibleChildren };
      }
      return null;
    }).filter(Boolean);
  }, [isInitialized, canAccessMenu]);

  const currentMenuSection = useMemo(() => {
    if (accessibleMenuStructure.length === 0) return null;
    const accessControl = accessibleMenuStructure.find((m: any) => m?.key === 'access-control');
    return accessControl || accessibleMenuStructure[0];
  }, [accessibleMenuStructure]);

  if (loading || !isInitialized) {
    return (
      <div className="flex h-full flex-1 flex-col overflow-hidden">
        <div className="shrink-0 pt-2.5"><SidebarSearch /></div>
        <div className="flex-1 overflow-y-auto py-2.5">
          <div className="space-y-2 px-2.5">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-9 w-full" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!currentMenuSection) {
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

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <div className="shrink-0 pt-2.5"><SidebarSearch /></div>
      <div className="flex-1 overflow-y-auto py-2.5">
        <div className="space-y-1 px-2.5">
          <div className="text-muted-foreground mb-3 px-2.5 text-xs font-normal flex items-center justify-between">
            <span>{currentMenuSection.title}</span>
            {isSystemAdmin && <Badge variant="outline" size="sm" className="text-[10px]">Admin</Badge>}
          </div>
          {currentMenuSection.children ? (
            <div className="space-y-1">
              {currentMenuSection.children.map((item: any, idx: number) => (
                <MenuItem key={idx} item={item} pathname={pathname} router={router} canAccessMenu={canAccessMenu} isBlocked={isBlocked} getBlockReason={getBlockReason} />
              ))}
            </div>
          ) : (
            <MenuItem item={currentMenuSection} pathname={pathname} router={router} canAccessMenu={canAccessMenu} isBlocked={isBlocked} getBlockReason={getBlockReason} />
          )}
        </div>
      </div>
    </div>
  );
}