
// 3. EXAMPLE PAGE WITH PERMISSION CHECK
// app/dashboard/access-control/roles/page.tsx 
// 4. NAVIGATION WITH PERMISSION CHECK
// components/navigation-link.tsx
'use client';

import Link from 'next/link';
import { useRbacMenu } from '@/hooks/use-rbac-menu';
import { LockIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NavigationLinkProps {
  href: string;
  menuKey: string;
  children: React.ReactNode;
  className?: string;
}

export function NavigationLink({ 
  href, 
  menuKey, 
  children, 
  className 
}: NavigationLinkProps) {
  const { canAccessMenu, navigateWithCheck } = useRbacMenu();
  const hasAccess = canAccessMenu(menuKey);

  if (!hasAccess) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`${className} opacity-50 cursor-not-allowed flex items-center gap-2`}>
            {children}
            <LockIcon className="size-3" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">You don't have access to this page</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Link 
      href={href}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        navigateWithCheck(href, menuKey);
      }}
    >
      {children}
    </Link>
  );
}
