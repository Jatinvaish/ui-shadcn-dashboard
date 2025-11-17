// app/dashboard/access-control/roles/[id]/page.tsx - PRODUCTION READY
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchRoleById,
  deleteRole,
  selectCurrentRole,
  selectRolesLoading,
  clearCurrentRole,
  fetchRolePermissionsTree,
  selectPermissionsTree,
  bulkAssignRolePermissions,
} from '@/store/slices/roles.slice';
import { selectUser } from '@/store/slices/authSlice';
import { ProtectedBreadcrumb } from '@/components/guards/protected-breadcrumb';
import { IfHasAccess } from '@/components/guards/if-has-access';
import CloneRoleDialog from '../components/clone-role-dialog';

const canManageSystemResources = (userType: string): boolean => {
  return userType === 'super_admin' || userType === 'saas_admin' || userType === 'owner';
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
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [permissionChanges, setPermissionChanges] = useState<Map<number, 'I' | 'D'>>(new Map());
  const [isSaving, setIsSaving] = useState(false);

  const userType = currentUser?.userType || currentUser?.user_type || '';
  
  const canEdit = useMemo(() => {
    if (!role) return false;
    if (canManageSystemResources(userType)) return true;
    if (role.is_system_role) return false;
    return true;
  }, [role, userType]);

  const canDelete = useMemo(() => {
    if (!role) return false;
    if (role.is_system_role) return false;
    if (canManageSystemResources(userType)) return true;
    return true;
  }, [role, userType]);

  // Load role and permissions tree
  useEffect(() => {
    if (roleId && !isNaN(roleId)) {
      console.log('🎯 Loading role:', roleId);
      dispatch(fetchRoleById(roleId));
      dispatch(fetchRolePermissionsTree(roleId));
    }

    return () => {
      dispatch(clearCurrentRole());
    };
  }, [dispatch, roleId]);

  // Auto-expand first category
  useEffect(() => {
    if (permissionsTree && 
        permissionsTree.permissions_tree && 
        permissionsTree.permissions_tree.length > 0 && 
        expandedCategories.length === 0) {
      setExpandedCategories([permissionsTree.permissions_tree[0].category]);
    }
  }, [permissionsTree, expandedCategories.length]);

  const handleDeleteClick = () => {
    if (!canDelete) {
      toast.error('You do not have permission to delete this role');
      return;
    }
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!role) return;

    setIsDeleting(true);
    try {
      await dispatch(deleteRole(role.id)).unwrap();
      toast.success('Role deleted successfully');
      router.push('/dashboard/access-control/roles');
    } catch (error: any) {
      toast.error(error || 'Failed to delete role');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePermissionToggle = useCallback((permissionId: number, currentlyChecked: boolean) => {
    const newChanges = new Map(permissionChanges);
    
    // Determine the change mode
    const changeMode = currentlyChecked ? 'D' : 'I';
    
    // If already in changes, remove it (toggling back)
    if (newChanges.has(permissionId)) {
      newChanges.delete(permissionId);
    } else {
      newChanges.set(permissionId, changeMode);
    }
    
    setPermissionChanges(newChanges);
  }, [permissionChanges]);

  const getEffectiveState = useCallback((permissionId: number, originalState: boolean) => {
    const change = permissionChanges.get(permissionId);
    if (change === 'I') return true;
    if (change === 'D') return false;
    return originalState;
  }, [permissionChanges]);

  const handleSavePermissions = async () => {
    if (!roleId || permissionChanges.size === 0) {
      toast.info('No changes to save');
      return;
    }

    setIsSaving(true);
    try {
      const changes = Array.from(permissionChanges.entries()).map(([permissionId, mode]) => ({
        mode,
        permissionId,
      }));

      await dispatch(bulkAssignRolePermissions({ roleId, changes })).unwrap();
      toast.success('Permissions updated successfully');
      setPermissionChanges(new Map());
      
      // Reload permissions tree
      dispatch(fetchRolePermissionsTree(roleId));
    } catch (error: any) {
      toast.error(error || 'Failed to update permissions');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = useCallback(() => {
    setPermissionChanges(new Map());
    toast.info('Changes discarded');
  }, []);

  const filteredTree = useMemo(() => {
    if (!permissionsTree || !permissionsTree.permissions_tree) return [];
    
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      <div className="flex items-center justify-center h-64">
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
          { label: 'Access Control', menuKey: 'access-control', href: '/dashboard/access-control' },
          { label: 'Roles', menuKey: 'access-control.roles', href: '/dashboard/access-control/roles' },
          { label: role.display_name || role.name, menuKey: 'access-control.roles', href: '', isCurrent: true },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{role.display_name || role.name}</h1>
              {role.is_system_role && <Badge variant="primary">System</Badge>}
              {role.is_default && <Badge variant="outline">Default</Badge>}
            </div>
            <p className="text-muted-foreground text-sm mt-1">{role.description || 'No description'}</p>
          </div>
        </div>

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
                <DropdownMenuItem onClick={() => router.push(`/dashboard/access-control/roles/${roleId}/edit`)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Role
                </DropdownMenuItem>
              </IfHasAccess>
            )}
            
            <DropdownMenuItem onClick={() => setCloneDialogOpen(true)}>
              <Copy className="h-4 w-4 mr-2" />
              Clone Role
            </DropdownMenuItem>

            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <IfHasAccess menuKey="access-control.roles.delete">
                  <DropdownMenuItem 
                    onClick={handleDeleteClick}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Role
                  </DropdownMenuItem>
                </IfHasAccess>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Users Assigned</p>
                <p className="text-2xl font-bold mt-1">{role.users_count || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Permissions</p>
                <p className="text-2xl font-bold mt-1">{role.permissions_count || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Key className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hierarchy Level</p>
                <p className="text-2xl font-bold mt-1">{role.hierarchy_level || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="permissions">
            Permissions
            {permissionChanges.size > 0 && (
              <Badge variant="primary" className="ml-2">{permissionChanges.size}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Role Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Role Name</Label>
                  <p className="font-medium mt-1">{role.name}</p>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Display Name</Label>
                  <p className="font-medium mt-1">{role.display_name || role.name}</p>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Hierarchy Level</Label>
                  <p className="font-medium mt-1">{role.hierarchy_level || 0}</p>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Type</Label>
                  <div className="mt-1">
                    <Badge variant={role.is_system_role ? 'primary' : 'outline'}>
                      {role.is_system_role ? 'System Role' : 'Custom Role'}
                    </Badge>
                  </div>
                </div>

                {role.created_at && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Created At</Label>
                    <p className="font-medium mt-1">
                      {new Date(role.created_at).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {role.updated_at && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Updated At</Label>
                    <p className="font-medium mt-1">
                      {new Date(role.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {role.description && (
                <div className="pt-4 border-t">
                  <Label className="text-sm text-muted-foreground">Description</Label>
                  <p className="mt-1">{role.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          {/* Changes Bar */}
          {permissionChanges.size > 0 && (
            <Card className="border-primary">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="primary">{permissionChanges.size} changes</Badge>
                    <span className="text-sm text-muted-foreground">Unsaved changes</span>
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

          {/* Summary */}
          {permissionsTree && (
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-2xl font-bold">{permissionsTree.summary.total_permissions}</div>
                    <div className="text-sm text-muted-foreground">Total Permissions</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {permissionsTree.summary.assigned_permissions}
                    </div>
                    <div className="text-sm text-muted-foreground">Assigned</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{permissionsTree.summary.total_categories}</div>
                    <div className="text-sm text-muted-foreground">Categories</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search permissions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Permissions List */}
          {isLoading && !permissionsTree ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
                  onValueChange={setExpandedCategories}
                >
                  {filteredTree.map((category) => {
                    const assignedCount = category.permissions.filter((p) =>
                      getEffectiveState(p.id, p.is_checked)
                    ).length;

                    return (
                      <AccordionItem key={category.category} value={category.category}>
                        <AccordionTrigger>
                          <div className="flex items-center justify-between w-full pr-4">
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

                              return (
                                <div
                                  key={perm.id}
                                  className={`flex items-start gap-3 p-3 rounded border ${
                                    hasChange ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
                                  }`}
                                >
                                  <Checkbox
                                    checked={effectiveState}
                                    onCheckedChange={() =>
                                      handlePermissionToggle(perm.id, perm.is_checked)
                                    }
                                    disabled={role.is_system_role && !canManageSystemResources(userType)}
                                  />

                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-sm">
                                        {perm.resource}:{perm.action}
                                      </span>

                                      {hasChange && (
                                        <Badge variant="primary" className="text-xs">
                                          {permissionChanges.get(perm.id) === 'I'
                                            ? 'Adding'
                                            : 'Removing'}
                                        </Badge>
                                      )}

                                      {perm.is_system_permission && (
                                        <Lock className="h-3 w-3 text-muted-foreground" />
                                      )}
                                    </div>

                                    {perm.description && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {perm.description}
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

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{role.display_name || role.name}"? This action cannot be undone.
              {(role.users_count || 0) > 0 && (
                <div className="mt-2 text-destructive font-medium">
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clone Dialog */}
      <CloneRoleDialog
        open={cloneDialogOpen}
        onOpenChange={setCloneDialogOpen}
        sourceRole={role}
        onSuccess={() => {
          setCloneDialogOpen(false);
          toast.success('Role cloned successfully');
        }}
      />
    </div>
  );
};

export default RoleDetailsPage;