// components/chat/thread-sidebar.tsx - COMPLETE
"use client";

import React, { useState, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Send, Loader2 } from 'lucide-react';
import { MessageItem } from "./message-item";
import type { Message } from "./message-list";

interface ThreadSidebarProps {
  threadId?: string;
  messages?: Message[];
  currentUserId?: string;
  onClose?: () => void;
  onReplyInThread?: (message: string, parentId: string) => void;
  isLoading?: boolean;
}

export function ThreadSidebar({
  threadId,
  messages = [],
  currentUserId = "",
  onClose,
  onReplyInThread,
  isLoading = false,
}: ThreadSidebarProps) {
  const [replyContent, setReplyContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSendReply = async () => {
    if (!replyContent.trim() || !threadId) return;
    
    setIsSending(true);
    try {
      await onReplyInThread?.(replyContent.trim(), threadId);
      setReplyContent("");
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReplyContent(e.target.value);
    // Auto-resize
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  // Get parent message (first message in thread)
  const parentMessage = messages.length > 0 ? messages[0] : null;
  const replies = messages.slice(1);

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
              {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
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
        <ScrollArea className="flex-1 bg-background" ref={scrollRef}>
          <div className="p-3 space-y-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-12">
                <p className="font-medium mb-1">No replies yet</p>
                <p className="text-xs">Start the conversation in this thread</p>
              </div>
            ) : (
              <>
                {/* Parent message highlighted */}
                {parentMessage && (
                  <div className="mb-4 pb-4 border-b border-border">
                    <MessageItem
                      message={parentMessage}
                      isOwn={parentMessage.authorId === currentUserId}
                      isDirect={true}
                      onReply={() => {}}
                      onReact={() => {}}
                    />
                  </div>
                )}
                
                {/* Replies */}
                {replies.map((message) => (
                  <MessageItem
                    key={message.id}
                    message={message}
                    isOwn={message.authorId === currentUserId}
                    isDirect={true}
                    onReply={() => {}}
                    onReact={() => {}}
                  />
                ))}
              </>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t border-border flex-shrink-0 bg-background p-4">
          <div className="flex flex-col gap-2">
            <Textarea
              ref={textareaRef}
              value={replyContent}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Reply in thread..."
              disabled={!threadId || isSending}
              className="min-h-[60px] max-h-[120px] resize-none"
              rows={2}
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSendReply}
                disabled={!replyContent.trim() || !threadId || isSending}
                size="sm"
                className="gap-2"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Reply
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}