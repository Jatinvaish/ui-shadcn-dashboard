'use client';

import { useState } from 'react';
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
import { createRole } from '@/store/slices/roles.slice';

interface CreateRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CreateRoleDialog = ({ open, onOpenChange, onSuccess }: CreateRoleDialogProps) => {
  const dispatch = useAppDispatch();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [isDefault, setIsDefault] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const onSubmit = async (data: any) => {
    setIsCreating(true);
    try {
      await dispatch(createRole({
        ...data,
        isDefault,
        hierarchyLevel: Number(data.hierarchyLevel) || 0,
      })).unwrap();

      toast.success('Role created successfully');
      reset();
      setIsDefault(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error || 'Failed to create role');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Create a new role with specific permissions and access levels.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Role Name *</Label>
              <Input
                id="name"
                placeholder="e.g., manager, editor"
                {...register('name', { required: 'Role name is required' })}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message as string}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                placeholder="e.g., Content Manager"
                {...register('displayName')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the role's purpose and responsibilities"
                rows={3}
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
                defaultValue="0"
                {...register('hierarchyLevel')}
              />
              <p className="text-xs text-muted-foreground">
                Higher values indicate higher priority (0-100)
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isDefault">Default Role</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically assign this role to new users
                </p>
              </div>
              <Switch
                id="isDefault"
                checked={isDefault}
                onCheckedChange={setIsDefault}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRoleDialog;