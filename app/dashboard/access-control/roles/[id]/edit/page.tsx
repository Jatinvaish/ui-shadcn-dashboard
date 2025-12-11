// app/dashboard/access-control/roles/[id]/edit/page.tsx - NEW
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchRoleById,
  updateRole,
  selectCurrentRole,
  selectRolesLoading,
  clearCurrentRole,
} from '@/store/slices/roles.slice';
import { ProtectedBreadcrumb } from '@/components/guards/protected-breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';

const RoleEditPage = () => {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const roleId = Number(params.id);

  const role = useAppSelector(selectCurrentRole);
  const isLoading = useAppSelector(selectRolesLoading);

  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm();

  useEffect(() => {
    if (roleId) {
      dispatch(fetchRoleById(roleId));
    }

    return () => {
      dispatch(clearCurrentRole());
    };
  }, [dispatch, roleId]);

  useEffect(() => {
    if (role) {
      reset({
        displayName: role.display_name,
        description: role.description,
        hierarchyLevel: role.hierarchy_level,
        isDefault: role.is_default,
      });
    }
  }, [role, reset]);

  const onSubmit = async (data: any) => {
    setIsSaving(true);
    try {
      await dispatch(updateRole({
        roleId,
        displayName: data.displayName,
        description: data.description,
        hierarchyLevel: Number(data.hierarchyLevel),
      })).unwrap();

      toast.success('Role updated successfully');
      router.push(`/dashboard/access-control/roles/${roleId}`);
    } catch (error: any) {
      toast.error(error || 'Failed to update role');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !role) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
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

  if (role.is_system_role) {
    return (
      <div className="flex flex-col gap-6">
        <ProtectedBreadcrumb
          items={[
            { label: 'Access Control', menuKey: 'access-control', href: '/dashboard/access-control' },
            { label: 'Roles', menuKey: 'access-control.roles', href: '/dashboard/access-control/roles' },
            { label: role && role.display_name || '', menuKey: 'access-control.roles', href: `/dashboard/access-control/roles/${roleId}` },
            { label: 'Edit', menuKey: 'access-control.roles', href: '', isCurrent: true },
          ]}
        />
        
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">System Role</h3>
              <p className="text-muted-foreground mb-4">
                System roles cannot be edited. Only super admins can modify system roles.
              </p>
              <Button onClick={() => router.back()} variant="outline">
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <ProtectedBreadcrumb
        items={[
          { label: 'Access Control', menuKey: 'access-control', href: '/dashboard/access-control' },
          { label: 'Roles', menuKey: 'access-control.roles', href: '/dashboard/access-control/roles' },
          { label: role && role.display_name || '', menuKey: 'access-control.roles', href: `/dashboard/access-control/roles/${roleId}` },
          { label: 'Edit', menuKey: 'access-control.roles', href: '', isCurrent: true },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Edit Role</h1>
          <p className="text-muted-foreground">Update role details and settings</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Role Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Role Name (Read-only)</Label>
              <Input
                id="name"
                value={role.name}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Role names cannot be changed after creation
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name *</Label>
              <Input
                id="displayName"
                placeholder="e.g., Content Manager"
                {...register('displayName', { required: 'Display name is required' })}
              />
              {errors.displayName && (
                <p className="text-sm text-destructive">{errors.displayName.message as string}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the role's purpose and responsibilities"
                rows={4}
                {...register('description')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hierarchyLevel">Hierarchy Level</Label>
              <Input
                id="hierarchyLevel"
                type="number"
                min="0"
                max="100"
                {...register('hierarchyLevel', {
                  min: { value: 0, message: 'Minimum value is 0' },
                  max: { value: 100, message: 'Maximum value is 100' }
                })}
              />
              {errors.hierarchyLevel && (
                <p className="text-sm text-destructive">{errors.hierarchyLevel.message as string}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Higher values indicate higher priority (0-100). Users can only manage roles with equal or lower hierarchy levels.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="space-y-0.5">
                <Label>System Role</Label>
                <p className="text-xs text-muted-foreground">
                  This role is {role.is_system_role ? 'a system role' : 'a custom role'}
                </p>
              </div>
              <Switch
                checked={role.is_system_role}
                disabled
              />
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div className="space-y-0.5">
                <Label htmlFor="isDefault">Default Role</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically assign this role to new users (Read-only)
                </p>
              </div>
              <Switch
                id="isDefault"
                checked={role.is_default}
                disabled
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RoleEditPage;