// components/chat/thread-sidebar.tsx - COMPLETE WITH FULL FUNCTIONALITY
"use client";

import React, { useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { X, MessageCircle, Loader2 } from 'lucide-react';
import { MessageItem } from "./message-item";
import { RichTextEditor } from "./rich-text-editor";
import type { Message } from "./message-list";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchThreadMessages } from "@/store/slices/chatSlice";

interface ThreadSidebarProps {
  threadId?: string;
  parentMessageId?: number;
  currentUserId?: string;
  onClose?: () => void;
  onReplyInThread?: (content: string, parentId: number) => Promise<boolean>;
  teamMembers?: Array<{ id: string; name: string; email: string }>;
}

export function ThreadSidebar({
  threadId,
  parentMessageId,
  currentUserId = "",
  onClose,
  onReplyInThread,
  teamMembers = [],
}: ThreadSidebarProps) {
  const dispatch = useAppDispatch();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const threadMessages = useAppSelector(state => 
    parentMessageId ? state.chat.threadMessages[parentMessageId] || [] : []
  );
  const isLoadingThread = useAppSelector(state => state.chat.isLoadingThread);
  const selectedChannel = useAppSelector(state => state.chat.selectedChannel);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current && threadMessages.length > 0) {
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [threadMessages.length]);

  // Load thread messages on mount
  useEffect(() => {
    if (parentMessageId) {
      dispatch(fetchThreadMessages({ parentMessageId, limit: 50 }));
    }
  }, [parentMessageId, dispatch]);

  const convertToFrontendMessage = (msg: any): Message => {
    const senderFirstName = msg.sender_first_name || msg.first_name || '';
    const senderLastName = msg.sender_last_name || msg.last_name || '';
    const senderName = `${senderFirstName} ${senderLastName}`.trim() || msg.sender_email || 'Unknown User';

    return {
      id: msg.id?.toString() || String(msg.message_id || Math.random()),
      authorId: msg.sender_user_id?.toString() || msg.user_id?.toString() || "0",
      authorName: senderName,
      authorAvatar: msg.sender_avatar_url || msg.avatar_url,
      content: msg.content || "",
      timestamp: msg.sent_at ? new Date(msg.sent_at) : (msg.created_at ? new Date(msg.created_at) : new Date()),
      edited: msg.is_edited || false,
      isPinned: msg.is_pinned || false,
      reactions: msg.reactions || [],
      threadReplies: msg.reply_count || 0,
      files: msg.files || [],
      replyTo: msg.reply_to_message_id ? {
        messageId: msg.reply_to_message_id.toString(),
        authorName: msg.reply_to_author_name || "User",
        content: msg.reply_to_content || "Previous message"
      } : undefined,
      read_count: msg.read_count,
      delivered_count: msg.delivered_count,
      read_by_user_ids: msg.read_by_user_ids,
      delivered_to_user_ids: msg.delivered_to_user_ids,
      am_i_mentioned: msg.am_i_mentioned || false,
      threadId: msg.thread_id?.toString(),
      parentId: msg.reply_to_message_id?.toString(),
    };
  };

  const transformedMessages = threadMessages.map(convertToFrontendMessage);
  const parentMessage = transformedMessages.length > 0 ? transformedMessages[0] : null;
  const replies = transformedMessages.slice(1);

  const handleSend = async (html: string, text: string, mentions?: number[]): Promise<boolean> => {
    if (!text.trim() || !parentMessageId) return false;
    
    try {
      const result = await onReplyInThread?.(text.trim(), parentMessageId);
      
      if (result) {
        // Auto-scroll to bottom after sending
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }, 200);
      }
      
      return result ?? false;
    } catch (e) {
      console.error('Failed to send thread reply:', e);
      return false;
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className="fixed inset-0 z-40 bg-black/50 lg:hidden" 
        onClick={onClose} 
      />
      
      {/* Thread Sidebar Container */}
      <div className={cn(
        "fixed inset-y-0 right-0 z-50 lg:z-auto lg:relative lg:flex lg:flex-col",
        "bg-background border-l border-border overflow-hidden",
        "w-full sm:w-96 lg:w-96 shadow-2xl lg:shadow-none",
        "h-full"
      )}>
        {/* Header */}
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

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto bg-background" ref={scrollRef}>
          <div className="p-2 sm:p-3 space-y-0">
            {isLoadingThread ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : transformedMessages.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-12">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="font-medium mb-1">No replies yet</p>
                <p className="text-xs">Start the conversation in this thread</p>
              </div>
            ) : (
              <>
                {/* Parent Message */}
                {parentMessage && (
                  <div className="mb-3 pb-3 border-b border-border bg-muted/30 rounded-lg p-2">
                    <div className="text-xs text-muted-foreground mb-2 font-medium px-2">
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
                      isInThread={true}
                    />
                  </div>
                )}
                
                {/* Thread Replies */}
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
                      isInThread={true}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Reply Editor */}
        <div className="border-t border-border flex-shrink-0 bg-card">
          <RichTextEditor 
            onSend={handleSend}
            disabled={!parentMessageId || isLoadingThread}
            placeholder="Reply in thread..."
            className="border-0"
            teamMembers={teamMembers}
          />
        </div>
      </div>
    </>
  );
}