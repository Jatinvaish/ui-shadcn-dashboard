"use client"

import React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { MessageCircle, MoreVertical, Reply, Trash2 } from "lucide-react"

interface MessageActionsPopoverProps {
  isDirect?: boolean
  isOwn: boolean
  messageId: string
  onReply?: (messageId: string) => void
  onReplyInThread?: (messageId: string) => void
  onDelete?: (messageId: string) => void
}

export function MessageActionsPopover({
  isDirect = false,
  isOwn,
  messageId,
  onReply,
  onReplyInThread,
  onDelete,
}: MessageActionsPopoverProps) {
  const [open, setOpen] = React.useState(false)

  const handleReply = () => {
    console.log("[v0] Reply clicked for message:", messageId)
    if (isDirect) {
      onReply?.(messageId)
    } else {
      onReplyInThread?.(messageId)
    }
    setOpen(false)
  }

  const handleDelete = () => {
    console.log("[v0] Deleting message:", messageId)
    onDelete?.(messageId)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="icon" variant="ghost" className="h-7 w-7">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" side="top" align="end">
        <div className="flex flex-col gap-1 p-2">
          {/* Reply option - always show */}
          <button
            onClick={handleReply}
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded transition-colors"
          >
            {isDirect ? (
              <>
                <Reply className="h-4 w-4" />
                Reply
              </>
            ) : (
              <>
                <MessageCircle className="h-4 w-4" />
                Reply in thread
              </>
            )}
          </button>

          {/* Delete option - only for own messages */}
          {isOwn && (
            <>
              <div className="h-px bg-border my-1" />
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
