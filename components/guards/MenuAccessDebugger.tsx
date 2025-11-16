
// ============================================
// FILE 5: components/guards/MenuAccessDebugger.tsx - IMPROVED
// ============================================
"use client";

import { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { selectUser, selectUserType } from '@/store/slices/authSlice';
import { 
  selectAccessibleMenus, 
  selectBlockedMenus, 
  selectUserPermissions,
  selectMenuPermissionsInitialized,
  selectMenuPermissionsLoadingAny,
} from '@/store/slices/menu-permissions.slice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MenuAccessDebugger() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const user = useAppSelector(selectUser);
  const userType = useAppSelector(selectUserType);
  const accessibleMenus = useAppSelector(selectAccessibleMenus);
  const blockedMenus = useAppSelector(selectBlockedMenus);
  const userPermissions = useAppSelector(selectUserPermissions);
  const initialized = useAppSelector(selectMenuPermissionsInitialized);
  const loading = useAppSelector(selectMenuPermissionsLoadingAny);

  const isSystemAdmin = userType === 'super_admin' || userType === 'saas_admin';

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Card className="shadow-lg border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              🔍 Menu Access Debugger
              {isSystemAdmin && (
                <Badge variant="destructive" className="text-xs">
                  ADMIN
                </Badge>
              )}
              {loading && (
                <Badge variant="secondary" className="text-xs animate-pulse">
                  Loading...
                </Badge>
              )}
              {!initialized && (
                <Badge variant="outline" className="text-xs">
                  Not Initialized
                </Badge>
              )}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        
        {!isCollapsed && (
          <CardContent className="space-y-4 text-xs">
            {/* User Info */}
            <div>
              <div className="font-semibold mb-1">User Info:</div>
              <div className="space-y-1 pl-2">
                <div>ID: <code className="bg-muted px-1 rounded">{user?.id}</code></div>
                <div>Email: <code className="bg-muted px-1 rounded">{user?.email}</code></div>
                <div>Type: <Badge variant="outline">{userType}</Badge></div>
              </div>
            </div>

            {/* State */}
            <div>
              <div className="font-semibold mb-1">State:</div>
              <div className="space-y-1 pl-2">
                <div>Initialized: {initialized ? '✅' : '❌'}</div>
                <div>Loading: {loading ? '⏳' : '✅'}</div>
              </div>
            </div>

            {/* Accessible Menus */}
            <div>
              <div className="font-semibold mb-1 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Accessible Menus ({accessibleMenus.length})
              </div>
              <ScrollArea className="h-32 rounded border p-2 bg-muted/30">
                {accessibleMenus.length > 0 ? (
                  <div className="space-y-1">
                    {accessibleMenus.map(menu => (
                      <div key={menu} className="text-green-700 dark:text-green-400 font-mono text-xs">
                        ✓ {menu}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground italic">
                    No accessible menus
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Blocked Menus */}
            {blockedMenus.length > 0 && (
              <div>
                <div className="font-semibold mb-1 flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  Blocked Menus ({blockedMenus.length})
                </div>
                <ScrollArea className="h-32 rounded border p-2 bg-muted/30">
                  <div className="space-y-1">
                    {blockedMenus.map(menu => (
                      <div key={menu} className="text-red-700 dark:text-red-400 font-mono text-xs">
                        ✗ {menu}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Permissions */}
            <div>
              <div className="font-semibold mb-1 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                Permissions ({userPermissions.length})
              </div>
              <ScrollArea className="h-32 rounded border p-2 bg-muted/30">
                {userPermissions.length > 0 ? (
                  <div className="space-y-1">
                    {userPermissions.slice(0, 10).map(perm => (
                      <div key={perm.id} className="text-blue-700 dark:text-blue-400 font-mono text-xs">
                        • {perm.permission_key}
                      </div>
                    ))}
                    {userPermissions.length > 10 && (
                      <div className="text-muted-foreground italic text-xs">
                        ...and {userPermissions.length - 10} more
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-muted-foreground italic">
                    No permissions
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Summary */}
            <div className="pt-2 border-t space-y-1">
              <div className="font-semibold">Summary:</div>
              <div className="pl-2 space-y-1">
                <div>✅ Accessible: <strong>{accessibleMenus.length}</strong></div>
                <div>❌ Blocked: <strong>{blockedMenus.length}</strong></div>
                <div>🔑 Permissions: <strong>{userPermissions.length}</strong></div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}