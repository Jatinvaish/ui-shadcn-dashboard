// app/dashboard/access-control/role-permissions/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Shield, Check, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchRoles,
  fetchRolePermissionsTree,
  bulkAssignRolePermissions,
  selectRoles,
  selectPermissionsTree,
} from '@/store/slices/roles.slice';
import { ProtectedBreadcrumb } from '@/components/guards/protected-breadcrumb';
import { useParams } from 'next/navigation';

const RolePermissionsPage = () => {
  const dispatch = useAppDispatch();
  const params = useParams();

  const selectedRoleId = Number(params.id);

  const roles = useAppSelector(selectRoles);
  const tree = useAppSelector(selectPermissionsTree);

  const [permissionChanges, setPermissionChanges] = useState<Map<number, 'I' | 'D'>>(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  useEffect(() => {
    dispatch(fetchRoles({ page: 1, limit: 1000 }));
  }, [dispatch]);

  useEffect(() => {
    if (selectedRoleId) {
      dispatch(fetchRolePermissionsTree(selectedRoleId));
      setPermissionChanges(new Map());
    }
  }, [dispatch, selectedRoleId]);

  useEffect(() => {
    if (tree && tree.permissions_tree.length > 0 && expandedCategories.length === 0) {
      setExpandedCategories([tree.permissions_tree[0].category]);
    }
  }, [tree]);

  const handlePermissionToggle = (permissionId: number, currentlyChecked: boolean) => {
    const newChanges = new Map(permissionChanges);
    newChanges.set(permissionId, currentlyChecked ? 'D' : 'I');
    setPermissionChanges(newChanges);
  };

  const getEffectiveState = (permissionId: number, originalState: boolean) => {
    const change = permissionChanges.get(permissionId);
    if (change === 'I') return true;
    if (change === 'D') return false;
    return originalState;
  };

  const handleSaveChanges = async () => {
    if (!selectedRoleId || permissionChanges.size === 0) {
      toast.info('No changes to save');
      return;
    }

    setIsSaving(true);
    try {
      const changes = Array.from(permissionChanges.entries()).map(([permissionId, mode]) => ({
        mode,
        permissionId,
      }));

      await dispatch(bulkAssignRolePermissions({ roleId: selectedRoleId, changes })).unwrap();
      toast.success('Permissions updated successfully');
      setPermissionChanges(new Map());
      dispatch(fetchRolePermissionsTree(selectedRoleId));
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

  const filteredTree = tree?.permissions_tree
    .map((category) => {
      const filteredPerms = category.permissions.filter((perm) => {
        const q = searchQuery.toLowerCase();
        return (
          perm.permission_key.toLowerCase().includes(q) ||
          perm.resource.toLowerCase().includes(q) ||
          perm.action.toLowerCase().includes(q)
        );
      });

      return { ...category, permissions: filteredPerms };
    })
    .filter((cat) => cat.permissions.length > 0);

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  return (
    <div className="flex flex-col gap-6">
      <ProtectedBreadcrumb
        items={[
          { label: 'Access Control', menuKey: 'access-control', href: '/dashboard/access-control' },
          { label: 'Role Permissions', menuKey: 'access-control.role-permissions', href: `/dashboard/access-control/role-permissions/${selectedRoleId}`, isCurrent: true },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold">Role Permissions</h1>

        {selectedRole && (
          <p className="text-muted-foreground mt-1">
            Managing permissions for <strong>{selectedRole.display_name || selectedRole.name}</strong>
          </p>
        )}
      </div>

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
                  <X className="h-4 w-4" />
                  Discard
                </Button>
                <Button onClick={handleSaveChanges} disabled={isSaving}>
                  <Check className="h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {tree && (
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-2xl font-bold">{tree.summary.total_permissions}</div>
                <div className="text-sm text-muted-foreground">Total Permissions</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{tree.summary.assigned_permissions}</div>
                <div className="text-sm text-muted-foreground">Assigned</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{tree.summary.total_categories}</div>
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
      {tree && (
        <Card>
          <CardHeader>
            <CardTitle>Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" value={expandedCategories} onValueChange={setExpandedCategories}>
              {filteredTree?.map((category) => {
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
      )}
    </div>
  );
};

export default RolePermissionsPage;
