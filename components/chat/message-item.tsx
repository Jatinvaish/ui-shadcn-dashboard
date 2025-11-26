// components/chat/message-item.tsx - UPDATED WITH READ RECEIPTS
"use client"

import React, { useState } from "react"
import { cn } from "@/lib/utils"
import { MessageActionsPopover } from "./popovers/message-actions-popover"
import type { Message } from "./message-list"
import { MessageCircle, Check, CheckCheck } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
}


const MessageReadStatus = ({ message, isOwn }: { message: any; isOwn: boolean }) => {
  if (!isOwn) return null;

  const readCount = message.read_count || 0;
  const deliveredCount = message.delivered_count || 0;
  const readByUserIds = message.read_by_user_ids?.split(',').filter(Boolean) || [];
  const deliveredToUserIds = message.delivered_to_user_ids?.split(',').filter(Boolean) || [];

  const isRead = readCount > 0 || readByUserIds.length > 0;
  const isDelivered = deliveredCount > 0 || deliveredToUserIds.length > 0;

  // ✅ NEW: Animated transitions
  if (isRead) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-0.5 cursor-help animate-in fade-in duration-300">
              <CheckCheck className="h-3.5 w-3.5 text-blue-500 transition-all duration-300" strokeWidth={2.5} />
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
            <div className="flex items-center gap-0.5 cursor-help animate-in fade-in duration-300">
              <CheckCheck className="h-3.5 w-3.5 text-gray-500 transition-all duration-300" strokeWidth={2.5} />
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
          <div className="flex items-center gap-0.5 cursor-help animate-in fade-in duration-300">
            <Check className="h-3.5 w-3.5 text-gray-400 transition-all duration-300" strokeWidth={2.5} />
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
}: MessageItemProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const renderContent = (content: string) => {
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
    if (isDirect) {
      onReply?.(message.id);
    } else {
      onOpenThread?.(message.id);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    onReact?.(message.id, emoji);
    setShowEmojiPicker(false);
  };

  const groupedReactions = React.useMemo(() => {
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
  }, [message.reactions, currentUserId]);
  return (
    <div
      className={cn(
        "flex gap-3 py-2 px-3 group relative hover:bg-muted/30 transition-colors",
        isOwn ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div className="h-8 w-8 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold overflow-hidden">
        {message.authorAvatar ? (
          <img src={message.authorAvatar} alt="" className="h-full w-full object-cover" />
        ) : (
          message.authorName?.charAt(0).toUpperCase() || "U"
        )}
      </div>

      <div className={cn(
        "flex-1 min-w-0 flex flex-col gap-1",
        isOwn && "items-end"
      )}>
        <div className={cn(
          "flex items-center gap-2 flex-wrap text-xs",
          isOwn && "flex-row-reverse"
        )}>
          <span className="font-medium text-foreground">{message.authorName}</span>
          <span className="text-muted-foreground">{formatTime(message.timestamp)}</span>
          <MessageReadStatus message={message} isOwn={isOwn} />
          {message.edited && <span className="text-muted-foreground italic">(edited)</span>}
          {message.isPinned && (
            <div className="flex items-center gap-1 text-primary">
              <span className="text-xs">📌</span>
            </div>
          )}
        </div>

        {message.replyTo && (
          <div
            className={cn(
              "rounded border-l-2 border-primary bg-muted/60 p-2 text-xs w-full max-w-md cursor-pointer hover:bg-muted transition-colors",
              isOwn && "border-l-0 border-r-2"
            )}
            onClick={() => onScrollToMessage?.(message.replyTo!.messageId)}
          >
            <div className="font-medium text-primary">{message.replyTo.authorName}</div>
            <div className="line-clamp-2 text-muted-foreground">{message.replyTo.content}</div>
          </div>
        )}

        <div className={cn(
          "inline-block max-w-md rounded-lg px-3 py-2 shadow-sm",
          isOwn
            ? "bg-primary text-primary-foreground"
            : "bg-card text-card-foreground border border-border"
        )}>
          <p className="break-words text-sm leading-relaxed whitespace-pre-wrap">
            {renderContent(message.content)}
          </p>
        </div>

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

        {groupedReactions.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {groupedReactions.map((reaction) => (
              <TooltipProvider key={reaction.emoji}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onReact?.(message.id, reaction.emoji)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs transition-all border",
                        "hover:scale-110 active:scale-95",
                        reaction.userReacted
                          ? "bg-primary/20 border-primary text-primary font-medium shadow-sm"
                          : "bg-muted border-border hover:bg-muted/80 hover:border-primary/30"
                      )}
                    >
                      <span className="text-base leading-none">{reaction.emoji}</span>
                      {reaction.count > 1 && (
                        <span className="text-xs font-semibold">{reaction.count}</span>
                      )}
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

        {!isDirect && message.threadReplies !== undefined && message.threadReplies >= 0 && (
          <button
            onClick={() => onOpenThread?.(message.id)}
            className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium pt-1 w-fit"
          >
            <MessageCircle className="h-3 w-3" />
            <span>
              {message.threadReplies === 0
                ? "Reply in thread"
                : `${message.threadReplies} ${message.threadReplies === 1 ? "reply" : "replies"}`
              }
            </span>
          </button>
        )}
      </div>

      <div className={cn(
        "absolute top-0 flex items-center gap-1 bg-popover/95 backdrop-blur-sm rounded shadow-md p-1 border border-border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto z-10",
        isOwn ? "right-12" : "left-12",
        "-translate-y-1/2"
      )}>
        <div className="relative">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-1.5 hover:bg-muted rounded-md transition-colors text-base"
            title="React"
          >
            😊
          </button>
          {showEmojiPicker && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowEmojiPicker(false)} />
              <div className="absolute bottom-full mb-2 bg-popover border border-border rounded-lg shadow-lg p-2 flex gap-1 z-20">
                {['👍', '❤️', '😂', '😮', '😢', '🙏', '👏', '🔥'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiSelect(emoji)}
                    className="hover:bg-muted p-1.5 rounded text-lg transition-all hover:scale-125 active:scale-95"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

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
      </div>
    </div>
  )
}