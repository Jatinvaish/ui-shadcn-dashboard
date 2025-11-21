// components/chat/message-item.tsx - ENHANCED WITH ALL FEATURES
"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { EmojiPopover } from "./popovers/emoji-popover"
import { MessageActionsPopover } from "./popovers/message-actions-popover"
import type { Message } from "./message-list"
import { MessageCircle, Pin } from "lucide-react"

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

  // Extract mentions from content
  const renderContent = (content: string) => {
    const mentionRegex = /@(\w+)/g;
    const parts = content.split(mentionRegex);
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          <span key={index} className="text-blue-500 font-semibold bg-blue-50 dark:bg-blue-950 px-1 rounded">
            @{part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div
      className="flex gap-3 group/message py-2 items-start hover:bg-muted/30 rounded px-3 transition-colors duration-150"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="h-8 w-8 flex-shrink-0 rounded-full bg-gradient-to-br from-primary/60 to-primary/80 flex items-center justify-center text-white text-xs font-semibold">
        {message.authorName?.charAt(0).toUpperCase() || "U"}
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{message.authorName}</span>
          <span className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>
          {message.edited && <span className="text-xs text-muted-foreground italic">(edited)</span>}
          {message.isPinned && (
            <div className="flex items-center gap-1 text-xs text-primary">
              <Pin className="h-3 w-3" />
              <span>Pinned</span>
            </div>
          )}
        </div>

        {/* Reply bubble */}
        {message.replyTo && (
          <div className="rounded border-l-2 border-primary bg-muted/60 p-2 text-xs w-full">
            <div className="font-medium text-primary">{message.replyTo.authorName}</div>
            <div className="line-clamp-2 text-muted-foreground">{message.replyTo.content}</div>
          </div>
        )}

        {/* Message text with mentions */}
        <p className="break-words text-sm leading-relaxed">
          {renderContent(message.content)}
        </p>

        {/* Files */}
        {message.files && message.files.length > 0 && (
          <div className="space-y-1">
            {message.files.map((file) => (
              <div
                key={file.name}
                className="inline-flex items-center gap-2 rounded border border-border bg-muted px-3 py-1 text-xs hover:bg-muted/80 transition-colors cursor-pointer"
              >
                📎 {file.name}
              </div>
            ))}
          </div>
        )}

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {message.reactions.map((reaction, index) => (
              <button
                key={`${reaction.emoji}-${index}`}
                onClick={() => onReact?.(message.id, reaction.emoji)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs transition-colors hover:bg-accent",
                  reaction.userReacted && "bg-primary/20 border border-primary",
                )}
              >
                {reaction.emoji} <span className="text-xs">{reaction.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Thread replies indicator */}
        {!isDirect && message.threadReplies && message.threadReplies > 0 && (
          <button
            onClick={() => {
              onOpenThread?.(message.id)
            }}
            className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium pt-1 w-fit"
          >
            <MessageCircle className="h-3 w-3" />
            <span>{message.threadReplies} {message.threadReplies === 1 ? "reply" : "replies"}</span>
          </button>
        )}
      </div>

      {/* Action buttons */}
      {showActions && (
        <div className="flex items-center gap-1 flex-shrink-0 bg-background rounded shadow-md p-1.5 border border-border">
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
              onReact?.(message.id, emoji)
            }}
          />
        </div>
      )}
    </div>
  )
}