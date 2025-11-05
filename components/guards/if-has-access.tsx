// components/if-has-access.tsx - FIXED
"use client";

import { useMenuPermissions } from '@/hooks/use-menu-permissions';
import { Loader2 } from 'lucide-react';

interface IfHasAccessProps {
  menuKey: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showLoading?: boolean;
}

export function IfHasAccess({ 
  menuKey, 
  children, 
  fallback = null,
  showLoading = false 
}: IfHasAccessProps) {
  const { canAccessMenu, loading } = useMenuPermissions();
  const hasAccess = canAccessMenu(menuKey);

  if (loading && showLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
