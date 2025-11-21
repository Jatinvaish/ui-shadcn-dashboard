// components/chat/message-input.tsx - FIXED TypeScript Error
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, X, Paperclip, Image, FileText } from "lucide-react";
import { AttachmentPopover } from "./popovers/attachment-popover";
import { EmojiPopover } from "./popovers/emoji-popover";
import type { Message } from "./message-list";

interface MessageInputProps {
  placeholder?: string;
  onSend?: (message: string) => Promise<boolean> | void;
  onAttachment?: (type: string) => void;
  onEmoji?: (emoji: string) => void;
  disabled?: boolean;
  replyingTo?: Message | null;
  onClearReply?: () => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
}

export function MessageInput({
  placeholder = "Message #channel",
  onSend,
  onAttachment,
  onEmoji,
  disabled,
  replyingTo,
  onClearReply,
  onTypingStart,
  onTypingStop,
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const isTypingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    const textContent = content.trim();
    if (textContent || uploadedFiles.length > 0) {
      const result = await onSend?.(textContent);
      
      // Clear input only on success
      if (result !== false) {
        setContent("");
        setUploadedFiles([]);
        
        // Stop typing on send
        if (isTypingRef.current) {
          onTypingStop?.();
          isTypingRef.current = false;
        }

        // Reset textarea height
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }

    // Typing indicators
    if (newContent.trim().length > 0) {
      if (!isTypingRef.current) {
        onTypingStart?.();
        isTypingRef.current = true;
      }
    } else {
      if (isTypingRef.current) {
        onTypingStop?.();
        isTypingRef.current = false;
      }
    }
  };

  const handleFileSelect = (type: string) => {
    if (type === 'upload' || type === 'file') {
      fileInputRef.current?.click();
    } else if (type === 'image') {
      if (fileInputRef.current) {
        fileInputRef.current.accept = 'image/*';
        fileInputRef.current.click();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const insertEmoji = (emoji: string) => {
    setContent(prev => prev + emoji);
    textareaRef.current?.focus();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isTypingRef.current) {
        onTypingStop?.();
      }
    };
  }, [onTypingStop]);

  return (
    <div className="bg-background px-4 md:px-6 py-3 md:py-4 flex flex-col gap-2">
      <div className="w-full space-y-2">
        {replyingTo && (
          <div className="flex items-center gap-2 rounded-l-lg border-l-2 border-primary bg-muted p-2">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-primary">
                Replying to {replyingTo.authorName}
              </div>
              <div className="line-clamp-1 text-xs text-muted-foreground">
                {replyingTo.content}
              </div>
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

        {uploadedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2 bg-muted rounded-lg">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-2 bg-background px-3 py-2 rounded-md border">
                {file.type.startsWith('image/') ? (
                  <Image className="h-4 w-4 text-blue-500" />
                ) : (
                  <FileText className="h-4 w-4 text-gray-500" />
                )}
                <span className="text-xs truncate max-w-[150px]">{file.name}</span>
                <button
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2 rounded-lg border border-input bg-background shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all duration-200">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className="min-h-[60px] max-h-[200px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-3 md:px-4 py-2 md:py-3 text-sm"
              rows={1}
            />
          </div>

          <div className="flex items-center justify-between px-3 md:px-4 py-2 md:py-3 gap-2 bg-background rounded-b-lg border-t">
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleFileSelect('upload')}
                disabled={disabled}
                className="h-8 w-8 p-0 hover:bg-muted"
                title="Attach file"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <EmojiPopover 
                onEmojiSelect={insertEmoji} 
                disabled={disabled} 
              />
            </div>

            <Button
              size="sm"
              onClick={handleSend}
              disabled={(!content.trim() && uploadedFiles.length === 0) || disabled}
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              title="Send message (Enter)"
            >
              <Send className="h-4 w-4" />
              <span className="text-xs font-medium">Send</span>
            </Button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
          accept="*/*"
        />
      </div>
    </div>
  );
}