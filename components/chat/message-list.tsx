// components/chat/message-list.tsx
"use client"

import React, { useRef, useEffect, useMemo } from "react"
import { MessageItem } from "./message-item"

// components/chat/message-list.tsx - Update Message interface

export interface Message {
  id: string
  authorId: string
  authorName: string
  authorAvatar?: string
  content: string
  timestamp: Date
  edited?: boolean
  reactions?: any[]
  threadReplies?: number
  // ✅ Updated files interface
  files?: Array<{
    id?: number;
    name: string;
    size: number;
    url?: string;
    mimeType?: string;
    thumbnailUrl?: string;
  }>
  replyTo?: {
    messageId: string
    authorName: string
    content: string
  }
  isPinned?: boolean
  am_i_mentioned?: boolean
  threadId?: string
  parentId?: string
  is_sent?: boolean
  is_delivered?: boolean
  is_read?: boolean
  read_count?: number
  delivered_count?: number
  read_by_user_ids?: string
  delivered_to_user_ids?: string
}

interface MessageListProps {
  messages: Message[]
  currentUserId: string
  isDirect?: boolean
  onReply?: (messageId: string) => void
  onReact?: (messageId: string, emoji: string) => void
  onOpenThread?: (messageId: string) => void
  onDelete?: (messageId: string) => void
  onEdit?: (messageId: string, newContent: string) => void
  onPin?: (messageId: string, isPinned: boolean) => void
  onReplyInThread?: (content: string, parentId: number) => Promise<boolean>
  onForward?: (messageId: string) => void
}

export function MessageList({
  messages,
  currentUserId,
  isDirect = false,
  onReply,
  onReact,
  onOpenThread,
  onDelete,
  onEdit,
  onPin,
  onReplyInThread,
  onForward,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const prevMessagesLengthRef = useRef(messages.length)
  const isUserScrollingRef = useRef(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastMessageIdRef = useRef<string | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      isUserScrollingRef.current = true;
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      scrollTimeoutRef.current = setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 1000);
    };

    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => {
        scrollElement.removeEventListener('scroll', handleScroll);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      };
    }
  }, []);

  useEffect(() => {
    if (!scrollRef.current || messages.length === 0) return;

    const isNewMessage = messages.length > prevMessagesLengthRef.current;
    const lastMessage = messages[messages.length - 1];
    const isOwnMessage = lastMessage?.authorId === currentUserId;
    const isAtBottom = scrollRef.current.scrollHeight - scrollRef.current.scrollTop - scrollRef.current.clientHeight < 100;

    if (isNewMessage && (isOwnMessage || isAtBottom || !isUserScrollingRef.current)) {
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: isOwnMessage ? 'auto' : 'smooth'
          });
        }
      }, 50);
    }

    prevMessagesLengthRef.current = messages.length;
    lastMessageIdRef.current = lastMessage?.id || null;
  }, [messages, currentUserId]);

  useEffect(() => {
    if (!scrollRef.current || messages.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.getAttribute('data-message-id');
            if (messageId) {
              window.dispatchEvent(new CustomEvent('markMessageAsRead', {
                detail: {
                  messageId,
                  channelId: messages[0]?.authorId
                }
              }));
            }
          }
        });
      },
      {
        root: scrollRef.current,
        threshold: 0.5,
        rootMargin: '0px'
      }
    );

    const messageElements = scrollRef.current.querySelectorAll('[data-message-id]');
    messageElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [messages]);

  const scrollToMessage = (messageId: string) => {
    const element = messageRefs.current.get(messageId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      
      element.classList.add('bg-yellow-100', 'dark:bg-yellow-900/20')
      setTimeout(() => {
        element.classList.remove('bg-yellow-100', 'dark:bg-yellow-900/20')
      }, 2000)
    }
  }

  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: Message[] }[] = []

    const sortedMessages = [...messages].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    let currentDate = ""

    sortedMessages.forEach((message) => {
      const messageDate = new Date(message.timestamp).toDateString()

      if (messageDate !== currentDate) {
        currentDate = messageDate
        groups.push({ date: messageDate, messages: [message] })
      } else {
        groups[groups.length - 1].messages.push(message)
      }
    })

    return groups
  }, [messages])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    } else {
      return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      })
    }
  }

  const handleReplyInThreadWrapper = async (content: string, parentId: string) => {
    if (!onReplyInThread) return;
    await onReplyInThread(content, parseInt(parentId));
  };

  return (
    <div 
      ref={scrollRef} 
      className="flex-1 space-y-0 overflow-y-auto px-0 lg:px-6 py-3 lg:py-4 bg-background"
    >
      {messages.length === 0 ? (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <div className="text-center">
            <p className="text-sm font-medium mb-1">No messages yet</p>
            <p className="text-xs">Start the conversation!</p>
          </div>
        </div>
      ) : (
        groupedMessages.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-0">
            <div className="flex items-center gap-3 my-4 px-4 lg:px-6">
              <div className="flex-1 h-px bg-border"></div>
              <span className="text-xs text-muted-foreground font-medium px-2">
                {formatDate(group.date)}
              </span>
              <div className="flex-1 h-px bg-border"></div>
            </div>

            {group.messages.map((message) => (
              <div
                key={message.id}
                data-message-id={message.id}
                ref={(el) => {
                  if (el) messageRefs.current.set(message.id, el)
                }}
                className="transition-colors duration-300"
              >
                <MessageItem
                  message={message}
                  isOwn={message.authorId === currentUserId}
                  isDirect={isDirect}
                  currentUserId={currentUserId}
                  onReply={onReply}
                  onReact={onReact}
                  onOpenThread={onOpenThread}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  onPin={onPin}
                  onReplyInThread={handleReplyInThreadWrapper}
                  onForward={onForward}
                  onScrollToMessage={scrollToMessage}
                />
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  )
}