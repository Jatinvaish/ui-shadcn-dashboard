// app/dashboard/access-control/roles/components/clone-role-dialog.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useAppDispatch } from '@/store/hooks';
import { cloneRole } from '@/store/slices/roles.slice';
import { Role } from '@/lib/api/services/rbac-service';
import { Shield } from 'lucide-react';

interface CloneRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceRole: Role | null;
  onSuccess: () => void;
}

const CloneRoleDialog = ({ open, onOpenChange, sourceRole, onSuccess }: CloneRoleDialogProps) => {
  const dispatch = useAppDispatch();
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm();
  const [copyPermissions, setCopyPermissions] = useState(true);
  const [copyLimits, setCopyLimits] = useState(false);
  const [isCloning, setIsCloning] = useState(false);

  const newName = watch('newName');

  useEffect(() => {
    if (open && sourceRole) {
      reset({
        newName: `${sourceRole.name}_copy`,
        newDisplayName: `${sourceRole.display_name || sourceRole.name} (Copy)`,
        description: sourceRole.description,
      });
      setCopyPermissions(true);
      setCopyLimits(false);
    }
  }, [open, sourceRole, reset]);

  const onSubmit = async (data: any) => {
    if (!sourceRole) return;

    setIsCloning(true);
    try {
      const result = await dispatch(cloneRole({
        sourceRoleId: sourceRole.id,
        newName: data.newName,
        newDisplayName: data.newDisplayName,
        description: data.description,
        copyPermissions,
        copyLimits,
      })).unwrap();

      toast.success(
        `Role cloned successfully. ${result.copiedPermissions} permissions and ${result.copiedLimits} limits copied.`
      );
      reset();
      setCopyPermissions(true);
      setCopyLimits(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error || 'Failed to clone role');
    } finally {
      setIsCloning(false);
    }
  };

  if (!sourceRole) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Clone Role</DialogTitle>
            <DialogDescription>
              Create a copy of "{sourceRole.display_name || sourceRole.name}" with all or selected attributes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Source Role Info */}
            <div className="p-4 rounded-lg bg-muted">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-sm">Source Role</div>
                  <div className="text-xs text-muted-foreground">
                    {sourceRole.display_name || sourceRole.name}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {sourceRole.permissions_count || 0} permissions
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      Level {sourceRole.hierarchy_level || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* New Role Name */}
            <div className="space-y-2">
              <Label htmlFor="newName">New Role Name *</Label>
              <Input
                id="newName"
                placeholder="e.g., content_manager_copy"
                {...register('newName', { 
                  required: 'Role name is required',
                  pattern: {
                    value: /^[a-z0-9_-]+$/,
                    message: 'Only lowercase letters, numbers, hyphens and underscores allowed'
                  }
                })}
              />
              {errors.newName && (
                <p className="text-sm text-destructive">{errors.newName.message as string}</p>
              )}
            </div>

            {/* New Display Name */}
            <div className="space-y-2">
              <Label htmlFor="newDisplayName">Display Name</Label>
              <Input
                id="newDisplayName"
                placeholder="e.g., Content Manager (Copy)"
                {...register('newDisplayName')}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the role's purpose"
                rows={3}
                {...register('description')}
              />
            </div>

            {/* Clone Options */}
            <div className="space-y-4 pt-4 border-t">
              <Label>Clone Options</Label>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="copyPermissions">Copy Permissions</Label>
                  <p className="text-xs text-muted-foreground">
                    Include all {sourceRole.permissions_count || 0} permissions from source role
                  </p>
                </div>
                <Switch
                  id="copyPermissions"
                  checked={copyPermissions}
                  onCheckedChange={setCopyPermissions}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="copyLimits">Copy Limits</Label>
                  <p className="text-xs text-muted-foreground">
                    Include usage limits and restrictions
                  </p>
                </div>
                <Switch
                  id="copyLimits"
                  checked={copyLimits}
                  onCheckedChange={setCopyLimits}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCloning}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCloning || !newName}>
              {isCloning ? 'Cloning...' : 'Clone Role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CloneRoleDialog;