// components/protected-breadcrumb.tsx - FIXED
"use client";

import Link from 'next/link';
import { ChevronRight, Home, Lock } from 'lucide-react';
import { useMenuPermissions } from '@/hooks/use-menu-permissions';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface BreadcrumbItemType {
  label: string;
  menuKey: string;
  href: string;
  isCurrent?: boolean;
}

interface ProtectedBreadcrumbProps {
  items: BreadcrumbItemType[];
}

export function ProtectedBreadcrumb({ items }: ProtectedBreadcrumbProps) {
  const { canAccessMenu } = useMenuPermissions();

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/dashboard">
              <Home className="h-4 w-4" />
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {items.map((item, index) => {
          const isAccessible = canAccessMenu(item.menuKey);
          const isLast = index === items.length - 1;

          return (
            <div key={item.menuKey} className="flex items-center gap-2">
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <>
                    {isAccessible ? (
                      <BreadcrumbLink asChild>
                        <Link href={item.href}>{item.label}</Link>
                      </BreadcrumbLink>
                    ) : (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        {item.label}
                        <Lock className="h-3 w-3" />
                      </span>
                    )}
                  </>
                )}
              </BreadcrumbItem>
            </div>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
