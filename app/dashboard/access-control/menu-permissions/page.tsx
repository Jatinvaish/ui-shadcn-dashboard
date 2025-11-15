// app/(dashboard)/access-control/menu-permissions/page.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { Plus, Search, X, Unlink, Menu, ChevronRight, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTable } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
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

export default function MenuPermissionsPage() {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectUser);
  const { accessibleMenus, userPermissions, isSystemAdmin } = useMenuPermissions();

  const menuPermissions = useAppSelector(selectMenuPermissions);
  const allPermissions = useAppSelector(selectAllPermissions);
  const isLoading = useAppSelector(selectMenuPermissionsLoading);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MenuPermission | null>(null);

  const filteredPermissions = useMemo(() => {
    if (!currentUser) return [];
    const userType = currentUser.userType || currentUser.user_type || '';
    if (canManageSystemResources(userType)) return allPermissions;
    const userPermissionKeys = new Set(userPermissions.map(p => p.permission_key));
    return allPermissions.filter(p => userPermissionKeys.has(p.permission_key));
  }, [allPermissions, currentUser, userPermissions]);

  useEffect(() => {
    dispatch(fetchMenuPermissions({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      search: searchQuery || undefined,
    }));
  }, [dispatch, pagination.pageIndex, pagination.pageSize, searchQuery]);

  useEffect(() => {
    dispatch(fetchAllPermissions());
  }, [dispatch]);

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
      toast.success('Menu permission unlinked');
      setDeleteDialogOpen(false);
      setItemToDelete(null);
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
                  <Button mode="icon" variant="ghost" size="sm" onClick={() => handleUnlinkClick(row.original)}>
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
    //todo
    //@ts-ignore
    data: menuPermissions,
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
  });

  return (
    <div className="flex flex-col gap-6">
      <ProtectedBreadcrumb
        items={[
          { label: 'Access Control', menuKey: 'access-control', href: '/dashboard/access-control' },
          { label: 'Menu Permissions', menuKey: 'access-control.menu-permissions', href: '/dashboard/access-control/menu-permissions', isCurrent: true },
        ]}
      />

      <DataGrid table={table} recordCount={menuPermissions.length} isLoading={isLoading}>
        <Card>
          <CardHeader className="py-5">
            <div className="flex justify-between items-center">
              <div className="relative">
                <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Search menu permissions"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="ps-9 w-64"
                />
              </div>
              <IfHasAccess menuKey="access-control.menu-permissions">
                <Button onClick={() => setLinkDialogOpen(true)}>
                  <Plus />Link Permission
                </Button>
              </IfHasAccess>
            </div>
          </CardHeader>
          <CardTable>
            <ScrollArea>
              <DataGridTable />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardTable>
          <CardFooter><DataGridPagination /></CardFooter>
        </Card>
      </DataGrid>

      <LinkDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        permissions={filteredPermissions}
        onSuccess={() => {
          dispatch(fetchMenuPermissions({ page: 1, limit: pagination.pageSize }));
          setLinkDialogOpen(false);
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink Menu Permission</AlertDialogTitle>
            <AlertDialogDescription>
              Unlink {itemToDelete?.permission_key} from {itemToDelete?.menu_key}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnlinkConfirm} className="bg-destructive">Unlink</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function LinkDialog({ open, onOpenChange, permissions, onSuccess }: any) {
  const dispatch = useAppDispatch();
  const { accessibleMenus, isSystemAdmin } = useMenuPermissions();
  const [menuKey, setMenuKey] = useState('');
  const [permissionId, setPermissionId] = useState('');
  const [isRequired, setIsRequired] = useState(true);
  const [isLinking, setIsLinking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuKey || !permissionId) {
      toast.error('Fill all fields');
      return;
    }
    setIsLinking(true);
    try {
      await dispatch(linkMenuPermission({ menuKey, permissionId: Number(permissionId), isRequired })).unwrap();
      toast.success('Linked successfully');
      onSuccess();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to link');
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Link Menu Permission</DialogTitle>
            <DialogDescription>Associate a permission with a menu item</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Menu Key *</Label>
              <Select value={menuKey} onValueChange={setMenuKey}>
                <SelectTrigger><SelectValue placeholder="Select menu" /></SelectTrigger>
                <SelectContent>
                  {accessibleMenus.map(key => (
                    <SelectItem key={key} value={key}>{key}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Permission *</Label>
              <Select value={permissionId} onValueChange={setPermissionId}>
                <SelectTrigger><SelectValue placeholder="Select permission" /></SelectTrigger>
                <SelectContent>
                  {permissions.map((p: Permission) => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.permission_key}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Required</Label>
              <Switch checked={isRequired} onCheckedChange={setIsRequired} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isLinking}>{isLinking ? 'Linking...' : 'Link'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}