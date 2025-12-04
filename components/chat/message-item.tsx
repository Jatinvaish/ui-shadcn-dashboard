// components/chat/message-item.tsx - WITH FILE ATTACHMENTS
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { MessageActionsPopover } from "./popovers/message-actions-popover";
import type { Message } from "./message-list";
import {
  MessageCircle,
  Check,
  CheckCheck,
  Pin,
  Download,
  ExternalLink,
  FileIcon,
  Image as ImageIcon,
  Play
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import DOMPurify from "dompurify";
import { ChatService } from "@/lib/api/services/chat-service";

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  isDirect?: boolean;
  currentUserId: string;
  onReply?: (messageId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onOpenThread?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onPin?: (messageId: string, isPinned: boolean) => void;
  onReplyInThread?: (content: string, parentId: string) => void;
  onForward?: (messageId: string) => void;
  onScrollToMessage?: (messageId: string) => void;
  isInThread?: boolean;
}

const MessageReadStatus = ({ message, isOwn }: { message: any; isOwn: boolean }) => {
  if (!isOwn) return null;

  const readCount = message.read_count || 0;
  const deliveredCount = message.delivered_count || 0;
  const readByUserIds = message.read_by_user_ids?.split(",").filter(Boolean) || [];
  const deliveredToUserIds = message.delivered_to_user_ids?.split(",").filter(Boolean) || [];

  const isRead = readCount > 0 || readByUserIds.length > 0;
  const isDelivered = deliveredCount > 0 || deliveredToUserIds.length > 0;

  if (isRead) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex cursor-help items-center gap-0.5">
              <CheckCheck className="h-3.5 w-3.5 text-blue-500" strokeWidth={2.5} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              Read by {readCount} {readCount === 1 ? "person" : "people"}
            </p>
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
            <div className="flex cursor-help items-center gap-0.5">
              <CheckCheck className="text-muted-foreground h-3.5 w-3.5" strokeWidth={2.5} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              Delivered to {deliveredCount} {deliveredCount === 1 ? "person" : "people"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex cursor-help items-center gap-0.5">
            <Check className="text-muted-foreground h-3.5 w-3.5" strokeWidth={2.5} />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Sent</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// ✅ File Attachment Component
interface FileAttachmentProps {
  file: {
    id?: number;
    name: string;
    size: number;
    url?: string;
    mimeType?: string;
    thumbnailUrl?: string;
  };
}

const FileAttachment: React.FC<FileAttachmentProps> = ({ file }) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const isImage = file.mimeType?.startsWith("image/");
  const isVideo = file.mimeType?.startsWith("video/");
  const isPdf = file.mimeType?.includes("pdf");

  const handleDownload = async () => {
    if (!file.id) {
      // Direct download if we have URL
      if (file.url) {
        window.open(file.url, "_blank");
      }
      return;
    }

    setIsDownloading(true);
    try {
      const downloadInfo = await ChatService.getFileDownloadUrl(file.id);
      window.open(downloadInfo.url, "_blank");
    } catch (error) {
      console.error("Failed to get download URL:", error);
      // Fallback to direct URL
      if (file.url) {
        window.open(file.url, "_blank");
      }
    } finally {
      setIsDownloading(false);
    }
  };

  // Image preview
  if (isImage && !imageError) {
    return (
      <div className="border-border group relative max-w-xs overflow-hidden rounded-lg border">
        {!isImageLoaded && (
          <div className="bg-muted flex h-32 w-48 animate-pulse items-center justify-center">
            <ImageIcon className="text-muted-foreground h-8 w-8" />
          </div>
        )}
        <img
          src={file.thumbnailUrl || file.url}
          alt={file.name}
          className={cn(
            "max-h-64 max-w-full cursor-pointer object-contain transition-opacity",
            isImageLoaded ? "opacity-100" : "absolute opacity-0"
          )}
          onLoad={() => setIsImageLoaded(true)}
          onError={() => setImageError(true)}
          onClick={() => file.url && window.open(file.url, "_blank")}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-colors group-hover:bg-black/30 group-hover:opacity-100">
          <button
            onClick={handleDownload}
            className="rounded-full bg-white/90 p-2 transition-colors hover:bg-white"
            disabled={isDownloading}>
            <Download className="h-4 w-4 text-gray-700" />
          </button>
        </div>
        <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/60 to-transparent p-2">
          <p className="truncate text-xs text-white">{file.name}</p>
          <p className="text-[10px] text-white/80">{ChatService.formatFileSize(file.size)}</p>
        </div>
      </div>
    );
  }

  // Video preview
  if (isVideo) {
    return (
      <div className="border-border group relative max-w-xs overflow-hidden rounded-lg border">
        <div className="bg-muted relative flex h-32 w-48 items-center justify-center">
          {file.thumbnailUrl ? (
            <img src={file.thumbnailUrl} alt={file.name} className="h-full w-full object-cover" />
          ) : (
            <Play className="text-muted-foreground h-12 w-12" />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Play className="h-10 w-10 fill-white text-white" />
          </div>
        </div>
        <div className="bg-muted/50 p-2">
          <p className="truncate text-xs font-medium">{file.name}</p>
          <p className="text-muted-foreground text-[10px]">
            {ChatService.formatFileSize(file.size)}
          </p>
        </div>
        <button
          onClick={handleDownload}
          className="absolute top-2 right-2 rounded-full bg-white/90 p-1.5 opacity-0 transition-colors group-hover:opacity-100 hover:bg-white"
          disabled={isDownloading}>
          <Download className="h-3.5 w-3.5 text-gray-700" />
        </button>
      </div>
    );
  }

  // Generic file attachment
  return (
    <div
      className="border-border bg-muted/50 hover:bg-muted group inline-flex max-w-xs cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors"
      onClick={handleDownload}>
      <div className="bg-primary/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
        <span className="text-lg">
          {ChatService.getFileIcon(file.mimeType || "application/octet-stream")}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{file.name}</p>
        <p className="text-muted-foreground text-xs">{ChatService.formatFileSize(file.size)}</p>
      </div>
      <button
        className="hover:bg-primary/10 flex-shrink-0 rounded-full p-1.5 opacity-60 transition-opacity group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          handleDownload();
        }}
        disabled={isDownloading}>
        {isDownloading ? (
          <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
        ) : (
          <Download className="h-4 w-4" />
        )}
      </button>
    </div>
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
  isInThread = false
}: MessageItemProps) {
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const renderContent = (content: string) => {
    const isHTML = /<[^>]+>/.test(content);

    if (isHTML) {
      const sanitizedHTML = DOMPurify.sanitize(content, {
        ALLOWED_TAGS: [
          "p",
          "br",
          "strong",
          "em",
          "u",
          "s",
          "code",
          "pre",
          "ul",
          "ol",
          "li",
          "blockquote",
          "a",
          "span"
        ],
        ALLOWED_ATTR: ["class", "href", "data-type", "data-id", "data-label"]
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
              "rounded px-1 font-semibold",
              isMentioningMe
                ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
                : "text-primary bg-primary/10"
            )}>
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

    const reactionMap = new Map<
      string,
      {
        emoji: string;
        count: number;
        userReacted: boolean;
        userIds: number[];
        users: string[];
      }
    >();

    message.reactions.forEach((reaction: any) => {
      const existing = reactionMap.get(reaction.emoji);
      const reactorId = reaction.user_id || 0;
      const reactorName =
        `${reaction.first_name || ""} ${reaction.last_name || ""}`.trim() || "Anonymous";
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
    <div className="group hover:bg-muted/30 relative -mx-4 px-4 py-1.5 lg:-mx-6 lg:px-6">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="from-primary/80 to-primary text-primary-foreground mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded bg-gradient-to-br text-sm font-semibold">
          {message.authorAvatar ? (
            <img src={message.authorAvatar} alt="" className="h-full w-full rounded object-cover" />
          ) : (
            initials
          )}
        </div>

        {/* Message Body */}
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-baseline gap-2">
            <span className="text-foreground text-sm font-bold">{message.authorName}</span>
            <span className="text-muted-foreground text-xs">{formatTime(message.timestamp)}</span>
            <MessageReadStatus message={message} isOwn={isOwn} />
            {message.edited && <span className="text-muted-foreground text-xs">(edited)</span>}
            {message.isPinned && <Pin className="text-muted-foreground h-3 w-3" />}
          </div>

          {/* Reply Preview */}
          {message.replyTo && (
            <div
              className="border-primary bg-muted/60 hover:bg-muted mb-2 cursor-pointer rounded border-l-2 p-2 text-xs transition-colors"
              onClick={() => onScrollToMessage?.(message.replyTo!.messageId)}>
              <div className="text-primary font-medium">{message.replyTo.authorName}</div>
              <div className="text-muted-foreground line-clamp-2">{message.replyTo.content}</div>
            </div>
          )}

          {/* Message content */}
          <div className="text-foreground mt-0.5 text-sm break-words">
            {renderContent(message.content)}
          </div>

          {/* ✅ File Attachments */}
          {/* ✅ File Attachments - Grid for multiple files */}
          {message.files && message.files.length > 0 && (
            <div
              className={cn(
                "mt-2 gap-2",
                message.files.length === 1 ? "flex" : "grid max-w-md grid-cols-2 sm:grid-cols-3"
              )}>
              {message.files.map((file, index) => (
                <FileAttachment key={file.id || `${file.name}-${index}`} file={file} />
              ))}
            </div>
          )}

          {/* Reactions */}
          {groupedReactions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {groupedReactions.map((reaction) => (
                <TooltipProvider key={`${message.id}-${reaction.emoji}-${reaction.count}`}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onReact?.(message.id, reaction.emoji)}
                        className={cn(
                          "flex items-center gap-1 rounded border px-2 py-0.5 text-xs transition-colors",
                          reaction.userReacted
                            ? "bg-primary/20 border-primary text-primary"
                            : "bg-muted border-border hover:bg-muted/80"
                        )}>
                        <span>{reaction.emoji}</span>
                        <span>{reaction.count}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{reaction.users.join(", ")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          )}

          {/* Thread Reply Count */}
          {!isInThread &&
            !isDirect &&
            message.threadReplies !== undefined &&
            message.threadReplies >= 0 && (
              <button
                onClick={() => onOpenThread?.(message.id)}
                className="text-primary hover:text-primary/80 mt-2 flex items-center gap-2 text-xs font-medium">
                <MessageCircle className="h-4 w-4" />
                {message.threadReplies === 0
                  ? "Reply in thread"
                  : `${message.threadReplies} ${message.threadReplies === 1 ? "reply" : "replies"}`}
              </button>
            )}
        </div>
      </div>

      {/* Hover Actions */}
      <div className="bg-background border-border absolute top-0 right-4 z-10 flex -translate-y-1/2 items-center gap-1 rounded border p-1 opacity-0 transition-opacity group-hover:opacity-100 lg:right-6">
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
  );
}
