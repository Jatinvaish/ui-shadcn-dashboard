"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { MinimalTiptapEditor } from "@/components/ui/custom/minimal-tiptap"
import { Send, X } from 'lucide-react'
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
    <div className="bg-background px-4 md:px-6 py-3 md:py-4 flex flex-col gap-2">
      <div className="w-full space-y-2">
        {replyingTo && (
          <div className="flex items-center gap-2 rounded-l-lg border-l-2 border-primary bg-muted p-2">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-primary">{replyingTo.authorName}</div>
              <div className="line-clamp-1 text-xs text-muted-foreground">{replyingTo.content}</div>
            </div>
            <button
              onClick={onClearReply}
              className="text-muted-foreground hover:text-foreground flex-shrink-0 transition-colors"
              aria-label="Clear reply"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2 rounded-lg border border-input bg-background shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all duration-200">
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
              editorContentClassName="px-3 md:px-4 py-2 md:py-3 text-sm max-h-52 overflow-y-auto"
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* Bottom action bar */}
          <div className="flex items-center justify-between px-3 md:px-4 py-2 md:py-3 gap-2 bg-background rounded-b-lg">
            <div className="flex gap-1">
              <AttachmentPopover onFileSelect={onAttachment} disabled={disabled} />
              <EmojiPopover onEmojiSelect={onEmoji} disabled={disabled} />
            </div>

            <Button
              size="sm"
              onClick={handleSend}
              disabled={!content || disabled}
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              title="Send message (Enter)"
            >
              <Send className="h-4 w-4" />
              <span className="text-xs font-medium">Send</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
