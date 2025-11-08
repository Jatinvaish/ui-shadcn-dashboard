
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className="relative">
            <BellIcon />
            <span className="bg-destructive absolute end-0 top-0 block size-2 shrink-0 rounded-full"></span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-80 p-0">
          <DropdownMenuLabel className="bg-background sticky top-0 z-10 p-0">
            <div className="flex justify-between border-b px-6 py-4">
              <div className="font-medium">Notifications</div>
              <Button variant="foreground" className="h-auto p-0 text-xs" size="sm" asChild>
                <Link href="#">View all</Link>
              </Button>
            </div>
          </DropdownMenuLabel>

          <ScrollArea className="h-[350px]">
            {notifications.map((item, key) => (
              <DropdownMenuItem
                key={key}
                className="group flex cursor-pointer items-start gap-9 rounded-none border-b px-4 py-3">
                <div className="flex flex-1 items-start gap-2">
                  <div className="flex-none">
                    <Avatar className="size-8">
                      <AvatarImage src={toAbsoluteUrl('/media/avatars/300-2.png')} />
                      <AvatarFallback>{item.title.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="truncate text-sm font-medium">
                      {item.title}
                    </div>
                    <div className="text-muted-foreground line-clamp-1 text-xs">
                      {item.desc}
                    </div>
                    {item.type === "confirm" && (
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">Accept</Button>
                        <Button size="sm" variant="destructive">Decline</Button>
                      </div>
                    )}
                    <div className="text-muted-foreground flex items-center gap-1 text-xs">
                      <ClockIcon className="size-3!" />
                      {item.date}
                    </div>
                  </div>
                </div>
                {item.unread_message && (
                  <div className="flex-0">
                    <span className="bg-destructive/80 block size-2 rounded-full border" />
                  </div>
                )}
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>

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