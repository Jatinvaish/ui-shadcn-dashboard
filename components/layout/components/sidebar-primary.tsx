// components/layout/sidebar-primary.tsx - WITH SECONDARY SIDEBAR FLAG
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Clock,
  Shield,
  Building2,
  LogOut,
  Download,
  ExternalLink,
  Zap,
  Target,
  ChartPieIcon,
  SquareKanbanIcon,
  MessageSquareIcon,
  BrainIcon,
  UsersIcon,
  ClipboardMinusIcon,
  User,
  Settings,
  Users,
  Mails,
  NotepadText,
  Bell,
  LockIcon
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarIndicator,
  AvatarStatus
} from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { usePathname, useRouter } from "next/navigation";
import { useLayout } from "./context";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout, selectUser } from "@/store/slices/authSlice";
import { toast } from "sonner";
import { toAbsoluteUrl } from "@/lib/helpers";
import { usePermissionContext } from "@/contexts/permission-context";

const menuItems = [
  {
    id: "dashboards",
    icon: ChartPieIcon,
    tooltip: "Dashboards",
    path: "/dashboard",
    rootPath: "/dashboard",
    showSecondarySidebar: false, // Flag to control secondary sidebar visibility
    menuKey: "dashboards" // Permission key for access control
  },
  {
    id: "access-control",
    icon: Shield,
    tooltip: "Access Control",
    path: "/dashboard/access-control",
    rootPath: "/dashboard/access-control",
    showSecondarySidebar: true, // Flag to control secondary sidebar visibility
    menuKey: "access-control" // Permission key for access control
  },
  {
    id: "chat",
    icon: MessageSquareIcon,
    tooltip: "Chat",
    path: "/dashboard/chat",
    rootPath: "/dashboard/chat",
    showSecondarySidebar: false, // Flag to control secondary sidebar visibility
    menuKey: "chat" // Permission key for access control
  }
];

