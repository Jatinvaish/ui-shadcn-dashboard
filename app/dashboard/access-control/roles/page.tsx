// app/dashboard/access-control/roles/page.tsx - COMPLETE VERSION
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronRight, Plus, Search, X, Edit, Trash2, Users, Shield, Lock, Copy, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTable } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchRoles,
  deleteRole,
  cloneRole,
  selectRoles,
  selectRolesLoading,
  selectRolesPagination,
} from '@/store/slices/roles.slice';
import { selectUser } from '@/store/slices/authSlice';
import { IfHasAccess } from '@/components/guards/if-has-access';
import { ProtectedBreadcrumb } from '@/components/guards/protected-breadcrumb';
import CreateRoleDialog from './components/create-role-dialog';
import { Role } from '@/lib/api/services/rbac-service';
import CloneRoleDialog from './components/clone-role-dialog';

const getUserType = (user: any): string => {
  return user?.userType || user?.user_type || '';
};

const canManageSystemResources = (userType: string): boolean => {
  return userType === 'super_admin' || userType === 'saas_admin' || userType === 'owner';
};

const canEditRole = (userType: string, role: Role): boolean => {
  if (canManageSystemResources(userType)) return true;
  if (role.is_system_role) return false;
  return true;
};

const canDeleteRole = (userType: string, role: Role): boolean => {
  if (role.is_system_role) return false;
  if (canManageSystemResources(userType)) return true;
  return true;
};

const RolesListPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const roles = useAppSelector(selectRoles);
  const isLoading = useAppSelector(selectRolesLoading);
  const paginationMeta = useAppSelector(selectRolesPagination);
  const currentUser = useAppSelector(selectUser);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'created_at', desc: true },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'system' | 'tenant'>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [roleToClone, setRoleToClone] = useState<Role | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredRoles = useMemo(() => {
    if (!currentUser) return roles;
    const userType = getUserType(currentUser);
    if (canManageSystemResources(userType)) {
      return roles;
    }
    return roles.filter(r => !r.is_system_role);
  }, [roles, currentUser]);

  useEffect(() => {
    dispatch(fetchRoles({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      scope: scopeFilter,
      search: searchQuery,
    }));
  }, [dispatch, pagination.pageIndex, pagination.pageSize, scopeFilter, searchQuery]);

  const handleDeleteClick = (role: Role) => {
    if (role.is_system_role) {
      toast.error('System roles cannot be deleted');
      return;
    }
    
    if (!currentUser) {
      toast.error('User not authenticated');
      return;
    }
    
    const userType = getUserType(currentUser);
    if (!canDeleteRole(userType, role)) {
      toast.error('You do not have permission to delete this role');
      return;
    }
    
    setRoleToDelete(role);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (roleToDelete) {
      setIsDeleting(true);
      try {
        await dispatch(deleteRole(roleToDelete.id)).unwrap();
        toast.success('Role deleted successfully');
        setDeleteDialogOpen(false);
        setRoleToDelete(null);
      } catch (error: any) {
        toast.error(error || 'Failed to delete role');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleCloneClick = (role: Role) => {
    setRoleToClone(role);
    setCloneDialogOpen(true);
  };

  const handleRowClick = (row: Role) => {
    router.push(`/dashboard/access-control/roles/${row.id}`);
  };

  const canUserEditRole = (role: Role): boolean => {
    if (!currentUser) return false;
    const userType = getUserType(currentUser);
    return canEditRole(userType, role);
  };

  const canUserDeleteRole = (role: Role): boolean => {
    if (!currentUser) return false;
    const userType = getUserType(currentUser);
    return canDeleteRole(userType, role);
  };

  const columns = useMemo<ColumnDef<Role>[]>(
    () => [
      {
        accessorKey: 'display_name',
        id: 'display_name',
        header: ({ column }) => (
          <DataGridColumnHeader title="Role Name" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const role = row.original;
          const displayName = role.display_name || role.displayName || role.name;
          const isSystemRole = role.is_system_role || false;
          
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-px">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{displayName}</span>
                  {isSystemRole && (
                    <Lock className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
                <div className="text-muted-foreground text-xs">{role.name}</div>
              </div>
            </div>
          );
        },
        size: 300,
        enableSorting: true,
        enableHiding: false,
      },
      {
        accessorKey: 'description',
        id: 'description',
        header: ({ column }) => (
          <DataGridColumnHeader title="Description" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          return (
            <div className="text-sm text-muted-foreground max-w-md truncate">
              {row.original.description || '-'}
            </div>
          );
        },
        size: 250,
        enableSorting: false,
        enableHiding: true,
      },
      {
        accessorKey: 'hierarchy_level',
        id: 'hierarchy_level',
        header: ({ column }) => (
          <DataGridColumnHeader title="Level" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const level = row.original.hierarchy_level || 0;
          return (
            <Badge variant="secondary">
              Level {level}
            </Badge>
          );
        },
        size: 100,
        enableSorting: true,
        enableHiding: true,
      },
      {
        accessorKey: 'is_system_role',
        id: 'is_system_role',
        header: ({ column }) => (
          <DataGridColumnHeader title="Type" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const isSystem = row.original.is_system_role || false;
          return (
            <Badge variant={isSystem ? 'primary' : 'outline'}>
              {isSystem ? 'System' : 'Custom'}
            </Badge>
          );
        },
        size: 100,
        enableSorting: true,
        enableHiding: true,
      },
      {
        accessorKey: 'users_count',
        id: 'users_count',
        header: ({ column }) => (
          <DataGridColumnHeader title="Users" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{row.original.users_count || 0}</span>
            </div>
          );
        },
        size: 100,
        enableSorting: true,
        enableHiding: true,
      },
      {
        accessorKey: 'permissions_count',
        id: 'permissions_count',
        header: ({ column }) => (
          <DataGridColumnHeader title="Permissions" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{row.original.permissions_count || 0}</span>
            </div>
          );
        },
        size: 125,
        enableSorting: true,
        enableHiding: true,
      },
      {
        accessorKey: 'actions',
        header: '',
        cell: ({ row }) => {
          const role = row.original;
          const canEdit = canUserEditRole(role);
          const canDelete = canUserDeleteRole(role);

          return (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button mode="icon" variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboard/access-control/roles/${role.id}`);
                    }}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  
                  {canEdit && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/access-control/roles/${role.id}/edit`);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Role
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloneClick(role);
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Clone Role
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  
                  {canDelete && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(role);
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Role
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <ChevronRight className="text-muted-foreground/70 size-3.5" />
            </div>
          );
        },
        size: 100,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
      },
    ],
    [router, currentUser]
  );

  const [columnOrder, setColumnOrder] = useState<string[]>(
    columns.map((column) => column.id as string)
  );

  const table = useReactTable({
    columns,
    data: filteredRoles,
    pageCount: paginationMeta.totalPages,
    getRowId: (row: Role) => row.id.toString(),
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
              placeholder="Search roles"
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
          <Select
            onValueChange={(value) => setScopeFilter(value as 'all' | 'system' | 'tenant')}
            value={scopeFilter}
            disabled={isLoading}
          >
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Filter by scope" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="tenant">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-end gap-2">
          <IfHasAccess menuKey="access-control.roles.bulk-assign">
            <Button
              variant="outline"
              disabled={isLoading}
              onClick={() => router.push('/dashboard/access-control/roles/bulk-assign')}
            >
              Bulk Assign
            </Button>
          </IfHasAccess>
          <IfHasAccess menuKey="access-control.roles.create">
            <Button
              disabled={isLoading}
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus />
              Create Role
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
          { label: 'Access Control', menuKey: 'access-control', href: '/dashboard/access-control' },
          { label: 'Roles', menuKey: 'access-control.roles', href: '/dashboard/access-control/roles', isCurrent: true },
        ]}
      />

      <DataGrid
        table={table}
        recordCount={paginationMeta.totalItems}
        isLoading={isLoading}
        onRowClick={handleRowClick}
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

      <CreateRoleDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          dispatch(fetchRoles({
            page: pagination.pageIndex + 1,
            limit: pagination.pageSize,
            scope: scopeFilter,
          }));
          setCreateDialogOpen(false);
        }}
      />

      <CloneRoleDialog
        open={cloneDialogOpen}
        onOpenChange={setCloneDialogOpen}
        sourceRole={roleToClone}
        onSuccess={() => {
          dispatch(fetchRoles({
            page: pagination.pageIndex + 1,
            limit: pagination.pageSize,
            scope: scopeFilter,
          }));
          setCloneDialogOpen(false);
          setRoleToClone(null);
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{roleToDelete?.display_name || roleToDelete?.name}"? This action cannot be undone.
              {(roleToDelete?.users_count || 0) > 0 && (
                <div className="mt-2 text-destructive">
                  Warning: This role is assigned to {roleToDelete?.users_count} user(s).
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RolesListPage;