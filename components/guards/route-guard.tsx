// components/route-guard.tsx - FIXED FOR DYNAMIC ROUTES
"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useMenuPermissions } from '@/hooks/use-menu-permissions';
import { Loader2, Lock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { isPublicRoute } from '@/lib/route-menu-map';

interface RouteGuardProps {
  children: React.ReactNode;
}

export function RouteGuard({ children }: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { canAccessRoute, loading, isInitialized } = useMenuPermissions();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [checkComplete, setCheckComplete] = useState(false);

  useEffect(() => {
    // ✅ Wait for initialization
    if (!isInitialized) {
      setIsAuthorized(null);
      setCheckComplete(false);
      return;
    }

    // ✅ Public routes always allowed
    if (isPublicRoute(pathname)) {
      setIsAuthorized(true);
      setCheckComplete(true);
      return;
    }

    // ✅ Check route access using fixed canAccessRoute
    const hasAccess = canAccessRoute(pathname);
    setIsAuthorized(hasAccess);
    setCheckComplete(true);

    // ✅ Redirect if no access
    if (!hasAccess) {
      console.warn(`❌ Access denied to ${pathname}`);
      router.push('/errors/forbidden');
    } else {
      console.log(`✅ Access granted to ${pathname}`);
    }
  }, [pathname, canAccessRoute, isInitialized, router]);

  // Show loading while checking
  if (!checkComplete || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Show error if not authorized after check
  if (checkComplete && !isAuthorized) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <Lock className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to access this page.
          </AlertDescription>
          <Button variant="outline" size="sm" className="mt-4" asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}