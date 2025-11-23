// components/layout/header-toolbar.tsx - COMPLETE WITH REAL DATA & LOGOUT
import { useEffect, useState } from "react";
import {
  Moon,
  Sun,
  LogOut,
  User,
  Settings,
  Bell,
  Sparkles,
  BadgeCheck,
  CreditCard,
  ChevronRightIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { selectUser } from "@/store/slices/authSlice";
import { useRouter } from "next/navigation";
import { AuthService } from "@/lib/api/services/auth-service";
import { toast } from "sonner";
import Notifications from "./notifications";
import { toAbsoluteUrl } from "@/lib/helpers";
import { ThemeCustomizerPanel } from "@/components/theme-customizer";
import ThemeSwitch from "./theme-switch";

export function HeaderToolbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const user = useAppSelector(selectUser);
  const dispatch = useAppDispatch();
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await AuthService.logout();
      toast.success("Logged out successfully");
      router.push("/sign-in");
    } catch (error: any) {
      toast.error(error?.message || "Logout failed");
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

  if (!mounted) return <div className="h-10 w-32" />;

  return (
    <nav className="flex items-center gap-2">
      <Notifications /> 

      {/* <Button mode="icon" variant="ghost" onClick={toggleTheme}>
        {theme === "light" ? <Moon /> : <Sun />}
      </Button> */}
      <ThemeSwitch />
      <ThemeCustomizerPanel />
      <Separator orientation="vertical" className="mx-2 h-4" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="cursor-pointer">
            <AvatarImage src={toAbsoluteUrl("/media/avatars/300-2.png")} alt="User" />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-60" align="end">
          <DropdownMenuLabel className="p-0">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar>
                <AvatarImage src={toAbsoluteUrl("/media/avatars/300-2.png")} alt="User" />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{displayName}</span>
                <span className="text-muted-foreground truncate text-xs">{displayEmail}</span>
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem>
              <Sparkles />
              Upgrade to Pro
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuGroup>
            <DropdownMenuItem>
              <BadgeCheck />
              Account
            </DropdownMenuItem>
            <DropdownMenuItem>
              <CreditCard />
              Billing
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Bell />
              Notifications
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={toggleTheme}>
            {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
            <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
            <LogOut />
            {isLoggingOut ? "Logging out..." : "Log out"}
          </DropdownMenuItem>

          <div className="bg-muted mt-1.5 rounded-md border">
            <div className="space-y-3 p-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Credits</h4>
                <div className="text-muted-foreground flex cursor-pointer items-center text-sm">
                  <span>5 left</span>
                  <ChevronRightIcon className="ml-1 h-4 w-4" />
                </div>
              </div>
              <Progress value={40} indicatorColor="bg-primary" />
              <div className="text-muted-foreground flex items-center text-sm">
                Daily credits used first
              </div>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
