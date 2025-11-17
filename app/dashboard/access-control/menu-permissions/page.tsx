// app/dashboard/access-control/menu-permissions/page.tsx - FIXED VERSION
'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { Plus, Search, X, Unlink, Menu, ChevronRight, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTable } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { IfHasAccess } from '@/components/guards/if-has-access';
import { ProtectedBreadcrumb } from '@/components/guards/protected-breadcrumb';
import {
  selectMenuPermissions,
  selectAllPermissions,
  selectMenuPermissionsLoading,
  selectMenuPermissionsPagination,
  fetchMenuPermissions,
  fetchAllPermissions,
  unlinkMenuPermission,
  linkMenuPermission,
} from '@/store/slices/menu-permissions.slice';
import { selectUser } from '@/store/slices/authSlice';
import { useMenuPermissions } from '@/hooks/use-menu-permissions';
import { canManageSystemResources } from '@/lib/rbac-utils';

interface MenuPermission {
  id: number;
  menu_key: string;
  permission_id: number;
  permission_key: string;
  resource?: string;
  action?: string;
  category?: string;
  is_required: boolean;
  is_system_permission: boolean;
  created_at: string;
}

interface Permission {
  id: number;
  permission_key: string;
  resource: string;
  action: string;
  description?: string;
  category?: string;
  is_system_permission: boolean;
}

const formatMenuKey = (menuKey: string): string => {
  return menuKey
    .split('.')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' > ');
};

const AVAILABLE_MENU_KEYS = [
  'dashboard',
  'access-control',
  'access-control.roles',
  'access-control.roles.create',
  'access-control.roles.edit',
  'access-control.roles.delete',
  'access-control.roles.bulk-assign',
  'access-control.permissions',
  'access-control.permissions.create',
  'access-control.permissions.delete',
  'access-control.role-permissions',
  'access-control.user-roles',
  'access-control.menu-permissions',
];

