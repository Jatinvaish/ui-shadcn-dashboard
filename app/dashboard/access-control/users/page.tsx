"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  type ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type PaginationState,
  type SortingState,
  useReactTable
} from "@tanstack/react-table";
import { Plus, Search, X, Trash2, Menu, ChevronRight, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTable } from "@/components/ui/card";
import { DataGrid } from "@/components/ui/data-grid";
import { DataGridColumnHeader } from "@/components/ui/data-grid-column-header";
import { DataGridPagination } from "@/components/ui/data-grid-pagination";
import { DataGridTable } from "@/components/ui/data-grid-table";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { IfHasAccess } from "@/components/guards/if-has-access";
import { ProtectedBreadcrumb } from "@/components/guards/protected-breadcrumb";
import { cancelInvite, resendInvite, selectUser, sendInvite } from "@/store/slices/authSlice";
import {
  fetchTenantMembers,
  selectTenantMembers,
  selectTenantLoading,
  selectCurrentTenant
} from "@/store/slices/tenantSlice";
import { fetchRoles, selectRoles, selectRolesLoading } from "@/store/slices/roles.slice";
import { useMenuPermissions } from "@/hooks/use-menu-permissions";
import { Combobox } from "@/components/ui/combobox";
import { Role } from "@/lib/api/services/rbac-service";

interface User {
  id: number;
  memberId: number;
  email: string;
  firstName?: string;
  lastName?: string;
  userType?: string;
  createdAt?: string;
  status?: string;
  isActive?: boolean;
  memberType?: string;
  joinedAt?: string;
  roles?: Array<{
    id: number;
    name: string;
    displayName?: string;
  }>;
}

