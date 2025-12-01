// components/chat/message-item.tsx
"use client"

import React, { useState, useMemo, useEffect } from "react"
import { cn } from "@/lib/utils"
import { MessageActionsPopover } from "./popovers/message-actions-popover"
import type { Message } from "./message-list"
import { MessageCircle, Check, CheckCheck, Pin } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import DOMPurify from 'dompurify'

interface MessageItemProps {
  message: Message
  isOwn: boolean
  isDirect?: boolean
  currentUserId: string
  onReply?: (messageId: string) => void
  onReact?: (messageId: string, emoji: string) => void
  onOpenThread?: (messageId: string) => void
  onDelete?: (messageId: string) => void
  onEdit?: (messageId: string, newContent: string) => void
  onPin?: (messageId: string, isPinned: boolean) => void
  onReplyInThread?: (content: string, parentId: string) => void
  onForward?: (messageId: string) => void
  onScrollToMessage?: (messageId: string) => void
  isInThread?: boolean
}

const MessageReadStatus = ({ message, isOwn }: { message: any; isOwn: boolean }) => {
  if (!isOwn) return null;

  const readCount = message.read_count || 0;
  const deliveredCount = message.delivered_count || 0;
  const readByUserIds = message.read_by_user_ids?.split(',').filter(Boolean) || [];
  const deliveredToUserIds = message.delivered_to_user_ids?.split(',').filter(Boolean) || [];

  const isRead = readCount > 0 || readByUserIds.length > 0;
  const isDelivered = deliveredCount > 0 || deliveredToUserIds.length > 0;

  if (isRead) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-0.5 cursor-help">
              <CheckCheck className="h-3.5 w-3.5 text-blue-500" strokeWidth={2.5} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Read by {readCount} {readCount === 1 ? 'person' : 'people'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (isDelivered) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-0.5 cursor-help">
              <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2.5} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Delivered to {deliveredCount} {deliveredCount === 1 ? 'person' : 'people'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-0.5 cursor-help">
            <Check className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2.5} />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Sent</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

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
  isInThread = false,
}: MessageItemProps) {

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const renderContent = (content: string) => {
    const isHTML = /<[^>]+>/.test(content);

    if (isHTML) {
      const sanitizedHTML = DOMPurify.sanitize(content, {
        ALLOWED_TAGS: [
          'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
          'ul', 'ol', 'li', 'blockquote', 'a', 'span'
        ],
        ALLOWED_ATTR: ['class', 'href', 'data-type', 'data-id', 'data-label']
      });

      return (
        <div
          className="prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
        />
      );
    }

    const mentionRegex = /@(\w+)/g;
    const parts = content.split(mentionRegex);

    return parts.map((part, index) => {
      if (index % 2 === 1) {
        const isMentioningMe = message?.am_i_mentioned || false;
        return (
          <span
            key={index}
            className={cn(
              "font-semibold px-1 rounded",
              isMentioningMe
                ? "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400"
                : "text-primary bg-primary/10"
            )}
          >
            @{part}
          </span>
        );
      }
      return part;
    });
  };

  const handleReplyInThread = () => {
    if (isDirect || isInThread) {
      onReply?.(message.id);
    } else {
      onOpenThread?.(message.id);
    }
  };

  const groupedReactions = useMemo(() => {
    if (!message.reactions || message.reactions.length === 0) return [];

    const reactionMap = new Map<string, {
      emoji: string;
      count: number;
      userReacted: boolean;
      userIds: number[];
      users: string[];
    }>();

    message.reactions.forEach((reaction: any) => {
      const existing = reactionMap.get(reaction.emoji);
      const reactorId = reaction.user_id || 0;
      const reactorName = `${reaction.first_name || ''} ${reaction.last_name || ''}`.trim() || 'Anonymous';
      const userReacted = reactorId.toString() === currentUserId;

      if (existing) {
        existing.count += 1;
        existing.userReacted = existing.userReacted || userReacted;
        if (!existing.userIds.includes(reactorId)) {
          existing.userIds.push(reactorId);
          existing.users.push(reactorName);
        }
      } else {
        reactionMap.set(reaction.emoji, {
          emoji: reaction.emoji,
          count: 1,
          userReacted,
          userIds: [reactorId],
          users: [reactorName]
        });
      }
    });

    return Array.from(reactionMap.values()).sort((a, b) => b.count - a.count);
  }, [message.reactions, message.reactions?.length, currentUserId]);

  const initials = message.authorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="group hover:bg-muted/30 -mx-4 lg:-mx-6 px-4 lg:px-6 py-1.5 relative">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="w-9 h-9 rounded bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-primary-foreground text-sm font-semibold flex-shrink-0 mt-0.5">
          {message.authorAvatar ? (
            <img src={message.authorAvatar} alt="" className="w-full h-full rounded object-cover" />
          ) : (
            initials
          )}
        </div>

        {/* Message Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="font-bold text-sm text-foreground">{message.authorName}</span>
            <span className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>
            <MessageReadStatus message={message} isOwn={isOwn} />
            {message.edited && (
              <span className="text-xs text-muted-foreground">(edited)</span>
            )}
            {message.isPinned && <Pin className="w-3 h-3 text-muted-foreground" />}
          </div>

          {/* Reply Preview */}
          {message.replyTo && (
            <div
              className="rounded border-l-2 border-primary bg-muted/60 p-2 text-xs mb-2 cursor-pointer hover:bg-muted transition-colors"
              onClick={() => onScrollToMessage?.(message.replyTo!.messageId)}
            >
              <div className="font-medium text-primary">{message.replyTo.authorName}</div>
              <div className="line-clamp-2 text-muted-foreground">{message.replyTo.content}</div>
            </div>
          )}

          {/* Message content */}
          <div className="text-sm break-words text-foreground mt-0.5">
            {renderContent(message.content)}
          </div>

          {/* File Attachments */}
          {message.files && message.files.length > 0 && (
            <div className="space-y-1 mt-2">
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
          {groupedReactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {groupedReactions.map((reaction) => (
                <TooltipProvider key={`${message.id}-${reaction.emoji}-${reaction.count}`}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onReact?.(message.id, reaction.emoji)}
                        className={cn(
                          "flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors border",
                          reaction.userReacted
                            ? "bg-primary/20 border-primary text-primary"
                            : "bg-muted border-border hover:bg-muted/80"
                        )}
                      >
                        <span>{reaction.emoji}</span>
                        <span>{reaction.count}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{reaction.users.join(', ')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          )}

          {/* Thread Reply Count */}
          {!isInThread && !isDirect && message.threadReplies !== undefined && message.threadReplies >= 0 && (
            <button
              onClick={() => onOpenThread?.(message.id)}
              className="flex items-center gap-2 mt-2 text-xs text-primary hover:text-primary/80 font-medium"
            >
              <MessageCircle className="w-4 h-4" />
              {message.threadReplies === 0
                ? "Reply in thread"
                : `${message.threadReplies} ${message.threadReplies === 1 ? "reply" : "replies"}`
              }
            </button>
          )}
        </div>
      </div>

      {/* Hover Actions */}
      <div className="absolute top-0 right-4 lg:right-6 flex items-center gap-1 bg-background border border-border rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 -translate-y-1/2">
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
          onReact={onReact}
          onForward={onForward}
          isInThread={isInThread}
        />
      </div>
    </div>
  )
}