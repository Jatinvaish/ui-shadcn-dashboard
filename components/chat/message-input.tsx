"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { MinimalTiptapEditor } from "@/components/ui/custom/minimal-tiptap"
import { Send, X } from "lucide-react"
import { AttachmentPopover } from "./popovers/attachment-popover"
import { EmojiPopover } from "./popovers/emoji-popover"
import type { Content } from "@tiptap/react"
import type { Message } from "./message-list"

interface MessageInputProps {
  placeholder?: string
  onSend?: (message: string) => void
  onAttachment?: (type: string) => void
  onEmoji?: (emoji: string) => void
  disabled?: boolean
  replyingTo?: Message | null
  onClearReply?: () => void
}

export function MessageInput({
  placeholder = "Message #channel",
  onSend,
  onAttachment,
  onEmoji,
  disabled,
  replyingTo,
  onClearReply,
}: MessageInputProps) {
  const [content, setContent] = React.useState<Content>("")
  const editorRef = React.useRef<HTMLDivElement>(null)

  const handleSend = () => {
    // Get the text content from the editor
    if (editorRef.current) {
      const textContent = editorRef.current.innerText?.trim()
      if (textContent) {
        onSend?.(textContent)
        setContent("")
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-border bg-background p-4">
      {replyingTo && (
        <div className="mb-3 flex items-center gap-2 rounded border-l-2 border-primary bg-muted p-2">
          <div className="flex-1">
            <div className="text-xs font-medium text-primary">{replyingTo.authorName}</div>
            <div className="line-clamp-1 text-xs text-muted-foreground">{replyingTo.content}</div>
          </div>
          <button
            onClick={onClearReply}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Clear reply"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-lg border border-input bg-background shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
        {/* Editor */}
        <div className="relative">
          <MinimalTiptapEditor
            ref={editorRef}
            value={content}
            onChange={setContent}
            placeholder={placeholder}
            editorProps={{
              attributes: {
                class: "prose dark:prose-invert max-w-none",
              },
            }}
            className="min-h-fit max-h-56 rounded-t-lg border-0 bg-background shadow-none focus-within:ring-0"
            editorContentClassName="px-4 py-3 text-sm max-h-52 overflow-y-auto"
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* Bottom action bar with attachment, emoji, and send button */}
        <div className="flex items-center justify-between border-t border-input px-4 py-3">
          <div className="flex gap-2">
            <AttachmentPopover onFileSelect={onAttachment} disabled={disabled} />
            <EmojiPopover onEmojiSelect={onEmoji} disabled={disabled} />
          </div>

          <Button
            size="sm"
            onClick={handleSend}
            disabled={!content || disabled}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            title="Send message (Enter)"
          >
            <Send className="h-4 w-4" />
            <span className="text-xs">Send</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
