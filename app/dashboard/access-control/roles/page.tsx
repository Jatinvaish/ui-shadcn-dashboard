// app/dashboard/access-control/roles/page.tsx - RESPONSIVE VERSION
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
import { ChevronRight, Plus, Search, X, Edit, Trash2, Users, Shield, Lock, Copy, MoreHorizontal, Loader2 } from 'lucide-react';
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
  const [searchInput, setSearchInput] = useState('');
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

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const handleRefresh = () => {
    dispatch(fetchRoles({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      scope: scopeFilter,
      search: searchQuery,
    }));
    toast.success('Refreshing roles...');
  };

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
              <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
                <Shield className="text-primary h-4 w-4" />
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

                  {canDelete && (
                    <>
                      <DropdownMenuSeparator />
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
                    </>
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

  return (
    <div className="flex flex-col gap-4">
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
      >
        <Card>
          <CardHeader className="px-4 sm:px-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:gap-3">
                {/* Search Bar - Full width on mobile, auto on large screens */}
                <div className="relative w-full lg:flex-1">
                  <Button
                    mode="icon"
                    variant="ghost"
                    size="sm"
                    className="absolute start-1 top-1/2 h-7 w-7 -translate-y-1/2"
                    onClick={handleSearch}
                    disabled={isLoading}
                  >
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Input
                    placeholder="Search roles by name or description"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full max-w-md ps-9 text-sm sm:text-base"
                    disabled={isLoading}
                  />
                  {searchQuery && (
                    <Button
                      mode="icon"
                      variant="ghost"
                      size="sm"
                      className="absolute end-1 top-1/2 h-7 w-7 -translate-y-1/2"
                      onClick={handleClearSearch}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Buttons - Stacked on small screens, inline on large screens */}
                <div className="xs:flex-row xs:gap-2 flex w-full flex-col gap-2 sm:gap-3 lg:w-auto">

                  <div className="w-full lg:w-auto lg:flex-row lg:gap-2 xs:flex-row xs:gap-2 flex flex-col gap-2 sm:gap-3">
                    <Select
                      onValueChange={(value) => {
                        setScopeFilter(value as 'all' | 'system' | 'tenant');
                        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                      }}
                      value={scopeFilter}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="xs:w-auto w-full">
                        <SelectValue placeholder="Filter by scope" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="tenant">Custom</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      onClick={handleRefresh}
                      disabled={isLoading}
                      variant="outline"
                      className="xs:w-auto flex w-full items-center gap-2 bg-transparent"
                    >
                      <Loader2
                        className={`h-4 w-4 flex-shrink-0 ${isLoading ? 'animate-spin' : ''}`}
                      />
                      <span>Refresh</span>
                    </Button>

                    <IfHasAccess menuKey="access-control.roles.bulk-assign">
                      <Button
                        variant="outline"
                        disabled={isLoading}
                        onClick={() => router.push('/dashboard/access-control/roles/bulk-assign')}
                        className="xs:w-auto flex w-full items-center gap-2 bg-transparent"
                      >
                        <Users className="h-4 w-4 flex-shrink-0" />
                        <span>Bulk Assign</span>
                      </Button>
                    </IfHasAccess>

                    <IfHasAccess menuKey="access-control.roles.create">
                      <Button
                        disabled={isLoading}
                        onClick={() => setCreateDialogOpen(true)}
                        className="xs:w-auto flex w-full items-center gap-2"
                      >
                        <Plus className="h-4 w-4 flex-shrink-0" />
                        <span>Create Role</span>
                      </Button>
                    </IfHasAccess>
                  </div>
                </div>
              </div>

              <div className="text-muted-foreground flex flex-wrap items-center gap-1 text-xs sm:gap-2 sm:text-sm">
                <span>
                  {filteredRoles.length} role{filteredRoles.length !== 1 ? 's' : ''}
                </span>
                <span>•</span>
                <span>
                  {filteredRoles.filter((r) => r.is_system_role).length} system
                </span>
                <span>•</span>
                <span>
                  {filteredRoles.filter((r) => !r.is_system_role).length} custom
                </span>
              </div>
            </div>
          </CardHeader>

          <CardTable className="overflow-x-auto">
            <ScrollArea className="w-full">
              <DataGridTable />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardTable>

          <CardFooter className="px-4 sm:px-4">
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
        <AlertDialogContent className="mx-auto w-[95vw] sm:w-full">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl">Delete Role</AlertDialogTitle>
            <AlertDialogDescription className="text-sm sm:text-base">
              Are you sure you want to delete <strong>"{roleToDelete?.display_name || roleToDelete?.name}"</strong>? 
              <br />
              <br />
              This action cannot be undone.
              {(roleToDelete?.users_count || 0) > 0 && (
                <div className="mt-2 text-destructive font-medium">
                  ⚠️ Warning: This role is assigned to {roleToDelete?.users_count} user(s).
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col-reverse gap-2 sm:flex-row">
            <AlertDialogCancel className="w-full sm:w-auto" disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
            >
              {isDeleting ? 'Deleting...' : 'Delete Role'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RolesListPage;