// components/menu-access-indicator.tsx - FIXED
"use client";

import { useMenuPermissions } from '@/hooks/use-menu-permissions';
import { Lock, CheckCircle2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MenuAccessIndicatorProps {
  menuKey: string;
  showLoading?: boolean;
}

export function MenuAccessIndicator({ 
  menuKey, 
  showLoading = false 
}: MenuAccessIndicatorProps) {
  const { canAccessMenu, loading } = useMenuPermissions();
  const isAccessible = canAccessMenu(menuKey);

  if (loading && showLoading) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Checking...
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Verifying access permissions</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (!isAccessible) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="destructive" className="gap-1">
              <Lock className="h-3 w-3" />
              No Access
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-semibold">Access Denied</p>
            <p className="text-xs">You don't have permission to access this menu.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="primary" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Access Granted
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>You have access to this menu</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
