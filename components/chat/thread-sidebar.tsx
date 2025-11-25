// components/chat/thread-sidebar.tsx - FIX 11: Use RichTextEditor
"use client";

import React, { useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { X, MessageCircle, Loader2 } from 'lucide-react';
import { MessageItem } from "./message-item";
import { RichTextEditor } from "./rich-text-editor";
import type { Message } from "./message-list";
import { cn } from "@/lib/utils";

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
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  // Get parent message and replies
  const parentMessage = messages.length > 0 ? messages[0] : null;
  const replies = messages.slice(1);

  // Handle send from RichTextEditor
  const handleSend = async (html: string, text: string): Promise<boolean> => {
    if (!text.trim() || !threadId) return false;
    
    try {
      await onReplyInThread?.(text.trim(), threadId);
      return true;
    } catch (e) {
      return false;
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      <div 
        className="fixed inset-0 z-40 bg-black/50 lg:hidden" 
        onClick={onClose} 
      />
      
      {/* Sidebar - FIX 13: Mobile-first responsive */}
      <div className={cn(
        "fixed inset-y-0 right-0 z-50 lg:z-auto lg:relative lg:flex lg:flex-col lg:h-screen",
        "bg-background border-l border-border overflow-hidden",
        "w-full sm:w-96 lg:w-96 shadow-2xl lg:shadow-none"
      )}>
        {/* Header - FIX 12: Use theme colors */}
        <div className="px-4 py-3 sm:py-4 h-14 sm:h-16 flex items-center justify-between border-b border-border flex-shrink-0 bg-card">
          <div>
            <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 text-foreground">
              <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Thread
            </h3>
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
        <div className="flex-1 overflow-y-auto bg-background" ref={scrollRef}>
          <div className="p-2 sm:p-3 space-y-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-12">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="font-medium mb-1">No replies yet</p>
                <p className="text-xs">Start the conversation in this thread</p>
              </div>
            ) : (
              <>
                {/* Parent message - highlighted */}
                {parentMessage && (
                  <div className="mb-3 pb-3 border-b border-border bg-muted/30 rounded-lg p-2">
                    <div className="text-xs text-muted-foreground mb-2 font-medium">
                      Original message
                    </div>
                    <MessageItem
                      message={parentMessage}
                      isOwn={parentMessage.authorId === currentUserId}
                      isDirect={false}
                      currentUserId={currentUserId}
                      onReply={() => {}}
                      onReact={() => {}}
                      onOpenThread={() => {}}
                    />
                  </div>
                )}
                
                {/* Replies */}
                <div className="space-y-0">
                  {replies.length > 0 && (
                    <div className="text-xs text-muted-foreground mb-2 font-medium px-2">
                      Replies
                    </div>
                  )}
                  {replies.map((message) => (
                    <MessageItem
                      key={message.id}
                      message={message}
                      isOwn={message.authorId === currentUserId}
                      isDirect={false}
                      currentUserId={currentUserId}
                      onReply={() => {}}
                      onReact={() => {}}
                      onOpenThread={() => {}}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* FIX 11: Use RichTextEditor instead of simple textarea */}
        <div className="border-t border-border flex-shrink-0 bg-card">
          <RichTextEditor 
            onSend={handleSend}
            disabled={!threadId || isLoading}
            placeholder="Reply in thread..."
            className="border-0"
          />
        </div>
      </div>
    </>
  );
}