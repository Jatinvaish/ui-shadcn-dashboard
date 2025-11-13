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
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

interface InviteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  channelName: string
  onInviteUsers: (emails: string[]) => void
}

export function InviteDialog({ open, onOpenChange, channelName, onInviteUsers }: InviteDialogProps) {
  const [emails, setEmails] = React.useState<string[]>([])
  const [inputValue, setInputValue] = React.useState("")

  const handleAddEmail = () => {
    const email = inputValue.trim().toLowerCase()
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !emails.includes(email)) {
      setEmails([...emails, email])
      setInputValue("")
    }
  }

  const handleRemoveEmail = (email: string) => {
    setEmails(emails.filter((e) => e !== email))
  }

  const handleInvite = () => {
    if (emails.length > 0) {
      onInviteUsers(emails)
      setEmails([])
      setInputValue("")
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite people to #{channelName}</DialogTitle>
          <DialogDescription>Add team members to this channel by email</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-input">Email addresses</Label>
            <div className="flex gap-2">
              <Input
                id="email-input"
                type="email"
                placeholder="user@example.com"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddEmail()
                  }
                }}
              />
              <Button onClick={handleAddEmail} variant="outline">
                Add
              </Button>
            </div>
          </div>
          {emails.length > 0 && (
            <div className="space-y-2">
              <Label>Added ({emails.length})</Label>
              <div className="flex flex-wrap gap-2">
                {emails.map((email) => (
                  <Badge key={email} variant="secondary" className="flex items-center gap-1">
                    {email}
                    <button onClick={() => handleRemoveEmail(email)} className="ml-1 hover:opacity-70" title="Remove">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleInvite} disabled={emails.length === 0}>
            Invite {emails.length > 0 ? `(${emails.length})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
