// app/dashboard/access-control/roles/bulk-assign/page.tsx - NEW
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, Shield, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useAppSelector } from '@/store/hooks';
import { selectRoles } from '@/store/slices/roles.slice';
import { ProtectedBreadcrumb } from '@/components/guards/protected-breadcrumb';
import { RbacService } from '@/lib/api/services/rbac-service';
import { Progress } from '@/components/ui/progress';

interface UserRow {
  id: number;
  email: string;
  name: string;
  selected: boolean;
}

const BulkRoleAssignmentPage = () => {
  const router = useRouter();
  const roles = useAppSelector(selectRoles);

  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [userIdInput, setUserIdInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);

  const handleAddUser = () => {
    const userId = Number(userIdInput.trim());
    if (!userId || isNaN(userId)) {
      toast.error('Please enter a valid user ID');
      return;
    }

    if (users.find(u => u.id === userId)) {
      toast.error('User already added');
      return;
    }

    // In real app, fetch user details from API
    setUsers([...users, {
      id: userId,
      email: `user${userId}@example.com`,
      name: `User ${userId}`,
      selected: true,
    }]);
    setUserIdInput('');
  };

  const handleRemoveUser = (userId: number) => {
    setUsers(users.filter(u => u.id !== userId));
  };

  const handleToggleUser = (userId: number) => {
    setUsers(users.map(u => 
      u.id === userId ? { ...u, selected: !u.selected } : u
    ));
  };

  const handleToggleRole = (roleId: number) => {
    setSelectedRoleIds(prev => 
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  const selectedUsers = users.filter(u => u.selected);
  const canProcess = selectedUsers.length > 0 && selectedRoleIds.length > 0;

  const handleProcess = async () => {
    if (!canProcess) {
      toast.error('Please select at least one user and one role');
      return;
    }

    setIsProcessing(true);
    setResults([]);
    setProgress(0);

    const totalOperations = selectedUsers.length * selectedRoleIds.length;
    let completed = 0;

    const newResults: any[] = [];

    for (const user of selectedUsers) {
      for (const roleId of selectedRoleIds) {
        try {
          await RbacService.assignRoleToUser({
            userId: user.id,
            roleId: roleId,
          });

          newResults.push({
            userId: user.id,
            userEmail: user.email,
            roleId,
            roleName: roles.find(r => r.id === roleId)?.display_name || 'Unknown',
            status: 'success',
          });
        } catch (error: any) {
          newResults.push({
            userId: user.id,
            userEmail: user.email,
            roleId,
            roleName: roles.find(r => r.id === roleId)?.display_name || 'Unknown',
            status: 'failed',
            error: error?.message || 'Failed to assign',
          });
        }

        completed++;
        setProgress((completed / totalOperations) * 100);
        setResults([...newResults]);
      }
    }

    setIsProcessing(false);

    const successCount = newResults.filter(r => r.status === 'success').length;
    const failedCount = newResults.filter(r => r.status === 'failed').length;

    if (failedCount === 0) {
      toast.success(`Successfully assigned roles to all users (${successCount} operations)`);
    } else {
      toast.warning(`Completed with ${successCount} successes and ${failedCount} failures`);
    }
  };

  const handleReset = () => {
    setResults([]);
    setProgress(0);
    setUsers([]);
    setSelectedRoleIds([]);
  };

  return (
    <div className="flex flex-col gap-6">
      <ProtectedBreadcrumb
        items={[
          { label: 'Access Control', menuKey: 'access-control', href: '/dashboard/access-control' },
          { label: 'Roles', menuKey: 'access-control.roles', href: '/dashboard/access-control/roles' },
          { label: 'Bulk Assign', menuKey: 'access-control.roles', href: '', isCurrent: true },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bulk Role Assignment</h1>
          <p className="text-muted-foreground">Assign roles to multiple users at once</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      {!isProcessing && results.length === 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Select Users
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter user ID"
                  value={userIdInput}
                  onChange={(e) => setUserIdInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddUser()}
                  type="number"
                />
                <Button onClick={handleAddUser}>Add User</Button>
              </div>

              {users.length > 0 && (
                <div className="space-y-2">
                  <Label>Users ({users.length})</Label>
                  <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                    {users.map(user => (
                      <div key={user.id} className="flex items-center gap-3 p-3 hover:bg-muted/50">
                        <Checkbox
                          checked={user.selected}
                          onCheckedChange={() => handleToggleUser(user.id)}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{user.email}</div>
                          <div className="text-xs text-muted-foreground">ID: {user.id}</div>
                        </div>
                        <Button
                          mode="icon"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveUser(user.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Select Roles to Assign
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {roles.map(role => (
                  <div
                    key={role.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedRoleIds.includes(role.id)
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleToggleRole(role.id)}
                  >
                    <Checkbox
                      checked={selectedRoleIds.includes(role.id)}
                      onCheckedChange={() => handleToggleRole(role.id)}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{role.display_name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          Level {role.hierarchy_level}
                        </Badge>
                        {role.is_system_role && (
                          <Badge variant="outline" className="text-xs">System</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">
                    {selectedUsers.length} users × {selectedRoleIds.length} roles = {selectedUsers.length * selectedRoleIds.length} operations
                  </div>
                </div>
                <Button
                  onClick={handleProcess}
                  disabled={!canProcess}
                  size="lg"
                >
                  Process Assignments
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {isProcessing && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin" />
                <div>
                  <div className="font-medium">Processing assignments...</div>
                  <div className="text-sm text-muted-foreground">
                    {Math.round(progress)}% complete
                  </div>
                </div>
              </div>
              <Progress value={progress} />
            </div>
          </CardContent>
        </Card>
      )}

      {!isProcessing && results.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Results</CardTitle>
                <Button onClick={handleReset} variant="outline">
                  Start New Batch
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 rounded-lg bg-muted">
                  <div className="text-2xl font-bold">{results.length}</div>
                  <div className="text-sm text-muted-foreground">Total Operations</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-green-50">
                  <div className="text-2xl font-bold text-green-600">
                    {results.filter(r => r.status === 'success').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Successful</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-red-50">
                  <div className="text-2xl font-bold text-red-600">
                    {results.filter(r => r.status === 'failed').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {results.map((result, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-3 rounded border ${
                      result.status === 'success'
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    {result.status === 'success' ? (
                      <Check className="h-5 w-5 text-green-600" />
                    ) : (
                      <X className="h-5 w-5 text-red-600" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {result.userEmail} → {result.roleName}
                      </div>
                      {result.error && (
                        <div className="text-xs text-red-600 mt-1">{result.error}</div>
                      )}
                    </div>
                    <Badge variant={result.status === 'success' ? 'primary' : 'destructive'}>
                      {result.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default BulkRoleAssignmentPage;