// components/chat/message-list.tsx - COMPLETE WITH ALL HANDLERS
"use client"

import React from "react"
import { MessageItem } from "./message-item"

export interface Message {
  id: string
  authorId: string
  authorName: string
  authorAvatar?: string
  content: string
  timestamp: Date
  edited?: boolean
  reactions?: Array<{ emoji: string; count: number; userReacted?: boolean }>
  threadReplies?: number
  files?: Array<{ name: string; size: number }>
  replyTo?: {
    messageId: string
    authorName: string
    content: string
  }
  isPinned?: boolean
  threadId?: string
  parentId?: string
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
  onReplyInThread?: (content: string, parentId: string) => void
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
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const prevMessagesLengthRef = React.useRef(messages.length)

  // Auto-scroll to bottom on new messages
  React.useEffect(() => {
    if (scrollRef.current && messages.length > prevMessagesLengthRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
    prevMessagesLengthRef.current = messages.length
  }, [messages])

  // Group messages by date
  const groupedMessages = React.useMemo(() => {
    const groups: { date: string; messages: Message[] }[] = []
    let currentDate = ""

    messages.forEach((message) => {
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

  return (
    <div ref={scrollRef} className="flex-1 space-y-0 overflow-y-auto px-4 md:px-6 py-3 md:py-4 bg-background">
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
            {/* Date divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-border"></div>
              <span className="text-xs text-muted-foreground font-medium px-2">
                {formatDate(group.date)}
              </span>
              <div className="flex-1 h-px bg-border"></div>
            </div>

            {/* Messages */}
            {group.messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                isOwn={message.authorId === currentUserId}
                isDirect={isDirect}
                onReply={onReply}
                onReact={onReact}
                onOpenThread={onOpenThread}
                onDelete={onDelete}
                onEdit={onEdit}
                onPin={onPin}
                onReplyInThread={onReplyInThread}
                onForward={onForward}
              />
            ))}
          </div>
        ))
      )}
    </div>
  )
}