export default function MenuPermissionsPage() {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectUser);
  const { accessibleMenus, userPermissions, isSystemAdmin } = useMenuPermissions();

  const menuPermissions = useAppSelector(selectMenuPermissions);
  const allPermissions = useAppSelector(selectAllPermissions);
  const isLoading = useAppSelector(selectMenuPermissionsLoading);
  const paginationMeta = useAppSelector(selectMenuPermissionsPagination);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MenuPermission | null>(null);

  // ✅ FIX: Single ref to track if initial load is complete
  const hasInitialized = useRef(false);
  const currentFetchParams = useRef<string>('');

  // Filter permissions based on user access
  const filteredPermissions = useMemo(() => {
    if (!currentUser) return [];
    const userType = currentUser.userType || currentUser.user_type || '';

    if (canManageSystemResources(userType)) return allPermissions;

    const userPermissionKeys = new Set(userPermissions.map(p => p.permission_key));
    return allPermissions.filter(p => userPermissionKeys.has(p.permission_key));
  }, [allPermissions, currentUser, userPermissions]);

  // Available menus based on user access
  const availableMenuKeys = useMemo(() => {
    if (!currentUser) return [];
    const userType = currentUser.userType || currentUser.user_type || '';

    if (canManageSystemResources(userType)) return AVAILABLE_MENU_KEYS;

    return AVAILABLE_MENU_KEYS.filter(key => accessibleMenus.includes(key));
  }, [currentUser, accessibleMenus]);

  // ✅ FIX: Memoized fetch function with deduplication
  const fetchData = useCallback((params: {
    page: number;
    limit: number;
    search?: string;
  }) => {
    const paramsKey = JSON.stringify(params);

    // Prevent duplicate calls
    if (currentFetchParams.current === paramsKey) {
      console.log('🚫 Duplicate fetch prevented', params);
      return;
    }

    console.log('✅ Fetching menu permissions:', params);
    currentFetchParams.current = paramsKey;

    dispatch(fetchMenuPermissions({
      page: params.page,
      limit: params.limit,
      search: params.search || undefined,
    }));
  }, [dispatch]);

  // ✅ FIX: Single initialization effect
  useEffect(() => {
    if (!hasInitialized.current) {
      console.log('🎯 Initial load - fetching data');
      hasInitialized.current = true;

      // Fetch menu permissions
      fetchData({
        page: 1,
        limit: pagination.pageSize,
        search: undefined,
      });

      // Fetch all permissions for dropdown (only once)
      if (allPermissions.length === 0) {  // ❌ PROBLEM: allPermissions is in dependency
        console.log('🔍 Fetching all permissions for dropdown');
        dispatch(fetchAllPermissions());
      }
    }
  }, []); // ✅

  // ✅ FIX: Separate effect for pagination changes (not initial load)
  // ✅ FIX: Separate effect for pagination changes (not initial load)
  useEffect(() => {
    if (!hasInitialized.current) return; // Skip during initial mount
    if (searchQuery) return; // Don't fetch if search is active

    console.log('📄 Pagination changed - fetching data');
    fetchData({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      search: undefined,
    });
  }, [pagination.pageIndex, pagination.pageSize]); // ❌ Missing fetchData dependency
  
  // ✅ FIX: Handle search with proper state management
  const handleSearch = useCallback(() => {
    console.log('🔍 Search triggered:', searchInput);
    setSearchQuery(searchInput);
    setPagination(prev => ({ ...prev, pageIndex: 0 }));

    fetchData({
      page: 1,
      limit: pagination.pageSize,
      search: searchInput || undefined,
    });
  }, [searchInput, pagination.pageSize, fetchData]);

  // ✅ FIX: Clear search with proper cleanup
  const handleClearSearch = useCallback(() => {
    console.log('🧹 Clearing search');
    setSearchInput('');
    setSearchQuery('');
    setPagination(prev => ({ ...prev, pageIndex: 0 }));

    fetchData({
      page: 1,
      limit: pagination.pageSize,
      search: undefined,
    });
  }, [pagination.pageSize, fetchData]);

  const canUserUnlinkPermission = useCallback((mapping: MenuPermission): boolean => {
    if (!currentUser) return false;
    const userType = currentUser.userType || currentUser.user_type || '';

    if (canManageSystemResources(userType)) return true;
    if (mapping.is_system_permission) return false;
    if (!accessibleMenus.includes(mapping.menu_key)) return false;

    return true;
  }, [currentUser, accessibleMenus]);

  const handleUnlinkClick = (mapping: MenuPermission) => {
    if (!canUserUnlinkPermission(mapping)) {
      toast.error(mapping.is_system_permission
        ? 'Only system admins can unlink system permissions'
        : 'You do not have access to this menu'
      );
      return;
    }
    setItemToDelete(mapping);
    setDeleteDialogOpen(true);
  };

  const handleUnlinkConfirm = async () => {
    if (!itemToDelete) return;

    try {
      await dispatch(unlinkMenuPermission({
        menuKey: itemToDelete.menu_key,
        permissionId: itemToDelete.permission_id,
      })).unwrap();

      toast.success('Menu permission unlinked successfully');
      setDeleteDialogOpen(false);
      setItemToDelete(null);

      // ✅ FIX: Refetch current view without resetting state
      fetchData({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: searchQuery || undefined,
      });
    } catch (error: any) {
      toast.error(error?.message || 'Failed to unlink permission');
    }
  };

  const columns = useMemo<ColumnDef<MenuPermission>[]>(
    () => [
      {
        accessorKey: 'menu_key',
        header: ({ column }) => <DataGridColumnHeader title="Menu Key" visibility={true} column={column} />,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10">
              <Menu className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="font-medium text-sm">{row.original.menu_key}</div>
              <div className="text-xs text-muted-foreground">{formatMenuKey(row.original.menu_key)}</div>
            </div>
          </div>
        ),
        size: 250,
      },
      {
        accessorKey: 'permission_key',
        header: ({ column }) => <DataGridColumnHeader title="Permission" visibility={true} column={column} />,
        cell: ({ row }) => (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{row.original.permission_key}</span>
              {row.original.is_system_permission && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger><Lock className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent>System Permission</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            {row.original.resource && row.original.action && (
              <div className="text-xs text-muted-foreground">
                {row.original.resource} → {row.original.action}
              </div>
            )}
          </div>
        ),
        size: 200,
      },
      {
        accessorKey: 'category',
        header: ({ column }) => <DataGridColumnHeader title="Category" visibility={true} column={column} />,
        cell: ({ row }) => <Badge variant="secondary">{row.original.category || 'General'}</Badge>,
        size: 150,
      },
      {
        accessorKey: 'is_required',
        header: ({ column }) => <DataGridColumnHeader title="Required" visibility={true} column={column} />,
        cell: ({ row }) => (
          <Badge variant={row.original.is_required ? 'primary' : 'outline'}>
            {row.original.is_required ? 'Required' : 'Optional'}
          </Badge>
        ),
        size: 100,
      },
      {
        accessorKey: 'actions',
        header: '',
        cell: ({ row }) => {
          const canUnlink = canUserUnlinkPermission(row.original);
          return (
            <div className="flex items-center gap-2">
              <IfHasAccess menuKey="access-control.menu-permissions">
                {canUnlink ? (
                  <Button
                    mode="icon"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnlinkClick(row.original)}
                  >
                    <Unlink className="h-4 w-4" />
                  </Button>
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button mode="icon" variant="ghost" size="sm" disabled>
                          <Unlink className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {row.original.is_system_permission ? 'System admins only' : 'No access to menu'}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </IfHasAccess>
              <ChevronRight className="text-muted-foreground/70 size-3.5" />
            </div>
          );
        },
        size: 80,
      },
    ],
    [canUserUnlinkPermission]
  );

  const table = useReactTable({
    columns,
    data: menuPermissions,
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: paginationMeta.totalPages,
  });

  return (
    <div className="flex flex-col gap-6">
      <ProtectedBreadcrumb
        items={[
          { label: 'Access Control', menuKey: 'access-control', href: '/dashboard/access-control' },
          { label: 'Menu Permissions', menuKey: 'access-control.menu-permissions', href: '/dashboard/access-control/menu-permissions', isCurrent: true },
        ]}
      />

      <DataGrid table={table} recordCount={paginationMeta.totalItems} isLoading={isLoading}>
        <Card>
          <CardHeader className="py-5">
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Search menu permissions"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="ps-9 w-full"
                  disabled={isLoading}
                />
                {searchQuery && (
                  <Button
                    mode="icon"
                    variant="ghost"
                    size="sm"
                    className="absolute end-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={handleClearSearch}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {searchInput !== searchQuery && (
                  <Button onClick={handleSearch} disabled={isLoading} variant="outline">
                    <Search className="h-4 w-4" />
                    Search
                  </Button>
                )}

                <IfHasAccess menuKey="access-control.menu-permissions">
                  <Button onClick={() => setLinkDialogOpen(true)} disabled={isLoading}>
                    <Plus className="h-4 w-4" />
                    Link Permission
                  </Button>
                </IfHasAccess>
              </div>
            </div>
          </CardHeader>

          <CardTable>
            <ScrollArea>
              <DataGridTable />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardTable>

          <CardFooter>
            <DataGridPagination />
          </CardFooter>
        </Card>
      </DataGrid>

      <LinkDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        permissions={filteredPermissions}
        availableMenuKeys={availableMenuKeys}
        onSuccess={() => {
          fetchData({
            page: pagination.pageIndex + 1,
            limit: pagination.pageSize,
            search: searchQuery || undefined,
          });
          setLinkDialogOpen(false);
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink Menu Permission</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unlink <strong>{itemToDelete?.permission_key}</strong> from <strong>{itemToDelete?.menu_key}</strong>?
              <br /><br />
              This will remove the permission requirement for accessing this menu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnlinkConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Unlink
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function LinkDialog({ open, onOpenChange, permissions, availableMenuKeys, onSuccess }: any) {
  const dispatch = useAppDispatch();
  const [menuKey, setMenuKey] = useState('');
  const [permissionId, setPermissionId] = useState('');
  const [isRequired, setIsRequired] = useState(true);
  const [isLinking, setIsLinking] = useState(false);

  // ✅ FIX: Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setMenuKey('');
      setPermissionId('');
      setIsRequired(true);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!menuKey || !permissionId) {
      toast.error('Please select both menu and permission');
      return;
    }

    setIsLinking(true);
    try {
      await dispatch(linkMenuPermission({
        menuKey,
        permissionId: Number(permissionId),
        isRequired
      })).unwrap();

      toast.success('Menu permission linked successfully');
      onSuccess();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to link permission');
    } finally {
      setIsLinking(false);
    }
  };

  const handleClose = () => {
    if (!isLinking) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link Menu Permission</DialogTitle>
          <DialogDescription>
            Associate a permission with a menu item to control access
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="menu">Menu Key *</Label>
            <Select value={menuKey} onValueChange={setMenuKey} disabled={isLinking}>
              <SelectTrigger id="menu">
                <SelectValue placeholder="Select menu" />
              </SelectTrigger>
              <SelectContent>
                {availableMenuKeys.map((key: string) => (
                  <SelectItem key={key} value={key}>
                    {formatMenuKey(key)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose the menu item to link the permission to
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="permission">Permission *</Label>
            <Select value={permissionId} onValueChange={setPermissionId} disabled={isLinking}>
              <SelectTrigger id="permission">
                <SelectValue placeholder="Select permission" />
              </SelectTrigger>
              <SelectContent>
                {permissions.map((p: Permission) => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    <div className="flex flex-col">
                      <span className="font-medium">{p.permission_key}</span>
                      {p.description && (
                        <span className="text-xs text-muted-foreground">{p.description}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Select the permission required to access this menu
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="space-y-0.5">
              <Label htmlFor="required">Required Permission</Label>
              <p className="text-xs text-muted-foreground">
                If enabled, users must have this permission to access the menu
              </p>
            </div>
            <Switch
              id="required"
              checked={isRequired}
              onCheckedChange={setIsRequired}
              disabled={isLinking}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLinking}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLinking || !menuKey || !permissionId}
          >
            {isLinking ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Linking...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Link Permission
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


