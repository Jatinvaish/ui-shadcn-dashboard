"use client";

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';
import { MessageItem } from "./message-item";
import { MessageInput } from "./message-input";
import type { Message } from "./message-list";

interface ThreadSidebarProps {
  threadId?: string;
  messages?: Message[];
  currentUserId?: string;
  onClose?: () => void;
  onReplyInThread?: (message: string, parentId: string) => void;
}

export function ThreadSidebar({
  threadId,
  messages = [],
  currentUserId = "user-1",
  onClose,
  onReplyInThread,
}: ThreadSidebarProps) {
  const threadMessages = messages.filter((m) => m.parentId === threadId);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      
      <div className="fixed inset-y-0 right-0 z-50 lg:z-auto lg:relative lg:flex lg:flex-col lg:h-screen lg:w-72 lg:fixed lg:inset-y-0 lg:right-0 bg-background border-l border-border overflow-hidden w-72">
        {/* Header */}
        <div className="px-3 md:px-4 py-3 md:py-4 h-16 flex items-center justify-between border-b border-border flex-shrink-0">
          <h3 className="font-display text-sm md:text-base font-bold">Thread</h3>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="h-6 w-6 hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1">
          <div className="p-2 md:p-3 space-y-2">
            {threadMessages.length === 0 ? (
              <div className="text-center text-xs md:text-sm text-muted-foreground py-8">No replies yet</div>
            ) : (
              threadMessages.map((message) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  isOwn={message.authorId === currentUserId}
                  onReply={() => {}}
                />
              ))
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="px-0 py-0 h-auto border-t border-border flex-shrink-0 flex items-center">
          <MessageInput
            placeholder="Reply in thread..."
            onSend={(message) => onReplyInThread?.(message, threadId || "")}
            disabled={!threadId}
          />
        </div>
      </div>
    </>
  );
}
