"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Archive, LogOut } from "lucide-react"

interface ChannelSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  channelName: string
  description?: string
  isPrivate?: boolean
  onUpdateChannel?: (name: string, description: string) => void
  onArchiveChannel?: () => void
  onLeaveChannel?: () => void
}

export function ChannelSettingsDialog({
  open,
  onOpenChange,
  channelName,
  description = "",
  isPrivate = false,
  onUpdateChannel,
  onArchiveChannel,
  onLeaveChannel,
}: ChannelSettingsDialogProps) {
  const [name, setName] = React.useState(channelName)
  const [desc, setDesc] = React.useState(description)
  const [showArchiveDialog, setShowArchiveDialog] = React.useState(false)
  const [showLeaveDialog, setShowLeaveDialog] = React.useState(false)

  // Update local state when dialog opens or props change
  React.useEffect(() => {
    if (open) {
      setName(channelName)
      setDesc(description)
    }
  }, [open, channelName, description])

  const handleUpdate = () => {
    onUpdateChannel?.(name, desc)
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Channel settings</DialogTitle>
            <DialogDescription>Manage channel information and preferences</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="channel-name">Channel name</Label>
              <Input
                id="channel-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="channel-desc">Description</Label>
              <Textarea id="channel-desc" value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} />
            </div>
            <div className="pt-4 border-t border-border space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Danger zone</p>
              <div className="space-y-2">
                <Button
                  onClick={() => setShowArchiveDialog(true)}
                  variant="outline"
                  className="w-full justify-start text-destructive hover:text-destructive"
                >
                  <Archive className="mr-2 h-4 w-4" />
                  Archive channel
                </Button>
                <Button
                  onClick={() => setShowLeaveDialog(true)}
                  variant="outline"
                  className="w-full justify-start text-destructive hover:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Leave channel
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive channel?</AlertDialogTitle>
            <AlertDialogDescription>
              This channel will be archived and hidden from everyone's channel list. This action can be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onArchiveChannel?.()
                setShowArchiveDialog(false)
                onOpenChange(false)
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave channel?</AlertDialogTitle>
            <AlertDialogDescription>
              You will no longer have access to #{channelName}. You can request to rejoin later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onLeaveChannel?.()
                setShowLeaveDialog(false)
                onOpenChange(false)
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}