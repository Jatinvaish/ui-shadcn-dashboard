// components/guards/PermissionGuard.tsx - UPDATED
'use client';

import { usePermissions } from '@/hooks/usePermissions';
import { Loader2 } from 'lucide-react';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission: string | string[];
  requireAll?: boolean; // If true, requires ALL permissions. If false, requires ANY
  fallback?: React.ReactNode;
}

export function PermissionGuard({ 
  children, 
  permission, 
  requireAll = false,
  fallback = null 
}: PermissionGuardProps) {
  const { hasPermission, hasAllPermissions, hasAnyPermission, loading, initialized } = usePermissions();

  // Show loading state while fetching permissions
  if (loading || !initialized) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  // Check permissions
  const permissions = Array.isArray(permission) ? permission : [permission];
  const hasAccess = requireAll 
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
