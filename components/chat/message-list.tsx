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
}

interface MessageListProps {
  messages: Message[]
  currentUserId: string
  isDirect?: boolean
  onReply?: (messageId: string) => void
  onReact?: (messageId: string, emoji: string) => void
  onOpenThread?: (messageId: string) => void
  onDelete?: (messageId: string) => void
  onReplyInThread?: (messageId: string) => void
}

export function MessageList({
  messages,
  currentUserId,
  isDirect = false,
  onReply,
  onReact,
  onOpenThread,
  onDelete,
  onReplyInThread,
}: MessageListProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-6 py-4">
      {messages.length === 0 ? (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <p>No messages yet. Start the conversation!</p>
        </div>
      ) : (
        messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            isOwn={message.authorId === currentUserId}
            isDirect={isDirect}
            onReply={onReply}
            onReact={onReact}
            onOpenThread={onOpenThread}
            onDelete={onDelete}
            onReplyInThread={onReplyInThread}
          />
        ))
      )}
    </div>
  )
}
