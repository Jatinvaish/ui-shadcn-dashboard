// components/permission-badge.tsx - FIXED
"use client";

import { Badge } from '@/components/ui/badge';
import { usePermissions } from '@/hooks/usePermissions';
import { CheckCircle2, XCircle } from 'lucide-react';

interface PermissionBadgeProps {
  permissionName: string;
}

export function PermissionBadge({ permissionName }: PermissionBadgeProps) {
  const { hasPermission } = usePermissions();
  const hasPerm = hasPermission(permissionName);

  return (
    <Badge 
      variant={hasPerm ? "default" : "secondary"}
      className="gap-1"
    >
      {hasPerm ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : (
        <XCircle className="h-3 w-3" />
      )}
      {permissionName}
    </Badge>
  );
}
