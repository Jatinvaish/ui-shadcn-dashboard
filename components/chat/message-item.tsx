"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { EmojiPopover } from "./popovers/emoji-popover"
import { MessageActionsPopover } from "./popovers/message-actions-popover"
import type { Message } from "./message-list"

interface MessageItemProps {
  message: Message
  isOwn: boolean
  isDirect?: boolean
  onReply?: (messageId: string) => void
  onReact?: (messageId: string, emoji: string) => void
  onOpenThread?: (messageId: string) => void
  onDelete?: (messageId: string) => void
  onReplyInThread?: (messageId: string) => void
}

export function MessageItem({
  message,
  isOwn,
  isDirect = false,
  onReply,
  onReact,
  onOpenThread,
  onDelete,
  onReplyInThread,
}: MessageItemProps) {
  const [showActions, setShowActions] = React.useState(false)

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div
      className="flex gap-3 group/message py-2 items-start"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar - always on left */}
      <div className="h-8 w-8 flex-shrink-0 rounded-full bg-accent" />

      <div className="flex-1 max-w-md flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{message.authorName}</span>
          <span className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>
          {message.edited && <span className="text-xs text-muted-foreground">(edited)</span>}
        </div>

        {/* WhatsApp-like reply bubble if message has a reply */}
        {message.replyTo && (
          <div className="rounded border-l-2 border-primary bg-muted p-2 text-xs w-full">
            <div className="font-medium text-primary">{message.replyTo.authorName}</div>
            <div className="line-clamp-2 text-muted-foreground">{message.replyTo.content}</div>
          </div>
        )}

        {/* Message text */}
        <p className="break-words text-sm">{message.content}</p>

        {/* Files */}
        {message.files && message.files.length > 0 && (
          <div className="space-y-1">
            {message.files.map((file) => (
              <div
                key={file.name}
                className="inline-flex items-center gap-2 rounded border border-border bg-muted px-3 py-1 text-xs"
              >
                📎 {file.name}
              </div>
            ))}
          </div>
        )}

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {message.reactions.map((reaction) => (
              <button
                key={reaction.emoji}
                onClick={() => onReact?.(message.id, reaction.emoji)}
                className={cn(
                  "inline-flex items-center gap-1 rounded bg-muted px-2 py-1 text-xs transition-colors hover:bg-accent",
                  reaction.userReacted && "bg-accent",
                )}
              >
                {reaction.emoji} {reaction.count}
              </button>
            ))}
          </div>
        )}

        {/* Thread replies indicator - only show for channels */}
        {!isDirect && message.threadReplies && message.threadReplies > 0 && (
          <button
            onClick={() => {
              console.log("[v0] Opening thread for message:", message.id)
              onOpenThread?.(message.id)
            }}
            className="text-xs text-primary hover:underline"
          >
            {message.threadReplies} replies
          </button>
        )}
      </div>

      {showActions && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <MessageActionsPopover
            isDirect={isDirect}
            isOwn={isOwn}
            messageId={message.id}
            onReply={onReply}
            onReplyInThread={onReplyInThread}
            onDelete={onDelete}
          />
          <EmojiPopover
            onEmojiSelect={(emoji) => {
              console.log("[v0] Emoji selected:", emoji)
              onReact?.(message.id, emoji)
            }}
          />
        </div>
      )}
    </div>
  )
}