export function SidebarPrimary() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { activeSecondaryMenu, setActiveSecondaryMenu, setShowSecondarySidebar } = useLayout();
  const [selectedMenuItem, setSelectedMenuItem] = useState(menuItems[0]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const user = useAppSelector(selectUser);

  const { isLoading, canAccessMenu, isSystemAdmin, blockedMenus } = usePermissionContext();

  useEffect(() => {
    menuItems.forEach((item) => {
      if (item.rootPath === pathname || (item.rootPath && pathname.includes(item.rootPath))) {
        setSelectedMenuItem(item);
        setActiveSecondaryMenu(item.id);
        setShowSecondarySidebar(item.showSecondarySidebar);
      }
    });
  }, [pathname, setActiveSecondaryMenu, setShowSecondarySidebar]);

  const isBlocked = (menuKey: string) => {
    return blockedMenus.some((blocked: any) => {
      const key = typeof blocked === "string" ? blocked : blocked?.menu_key;
      return key === menuKey;
    });
  };

  const getBlockReason = (menuKey: string) => {
    const blocked = blockedMenus.find((b: any) => {
      const key = typeof b === "string" ? b : b?.menu_key;
      return key === menuKey;
    });
    if (blocked && typeof blocked === "object") {
      return blocked.block_reason || blocked.missing_permissions;
    }
    return "Missing required permissions";
  };

  const handleMenuClick = (item: (typeof menuItems)[0]) => {
    // Check if menu is blocked
    if (isBlocked(item.menuKey)) {
      router.push("/dashboard/errors/403");
      return;
    }

    // Check if user has access to the menu
    // if (!canAccessMenu(item.menuKey)) {
    //   toast.error("You don't have permission to access this section");
    //   return;
    // }

    setSelectedMenuItem(item);
    setActiveSecondaryMenu(item.id);
    setShowSecondarySidebar(item.showSecondarySidebar);

    // If showSecondarySidebar is false, navigate directly to the path
    if (!item.showSecondarySidebar && item.path && item.path !== "#") {
      router.push(item.path);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await dispatch(logout()).unwrap();
      toast.success("Logged out successfully");
      router.push("/sign-in");
    } catch (error: any) {
      toast.error(error || "Logout failed");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  const displayName = user?.firstName || "User";
  const displayEmail = user?.email || "user@example.com";
  const initials = getInitials(user?.firstName || user?.firstName, user?.email);
  const userRole = user?.userType || user?.user_type || "User";

  return (
    <div className="border-input bg-muted flex shrink-0 flex-col items-center justify-center gap-5 border-0 px-2.5 py-2.5 lg:w-[var(--sidebar-collapsed-width)]">
      {/* Navigation */}
      <ScrollArea className="h-[calc(100vh-13rem)] w-full grow lg:h-[calc(100vh-5.5rem)]">
        <div className="flex shrink-0 grow flex-col items-center gap-1">
          {menuItems.map((item, index) => {
            // const blocked = isBlocked(item.menuKey);
            const blocked = false;
            // const hasAccess = canAccessMenu(item.menuKey);
            // const blockReason = getBlockReason(item.menuKey);

            // If blocked, show with lock icon and tooltip
            if (blocked) {
              return (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      mode="icon"
                      disabled
                      className={cn(
                        "relative size-9 shrink-0 cursor-not-allowed rounded-md opacity-50",
                        "hover:text-muted-foreground"
                      )}>
                      <item.icon className="size-4.5!" />
                      <LockIcon className="text-destructive absolute right-0 bottom-0 size-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="mb-1 text-xs font-semibold">Access Restricted</p>
                    {/* <p className="text-xs">{blockReason}</p> */}
                  </TooltipContent>
                </Tooltip>
              );
            }

            // If no access but not blocked, don't show the menu item
            // if (!hasAccess && !isSystemAdmin) {
            //   return null;
            // }

            // Normal accessible menu item
            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    mode="icon"
                    onClick={() => handleMenuClick(item)}
                    {...(item.id === activeSecondaryMenu ? { "data-state": "open" } : {})}
                    className={cn(
                      "size-9 shrink-0 rounded-md",
                      "data-[state=open]:bg-primary data-[state=open]:text-primary-foreground",
                      "hover:text-foreground"
                    )}>
                    <item.icon className="size-4.5!" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">{item.tooltip}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="flex shrink-0 flex-col items-center gap-2.5">
        <Button variant="ghost" mode="icon" className="text-muted-foreground hover:text-foreground">
          <Mails className="opacity-100" />
        </Button>

        <Button variant="ghost" mode="icon" className="text-muted-foreground hover:text-foreground">
          <NotepadText className="opacity-100" />
        </Button>

        <Button variant="ghost" mode="icon" className="text-muted-foreground hover:text-foreground">
          <Settings className="opacity-100" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger className="mb-2.5 cursor-pointer">
            <Avatar className="size-7">
              <AvatarImage src={toAbsoluteUrl("/media/avatars/300-2.png")} alt="User" />
              <AvatarFallback>{initials}</AvatarFallback>
              <AvatarIndicator className="-end-2 -top-2">
                <AvatarStatus variant="online" className="size-2.5" />
              </AvatarIndicator>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="mb-4 w-64" side="right" align="start" sideOffset={11}>
            <div className="flex items-center gap-3 px-3 py-2">
              <Avatar>
                <AvatarImage src={toAbsoluteUrl("/media/avatars/300-2.png")} alt="User" />
                <AvatarFallback>{initials}</AvatarFallback>
                <AvatarIndicator className="-end-1.5 -top-1.5">
                  <AvatarStatus variant="online" className="size-2.5" />
                </AvatarIndicator>
              </Avatar>
              <div className="flex flex-col items-start">
                <span className="text-foreground text-sm font-semibold">{displayName}</span>
                <span className="text-muted-foreground max-w-[160px] truncate text-xs">
                  {displayEmail}
                </span>
                <Badge variant="success" appearance="outline" size="sm" className="mt-1">
                  {userRole}
                </Badge>
              </div>
            </div>

            <DropdownMenuItem className="border-border hover:bg-muted cursor-pointer rounded-md border py-1">
              <Clock />
              <span>Set availability</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/dashboard/access-control/users")}>
              <Users />
              <span>Team Management</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
              <User />
              <span>Profile Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/dashboard/preferences")}>
              <Settings />
              <span>Preferences</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/dashboard/security")}>
              <Shield />
              <span>Security</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
              <LogOut />
              <span>{isLoggingOut ? "Signing out..." : "Sign out"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
