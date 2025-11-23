// components/chat/message-input.tsx - IMPROVED SLACK-LIKE INPUT
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Send, X, Paperclip, Smile, AtSign, Bold, Italic, Code } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "./message-list";
import { EmojiPopover } from "./popovers/emoji-popover";

interface MessageInputSlackProps {
  placeholder?: string;
  onSend?: (message: string) => Promise<boolean> | void;
  disabled?: boolean;
  replyingTo?: Message | null;
  onClearReply?: () => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  teamMembers?: Array<{ id: string; name: string; email: string }>;
}

export function MessageInputSlack({
  placeholder = "Message #channel",
  onSend,
  disabled,
  replyingTo,
  onClearReply,
  onTypingStart,
  onTypingStop,
  teamMembers = [],
}: MessageInputSlackProps) {
  const [content, setContent] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [content]);

  // Handle typing indicators
  useEffect(() => {
    if (content.trim() && !isTyping) {
      setIsTyping(true);
      onTypingStart?.();
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        onTypingStop?.();
      }
    }, 3000);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [content, isTyping, onTypingStart, onTypingStop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isTyping) {
        onTypingStop?.();
      }
    };
  }, [isTyping, onTypingStop]);

  // Handle @ mentions
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);

    // Check for @ mention
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1 && (lastAtIndex === 0 || textBeforeCursor[lastAtIndex - 1] === ' ')) {
      const searchTerm = textBeforeCursor.substring(lastAtIndex + 1);
      if (!searchTerm.includes(' ')) {
        setMentionSearch(searchTerm);
        setShowMentions(true);
        setSelectedMentionIndex(0);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  // Filter team members for mentions
  const filteredMembers = teamMembers.filter(m => 
    m.name.toLowerCase().includes(mentionSearch.toLowerCase())
  ).slice(0, 5);

  // Insert mention
  const insertMention = (member: { name: string }) => {
    if (!textareaRef.current) return;

    const cursorPos = textareaRef.current.selectionStart;
    const textBeforeCursor = content.substring(0, cursorPos);
    const textAfterCursor = content.substring(cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    const newContent = 
      content.substring(0, lastAtIndex) + 
      `@${member.name} ` + 
      textAfterCursor;

    setContent(newContent);
    setShowMentions(false);
    
    // Focus back and set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = lastAtIndex + member.name.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Handle keyboard navigation for mentions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentions && filteredMembers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev < filteredMembers.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev > 0 ? prev - 1 : filteredMembers.length - 1
        );
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(filteredMembers[selectedMentionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setShowMentions(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    if (!content.trim() || disabled) return;

    const result = await onSend?.(content.trim());
    
    if (result !== false) {
      setContent("");
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      if (isTyping) {
        onTypingStop?.();
        setIsTyping(false);
      }
    }
  };

  const insertEmoji = (emoji: string) => {
    const cursorPos = textareaRef.current?.selectionStart || content.length;
    const newContent = 
      content.substring(0, cursorPos) + 
      emoji + 
      content.substring(cursorPos);
    setContent(newContent);
    
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = cursorPos + emoji.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const insertAtSymbol = () => {
    const cursorPos = textareaRef.current?.selectionStart || content.length;
    const newContent = 
      content.substring(0, cursorPos) + 
      '@' + 
      content.substring(cursorPos);
    setContent(newContent);
    setShowMentions(true);
    setMentionSearch("");
    
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = cursorPos + 1;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const canSend = content.trim().length > 0 && !disabled;

  return (
    <div className="bg-white dark:bg-gray-900 px-3 py-2 sm:px-4 sm:py-3 border-t border-gray-200 dark:border-gray-800">
      <div className="w-full space-y-2">
        {/* Reply Preview */}
        {replyingTo && (
          <div className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded border-l-2 border-blue-500">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  Replying to {replyingTo.authorName}
                </span>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                {replyingTo.content}
              </div>
            </div>
            <button
              onClick={onClearReply}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Mention Suggestions */}
        {showMentions && filteredMembers.length > 0 && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filteredMembers.map((member, index) => (
              <button
                key={member.id}
                onClick={() => insertMention(member)}
                className={cn(
                  "w-full text-left px-3 py-2 flex items-center gap-2 transition-colors",
                  index === selectedMentionIndex 
                    ? "bg-blue-500 text-white" 
                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
              >
                <div className={cn(
                  "h-6 w-6 rounded flex items-center justify-center text-xs font-semibold",
                  index === selectedMentionIndex 
                    ? "bg-white text-blue-500" 
                    : "bg-blue-500 text-white"
                )}>
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium">{member.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Main Input Container */}
        <div className="flex flex-col border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden hover:border-gray-400 dark:hover:border-gray-600 transition-colors bg-white dark:bg-gray-800">
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full px-3 py-2.5 sm:py-3 text-sm resize-none focus:outline-none bg-transparent min-h-[44px] max-h-[200px]"
          />

          {/* Toolbar */}
          <div className="flex items-center justify-between px-2 py-1.5 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-0.5 sm:gap-1">
              {/* Mention */}
              <Button
                size="sm"
                variant="ghost"
                onClick={insertAtSymbol}
                disabled={disabled}
                className="h-7 w-7 p-0"
                title="Mention (@)"
              >
                <AtSign className="h-3.5 w-3.5" />
              </Button>

              {/* Emoji */}
              <EmojiPopover 
                onEmojiSelect={insertEmoji} 
                disabled={disabled}
              />

              <div className="hidden sm:flex items-center gap-0.5">
                <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

                {/* File Attachment */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                  className="h-7 w-7 p-0"
                  title="Attach file"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Send Button */}
            <Button
              size="sm"
              onClick={handleSend}
              disabled={!canSend}
              className={cn(
                "h-7 w-7 p-0 rounded transition-all",
                canSend
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
              )}
              title="Send (Enter)"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept="*/*"
        />
      </div>
    </div>
  );
}