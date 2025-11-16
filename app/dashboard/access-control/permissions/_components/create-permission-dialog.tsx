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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useAppDispatch } from '@/store/hooks';
import { createPermission } from '@/store/slices/permissions.slice';

interface CreatePermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreatePermissionDialog({ open, onOpenChange, onSuccess }: CreatePermissionDialogProps) {
  const dispatch = useAppDispatch();
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();
  const [isCreating, setIsCreating] = useState(false);

  const resource = watch('resource');
  const action = watch('action');

  const onSubmit = async (data: any) => {
    setIsCreating(true);
    try {
      await dispatch(createPermission({
        //@ts-ignore
        name: `${data.resource}:${data.action}`,
        resource: data.resource,
        action: data.action,
        description: data.description,
        category: data.category,
      })).unwrap();

      toast.success('Permission created successfully');
      reset();
      onSuccess();
    } catch (error: any) {
      toast.error(error || 'Failed to create permission');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Create New Permission</DialogTitle>
            <DialogDescription>
              Create a new permission for access control.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="resource">Resource *</Label>
              <Input
                id="resource"
                placeholder="e.g., users, roles, posts"
                {...register('resource', { required: 'Resource is required' })}
              />
              {errors.resource && (
                <p className="text-sm text-destructive">{errors.resource.message as string}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="action">Action *</Label>
              <Input
                id="action"
                placeholder="e.g., create, read, update, delete"
                {...register('action', { required: 'Action is required' })}
              />
              {errors.action && (
                <p className="text-sm text-destructive">{errors.action.message as string}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Permission Key (Auto-generated)</Label>
              <Input
                value={resource && action ? `${resource}:${action}` : ''}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this permission allows"
                rows={3}
                {...register('description')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select onValueChange={(value) => setValue('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Access Control">Access Control</SelectItem>
                  <SelectItem value="User Management">User Management</SelectItem>
                  <SelectItem value="Content">Content</SelectItem>
                  <SelectItem value="Settings">Settings</SelectItem>
                  <SelectItem value="Reports">Reports</SelectItem>
                </SelectContent>
              </Select>
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
              {isCreating ? 'Creating...' : 'Create Permission'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CreatePermissionDialog;