
// header-toolbar.tsx
import {
  Coffee,
  MessageSquareCode,
  Pin,
  User,
  Settings,
  LogOut,
  Sun,
  Moon,
  BellIcon,
  ClockIcon,
  BadgeCheck,
  CreditCard,
  Bell,
  ChevronRightIcon,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toAbsoluteUrl } from "@/lib/helpers";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarIndicator,
  AvatarStatus,
} from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { useTheme } from "next-themes";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { ThemeCustomizerPanel } from "@/components/theme-customizer";
import Notifications from "./notifications";

// Mock notifications data
const notifications = [
  {
    avatar: "01.png",
    title: "New message from John",
    desc: "Hey, how are you doing today?",
    date: "2 mins ago",
    unread_message: true,
    type: "message"
  },
  {
    avatar: "02.png",
    title: "Sarah sent you a friend request",
    desc: "Accept or decline the request",
    date: "1 hour ago",
    unread_message: true,
    type: "confirm"
  },
  {
    avatar: "03.png",
    title: "Project update",
    desc: "New milestone achieved in the project",
    date: "3 hours ago",
    unread_message: false,
    type: "message"
  },
];

export function HeaderToolbar() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <nav className="flex items-center gap-2">
      {/* Notifications */}
      <Notifications />
      {/* Theme Toggle */}
      <Button mode="icon" variant="ghost" onClick={toggleTheme}>
        {theme === "light" ? <Moon /> : <Sun />}
      </Button>

      <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="cursor-pointer">
            <AvatarImage src={toAbsoluteUrl('/media/avatars/300-2.png')} alt="User" />
            <AvatarFallback>CH</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-60" align="end">
          <DropdownMenuLabel className="p-0">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar>
                <AvatarImage src={toAbsoluteUrl('/media/avatars/300-2.png')} />
                <AvatarFallback>CH</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Chris Harris</span>
                <span className="text-muted-foreground truncate text-xs">chris@example.com</span>
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="#">
                <Sparkles /> Upgrade to Pro
              </Link>
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

          <DropdownMenuItem>
            <LogOut />
            Log out
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