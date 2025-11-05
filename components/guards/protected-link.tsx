// components/protected-link.tsx - FIXED
"use client";

import Link from 'next/link';
import { useMenuPermissions } from '@/hooks/use-menu-permissions';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ProtectedLinkProps {
  menuKey: string;
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function ProtectedLink({ 
  menuKey, 
  href, 
  children, 
  className 
}: ProtectedLinkProps) {
  const { canAccessMenu } = useMenuPermissions();
  const isAccessible = canAccessMenu(menuKey);

  if (!isAccessible) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={cn(
              "cursor-not-allowed opacity-50 flex items-center gap-2",
              className
            )}>
              {children}
              <Lock className="h-3 w-3" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <p className="font-semibold mb-1">Access Denied</p>
            <p className="text-xs">You don't have permission to access this menu.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
