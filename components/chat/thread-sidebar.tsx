"use client"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MessageItem } from "./message-item"
import { MessageInput } from "./message-input"
import type { Message } from "./message-list"

interface ThreadSidebarProps {
  parentMessage: Message | null
  threadMessages: Message[]
  currentUserId: string
  onClose: () => void
  onSendReply?: (content: string) => void
}

export function ThreadSidebar({
  parentMessage,
  threadMessages,
  currentUserId,
  onClose,
  onSendReply,
}: ThreadSidebarProps) {
  if (!parentMessage) return null

  return (
    <div className="flex h-full w-80 flex-col border-l border-border bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="text-sm font-semibold">Thread</div>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Parent message */}
      <div className="border-b border-border p-4">
        <div className="text-xs font-medium text-muted-foreground mb-2">In reply to</div>
        <MessageItem message={parentMessage} isOwn={parentMessage.authorId === currentUserId} onReply={() => {}} />
      </div>

      {/* Thread messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {threadMessages.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">No replies yet</div>
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

      {/* Reply input */}
      <MessageInput
        placeholder="Reply in thread..."
        onSend={onSendReply}
        onAttachment={(type) => console.log("Attachment:", type)}
        onEmoji={(emoji) => console.log("Emoji:", emoji)}
      />
    </div>
  )
}
