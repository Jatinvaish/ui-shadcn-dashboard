// components/chat/thread-sidebar.tsx - COMPLETE
"use client";

import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Send } from 'lucide-react';
import { MessageItem } from "./message-item";
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
  const [replyContent, setReplyContent] = useState("");

  const handleSendReply = () => {
    if (replyContent.trim() && threadId) {
      onReplyInThread?.(replyContent.trim(), threadId);
      setReplyContent("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      
      {/* Sidebar */}
      <div className="fixed inset-y-0 right-0 z-50 lg:z-auto lg:relative lg:flex lg:flex-col lg:h-screen lg:w-96 bg-background border-l border-border overflow-hidden w-full sm:w-96 shadow-2xl lg:shadow-none">
        {/* Header */}
        <div className="px-4 py-4 h-16 flex items-center justify-between border-b border-border flex-shrink-0 bg-background">
          <div>
            <h3 className="font-display text-base font-bold">Thread</h3>
            <p className="text-xs text-muted-foreground">
              {messages.length} {messages.length === 1 ? 'reply' : 'replies'}
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="h-8 w-8 hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 bg-background">
          <div className="p-3 space-y-0">
            {messages.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-12">
                <p className="font-medium mb-1">No replies yet</p>
                <p className="text-xs">Start the conversation in this thread</p>
              </div>
            ) : (
              messages.map((message) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  isOwn={message.authorId === currentUserId}
                  isDirect={true}
                  onReply={() => {}}
                />
              ))
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t border-border flex-shrink-0 bg-background p-4">
          <div className="flex gap-2">
            <Input
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Reply in thread..."
              disabled={!threadId}
              className="flex-1"
            />
            <Button
              onClick={handleSendReply}
              disabled={!replyContent.trim() || !threadId}
              size="icon"
              className="flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}