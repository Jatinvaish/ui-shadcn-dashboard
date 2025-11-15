// app/(dashboard)/access-control/user-roles/page.tsx
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { Plus, Search, X, Shield, Trash2, ChevronRight, Users, AlertCircle } from 'lucide-react';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { IfHasAccess } from '@/components/guards/if-has-access';
import { ProtectedBreadcrumb } from '@/components/guards/protected-breadcrumb';
import { RbacService, UserRole, Role } from '@/lib/api/services/rbac-service';
import { useAppSelector } from '@/store/hooks';
import { selectUser } from '@/store/slices/authSlice';
import { canManageSystemResources, canManageUserRole, getAssignableRoles } from '@/lib/rbac-utils';

interface UserRoleWithDetails extends UserRole {
  user_email?: string;
  display_name?: string;
  hierarchy_level?: number;
  is_active?: boolean;
  role_name?: string;
  is_system_role?: boolean;
}

export default function UserRolesPage() {
  const currentUser = useAppSelector(selectUser);
  const userType = currentUser?.userType || currentUser?.user_type || '';

  const [userRoles, setUserRoles] = useState<UserRoleWithDetails[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<UserRoleWithDetails | null>(null);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([{ id: 'assigned_at', desc: true }]);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch user roles
  const fetchUserRoles = useCallback(async () => {
    setIsLoading(true);
    try {
      // Mock API call - replace with actual implementation when backend provides user roles list
      // const response = await RbacService.listUserRoles({ page: pagination.pageIndex + 1, limit: pagination.pageSize, search: searchQuery });
      // setUserRoles(response.data);
      setUserRoles([]);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to fetch user roles');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize, searchQuery]);

  // Fetch all roles for assignment
  const fetchRoles = useCallback(async () => {
    try {
      const response:any = await RbacService.listRoles({ page: 1, limit: 1000 });
      const assignableRoles:any = getAssignableRoles(userType, response.data);
      setAllRoles(assignableRoles);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to fetch roles');
    }
  }, [userType]);

  useEffect(() => {
    fetchUserRoles();
  }, [fetchUserRoles]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // Check if user can remove role assignment
  const canUserRemoveRole = useCallback((userRole: UserRoleWithDetails): boolean => {
    if (!currentUser || !userRole.role) return false;
    
    if (canManageSystemResources(userType)) return true;
    
    if (userRole.role.isSystemRole) return false;
    
    return canManageUserRole(userType, userRole.role);
  }, [currentUser, userType]);

  const handleRemoveClick = (userRole: UserRoleWithDetails) => {
    if (!canUserRemoveRole(userRole)) {
      toast.error(userRole.role?.isSystemRole 
        ? 'Only system admins can remove system roles'
        : 'You cannot manage this role assignment'
      );
      return;
    }
    setItemToDelete(userRole);
    setDeleteDialogOpen(true);
  };

  const handleRemoveConfirm = async () => {
    if (!itemToDelete) return;

    try {
      await RbacService.removeRoleFromUser(itemToDelete.userId, itemToDelete.roleId);
      toast.success('Role removed from user');
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      fetchUserRoles();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to remove role');
    }
  };

  const columns = useMemo<ColumnDef<UserRoleWithDetails>[]>(
    () => [
      {
        accessorKey: 'display_name',
        id: 'display_name',
        header: ({ column }) => (
          <DataGridColumnHeader title="User" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const initials = row.original.display_name
            ?.split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase() || 'U';
          
          return (
            <div className="flex items-center gap-3">
              <Avatar className="size-8">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium text-sm">{row.original.display_name || 'Unknown User'}</div>
                <div className="text-xs text-muted-foreground">
                  {row.original.user_email || `ID: ${row.original.userId}`}
                </div>
              </div>
            </div>
          );
        },
        size: 250,
        enableSorting: true,
      },
      {
        accessorKey: 'role_name',
        id: 'role_name',
        header: ({ column }) => (
          <DataGridColumnHeader title="Role" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const isSystemRole = row.original.is_system_role;
          return (
            <div className="flex items-center gap-2">
              <Shield className={`h-4 w-4 ${isSystemRole ? 'text-orange-500' : 'text-primary'}`} />
              <span className="font-medium">{row.original.role_name || row.original.role?.displayName || 'Unknown Role'}</span>
              {isSystemRole && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline" className="text-xs">System</Badge>
                    </TooltipTrigger>
                    <TooltipContent>System Role</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          );
        },
        size: 200,
        enableSorting: true,
      },
      {
        accessorKey: 'hierarchy_level',
        id: 'hierarchy_level',
        header: ({ column }) => (
          <DataGridColumnHeader title="Level" visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <Badge variant="secondary">
            Level {row.original.hierarchy_level || row.original.role?.hierarchyLevel || 0}
          </Badge>
        ),
        size: 100,
        enableSorting: true,
      },
      {
        accessorKey: 'is_active',
        id: 'is_active',
        header: ({ column }) => (
          <DataGridColumnHeader title="Status" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const isActive = row.original.is_active ?? true;
          return (
            <Badge variant={isActive ? 'default' : 'destructive'}>
              {isActive ? 'Active' : 'Inactive'}
            </Badge>
          );
        },
        size: 100,
        enableSorting: true,
      },
      {
        accessorKey: 'assignedAt',
        id: 'assignedAt',
        header: ({ column }) => (
          <DataGridColumnHeader title="Assigned At" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const date = row.original.assignedAt ? new Date(row.original.assignedAt) : null;
          return (
            <div className="text-sm text-muted-foreground">
              {date ? date.toLocaleDateString() : 'N/A'}
            </div>
          );
        },
        size: 150,
        enableSorting: true,
      },
      {
        accessorKey: 'actions',
        header: '',
        cell: ({ row }) => {
          const canRemove = canUserRemoveRole(row.original);
          return (
            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
              <IfHasAccess menuKey="access-control.user-roles">
                {canRemove ? (
                  <Button 
                    mode="icon" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleRemoveClick(row.original)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button mode="icon" variant="ghost" size="sm" disabled>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {row.original.is_system_role 
                          ? 'System roles can only be removed by admins'
                          : 'You cannot manage this role assignment'
                        }
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
        enableSorting: false,
      },
    ],
    [canUserRemoveRole]
  );

  const table = useReactTable({
    columns,
    data: userRoles,
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
          {
            label: 'User Roles',
            menuKey: 'access-control.user-roles',
            href: '/dashboard/access-control/user-roles',
            isCurrent: true,
          },
        ]}
      />

      <DataGrid
        table={table}
        recordCount={userRoles.length}
        isLoading={isLoading}
        tableLayout={{
          columnsResizable: true,
          columnsMovable: true,
          columnsVisibility: true,
        }}
      >
        <Card>
          <CardHeader className="py-5">
            <div className="flex justify-between items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Search users or roles"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  disabled={isLoading}
                  className="ps-9"
                />
                {searchQuery && (
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
              <IfHasAccess menuKey="access-control.user-roles">
                <Button disabled={isLoading} onClick={() => setAssignDialogOpen(true)}>
                  <Plus />
                  Assign Role
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
          <CardFooter>
            <DataGridPagination />
          </CardFooter>
        </Card>
      </DataGrid>

      <AssignRoleDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        roles={allRoles}
        onSuccess={() => {
          fetchUserRoles();
          setAssignDialogOpen(false);
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Role Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the role "{itemToDelete?.role_name}" from user "{itemToDelete?.display_name}"?
              This will revoke all permissions associated with this role.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface AssignRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: Role[];
  onSuccess: () => void;
}

function AssignRoleDialog({ open, onOpenChange, roles, onSuccess }: AssignRoleDialogProps) {
  const currentUser = useAppSelector(selectUser);
  const userType = currentUser?.userType || currentUser?.user_type || '';

  const [userId, setUserId] = useState('');
  const [roleId, setRoleId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (!open) {
      setUserId('');
      setRoleId('');
      setValidationError('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!userId || !roleId) {
      toast.error('Please fill all required fields');
      return;
    }

    const userIdNum = Number(userId);
    const roleIdNum = Number(roleId);

    if (isNaN(userIdNum) || isNaN(roleIdNum)) {
      toast.error('Invalid user ID or role ID');
      return;
    }

    // Validate assignment
    try {
      const validation = await RbacService.validateRoleAssignment({
        userId: userIdNum,
        roleId: roleIdNum,
      });

      if (!validation.valid) {
        setValidationError(validation.reason || 'Invalid role assignment');
        return;
      }
    } catch (error: any) {
      console.error('Validation error:', error);
    }

    const selectedRole = roles.find(r => r.id === roleIdNum);
    if (selectedRole && selectedRole.isSystemRole && !canManageSystemResources(userType)) {
      toast.error('Only system admins can assign system roles');
      return;
    }

    setIsAssigning(true);
    try {
      await RbacService.assignRoleToUser({
        userId: userIdNum,
        roleId: roleIdNum,
      });
      toast.success('Role assigned successfully');
      onSuccess();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to assign role');
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Assign Role to User</DialogTitle>
            <DialogDescription>
              Assign a role to a user to grant them specific permissions.
              {!canManageSystemResources(userType) && (
                <span className="block mt-2 text-xs text-yellow-600 dark:text-yellow-500">
                  ⚠️ You can only assign roles you have permission to manage.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {validationError && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{validationError}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="userId">User ID *</Label>
              <Input
                id="userId"
                type="number"
                placeholder="Enter user ID"
                value={userId}
                onChange={e => setUserId(e.target.value)}
                disabled={isAssigning}
              />
              <p className="text-xs text-muted-foreground">
                Enter the numeric ID of the user
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={roleId} onValueChange={setRoleId} disabled={isAssigning}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No roles available
                    </div>
                  ) : (
                    roles.map(role => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Shield className={`h-3 w-3 ${role.isSystemRole ? 'text-orange-500' : 'text-primary'}`} />
                          <span>{role.displayName || role.name}</span>
                          {role.isSystemRole && (
                            <Badge variant="outline" className="text-xs ml-1">System</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {canManageSystemResources(userType) 
                  ? '✅ All roles available (System Admin)'
                  : `📋 ${roles.length} roles available based on your permissions`
                }
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isAssigning}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isAssigning || !userId || !roleId}>
              {isAssigning ? 'Assigning...' : 'Assign Role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}