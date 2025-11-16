// app/dashboard/access-control/reports/user-access/page.tsx - NEW
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Shield, Key, Menu, Download, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ProtectedBreadcrumb } from '@/components/guards/protected-breadcrumb';
import { RbacService } from '@/lib/api/services/rbac-service';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const UserAccessReportPage = () => {
  const router = useRouter();

  const [userId, setUserId] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [includeInherited, setIncludeInherited] = useState(true);
  const [includeMenus, setIncludeMenus] = useState(true);
  const [includeResources, setIncludeResources] = useState(false);

  const handleGenerate = async () => {
    if (!userId || isNaN(Number(userId))) {
      toast.error('Please enter a valid user ID');
      return;
    }

    setIsLoading(true);
    try {
      const response = await RbacService.getUserAccessReport({
        userId: Number(userId),
        includeInheritedPermissions: includeInherited,
        includeMenuAccess: includeMenus,
        includeResourcePermissions: includeResources,
      });

      setReportData(response.data);
      toast.success('Report generated successfully');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to generate report');
      setReportData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (!reportData) return;

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `user-access-report-${userId}-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success('Report exported successfully');
  };

  const groupPermissionsByCategory = (permissions: any[]) => {
    const grouped = new Map<string, any[]>();
    
    permissions.forEach(perm => {
      const category = perm.category || 'Uncategorized';
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(perm);
    });

    return Array.from(grouped.entries()).map(([category, perms]) => ({
      category,
      permissions: perms,
    }));
  };

  return (
    <div className="flex flex-col gap-6">
      <ProtectedBreadcrumb
        items={[
          { label: 'Access Control', menuKey: 'access-control', href: '/dashboard/access-control' },
          { label: 'Reports', menuKey: 'access-control', href: '/dashboard/access-control/reports' },
          { label: 'User Access', menuKey: 'access-control', href: '', isCurrent: true },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Access Report</h1>
          <p className="text-muted-foreground">Comprehensive access analysis for a specific user</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="userId">User ID *</Label>
              <div className="flex gap-2">
                <Input
                  id="userId"
                  placeholder="Enter user ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  type="number"
                />
                <Button onClick={handleGenerate} disabled={isLoading}>
                  <Search className="h-4 w-4" />
                  Generate
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <Label>Report Options</Label>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Include Inherited Permissions</Label>
                <p className="text-xs text-muted-foreground">
                  Show all permissions from assigned roles
                </p>
              </div>
              <Switch
                checked={includeInherited}
                onCheckedChange={setIncludeInherited}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Include Menu Access</Label>
                <p className="text-xs text-muted-foreground">
                  Show accessible menu items
                </p>
              </div>
              <Switch
                checked={includeMenus}
                onCheckedChange={setIncludeMenus}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Include Resource Permissions</Label>
                <p className="text-xs text-muted-foreground">
                  Show resource-level access (slower)
                </p>
              </div>
              <Switch
                checked={includeResources}
                onCheckedChange={setIncludeResources}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && reportData && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  User Information
                </CardTitle>
                <Button onClick={handleExport} variant="outline" size="sm">
                  <Download className="h-4 w-4" />
                  Export JSON
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Email</Label>
                  <div className="font-medium">{reportData.user.email}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">User Type</Label>
                  <Badge>{reportData.user.user_type || 'N/A'}</Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Name</Label>
                  <div className="font-medium">
                    {reportData.user.first_name} {reportData.user.last_name}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">User ID</Label>
                  <div className="font-medium">{reportData.user.id}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">
                    {reportData.summary.totalRoles}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Assigned Roles</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {reportData.summary.totalPermissions}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Permissions</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {reportData.summary.accessibleMenusCount}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Accessible Menus</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">
                    {reportData.summary.highestHierarchy}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Hierarchy Level</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="roles" className="w-full">
            <TabsList>
              <TabsTrigger value="roles">
                <Shield className="h-4 w-4 mr-2" />
                Roles ({reportData.roles.length})
              </TabsTrigger>
              <TabsTrigger value="permissions">
                <Key className="h-4 w-4 mr-2" />
                Permissions ({reportData.permissions.length})
              </TabsTrigger>
              {includeMenus && (
                <TabsTrigger value="menus">
                  <Menu className="h-4 w-4 mr-2" />
                  Menus ({reportData.accessibleMenus.length})
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="roles">
              <Card>
                <CardHeader>
                  <CardTitle>Assigned Roles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reportData.roles.map((role: any) => (
                      <div key={role.id} className="flex items-center justify-between p-4 rounded border">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Shield className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{role.display_name || role.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Assigned: {new Date(role.assigned_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Level {role.hierarchy_level}</Badge>
                          {role.is_system_role && (
                            <Badge variant="outline">System</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="permissions">
              <Card>
                <CardHeader>
                  <CardTitle>Effective Permissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" className="w-full">
                    {groupPermissionsByCategory(reportData.permissions).map((group) => (
                      <AccordionItem key={group.category} value={group.category}>
                        <AccordionTrigger>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{group.category}</span>
                            <Badge variant="secondary">{group.permissions.length}</Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 pt-2">
                            {group.permissions.map((perm: any) => (
                              <div key={perm.id} className="flex items-center justify-between p-3 rounded border">
                                <div>
                                  <div className="font-medium text-sm">{perm.permission_key}</div>
                                  {perm.description && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {perm.description}
                                    </div>
                                  )}
                                </div>
                                <Badge variant="outline">{perm.resource}:{perm.action}</Badge>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>

            {includeMenus && (
              <TabsContent value="menus">
                <Card>
                  <CardHeader>
                    <CardTitle>Accessible Menus</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {reportData.accessibleMenus.map((menu: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded border">
                          <Menu className="h-4 w-4 text-primary" />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{menu.title}</div>
                            <div className="text-xs text-muted-foreground">{menu.key}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </>
      )}
    </div>
  );
};

export default UserAccessReportPage;