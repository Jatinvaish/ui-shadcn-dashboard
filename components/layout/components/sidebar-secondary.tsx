
// ==================== sidebar-secondary.tsx ====================
import { Separator } from "@/components/ui/separator";
import { SidebarSearch } from "./sidebar-search";
import { useLayout } from './context';
import { Badge } from '@/components/ui/badge';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from "react";
import {
  ChartPieIcon,
  ShoppingBagIcon,
  BadgeDollarSignIcon,
  ChartBarDecreasingIcon,
  GaugeIcon,
  FolderDotIcon,
  FolderIcon,
  WalletMinimalIcon,
  GraduationCapIcon,
  ActivityIcon,
  Building2Icon,
  CreditCardIcon,
  SquareKanbanIcon,
  StickyNoteIcon,
  MessageSquareIcon,
  MessageSquareHeartIcon,
  MailIcon,
  SquareCheckIcon,
  ClipboardCheckIcon,
  CalendarIcon,
  ArchiveRestoreIcon,
  KeyIcon,
  CookieIcon,
  BookAIcon,
  BrainIcon,
  BrainCircuitIcon,
  ImagesIcon,
  SpeechIcon,
  UsersIcon,
  UserIcon,
  RedoDotIcon,
  BrushCleaningIcon,
  SettingsIcon,
  FingerprintIcon,
  ClipboardMinusIcon,
  ComponentIcon,
  ProportionsIcon,
  GithubIcon,
  ChevronRight,
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

// Navigation data based on your provided structure
const navItems = {
  dashboards: {
    title: "Dashboards",
    items: [
      { title: "Default", href: "/dashboard/default", icon: ChartPieIcon },
      {
        title: "E-commerce",
        href: "#",
        icon: ShoppingBagIcon,
        items: [
          { title: "Dashboard", href: "/dashboard/ecommerce" },
          { title: "Product List", href: "/dashboard/pages/products" },
          { title: "Product Detail", href: "/dashboard/pages/products/1" },
          { title: "Add Product", href: "/dashboard/pages/products/create" },
          { title: "Order List", href: "/dashboard/pages/orders" },
          { title: "Order Detail", href: "/dashboard/pages/orders/detail" }
        ]
      },
      { title: "Sales", href: "/dashboard/sales", icon: BadgeDollarSignIcon },
      { title: "CRM", href: "/dashboard/crm", icon: ChartBarDecreasingIcon },
      { title: "Website Analytics", href: "/dashboard/website-analytics", icon: GaugeIcon },
      {
        title: "Project Management",
        href: "/dashboard/project-management",
        icon: FolderDotIcon,
        items: [
          { title: "Dashboard", href: "/dashboard/project-management" },
          { title: "Project List", href: "/dashboard/project-list" }
        ]
      },
      { title: "File Manager", href: "/dashboard/file-manager", icon: FolderIcon },
      { title: "Crypto", href: "/dashboard/crypto", icon: WalletMinimalIcon },
      { title: "Academy/School", href: "/dashboard/academy", icon: GraduationCapIcon },
      { title: "Hospital Management", href: "/dashboard/hospital-management", icon: ActivityIcon },
      { title: "Hotel Dashboard", href: "/dashboard/hotel", icon: Building2Icon, isComing: true },
      { title: "Finance Dashboard", href: "/dashboard/finance", icon: WalletMinimalIcon },
      {
        title: "Payment Dashboard",
        href: "/dashboard/payment",
        icon: CreditCardIcon,
        items: [
          { title: "Dashboard", href: "/dashboard/payment" },
          { title: "Transactions", href: "/dashboard/payment/transactions" }
        ]
      }
    ]
  },
  apps: {
    title: "Apps",
    items: [
      { title: "Kanban", href: "/dashboard/apps/kanban", icon: SquareKanbanIcon, isNew: true },
      { title: "Notes", href: "/dashboard/apps/notes", icon: StickyNoteIcon, badge: "8" },
      { title: "Chats", href: "/dashboard/apps/chat", icon: MessageSquareIcon, badge: "5" },
      { title: "Social Media", href: "/dashboard/apps/social-media", icon: MessageSquareHeartIcon, isComing: true },
      { title: "Mail", href: "/dashboard/apps/mail", icon: MailIcon },
      { title: "Todo List App", href: "/dashboard/apps/todo-list-app", icon: SquareCheckIcon },
      { title: "Tasks", href: "/dashboard/apps/tasks", icon: ClipboardCheckIcon },
      { title: "Calendar", href: "/dashboard/apps/calendar", icon: CalendarIcon },
      { title: "File Manager", href: "/dashboard/apps/file-manager", icon: ArchiveRestoreIcon, isNew: true },
      { title: "Api Keys", href: "/dashboard/apps/api-keys", icon: KeyIcon },
      { title: "POS App", href: "/dashboard/apps/pos-system", icon: CookieIcon },
      { title: "Courses", href: "/dashboard/apps/courses", icon: BookAIcon, isComing: true }
    ]
  },
  "ai-apps": {
    title: "AI Apps",
    items: [
      { title: "AI Chat", href: "/dashboard/apps/ai-chat", icon: BrainIcon },
      { title: "AI Chat V2", href: "/dashboard/apps/ai-chat-v2", icon: BrainCircuitIcon, isNew: true },
      { title: "Image Generator", href: "/dashboard/apps/ai-image-generator", icon: ImagesIcon },
      { title: "Text to Speech", href: "/dashboard/apps/text-to-speech", icon: SpeechIcon, isComing: true }
    ]
  },
  pages: {
    title: "Pages",
    items: [
      { title: "Users List", href: "/dashboard/pages/users", icon: UsersIcon },
      { title: "Profile", href: "/dashboard/pages/profile", icon: UserIcon },
      { title: "Onboarding Flow", href: "/dashboard/pages/onboarding-flow", icon: RedoDotIcon },
      {
        title: "Empty States",
        href: "/dashboard/pages/empty-states/01",
        icon: BrushCleaningIcon,
        items: [
          { title: "Empty States 01", href: "/dashboard/pages/empty-states/01" },
          { title: "Empty States 02", href: "/dashboard/pages/empty-states/02" },
          { title: "Empty States 03", href: "/dashboard/pages/empty-states/03" }
        ]
      },
      {
        title: "Settings",
        href: "/dashboard/pages/settings",
        icon: SettingsIcon,
        items: [
          { title: "Profile", href: "/dashboard/pages/settings" },
          { title: "Account", href: "/dashboard/pages/settings/account" },
          { title: "Billing", href: "/dashboard/pages/settings/billing" },
          { title: "Appearance", href: "/dashboard/pages/settings/appearance" },
          { title: "Notifications", href: "/dashboard/pages/settings/notifications" },
          { title: "Display", href: "/dashboard/pages/settings/display" }
        ]
      },
      {
        title: "Pricing",
        href: "#",
        icon: BadgeDollarSignIcon,
        items: [
          { title: "Column Pricing", href: "/dashboard/pages/pricing/column" },
          { title: "Table Pricing", href: "/dashboard/pages/pricing/table" },
          { title: "Single Pricing", href: "/dashboard/pages/pricing/single" }
        ]
      },
      {
        title: "Authentication",
        href: "/",
        icon: FingerprintIcon,
        items: [
          { title: "Login v1", href: "/dashboard/login/v1" },
          { title: "Login v2", href: "/dashboard/login/v2" },
          { title: "Register v1", href: "/dashboard/register/v1" },
          { title: "Register v2", href: "/dashboard/register/v2" },
          { title: "Forgot Password", href: "/dashboard/forgot-password" }
        ]
      },
      {
        title: "Error Pages",
        href: "/",
        icon: FingerprintIcon,
        items: [
          { title: "404", href: "/dashboard/pages/error/404" },
          { title: "500", href: "/dashboard/pages/error/500" },
          { title: "403", href: "/dashboard/pages/error/403" }
        ]
      }
    ]
  },
  others: {
    title: "Others",
    items: [
      { title: "Download Shadcn UI Kit", href: "/pricing", icon: ClipboardMinusIcon, newTab: true },
      { title: "Components", href: "/components", icon: ComponentIcon, newTab: true },
      { title: "Blocks", href: "/blocks", icon: ComponentIcon, newTab: true },
      { title: "Templates", href: "/templates", icon: ProportionsIcon, newTab: true },
      { title: "Github", href: "https://github.com/bundui", icon: GithubIcon, newTab: true }
    ]
  }
};

interface MenuItemProps {
  item: any;
  pathname: string;
}

function MenuItem({ item, pathname }: MenuItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasSubmenu = item.items && item.items.length > 0;
  const isActive = pathname === item.href;

  if (hasSubmenu) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="group/collapsible">
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-normal transition-colors",
              "hover:bg-primary/10 hover:text-foreground",
              "text-foreground"
            )}
          >
            {item.icon && <item.icon className="size-4 shrink-0" />}
            <span className="flex-1 text-left">{item.title}</span>
            <ChevronRight className={cn(
              "size-4 shrink-0 transition-transform duration-200",
              isOpen && "rotate-90"
            )} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-6 mt-1 space-y-1">
          {item.items.map((subItem: any, index: number) => (
            <Link
              key={index}
              href={subItem.href}
              target={subItem.newTab ? "_blank" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors",
                "hover:bg-primary/10 hover:text-foreground",
                pathname === subItem.href
                  ? "bg-primary/10 text-foreground font-medium"
                  : "text-muted-foreground"
              )}
            >
              <span>{subItem.title}</span>
            </Link>
          ))}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <div className="relative flex items-center">
      <Link
        href={item.href}
        target={item.newTab ? "_blank" : undefined}
        className={cn(
          "flex flex-1 items-center gap-2 rounded-md px-2.5 py-2 text-sm font-normal transition-colors",
          "hover:bg-primary/10 hover:text-foreground",
          isActive
            ? "bg-primary/10 text-foreground font-medium"
            : "text-foreground"
        )}
      >
        {item.icon && <item.icon className="size-4 shrink-0" />}
        <span className="flex-1">{item.title}</span>
      </Link>
      {item.isNew && (
        <Badge variant="primary" size="sm" className="absolute right-2 border border-green-400 bg-green-50 text-green-600 text-[10px] px-1.5 py-0">
          New
        </Badge>
      )}
      {item.isComing && (
        <Badge variant="secondary" size="sm" className="absolute right-2 opacity-50 text-[10px] px-1.5 py-0">
          Soon
        </Badge>
      )}
      {item.badge && (
        <Badge variant="primary" size="sm" className="absolute right-2 bg-primary/20 text-foreground text-[10px] px-1.5 py-0">
          {item.badge}
        </Badge>
      )}
    </div>
  );
}

export function SidebarSecondary() {
  const { activeSecondaryMenu } = useLayout();
  const pathname = usePathname();

  const currentNav = navItems[activeSecondaryMenu as keyof typeof navItems] || navItems.dashboards;

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden">
      <div className="shrink-0 pt-2.5">
        <SidebarSearch />
      </div>
      <div className="flex-1 overflow-y-auto py-2.5">
        <div className="px-2.5 space-y-1">
          <div className="text-xs font-normal text-muted-foreground mb-3 px-2.5">
            {currentNav.title}
          </div>
          <div className="space-y-1">
            {currentNav.items.map((item: any, index: number) => (
              <MenuItem key={index} item={item} pathname={pathname} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}