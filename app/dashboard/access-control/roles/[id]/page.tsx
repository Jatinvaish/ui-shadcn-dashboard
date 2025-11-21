// app/dashboard/access-control/roles/[id]/page.tsx - PRODUCTION READY
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Shield,
  Users,
  Key,
  Edit,
  Trash2,
  ArrowLeft,
  Copy,
  Lock,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Search,
  Loader2,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchRoleById,
  deleteRole,
  selectCurrentRole,
  selectRolesLoading,
  clearCurrentRole,
  fetchRolePermissionsTree,
  selectPermissionsTree,
  bulkAssignRolePermissions
} from "@/store/slices/roles.slice";
import { selectUser } from "@/store/slices/authSlice";
import { ProtectedBreadcrumb } from "@/components/guards/protected-breadcrumb";
import { IfHasAccess } from "@/components/guards/if-has-access";
import CloneRoleDialog from "../components/clone-role-dialog";

const canManageSystemResources = (userType: string): boolean => {
  return userType === "super_admin" || userType === "saas_admin" || userType === "owner";
};

const RoleDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const roleId = Number(params.id);

  const role = useAppSelector(selectCurrentRole);
  const permissionsTree = useAppSelector(selectPermissionsTree);
  const isLoading = useAppSelector(selectRolesLoading);
  const currentUser = useAppSelector(selectUser);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [permissionChanges, setPermissionChanges] = useState<Map<number, "I" | "D">>(new Map());
  const [isSaving, setIsSaving] = useState(false);

  const userType = currentUser?.userType || currentUser?.user_type || "";
  const isGlobalAdmin = canManageSystemResources(userType);

  // ✅ Check if this is a system role
  const isSystemRole = role?.is_system_role || false;

  // ✅ Check if user can edit this role
  const canEdit = useMemo(() => {
    if (!role) return false;
    if (isGlobalAdmin) return true;
    if (isSystemRole) return false;
    return true;
  }, [role, isGlobalAdmin, isSystemRole]);

  const canDelete = useMemo(() => {
    if (!role) return false;
    if (isSystemRole) return false;
    if (isGlobalAdmin) return true;
    return true;
  }, [role, isSystemRole, isGlobalAdmin]);

  useEffect(() => {
    if (roleId && !isNaN(roleId)) {
      dispatch(fetchRoleById(roleId));
      dispatch(fetchRolePermissionsTree(roleId));
    }
    return () => {
      dispatch(clearCurrentRole());
    };
  }, [dispatch, roleId]);

  useEffect(() => {
    if (
      permissionsTree?.permissions_tree &&
      permissionsTree.permissions_tree.length > 0 &&
      expandedCategories.length === 0
    ) {
      setExpandedCategories([permissionsTree.permissions_tree[0].category]);
    }
  }, [permissionsTree, expandedCategories.length]);

  const handleDeleteClick = () => {
    if (!canDelete) {
      toast.error("You do not have permission to delete this role");
      return;
    }
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!role) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteRole(role.id)).unwrap();
      toast.success("Role deleted successfully");
      router.push("/dashboard/access-control/roles");
    } catch (error: any) {
      toast.error(error || "Failed to delete role");
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePermissionToggle = useCallback(
    (permissionId: number, currentlyChecked: boolean, isReadonly: boolean) => {
      // ✅ Prevent toggle if readonly or system role
      if (isReadonly || (isSystemRole && !isGlobalAdmin)) {
        toast.error("You cannot modify this permission");
        return;
      }

      const newChanges = new Map(permissionChanges);
      const changeMode = currentlyChecked ? "D" : "I";

      if (newChanges.has(permissionId)) {
        newChanges.delete(permissionId);
      } else {
        newChanges.set(permissionId, changeMode);
      }

      setPermissionChanges(newChanges);
    },
    [permissionChanges, isSystemRole, isGlobalAdmin]
  );

  const getEffectiveState = useCallback(
    (permissionId: number, originalState: boolean) => {
      const change = permissionChanges.get(permissionId);
      if (change === "I") return true;
      if (change === "D") return false;
      return originalState;
    },
    [permissionChanges]
  );

  const handleSavePermissions = async () => {
    if (!roleId || permissionChanges.size === 0) {
      toast.info("No changes to save");
      return;
    }

    if (isSystemRole && !isGlobalAdmin) {
      toast.error("System roles cannot be modified");
      return;
    }

    setIsSaving(true);
    try {
      const changes = Array.from(permissionChanges.entries()).map(([permissionId, mode]) => ({
        mode,
        permissionId
      }));

      const result: any = await dispatch(bulkAssignRolePermissions({ roleId, changes })).unwrap();
      console.log("🚀 ~ handleSavePermissions ~ result:", result);

      // ✅ Safe null check
      if (result?.filtered_out && result.filtered_out > 0) {
        toast.warning(
          `${result.filtered_out} changes were filtered (you don't have those permissions)`
        );
      } else {
        toast.success("Permissions updated successfully");
      }

      setPermissionChanges(new Map());
      dispatch(fetchRolePermissionsTree(roleId));
    } catch (error: any) {
      toast.error(error || "Failed to update permissions");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = useCallback(() => {
    setPermissionChanges(new Map());
    toast.info("Changes discarded");
  }, []);

  const filteredTree = useMemo(() => {
    if (!permissionsTree?.permissions_tree) return []; //
    if (!searchQuery) return permissionsTree.permissions_tree;

    return permissionsTree.permissions_tree
      .map((category) => {
        const filteredPerms = category.permissions.filter((perm) => {
          const q = searchQuery.toLowerCase();
          return (
            perm.permission_key.toLowerCase().includes(q) ||
            perm.resource.toLowerCase().includes(q) ||
            perm.action.toLowerCase().includes(q) ||
            (perm.description && perm.description.toLowerCase().includes(q))
          );
        });
        return { ...category, permissions: filteredPerms };
      })
      .filter((cat) => cat.permissions.length > 0);
  }, [permissionsTree, searchQuery]);

  if (isLoading && !role) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!role) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Role not found</h3>
          <Button onClick={() => router.back()} variant="outline" className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <ProtectedBreadcrumb
        items={[
          { label: "Access Control", menuKey: "access-control", href: "/dashboard/access-control" },
          {
            label: "Roles",
            menuKey: "access-control.roles",
            href: "/dashboard/access-control/roles"
          },
          {
            label: role.display_name || role.name,
            menuKey: "access-control.roles",
            href: "",
            isCurrent: true
          }
        ]}
      />
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{role.display_name || role.name}</h1>
            {isSystemRole && <Badge variant="primary">System</Badge>}
            {role.is_default && <Badge variant="outline">Default</Badge>}
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            {role.description || "No description"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreHorizontal className="h-4 w-4" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit && (
                <IfHasAccess menuKey="access-control.roles.edit">
                  <DropdownMenuItem
                    onClick={() => router.push(`/dashboard/access-control/roles/${roleId}/edit`)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Role
                  </DropdownMenuItem>
                </IfHasAccess>
              )}

              <DropdownMenuItem onClick={() => setCloneDialogOpen(true)}>
                <Copy className="mr-2 h-4 w-4" />
                Clone Role
              </DropdownMenuItem>

              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <IfHasAccess menuKey="access-control.roles.delete">
                    <DropdownMenuItem onClick={handleDeleteClick} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Role
                    </DropdownMenuItem>
                  </IfHasAccess>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="py-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Users Assigned</p>
                <p className="mt-1 text-2xl font-bold">{role.users_count || 0}</p>
              </div>
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                <Users className="text-primary h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="py-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Permissions</p>
                <p className="mt-1 text-2xl font-bold">{role.permissions_count || 0}</p>
              </div>
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                <Key className="text-primary h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="py-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Hierarchy Level</p>
                <p className="mt-1 text-2xl font-bold">{role.hierarchy_level || 0}</p>
              </div>
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                <Shield className="text-primary h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="permissions">
            Permissions
            {permissionChanges.size > 0 && (
              <Badge variant="primary" className="ml-2">
                {permissionChanges.size}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Role Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground text-sm">Role Name</Label>
                  <p className="mt-1 font-medium">{role.name}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground text-sm">Display Name</Label>
                  <p className="mt-1 font-medium">{role.display_name || role.name}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground text-sm">Hierarchy Level</Label>
                  <p className="mt-1 font-medium">{role.hierarchy_level || 0}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground text-sm">Type</Label>
                  <div className="mt-1">
                    <Badge variant={isSystemRole ? "primary" : "outline"}>
                      {isSystemRole ? "System Role" : "Custom Role"}
                    </Badge>
                  </div>
                </div>

                {role.created_at && (
                  <div>
                    <Label className="text-muted-foreground text-sm">Created At</Label>
                    <p className="mt-1 font-medium">
                      {new Date(role.created_at).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {role.updated_at && (
                  <div>
                    <Label className="text-muted-foreground text-sm">Updated At</Label>
                    <p className="mt-1 font-medium">
                      {new Date(role.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {role.description && (
                <div className="border-t pt-4">
                  <Label className="text-muted-foreground text-sm">Description</Label>
                  <p className="mt-1">{role.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          {/* ✅ System Role Lock Warning */}
          {isSystemRole && !isGlobalAdmin && (
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertDescription>
                This is a system role. All permissions are locked and cannot be modified unless you
                are a super admin.
              </AlertDescription>
            </Alert>
          )}

          {/* ✅ Filtered Permissions Info */}
          {!isGlobalAdmin && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                You can only see and modify permissions that you currently have. Locked permissions
                require super admin access.
              </AlertDescription>
            </Alert>
          )}

          {permissionChanges.size > 0 && (
            <Card className="border-primary">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="primary">{permissionChanges.size} changes</Badge>
                    <span className="text-muted-foreground text-sm">Unsaved changes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleDiscardChanges} disabled={isSaving}>
                      <XCircle className="h-4 w-4" />
                      Discard
                    </Button>
                    <Button onClick={handleSavePermissions} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {permissionsTree && (
            <Card>
              <CardContent className="px-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-2xl font-bold">
                      {permissionsTree.summary.total_permissions}
                    </div>
                    <div className="text-muted-foreground text-sm">Total Permissions</div>
                  </div>
                  <div>
                    <div className="text-primary text-2xl font-bold">
                      {permissionsTree.summary.assigned_permissions}
                    </div>
                    <div className="text-muted-foreground text-sm">Assigned</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {permissionsTree.summary.total_categories}
                    </div>
                    <div className="text-muted-foreground text-sm">Categories</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search permissions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {isLoading && !permissionsTree ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
            </div>
          ) : permissionsTree && filteredTree.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Permissions</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion
                  type="multiple"
                  value={expandedCategories}
                  onValueChange={setExpandedCategories}>
                  {filteredTree.map((category) => {
                    const assignedCount = category.permissions.filter((p) =>
                      getEffectiveState(p.id, p.is_checked)
                    ).length;

                    return (
                      <AccordionItem key={category.category} value={category.category}>
                        <AccordionTrigger>
                          <div className="flex w-full items-center justify-between pr-4">
                            <span className="font-medium">{category.category}</span>
                            <Badge variant="secondary">
                              {assignedCount}/{category.permissions.length}
                            </Badge>
                          </div>
                        </AccordionTrigger>

                        <AccordionContent>
                          <div className="space-y-2 pt-2">
                            {category.permissions.map((perm) => {
                              const effectiveState = getEffectiveState(perm.id, perm.is_checked);
                              const hasChange = permissionChanges.has(perm.id);
                              // ✅ Check if readonly
                              const isReadonly =
                                perm.is_readonly || (isSystemRole && !isGlobalAdmin);

                              return (
                                <div
                                  key={perm.id}
                                  className={`flex items-start gap-3 rounded border p-3 ${
                                    hasChange
                                      ? "bg-primary/5 border-primary"
                                      : isReadonly
                                        ? "bg-muted/50 opacity-60"
                                        : "hover:bg-muted/50"
                                  }`}>
                                  <Checkbox
                                    checked={effectiveState}
                                    onCheckedChange={() =>
                                      handlePermissionToggle(perm.id, perm.is_checked, isReadonly)
                                    }
                                    disabled={isReadonly}
                                  />

                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`text-sm font-medium ${isReadonly ? "text-muted-foreground" : ""}`}>
                                        {perm.resource}:{perm.action}
                                      </span>

                                      {hasChange && (
                                        <Badge variant="primary" className="text-xs">
                                          {permissionChanges.get(perm.id) === "I"
                                            ? "Adding"
                                            : "Removing"}
                                        </Badge>
                                      )}

                                      {isReadonly && (
                                        <Lock className="text-muted-foreground h-3 w-3" />
                                      )}

                                      {perm.is_system_permission && (
                                        <Badge variant="outline" className="text-xs">
                                          System
                                        </Badge>
                                      )}
                                    </div>

                                    {perm.description && (
                                      <p className="text-muted-foreground mt-1 text-xs">
                                        {perm.description}
                                      </p>
                                    )}

                                    {/* ✅ Show why it's locked */}
                                    {isReadonly && !isGlobalAdmin && (
                                      <p className="mt-1 text-xs text-amber-600">
                                        🔒 You don't have this permission
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">No permissions found</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{role.display_name || role.name}"? This action cannot
              be undone.
              {(role.users_count || 0) > 0 && (
                <div className="text-destructive mt-2 font-medium">
                  Warning: This role is assigned to {role.users_count} user(s).
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CloneRoleDialog
        open={cloneDialogOpen}
        onOpenChange={setCloneDialogOpen}
        sourceRole={role}
        onSuccess={() => {
          setCloneDialogOpen(false);
          toast.success("Role cloned successfully");
        }}
      />
    </div>
  );
};

export default RoleDetailsPage;
