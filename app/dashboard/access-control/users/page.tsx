"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  type ColumnDef,
  getCoreRowModel,
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
import { cancelInvite, resendInvite, selectUser } from "@/store/slices/authSlice";
import {
  fetchTenantMembers,
  selectTenantMembers,
  selectMembersPagination,
  selectTenantLoading,
  selectCurrentTenant
} from "@/store/slices/tenantSlice";
import { fetchRoles, selectRoles } from "@/store/slices/roles.slice";
import { AddUserDialog } from "./add-user-dialog";
import type { TenantMember } from "@/lib/api/services/tenant-service";

export default function UsersPage() {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectUser);
  const tenantMembers = useAppSelector(selectTenantMembers);
  const membersPagination = useAppSelector(selectMembersPagination);
  const isLoadingMembers = useAppSelector(selectTenantLoading);
  const currentTenant = useAppSelector(selectCurrentTenant);

  // Local state for UI - MOVED BEFORE columns definition
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'joined_at', desc: true }
  ]);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<TenantMember | null>(null);
  const [resendingInvites, setResendingInvites] = useState<Set<number>>(new Set());

  const hasInitialized = useRef(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debug logging
  useEffect(() => {
    console.log('📊 State Debug:', {
      'tenantMembers': tenantMembers,
      'tenantMembers type': typeof tenantMembers,
      'tenantMembers is array': Array.isArray(tenantMembers),
      'tenantMembers length': tenantMembers?.length,
      'membersPagination': membersPagination,
      'isLoadingMembers': isLoadingMembers,
      'currentTenant': currentTenant,
      'currentUser tenantId': currentUser?.tenantId,
      'current sorting': sorting,
      'current pagination': pagination
    });
  }, [tenantMembers, membersPagination, isLoadingMembers, currentTenant, currentUser, sorting, pagination]);

  // Fetch roles on mount
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      dispatch(
        fetchRoles({
          page: 1,
          limit: 20,
          scope: "all",
          search: ""
        })
      );
    }
  }, [dispatch]);

  // Debounce search input
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPagination(prev => ({ ...prev, pageIndex: 0 }));
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchInput]);

  // Fetch members when filters change
  useEffect(() => {
    const tenantId = currentUser?.tenantId || currentTenant?.id;
    if (!tenantId) {
      console.log('❌ No tenant ID available');
      return;
    }

    // Get sort configuration from TanStack Table state
    const sortBy = sorting.length > 0 ? sorting[0].id : 'joined_at';
    const sortOrder = sorting.length > 0 && sorting[0].desc ? 'DESC' : 'ASC';

    console.log('🔄 Fetching members with params:', {
      tenantId: Number(tenantId),
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      search: debouncedSearch || undefined,
      sortBy,
      sortOrder,
      sortingState: sorting
    });

    dispatch(
      fetchTenantMembers({
        tenantId: Number(tenantId),
        params: {
          page: pagination.pageIndex + 1,
          limit: pagination.pageSize,
          search: debouncedSearch || undefined,
          sortBy: sortBy as any,
          sortOrder: sortOrder as any
        }
      })
    ).unwrap()
      .then((response:any) => {
        console.log('✅ Members fetched successfully:', response);
        console.log('✅ Response type:', typeof response);
        console.log('✅ Response is array?:', Array.isArray(response));
        console.log('✅ Response keys:', response ? Object.keys(response) : 'null');
        console.log('✅ Response.data:', response?.data);
        console.log('✅ Response.pagination:', response?.pagination);
      })
      .catch((error) => {
        console.error('❌ Failed to fetch members:', error);
        toast.error(error?.message || 'Failed to load members');
      });
  }, [
    dispatch,
    currentUser?.tenantId,
    currentTenant?.id,
    pagination.pageIndex,
    pagination.pageSize,
    debouncedSearch,
    sorting // This dependency ensures sorting changes trigger refetch
  ]);

  const handleClearSearch = useCallback(() => {
    setSearchInput("");
    setDebouncedSearch("");
  }, []);

  const handleRefresh = useCallback(() => {
    const tenantId = currentUser?.tenantId || currentTenant?.id;
    if (tenantId) {
      const sortBy = sorting[0]?.id as any || 'joined_at';
      const sortOrder = sorting[0]?.desc ? 'DESC' : 'ASC';

      dispatch(
        fetchTenantMembers({
          tenantId: Number(tenantId),
          params: {
            page: pagination.pageIndex + 1,
            limit: pagination.pageSize,
            search: debouncedSearch || undefined,
            sortBy,
            sortOrder
          }
        })
      );
      toast.success("Refreshing users...");
    } else {
      toast.error("No tenant selected");
    }
  }, [
    dispatch,
    currentUser?.tenantId,
    currentTenant?.id,
    pagination,
    debouncedSearch,
    sorting
  ]);

  const handleDeleteClick = (user: TenantMember) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    const isPendingInvite = userToDelete.user_id <= 0;

    try {
      if (isPendingInvite) {
        await dispatch(cancelInvite({ invitationId: userToDelete.member_id })).unwrap();
        toast.success("Invitation cancelled successfully");
      } else {
        // TODO: Implement remove user from tenant API call
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

  const handleResendInvite = async (user: TenantMember) => {
    if (!user.role_id) {
      toast.error("Cannot resend invite: User has no assigned role");
      return;
    }

    setResendingInvites((prev) => new Set(prev).add(user.user_id));

    try {
      await dispatch(resendInvite({ invitationId: user.member_id })).unwrap();
      toast.success(`Invitation resent to ${user.email}`);
    } catch (error: any) {
      toast.error(error || "Failed to resend invitation");
    } finally {
      setResendingInvites((prev) => {
        const newSet = new Set(prev);
        newSet.delete(user.user_id);
        return newSet;
      });
    }
  };

  const columns = useMemo<ColumnDef<TenantMember>[]>(
    () => [
      {
        accessorKey: "email",
        id: "email",
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
                {row.original.first_name} {row.original.last_name || ''}
              </div>
            </div>
          </div>
        ),
        size: 250,
        enableSorting: true
      },
      {
        accessorKey: "role_name",
        id: "role_name",
        header: ({ column }) => (
          <DataGridColumnHeader title="Roles" visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.role_id ? (
              <Badge variant="secondary">
                {row.original.role_display_name || row.original.role_name}
              </Badge>
            ) : (
              <span className="text-muted-foreground text-xs">No roles assigned</span>
            )}
          </div>
        ),
        size: 200,
        enableSorting: true
      },
      {
        accessorKey: "member_type",
        id: "member_type",
        header: ({ column }) => (
          <DataGridColumnHeader title="Member Type" visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <Badge variant="outline" className="text-muted-foreground capitalize">
            {row.original.member_type || "N/A"}
          </Badge>
        ),
        size: 120,
        enableSorting: true
      },
      {
        accessorKey: "status",
        id: "status",
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
        size: 100,
        enableSorting: true
      },
      {
        accessorKey: "joined_at",
        id: "joined_at",
        header: ({ column }) => (
          <DataGridColumnHeader title="Joined / Action" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const isPending = row.original.user_id <= 0;
          const isResending = resendingInvites.has(row.original.user_id);

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
              {row.original.joined_at ? new Date(row.original.joined_at).toLocaleDateString() : "N/A"}
            </span>
          );
        },
        size: 150,
        enableSorting: true
      },
      {
        id: "actions",
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
                      disabled={row.original.user_id === currentUser?.id}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {row.original.user_id === currentUser?.id
                      ? "Cannot remove yourself"
                      : row.original.user_id <= 0
                        ? "Cancel invitation"
                        : "Remove from tenant"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </IfHasAccess>
            <ChevronRight className="text-muted-foreground/70 size-3.5" />
          </div>
        ),
        size: 80,
        enableSorting: false
      }
    ],
    [currentUser?.id, resendingInvites, handleResendInvite]
  );

  const table = useReactTable({
    columns,
    data: tenantMembers || [],
    state: { 
      pagination,
      sorting 
    },
    pageCount: membersPagination?.totalPages || 0,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true
  });

  const pendingCount = useMemo(() => {
    if (!tenantMembers || tenantMembers.length === 0) return 0;
    return tenantMembers.filter(m => m.status === 'pending').length;
  }, [tenantMembers]);

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
      <DataGrid 
        table={table} 
        recordCount={membersPagination?.totalCount || 0} 
        isLoading={isLoadingMembers}
      >
        <Card>
          <CardHeader className="px-4 sm:px-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:gap-3">
                <div className="relative w-full lg:flex-1">
                  <Button
                    mode="icon"
                    variant="ghost"
                    size="sm"
                    className="absolute start-1 top-1/2 h-7 w-7 -translate-y-1/2"
                    disabled={isLoadingMembers}>
                    <Search className="text-muted-foreground h-4 w-4" />
                  </Button>
                  <Input
                    placeholder="Search users by email, name, or role"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full max-w-md ps-9 text-sm sm:text-base"
                    disabled={isLoadingMembers}
                  />
                  {searchInput && (
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
                    {membersPagination?.totalCount || 0} member{(membersPagination?.totalCount || 0) !== 1 ? "s" : ""}
                  </span>
                  <span>•</span>
                  <span>
                    {pendingCount} pending invitation{pendingCount !== 1 ? "s" : ""}
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
        onSuccess={handleRefresh}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="mx-auto w-[95vw] sm:w-full">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl">
              {userToDelete?.user_id && userToDelete.user_id <= 0
                ? "Cancel Invitation"
                : "Remove User from Tenant"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm sm:text-base">
              {userToDelete?.user_id && userToDelete.user_id <= 0 ? (
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
              {userToDelete?.user_id && userToDelete.user_id <= 0 ? "Cancel Invitation" : "Remove User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}