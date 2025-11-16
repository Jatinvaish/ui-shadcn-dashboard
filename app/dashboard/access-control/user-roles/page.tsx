// app/dashboard/access-control/user-roles/page.tsx - COMPLETE WORKING VERSION
'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, X, Trash2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchRoles, selectRoles } from '@/store/slices/roles.slice';
import { selectUser } from '@/store/slices/authSlice';
import { ProtectedBreadcrumb } from '@/components/guards/protected-breadcrumb';
import { RbacService } from '@/lib/api/services/rbac-service';

interface UserRoleAssignment {
  id: number;
  userId: number;
  roleId: number;
  roleName: string;
  roleDisplayName: string;
  hierarchyLevel: number;
  isSystemRole: boolean;
  assignedAt: string;
}

const UserRolesPage = () => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectUser);
  const roles = useAppSelector(selectRoles);

  const [assignments, setAssignments] = useState<UserRoleAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchUserId, setSearchUserId] = useState('');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [itemToDelete, setItemToDelete] = useState<UserRoleAssignment | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    dispatch(fetchRoles({ page: 1, limit: 1000 }));
  }, [dispatch]);

  const handleSearchUser = async () => {
    if (!searchUserId) {
      toast.error('Please enter a user ID');
      return;
    }

    const userId = Number(searchUserId);
    if (isNaN(userId)) {
      toast.error('Invalid user ID');
      return;
    }

    setIsLoading(true);
    try {
      const response = await RbacService.getUserRoles(userId);
      
      if (response.success && response.data) {
        const mappedAssignments: UserRoleAssignment[] = response.data.map((ur: any) => ({
          id: ur.id,
          userId: ur.user_id || ur.userId,
          roleId: ur.role_id || ur.roleId,
          roleName: ur.role?.name || ur.role_name || 'Unknown',
          roleDisplayName: ur.role?.display_name || ur.role_display_name || ur.role?.name || 'Unknown',
          hierarchyLevel: ur.role?.hierarchy_level || ur.hierarchy_level || 0,
          isSystemRole: ur.role?.is_system_role || ur.is_system_role || false,
          assignedAt: ur.assigned_at || ur.assignedAt || new Date().toISOString(),
        }));
        
        setAssignments(mappedAssignments);
        setCurrentUserId(userId);
        toast.success(`Found ${mappedAssignments.length} role assignments`);
      } else {
        setAssignments([]);
        setCurrentUserId(userId);
        toast.info('No roles assigned to this user');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to fetch user roles');
      setAssignments([]);
      setCurrentUserId(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!currentUserId || !selectedRoleId) {
      toast.error('Please select a role');
      return;
    }

    setIsAssigning(true);
    try {
      await RbacService.assignRoleToUser({
        userId: currentUserId,
        roleId: Number(selectedRoleId),
      });

      toast.success('Role assigned successfully');
      setAssignDialogOpen(false);
      setSelectedRoleId('');
      handleSearchUser();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to assign role');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleDeleteClick = (assignment: UserRoleAssignment) => {
    setItemToDelete(assignment);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      await RbacService.removeRoleFromUser(itemToDelete.userId, itemToDelete.roleId);
      toast.success('Role removed successfully');
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      handleSearchUser();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to remove role');
    }
  };

  const availableRoles = roles.filter(
    role => !assignments.some(a => a.roleId === role.id)
  );

  return (
    <div className="flex flex-col gap-6">
      <ProtectedBreadcrumb
        items={[
          { label: 'Access Control', menuKey: 'access-control', href: '/dashboard/access-control' },
          { label: 'User Roles', menuKey: 'access-control.user-roles', href: '/dashboard/access-control/user-roles', isCurrent: true },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold">User Roles</h1>
        <p className="text-muted-foreground mt-1">Assign and manage roles for users</p>
      </div>

      {/* Search User */}
      <Card>
        <CardHeader>
          <CardTitle>Search User</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>User ID</Label>
              <Input
                type="number"
                placeholder="Enter user ID"
                value={searchUserId}
                onChange={(e) => setSearchUserId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
              />
            </div>
            <Button onClick={handleSearchUser} disabled={isLoading} className="mt-6">
              <Search className="h-4 w-4" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {currentUserId && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Role Assignments</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">User ID: {currentUserId}</p>
              </div>
              <Button onClick={() => setAssignDialogOpen(true)} disabled={availableRoles.length === 0}>
                <Plus className="h-4 w-4" />
                Assign Role
              </Button>
            </CardHeader>
            <CardContent>
              {assignments.length > 0 ? (
                <div className="space-y-3">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <UserPlus className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{assignment.roleDisplayName}</div>
                          <div className="text-xs text-muted-foreground">
                            Assigned {new Date(assignment.assignedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Level {assignment.hierarchyLevel}</Badge>
                        {assignment.isSystemRole && (
                          <Badge variant="outline">System</Badge>
                        )}
                        <Button
                          mode="icon"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(assignment)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No roles assigned to this user</p>
                  <Button onClick={() => setAssignDialogOpen(true)} className="mt-4">
                    Assign First Role
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!currentUserId && !isLoading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No User Selected</h3>
            <p className="text-sm text-muted-foreground">Enter a user ID to view and manage their roles</p>
          </CardContent>
        </Card>
      )}

      {/* Assign Role Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role</DialogTitle>
            <DialogDescription>
              Select a role to assign to user {currentUserId}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.display_name || role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignRole} disabled={isAssigning || !selectedRoleId}>
              {isAssigning ? 'Assigning...' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Role</AlertDialogTitle>
            <AlertDialogDescription>
              Remove role "{itemToDelete?.roleDisplayName}" from this user?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserRolesPage;