// app/(dashboard)/dashboard/access-control/roles/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Shield, Users, Edit, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchRoleById,
  fetchRolePermissionsTree,
  bulkAssignRolePermissions,
  selectCurrentRole,
  selectPermissionsTree,
  selectRolesLoading,
  clearCurrentRole,
} from '@/store/slices/roles.slice';
import { IfHasAccess } from '@/components/guards/if-has-access';
import { ProtectedBreadcrumb } from '@/components/guards/protected-breadcrumb';

const RoleDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const roleId = Number(params.id);

  const role = useAppSelector(selectCurrentRole);
  const tree = useAppSelector(selectPermissionsTree);
  const isLoading = useAppSelector(selectRolesLoading);

  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [permissionChanges, setPermissionChanges] = useState<Map<number, 'I' | 'D'>>(new Map());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (roleId) {
      dispatch(fetchRoleById(roleId));
      dispatch(fetchRolePermissionsTree(roleId));
    }

    return () => {
      dispatch(clearCurrentRole());
    };
  }, [dispatch, roleId]);

  const handlePermissionToggle = (permissionId: number, currentlyChecked: boolean) => {
    const newChanges = new Map(permissionChanges);

    if (currentlyChecked) {
      newChanges.set(permissionId, 'D');
    } else {
      newChanges.set(permissionId, 'I');
    }

    setPermissionChanges(newChanges);
  };
  const getEffectiveState = (permissionId: number, originalState: boolean) => {
    const change = permissionChanges.get(permissionId);
    if (change === 'I') return true;
    if (change === 'D') return false;
    return originalState;
  };

  const handleSaveChanges = async () => {
    if (permissionChanges.size === 0) {
      toast.info('No changes to save');
      return;
    }

    setIsSaving(true);
    try {
      const changes = Array.from(permissionChanges.entries()).map(([permissionId, mode]) => ({
        mode,
        permissionId,
      }));

      const result = await dispatch(bulkAssignRolePermissions({ roleId, changes })).unwrap();
      toast.success(`Updated ${result.total_changes} permissions successfully`);
      setPermissionChanges(new Map());

      // Refresh data
      dispatch(fetchRoleById(roleId));
      dispatch(fetchRolePermissionsTree(roleId));
    } catch (error: any) {
      toast.error(error || 'Failed to update permissions');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    setPermissionChanges(new Map());
    toast.info('Changes discarded');
  };

  if (isLoading && !role) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!role || !tree) {
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
          { label: role.display_name, menuKey: 'access-control.roles', href: `/dashboard/access-control/roles/${roleId}`, isCurrent: true },
        ]}
      />

      {/* Role Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold">{role.display_name}</h1>
                  <Badge variant={role.is_system_role ? 'primary' : 'secondary'}>
                    {role.is_system_role ? 'System' : 'Custom'}
                  </Badge>
                  <Badge variant="outline">Level {role.hierarchy_level}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{role.description || 'No description'}</p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{role.users_count || 0} users</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span>{role.permissions_count || 0} permissions</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <IfHasAccess menuKey="access-control.roles.edit">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/dashboard/access-control/roles/${roleId}/edit`)}
                  disabled={role.is_system_role}
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </IfHasAccess>
              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/access-control/roles/${roleId}/settings`)}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="permissions" className="w-full">
        <TabsList>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="users">Users ({role.users_count || 0})</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="permissions" className="space-y-4">
          {/* Save/Discard Bar */}
          {permissionChanges.size > 0 && (
            <Card className="border-primary">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="primary">{permissionChanges.size} changes</Badge>
                    <span className="text-sm text-muted-foreground">
                      You have unsaved permission changes
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={handleDiscardChanges}
                      disabled={isSaving}
                    >
                      Discard
                    </Button>
                    <Button
                      onClick={handleSaveChanges}
                      disabled={isSaving}
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Permissions Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Permission Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <div className="text-2xl font-bold">{tree.summary.total_permissions}</div>
                  <div className="text-sm text-muted-foreground">Total Permissions</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-primary">
                    {tree.summary.assigned_permissions}
                  </div>
                  <div className="text-sm text-muted-foreground">Assigned</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">{tree.summary.total_categories}</div>
                  <div className="text-sm text-muted-foreground">Categories</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissions Tree */}
          <Card>
            <CardHeader>
              <CardTitle>Manage Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" value={expandedCategories} onValueChange={setExpandedCategories}>
                {tree.permissions_tree.map((category: any) => {
                  const categoryPermissions = category.permissions;
                  const assignedCount = categoryPermissions.filter((p: any) =>
                    getEffectiveState(p.id, p.is_checked)
                  ).length;

                  return (
                    <AccordionItem key={category.category} value={category.category}>
                      <AccordionTrigger>
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{category.category}</span>
                            <Badge variant="secondary">
                              {assignedCount}/{categoryPermissions.length}
                            </Badge>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pt-2">
                          {categoryPermissions.map((permission: any) => {
                            const effectiveState = getEffectiveState(permission.id, permission.is_checked);
                            const hasChange = permissionChanges.has(permission.id);

                            return (
                              <div
                                key={permission.id}
                                className={`flex items-start gap-3 p-3 rounded-md border transition-colors ${hasChange ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
                                  }`}
                              >
                                <Checkbox
                                  checked={effectiveState}
                                  onCheckedChange={() => handlePermissionToggle(permission.id, permission.is_checked)}
                                  disabled={role.is_system_role}
                                />
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">
                                      {permission.resource}:{permission.action}
                                    </span>
                                    {permission.is_system_permission && (
                                      <Badge variant="outline" className="text-xs">System</Badge>
                                    )}
                                    {hasChange && (
                                      <Badge variant="primary" className="text-xs">
                                        {permissionChanges.get(permission.id) === 'I' ? 'Adding' : 'Removing'}
                                      </Badge>
                                    )}
                                  </div>
                                  {permission.description && (
                                    <p className="text-xs text-muted-foreground">
                                      {permission.description}
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
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Users with this role</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                No users assigned to this role yet
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                No activity to display
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RoleDetailsPage;