export default function UsersPage() {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectUser);
  const tenantMembers = useAppSelector(selectTenantMembers);
  const isLoadingMembers = useAppSelector(selectTenantLoading);
  const currentTenant = useAppSelector(selectCurrentTenant);
  const { accessibleMenus, userPermissions, isSystemAdmin } = useMenuPermissions();

  // Fetch roles from roles slice
  const allRoles = useAppSelector(selectRoles);
  const rolesLoading = useAppSelector(selectRolesLoading);

  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [roleSearchQuery, setRoleSearchQuery] = useState("");
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [resendingInvites, setResendingInvites] = useState<Set<number>>(new Set());

  const hasInitialized = useRef(false);

  // Fetch roles with hardcoded pagination
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;

      // Fetch roles with page 1 and size 20
      dispatch(
        fetchRoles({
          page: 1,
          limit: 20,
          scope: "all",
          search: roleSearchQuery
        })
      );

      // Fetch tenant members
      const tenantId = currentUser?.tenantId || currentTenant?.id;
      if (tenantId) {
        dispatch(fetchTenantMembers(Number(tenantId)));
      } else {
        toast.error("No tenant selected. Please select a tenant first.");
      }
    }
  }, [dispatch, currentUser?.tenantId, currentTenant?.id, roleSearchQuery]);

  useEffect(() => {
    if (tenantMembers && tenantMembers.length > 0) {
      const transformedUsers: User[] = tenantMembers.map((member) => ({
        id: member.user_id,
        memberId: member.member_id,
        email: member.email,
        firstName: member.first_name,
        lastName: member.last_name,
        userType: member.member_type,
        status: member.status,
        isActive: member.is_active,
        memberType: member.member_type,
        createdAt: member.joined_at,
        joinedAt: member.joined_at,
        roles: member.role_id
          ? [
              {
                id: member.role_id,
                name: member.role_name || "Unknown",
                displayName: member.role_display_name || "Unknown"
              }
            ]
          : []
      }));

      if (searchQuery) {
        const term = searchQuery.toLowerCase();
        const filtered = transformedUsers.filter(
          (user) =>
            user.email.toLowerCase().includes(term) ||
            user.firstName?.toLowerCase().includes(term) ||
            user.lastName?.toLowerCase().includes(term) ||
            user.roles?.some((r) => r.name.toLowerCase().includes(term))
        );
        setUsers(filtered);
      } else {
        setUsers(transformedUsers);
      }
    } else {
      setUsers([]);
    }
  }, [tenantMembers, searchQuery]);

  const handleSearch = useCallback(() => {
    setSearchQuery(searchInput);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [searchInput]);

  const handleClearSearch = useCallback(() => {
    setSearchInput("");
    setSearchQuery("");
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  const handleRefresh = useCallback(() => {
    const tenantId = currentUser?.tenantId || currentTenant?.id;
    if (tenantId) {
      dispatch(fetchTenantMembers(Number(tenantId)));
      toast.success("Refreshing users...");
    } else {
      toast.error("No tenant selected");
    }
  }, [dispatch, currentUser?.tenantId, currentTenant?.id]);

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    const isPendingInvite = userToDelete.id <= 0;

    try {
      if (isPendingInvite) {
        // Cancel pending invitation
        await dispatch(cancelInvite({ invitationId: userToDelete.memberId })).unwrap();
        toast.success("Invitation cancelled successfully");
      } else {
        // TODO: Implement remove user from tenant API call
        // await dispatch(removeUserFromTenant({ memberId: userToDelete.memberId })).unwrap();
        toast.success("User removed from tenant successfully");
      }

      setDeleteDialogOpen(false);
      setUserToDelete(null);
      handleRefresh();
    } catch (error: any) {
      const action = isPendingInvite ? "cancel invitation" : "remove user from tenant";
      toast.error(error?.message || `Failed to ${action}`);
    }
  };

  const handleResendInvite = async (user: User) => {
    if (!user.roles || user.roles.length === 0) {
      toast.error("Cannot resend invite: User has no assigned role");
      return;
    }

    setResendingInvites((prev) => new Set(prev).add(user.id));

    try {
      await dispatch(resendInvite({ invitationId: user.memberId })).unwrap();

      toast.success(`Invitation resent to ${user.email}`);
    } catch (error: any) {
      toast.error(error || "Failed to resend invitation");
    } finally {
      setResendingInvites((prev) => {
        const newSet = new Set(prev);
        newSet.delete(user.id);
        return newSet;
      });
    }
  };

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: "email",
        header: ({ column }) => (
          <DataGridColumnHeader title="Email" visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
              <Menu className="text-primary h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-medium">{row.original.email}</div>
              <div className="text-muted-foreground text-xs">
                {row.original.firstName} {row.original.lastName}
              </div>
            </div>
          </div>
        ),
        size: 250
      },
      {
        accessorKey: "roles",
        header: ({ column }) => (
          <DataGridColumnHeader title="Roles" visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.roles && row.original.roles.length > 0 ? (
              row.original.roles.map((role) => (
                <Badge key={role.id} variant="secondary">
                  {role.displayName || role.name}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground text-xs">No roles assigned</span>
            )}
          </div>
        ),
        size: 200
      },
      {
        accessorKey: "memberType",
        header: ({ column }) => (
          <DataGridColumnHeader title="Member Type" visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <Badge variant="outline" className="text-muted-foreground capitalize">
            {row.original.memberType || "N/A"}
          </Badge>
        ),
        size: 120
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataGridColumnHeader title="Status" visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            className={
              row.original.status === "pending"
                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                : ""
            }>
            {row.original.status === "active"
              ? "Active"
              : row.original.status === "pending"
                ? "Pending"
                : "Cancelled"}
          </Badge>
        ),
        size: 100
      },
      {
        accessorKey: "joinedAt",
        header: ({ column }) => (
          <DataGridColumnHeader title="Joined / Action" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const isPending = row.original.id <= 0;
          const isResending = resendingInvites.has(row.original.id);

          if (isPending) {
            return (
              <IfHasAccess menuKey="access-control.users">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResendInvite(row.original)}
                        disabled={isResending}>
                        {isResending ? (
                          <>
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-3 w-3" />
                            Resend
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Resend invitation email</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </IfHasAccess>
            );
          }

          return (
            <span className="text-muted-foreground text-sm">
              {row.original.joinedAt ? new Date(row.original.joinedAt).toLocaleDateString() : "N/A"}
            </span>
          );
        },
        size: 150
      },
      {
        accessorKey: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <IfHasAccess menuKey="access-control.users">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      mode="icon"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(row.original)}
                      disabled={row.original.id === currentUser?.id}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {row.original.id === currentUser?.id
                      ? "Cannot remove yourself"
                      : row.original.id <= 0
                        ? "Cancel invitation"
                        : "Remove from tenant"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </IfHasAccess>
            <ChevronRight className="text-muted-foreground/70 size-3.5" />
          </div>
        ),
        size: 80
      }
    ],
    [currentUser?.id, resendingInvites]
  );

  const table = useReactTable({
    columns,
    data: users,
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false
  });

  return (
    <div className="flex flex-col gap-4">
      <ProtectedBreadcrumb
        items={[
          { label: "Access Control", menuKey: "access-control", href: "/dashboard/access-control" },
          {
            label: "Users",
            menuKey: "access-control.users",
            href: "/dashboard/access-control/users",
            isCurrent: true
          }
        ]}
      />

      <DataGrid table={table} recordCount={users.length} isLoading={isLoadingMembers}>
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
                    disabled={isLoadingMembers}>
                    <Search className="text-muted-foreground h-4 w-4" />
                  </Button>
                  <Input
                    placeholder="Search users by email, name, or role"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="w-full max-w-md ps-9 text-sm sm:text-base"
                    disabled={isLoadingMembers}
                  />
                  {searchQuery && (
                    <Button
                      mode="icon"
                      variant="ghost"
                      size="sm"
                      className="absolute end-1 top-1/2 h-7 w-7 -translate-y-1/2"
                      onClick={handleClearSearch}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Buttons - Stacked on small screens, inline on large screens */}
                <div className="xs:flex-row xs:gap-2 flex w-full flex-col gap-2 sm:gap-3 lg:w-auto">
                  <div className="xs:flex-row xs:gap-2 flex w-full flex-col gap-2 sm:gap-3 lg:w-auto lg:flex-row lg:gap-2">
                    <Button
                      onClick={handleRefresh}
                      disabled={isLoadingMembers}
                      variant="outline"
                      className="xs:w-auto flex w-full items-center gap-2 bg-transparent">
                      <Loader2
                        className={`h-4 w-4 flex-shrink-0 ${isLoadingMembers ? "animate-spin" : ""}`}
                      />
                      <span>Refresh</span>
                    </Button>

                    <IfHasAccess menuKey="access-control.users">
                      <Button
                        onClick={() => setAddUserDialogOpen(true)}
                        disabled={isLoadingMembers}
                        className="xs:w-auto flex w-full items-center gap-2">
                        <Plus className="h-4 w-4 flex-shrink-0" />
                        <span>Add User</span>
                      </Button>
                    </IfHasAccess>
                  </div>
                </div>
              </div>

              {currentTenant && (
                <div className="text-muted-foreground flex flex-wrap items-center gap-1 text-xs sm:gap-2 sm:text-sm">
                  <Badge variant="outline" className="text-xs">
                    {currentTenant.name}
                  </Badge>
                  <span>•</span>
                  <span>
                    {users.length} member{users.length !== 1 ? "s" : ""}
                  </span>
                  <span>•</span>
                  <span>
                    {users.filter((u) => u.status === "pending").length} pending invitation
                    {users.filter((u) => u.status === "pending").length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
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

      <AddUserDialog
        open={addUserDialogOpen}
        onOpenChange={setAddUserDialogOpen}
        roles={allRoles}
        rolesLoading={rolesLoading}
        roleSearchQuery={roleSearchQuery}
        onRoleSearchChange={setRoleSearchQuery}
        tenantId={currentUser?.tenantId || currentTenant?.id}
        onSuccess={() => {
          setAddUserDialogOpen(false);
          handleRefresh();
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="mx-auto w-[95vw] sm:w-full">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl">
              {userToDelete?.id && userToDelete.id <= 0
                ? "Cancel Invitation"
                : "Remove User from Tenant"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm sm:text-base">
              {userToDelete?.id && userToDelete.id <= 0 ? (
                <>
                  Are you sure you want to cancel the invitation for{" "}
                  <strong>{userToDelete?.email}</strong>?
                  <br />
                  <br />
                  The pending invitation will be removed and the user will not be able to join this
                  tenant.
                </>
              ) : (
                <>
                  Are you sure you want to remove <strong>{userToDelete?.email}</strong> from this
                  tenant?
                  <br />
                  <br />
                  This will revoke their access to all tenant resources. This action cannot be
                  undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col-reverse gap-2 sm:flex-row">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto">
              {userToDelete?.id && userToDelete.id <= 0 ? "Cancel Invitation" : "Remove User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AddUserDialog({
  open,
  onOpenChange,
  roles,
  rolesLoading,
  roleSearchQuery,
  onRoleSearchChange,
  tenantId,
  onSuccess
}: any) {
  const dispatch = useAppDispatch();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [internalRoleSearch, setInternalRoleSearch] = useState("");

  // Filter roles based on search
  const filteredRoles = useMemo(() => {
    if (!internalRoleSearch) return roles;
    const searchLower = internalRoleSearch.toLowerCase();
    return roles.filter((role: Role) => {
      const displayName = role.display_name || role.displayName || role.name || "";
      const name = role.name || "";
      return (
        displayName.toLowerCase().includes(searchLower) || name.toLowerCase().includes(searchLower)
      );
    });
  }, [roles, internalRoleSearch]);

  useEffect(() => {
    if (!open) {
      setUserName("");
      setUserEmail("");
      setRoleId("");
      setInternalRoleSearch("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!userEmail || !roleId) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!tenantId) {
      toast.error("No tenant selected");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsAdding(true);
    try {
      await dispatch(
        sendInvite({
          inviteeEmail: userEmail,
          inviteeName: userName,
          inviteeType: "staff",
          roleId: Number(roleId),
          invitationMessage: `You have been invited to join the tenant.`
        })
      ).unwrap();

      toast.success("Invitation sent successfully");
      onSuccess();
    } catch (error: any) {
      toast.error(error || "Failed to send invitation");
    } finally {
      setIsAdding(false);
    }
  };

  const handleClose = () => {
    if (!isAdding) {
      onOpenChange(false);
    }
  };

  const comboboxItems = roles.map((role: Role) => ({
    id: role.id,
    label: role.display_name || role.displayName || role.name,
    description: role.is_system_role ? "(System Role)" : undefined
  }));

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add User to Tenant</DialogTitle>
          <DialogDescription>
            Add an existing user or invite a new user to join this tenant
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              disabled={isAdding}
            />
            <p className="text-muted-foreground text-xs">
              Enter the email address. If user doesn't exist, an invitation will be sent.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              disabled={isAdding}
            />
            <p className="text-muted-foreground text-xs">Enter the full name (optional)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <div className="space-y-2">
              <Combobox
                value={roleId}
                onValueChange={setRoleId}
                items={comboboxItems}
                placeholder="Select a role..."
                emptyMessage="No roles found."
                disabled={isAdding}
                isLoading={rolesLoading}
              />
            </div>
            <p className="text-muted-foreground text-xs">Select the role to assign to this user</p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isAdding}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isAdding || !userEmail || !roleId || !tenantId}>
            {isAdding ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add User
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
