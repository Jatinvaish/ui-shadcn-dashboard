"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Circle } from "lucide-react"

type StatusType = "active" | "away" | "offline"

interface UserStatusDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentStatus: StatusType
  currentStatusMessage?: string
  onStatusChange: (status: StatusType, message: string) => void
}

export function UserStatusDialog({
  open,
  onOpenChange,
  currentStatus,
  currentStatusMessage = "",
  onStatusChange,
}: UserStatusDialogProps) {
  const [status, setStatus] = React.useState<StatusType>(currentStatus)
  const [message, setMessage] = React.useState(currentStatusMessage)

  const statusOptions: Array<{ value: StatusType; label: string; color: string }> = [
    { value: "active", label: "Active", color: "bg-green-500" },
    { value: "away", label: "Away", color: "bg-yellow-500" },
    { value: "offline", label: "Offline", color: "bg-gray-400" },
  ]

  const handleStatusChange = () => {
    onStatusChange(status, message)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Set your status</DialogTitle>
          <DialogDescription>Let your team know what you're up to</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <RadioGroup value={status} onValueChange={(value) => setStatus(value as StatusType)}>
            {statusOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-3">
                <RadioGroupItem value={option.value} id={option.value} />
                <Label htmlFor={option.value} className="flex items-center gap-2 font-normal cursor-pointer">
                  <Circle className={`h-3 w-3 ${option.color}`} />
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
          <div className="space-y-2">
            <Label htmlFor="status-message">Status message (optional)</Label>
            <Input
              id="status-message"
              placeholder="What are you working on?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground text-right">{message.length}/50</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleStatusChange}>Update status</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
