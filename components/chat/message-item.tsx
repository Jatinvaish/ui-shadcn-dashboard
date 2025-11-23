// components/chat/message-item.tsx - COMPLETE FIX
"use client"

import React, { useState } from "react"
import { cn } from "@/lib/utils"
import { EmojiPopover } from "./popovers/emoji-popover"
import { MessageActionsPopover } from "./popovers/message-actions-popover"
import type { Message } from "./message-list"
import { MessageCircle, Pin } from "lucide-react"

interface MessageItemProps {
  message: Message
  isOwn: boolean
  isDirect?: boolean
  currentUserId?: string
  onReply?: (messageId: string) => void
  onReact?: (messageId: string, emoji: string) => void
  onOpenThread?: (messageId: string) => void
  onDelete?: (messageId: string) => void
  onEdit?: (messageId: string, newContent: string) => void
  onPin?: (messageId: string, isPinned: boolean) => void
  onReplyInThread?: (content: string, parentId: string) => void
  onForward?: (messageId: string) => void
  onScrollToMessage?: (messageId: string) => void
}

export function MessageItem({
  message,
  isOwn,
  isDirect = false,
  currentUserId,
  onReply,
  onReact,
  onOpenThread,
  onDelete,
  onEdit,
  onPin,
  onReplyInThread,
  onForward,
  onScrollToMessage,
}: MessageItemProps) {
  const [showActions, setShowActions] = useState(false)

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // ✅ FIX: Safe content rendering with null checks
  const renderContent = (content: string) => {
    if (!content || typeof content !== 'string') {
      return <span className="text-muted-foreground italic">Empty message</span>;
    }

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

  const handleReplyInThread = () => {
    if (isDirect) {
      onReply?.(message.id);
    } else {
      onOpenThread?.(message.id);
    }
  };

  // ✅ Display name with proper fallback
  const displayName = isOwn ? "You" : (message.authorName || "Unknown User");

  return (
    <div
      className={cn(
        "flex gap-3 py-2 items-start hover:bg-muted/30 rounded px-3 transition-colors duration-150",
        isOwn ? "flex-row-reverse" : "flex-row",
        "group/message"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div className="h-8 w-8 flex-shrink-0 rounded-full bg-gradient-to-br from-primary/60 to-primary/80 flex items-center justify-center text-white text-xs font-semibold">
        {message.authorAvatar ? (
          <img src={message.authorAvatar} alt="" className="h-full w-full rounded-full object-cover" />
        ) : (
          displayName.charAt(0).toUpperCase()
        )}
      </div>

      {/* Message Content */}
      <div className={cn(
        "flex-1 min-w-0 flex flex-col gap-1",
        isOwn ? "items-end" : "items-start"
      )}>
        {/* Header */}
        <div className={cn(
          "flex items-center gap-2 flex-wrap",
          isOwn ? "flex-row-reverse" : "flex-row"
        )}>
          <span className="text-sm font-medium">{displayName}</span>
          <span className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>
          {message.edited && <span className="text-xs text-muted-foreground italic">(edited)</span>}
          {message.isPinned && (
            <div className="flex items-center gap-1 text-xs text-primary">
              <Pin className="h-3 w-3" />
              <span>Pinned</span>
            </div>
          )}
        </div>

        {/* Reply Reference - Clickable */}
        {message.replyTo && (
          <div 
            onClick={() => onScrollToMessage?.(message.replyTo!.messageId)}
            className={cn(
              "rounded border-l-2 border-primary bg-muted/60 p-2 text-xs w-full cursor-pointer hover:bg-muted transition-colors",
              isOwn ? "text-right" : "text-left"
            )}
          >
            <div className="font-medium text-primary">{message.replyTo.authorName}</div>
            <div className="line-clamp-2 text-muted-foreground">{message.replyTo.content}</div>
          </div>
        )}

        {/* Message Bubble */}
        <div className={cn(
          "rounded-2xl px-4 py-2 max-w-[70%] break-words",
          isOwn 
            ? "bg-primary text-primary-foreground rounded-tr-sm" 
            : "bg-muted text-foreground rounded-tl-sm"
        )}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {renderContent(message.content)}
          </p>
        </div>

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
            onClick={() => onOpenThread?.(message.id)}
            className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium pt-1 w-fit"
          >
            <MessageCircle className="h-3 w-3" />
            <span>{message.threadReplies} {message.threadReplies === 1 ? "reply" : "replies"}</span>
          </button>
        )}
      </div>

      {/* Action buttons */}
      {showActions && (
        <div className={cn(
          "flex items-center gap-1 flex-shrink-0 bg-background rounded shadow-md p-1.5 border border-border",
          isOwn ? "flex-row-reverse" : "flex-row"
        )}>
          <MessageActionsPopover
            isDirect={isDirect}
            isOwn={isOwn}
            isPinned={message.isPinned}
            messageId={message.id}
            messageContent={message.content}
            onReply={onReply}
            onReplyInThread={handleReplyInThread}
            onDelete={onDelete}
            onEdit={onEdit}
            onPin={onPin}
            onForward={onForward}
          />
          <EmojiPopover
            onEmojiSelect={(emoji) => onReact?.(message.id, emoji)}
          />
        </div>
      )}
    </div>
  )
}