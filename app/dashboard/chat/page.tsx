"use client"

import React from "react"
import { Sidebar } from "@/components/chat/sidebar"
import { ChatHeader } from "@/components/chat/chat-header"
import { MessageList, type Message } from "@/components/chat/message-list"
import { MessageInput } from "@/components/chat/message-input"
import { ThreadSidebar } from "@/components/chat/thread-sidebar"

const MOCK_CHANNELS = [
  { id: "1", name: "general", isPrivate: false },
  { id: "2", name: "announcements", isPrivate: false, isPinned: true },
  { id: "3", name: "random", isPrivate: false },
]

const MOCK_DMS = [
  { id: "dm-1", name: "Alice Johnson" },
  { id: "dm-2", name: "Bob Smith", unread: 2 },
  { id: "dm-3", name: "Carol White" },
]

const MOCK_USERS = [
  { id: "user-2", name: "Bob Smith", email: "bob@example.com", status: "active" as const },
  { id: "user-3", name: "Carol White", email: "carol@example.com", status: "away" as const },
  { id: "user-4", name: "David Lee", email: "david@example.com", status: "offline" as const },
]

const MOCK_MESSAGES: Message[] = [
  {
    id: "1",
    authorId: "user-1",
    authorName: "Alice Johnson",
    content: "Hey everyone! 👋",
    timestamp: new Date(Date.now() - 5 * 60000),
    reactions: [{ emoji: "👋", count: 2, userReacted: true }],
  },
  {
    id: "2",
    authorId: "user-2",
    authorName: "Bob Smith",
    content: "Welcome to the chat!",
    timestamp: new Date(Date.now() - 3 * 60000),
  },
  {
    id: "3",
    authorId: "user-1",
    authorName: "You",
    content: "Thanks for the welcome! Looking forward to collaborating.",
    timestamp: new Date(Date.now() - 1 * 60000),
    threadReplies: 1,
  },
]

const MOCK_THREAD_MESSAGES: Message[] = [
  {
    id: "thread-1",
    authorId: "user-2",
    authorName: "Bob Smith",
    content: "That's great! We're excited to have you on board.",
    timestamp: new Date(Date.now() - 30000),
  },
]

export default function ChatPage() {
  const [activeId, setActiveId] = React.useState("1")
  const [messages, setMessages] = React.useState(MOCK_MESSAGES)
  const [selectedThreadId, setSelectedThreadId] = React.useState<string | null>(null)
  const [threadMessages, setThreadMessages] = React.useState(MOCK_THREAD_MESSAGES)
  const [pinnedIds, setPinnedIds] = React.useState<Set<string>>(new Set(["2"]))
  const [replyingTo, setReplyingTo] = React.useState<Message | null>(null)

  const handleSendMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      authorId: "user-1",
      authorName: "You",
      content,
      timestamp: new Date(),
      replyTo: replyingTo
        ? {
            messageId: replyingTo.id,
            authorName: replyingTo.authorName,
            content: replyingTo.content,
          }
        : undefined,
    }
    setMessages([...messages, newMessage])
    setReplyingTo(null)
  }

  const handleSendThreadReply = (content: string) => {
    if (!selectedThreadId) return
    const newMessage: Message = {
      id: `thread-${Date.now()}`,
      authorId: "user-1",
      authorName: "You",
      content,
      timestamp: new Date(),
    }
    setThreadMessages([...threadMessages, newMessage])
  }

  const handleDeleteMessage = (messageId: string) => {
    console.log("[v0] Deleting message:", messageId)
    setMessages(messages.filter((m) => m.id !== messageId))
  }

  const handleReplyToMessage = (messageId: string) => {
    console.log("[v0] Setting reply for message:", messageId)
    const message = messages.find((m) => m.id === messageId)
    if (message) {
      setReplyingTo(message)
    }
  }

  const handlePinChange = (channelId: string, isPinned: boolean) => {
    const newPinned = new Set(pinnedIds)
    if (isPinned) {
      newPinned.add(channelId)
    } else {
      newPinned.delete(channelId)
    }
    setPinnedIds(newPinned)
  }

  const parentMessage = selectedThreadId ? messages.find((m) => m.id === selectedThreadId) : null
  const isChannelView = activeId.startsWith("1") || activeId.startsWith("2") || activeId.startsWith("3")
  const currentChannelName = MOCK_CHANNELS.find((c) => c.id === activeId)?.name || "general"
  const isPinned = pinnedIds.has(activeId)

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        channels={MOCK_CHANNELS.map((ch) => ({
          ...ch,
          isPinned: pinnedIds.has(ch.id),
        }))}
        directMessages={MOCK_DMS}
        activeId={activeId}
        onChannelClick={setActiveId}
        onDirectMessageClick={setActiveId}
        currentUser={{
          id: "user-1",
          name: "You",
          email: "you@example.com",
          status: "active",
        }}
        availableUsers={MOCK_USERS}
      />

      {/* Main chat area */}
      <div className="flex flex-1 flex-col">
        <ChatHeader
          title={currentChannelName}
          description="Welcome to the general channel"
          memberCount={isChannelView ? 42 : undefined}
          isPinned={isPinned}
          onPinChange={(pinned) => handlePinChange(activeId, pinned)}
        />
        <MessageList
          messages={messages}
          currentUserId="user-1"
          isDirect={!isChannelView}
          onReply={handleReplyToMessage}
          onReact={(id, emoji) => console.log("React", emoji, "to", id)}
          onOpenThread={(id) => {
            console.log("[v0] Opening thread for message:", id)
            setSelectedThreadId(id)
          }}
          onDelete={handleDeleteMessage}
          onReplyInThread={(id) => {
            console.log("[v0] Reply in thread for message:", id)
            setSelectedThreadId(id)
          }}
        />
        <MessageInput onSend={handleSendMessage} replyingTo={replyingTo} onClearReply={() => setReplyingTo(null)} />
      </div>

      {selectedThreadId && (
        <ThreadSidebar
          parentMessage={parentMessage || null}
          threadMessages={threadMessages}
          currentUserId="user-1"
          onClose={() => {
            console.log("[v0] Closing thread sidebar")
            setSelectedThreadId(null)
          }}
          onSendReply={handleSendThreadReply}
        />
      )}
    </div>
  )
}
