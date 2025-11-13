"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Pin, PinOff } from "lucide-react"

interface PinDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  channelName: string
  isPinned: boolean
  onPinChange: (pinned: boolean) => void
}

export function PinDialog({ open, onOpenChange, channelName, isPinned, onPinChange }: PinDialogProps) {
  const [newPinState, setNewPinState] = React.useState(isPinned)

  React.useEffect(() => {
    setNewPinState(isPinned)
  }, [isPinned])

  const handleSave = () => {
    onPinChange(newPinState)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Pin channel</DialogTitle>
          <DialogDescription>Keep #{channelName} at the top of your channel list</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-4 rounded-lg border border-border bg-muted/30">
            <Checkbox
              id="pin-checkbox"
              checked={newPinState}
              onCheckedChange={(checked) => setNewPinState(checked as boolean)}
            />
            <Label htmlFor="pin-checkbox" className="flex items-center gap-2 font-normal cursor-pointer flex-1">
              {newPinState ? (
                <>
                  <Pin className="h-4 w-4" />
                  Channel is pinned
                </>
              ) : (
                <>
                  <PinOff className="h-4 w-4" />
                  Channel is unpinned
                </>
              )}
            </Label>
          </div>
          <p className="text-sm text-muted-foreground">
            {newPinState
              ? "This channel will appear at the top of your sidebar for quick access."
              : "This channel will appear in your normal channel list."}
          </p>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>{newPinState ? "Pin" : "Unpin"} channel</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
