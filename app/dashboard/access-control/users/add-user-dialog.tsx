// components/users/add-user-dialog.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Combobox } from "@/components/ui/combobox";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectUser, sendInvite } from "@/store/slices/authSlice";
import { selectRoles, selectRolesLoading } from "@/store/slices/roles.slice";
import { selectCurrentTenant } from "@/store/slices/tenantSlice";
import { Role } from "@/lib/api/services/rbac-service";

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddUserDialog({ open, onOpenChange, onSuccess }: AddUserDialogProps) {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectUser);
  const currentTenant = useAppSelector(selectCurrentTenant);
  const roles = useAppSelector(selectRoles);
  const rolesLoading = useAppSelector(selectRolesLoading);

  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [internalRoleSearch, setInternalRoleSearch] = useState("");

  const tenantId = currentUser?.tenantId || currentTenant?.id;

  const filteredRoles = useMemo(() => {
    if (!internalRoleSearch) return roles;
    const searchLower = internalRoleSearch.toLowerCase();
    return roles.filter((role: Role) => {
      const displayName = role.display_name || role.displayName || role.name || "";
      const name = role.name || "";
      return (
        displayName.toLowerCase().includes(searchLower) || name.toLowerCase().includes(searchLower)
      );
    });
  }, [roles, internalRoleSearch]);

  useEffect(() => {
    if (!open) {
      setUserName("");
      setUserEmail("");
      setRoleId("");
      setInternalRoleSearch("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!userEmail || !roleId) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!tenantId) {
      toast.error("No tenant selected");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsAdding(true);
    try {
      await dispatch(
        sendInvite({
          inviteeEmail: userEmail,
          inviteeName: userName,
          inviteeType: "staff",
          roleId: Number(roleId),
          invitationMessage: `You have been invited to join the tenant.`
        })
      ).unwrap();

      toast.success("Invitation sent successfully");
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error || "Failed to send invitation");
    } finally {
      setIsAdding(false);
    }
  };

  const comboboxItems = filteredRoles.map((role: Role) => ({
    id: role.id,
    label: role.display_name || role.displayName || role.name,
    description: role.is_system_role ? "(System Role)" : undefined
  }));

  return (
    <Dialog open={open} onOpenChange={(val) => !isAdding && onOpenChange(val)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add User to Tenant</DialogTitle>
          <DialogDescription>
            Add an existing user or invite a new user to join this tenant
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              disabled={isAdding}
            />
            <p className="text-muted-foreground text-xs">
              Enter the email address. If user doesn't exist, an invitation will be sent.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              disabled={isAdding}
            />
            <p className="text-muted-foreground text-xs">Enter the full name (optional)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Combobox
              value={roleId}
              onValueChange={setRoleId}
              items={comboboxItems}
              placeholder="Select a role..."
              emptyMessage="No roles found."
              disabled={isAdding}
              isLoading={rolesLoading}
            />
            <p className="text-muted-foreground text-xs">Select the role to assign to this user</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isAdding}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isAdding || !userEmail || !roleId || !tenantId}>
            {isAdding ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add User
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
