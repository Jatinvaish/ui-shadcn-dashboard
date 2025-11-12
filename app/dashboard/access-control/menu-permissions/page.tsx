'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { Plus, Search, X, Unlink, Menu } from 'lucide-react';
import { MenuPermission, Permission } from '@/lib/api/services/rbac-service';
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
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { IfHasAccess } from '@/components/guards/if-has-access';
import { ProtectedBreadcrumb } from '@/components/guards/protected-breadcrumb';
import { selectMenuPermissions, selectAllPermissions, selectMenuPermissionsLoading, selectMenuPermissionsPagination, fetchMenuPermissions, fetchAllPermissions, unlinkMenuPermission, linkMenuPermission } from '@/store/slices/menu-permissions.slice';
 

export const MenuPermissionsPage = () => {
  const dispatch = useAppDispatch();
  
  const menuPermissions = useAppSelector(selectMenuPermissions);
  const allPermissions = useAppSelector(selectAllPermissions);
  const isLoading = useAppSelector(selectMenuPermissionsLoading);
  const paginationMeta = useAppSelector(selectMenuPermissionsPagination);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'created_at', desc: true },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  // Fetch menu permissions when filters change
  useEffect(() => {
    dispatch(fetchMenuPermissions({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      search: searchQuery,
    }));
  }, [dispatch, pagination.pageIndex, pagination.pageSize, searchQuery]);

  // Fetch all permissions on mount
  useEffect(() => {
    dispatch(fetchAllPermissions());
  }, [dispatch]);

  const handleUnlink = async (mapping: MenuPermission) => {
    if (confirm(`Unlink ${mapping.permission_name} from ${mapping.menu_key}?`)) {
      try {
        await dispatch(unlinkMenuPermission({
          menuKey: mapping.menu_key,
          permissionId: mapping.permission_id,
        })).unwrap();
        toast.success('Menu permission unlinked successfully');
      } catch (error: any) {
        toast.error(error || 'Failed to unlink permission');
      }
    }
  };

  const columns = useMemo<ColumnDef<MenuPermission>[]>(
    () => [
      {
        accessorKey: 'menu_key',
        id: 'menu_key',
        header: ({ column }) => (
          <DataGridColumnHeader title="Menu Key" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10">
                <Menu className="h-4 w-4 text-primary" />
              </div>
              <div className="font-medium text-sm">{row.original.menu_key}</div>
            </div>
          );
        },
        size: 250,
        meta: {
          headerTitle: 'Menu Key',
          skeleton: (
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 rounded" />
              <Skeleton className="h-4 w-32" />
            </div>
          ),
        },
        enableSorting: true,
        enableHiding: false,
      },
      {
        accessorKey: 'permission_name',
        id: 'permission_name',
        header: ({ column }) => (
          <DataGridColumnHeader title="Permission" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const perm = row.original;
          return (
            <div className="space-y-1">
              <div className="font-medium text-sm">{perm.permission_key}</div>
              <div className="text-xs text-muted-foreground">
                {perm.resource} → {perm.action}
              </div>
            </div>
          );
        },
        size: 200,
        meta: {
          headerTitle: 'Permission',
          skeleton: (
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          ),
        },
        enableSorting: true,
        enableHiding: true,
      },
      {
        accessorKey: 'category',
        id: 'category',
        header: ({ column }) => (
          <DataGridColumnHeader title="Category" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          return (
            <Badge variant="secondary">
              {row.original.category || 'Uncategorized'}
            </Badge>
          );
        },
        size: 150,
        meta: {
          headerTitle: 'Category',
          skeleton: <Skeleton className="w-20 h-6" />,
        },
        enableSorting: true,
        enableHiding: true,
      },
      {
        accessorKey: 'is_required',
        id: 'is_required',
        header: ({ column }) => (
          <DataGridColumnHeader title="Required" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          return (
            <Badge variant={row.original.is_required ? 'primary' : 'outline'}>
              {row.original.is_required ? 'Required' : 'Optional'}
            </Badge>
          );
        },
        size: 100,
        meta: {
          headerTitle: 'Required',
          skeleton: <Skeleton className="w-16 h-6" />,
        },
        enableSorting: true,
        enableHiding: true,
      },
      {
        accessorKey: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <IfHasAccess menuKey="access-control.menu-permissions.delete">
              <Button
                mode="icon"
                variant="ghost"
                size="sm"
                onClick={() => handleUnlink(row.original)}
              >
                <Unlink className="h-4 w-4" />
              </Button>
            </IfHasAccess>
          </div>
        ),
        meta: {
          skeleton: <Skeleton className="size-4" />,
        },
        size: 80,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
      },
    ],
    []
  );

  const [columnOrder, setColumnOrder] = useState<string[]>(
    columns.map((column) => column.id as string)
  );

  const table = useReactTable({
    columns,
    data: menuPermissions,
    pageCount: paginationMeta.totalPages,
    getRowId: (row: MenuPermission) => row.id.toString(),
    state: {
      pagination,
      sorting,
      columnOrder,
    },
    columnResizeMode: 'onChange',
    onColumnOrderChange: setColumnOrder,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  const DataGridToolbar = () => {
    const [inputValue, setInputValue] = useState(searchQuery);

    const handleSearch = () => {
      setSearchQuery(inputValue);
      setPagination({ ...pagination, pageIndex: 0 });
    };

    return (
      <CardHeader className="flex-col flex-wrap sm:flex-row items-stretch sm:items-center py-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative">
            <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search menu permissions"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              disabled={isLoading}
              className="ps-9 w-full sm:w-64"
            />
            {searchQuery.length > 0 && (
              <Button
                mode="icon"
                variant="dim"
                className="absolute end-1.5 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => setSearchQuery('')}
              >
                <X />
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end">
          <IfHasAccess menuKey="access-control.menu-permissions.create">
            <Button
              disabled={isLoading}
              onClick={() => setLinkDialogOpen(true)}
            >
              <Plus />
              Link Permission
            </Button>
          </IfHasAccess>
        </div>
      </CardHeader>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <ProtectedBreadcrumb
        items={[
          { label: 'Access Control', menuKey: 'access-control', href: '/access-control' },
          { label: 'Menu Permissions', menuKey: 'access-control.menu-permissions', href: '/access-control/menu-permissions', isCurrent: true },
        ]}
      />

      <DataGrid
        table={table}
        recordCount={paginationMeta.totalItems}
        isLoading={isLoading}
        tableLayout={{
          columnsResizable: true,
          columnsPinnable: true,
          columnsMovable: true,
          columnsVisibility: true,
        }}
        tableClassNames={{
          edgeCell: 'px-5',
        }}
      >
        <Card>
          <DataGridToolbar />
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

      <LinkMenuPermissionDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        permissions={allPermissions}
        onSuccess={() => {
          dispatch(fetchMenuPermissions({
            page: pagination.pageIndex + 1,
            limit: pagination.pageSize,
          }));
          setLinkDialogOpen(false);
        }}
      />
    </div>
  );
};

// Link Dialog Component
const LinkMenuPermissionDialog = ({
  open,
  onOpenChange,
  permissions,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permissions: Permission[];
  onSuccess: () => void;
}) => {
  const dispatch = useAppDispatch();
  const [menuKey, setMenuKey] = useState('');
  const [permissionId, setPermissionId] = useState('');
  const [isRequired, setIsRequired] = useState(true);
  const [isLinking, setIsLinking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuKey || !permissionId) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsLinking(true);
    try {
      await dispatch(linkMenuPermission({
        menuKey,
        permissionId: Number(permissionId),
        isRequired,
      })).unwrap();
      
      toast.success('Menu permission linked successfully');
      setMenuKey('');
      setPermissionId('');
      setIsRequired(true);
      onSuccess();
    } catch (error: any) {
      toast.error(error || 'Failed to link permission');
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Link Menu Permission</DialogTitle>
            <DialogDescription>
              Associate a permission with a menu item to control access.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="menuKey">Menu Key *</Label>
              <Input
                id="menuKey"
                placeholder="e.g., access-control.roles"
                value={menuKey}
                onChange={(e) => setMenuKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Use dot notation for nested menus
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="permission">Permission *</Label>
              <Select value={permissionId} onValueChange={setPermissionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select permission" />
                </SelectTrigger>
                <SelectContent>
                  {permissions.map((perm) => (
                    <SelectItem key={perm.id} value={perm.id.toString()}>
                      {perm.permission_key} - {perm.description || perm.resource}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isRequired">Required Permission</Label>
                <p className="text-xs text-muted-foreground">
                  User must have this permission to access menu
                </p>
              </div>
              <Switch
                id="isRequired"
                checked={isRequired}
                onCheckedChange={setIsRequired}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLinking}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLinking}>
              {isLinking ? 'Linking...' : 'Link Permission'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MenuPermissionsPage;