"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface User {
  id: string
  name: string
  email: string
  status?: "active" | "away" | "offline"
}

interface DirectMessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  users: User[]
  onStartDirectMessage: (userId: string) => void
}

export function DirectMessageDialog({ open, onOpenChange, users, onStartDirectMessage }: DirectMessageDialogProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedUserId, setSelectedUserId] = React.useState<string>("")

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleStartDM = () => {
    if (selectedUserId) {
      onStartDirectMessage(selectedUserId)
      setSelectedUserId("")
      setSearchQuery("")
      onOpenChange(false)
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "away":
        return "bg-yellow-500"
      default:
        return "bg-gray-400"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Start a direct message</DialogTitle>
          <DialogDescription>Select a user to message</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-search">Find user</Label>
            <Input
              id="user-search"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <ScrollArea className="h-72 w-full rounded border border-border">
            <div className="p-4 space-y-2">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id)}
                    className={`flex items-center gap-3 p-3 rounded cursor-pointer transition-colors ${
                      selectedUserId === user.id ? "bg-sidebar-accent" : "hover:bg-muted"
                    }`}
                  >
                    <div className="relative h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                      <span
                        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ${getStatusColor(user.status)} border-2 border-background`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No users found</p>
              )}
            </div>
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleStartDM} disabled={!selectedUserId}>
            Start message
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
