"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertCircle } from "lucide-react"

interface CreateChannelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateChannel: (name: string, isPrivate: boolean, description: string) => void
}

export function CreateChannelDialog({ open, onOpenChange, onCreateChannel }: CreateChannelDialogProps) {
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [isPrivate, setIsPrivate] = React.useState(false)
  const [error, setError] = React.useState("")

  const handleCreate = () => {
    if (!name.trim()) {
      setError("Channel name is required")
      return
    }
    if (!/^[a-z0-9-]+$/.test(name)) {
      setError("Channel name can only contain lowercase letters, numbers, and hyphens")
      return
    }
    onCreateChannel(name, isPrivate, description)
    setName("")
    setDescription("")
    setIsPrivate(false)
    setError("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a new channel</DialogTitle>
          <DialogDescription>Create a public or private channel to organize conversations</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="channel-name">Channel name</Label>
            <Input
              id="channel-name"
              placeholder="e.g., project-updates"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="channel-description">Description (optional)</Label>
            <Input
              id="channel-description"
              placeholder="What is this channel about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="private-channel"
              checked={isPrivate}
              onCheckedChange={(checked) => setIsPrivate(checked as boolean)}
            />
            <Label htmlFor="private-channel" className="font-normal cursor-pointer">
              Make this a private channel
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>Create channel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
