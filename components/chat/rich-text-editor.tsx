// components/chat/rich-text-editor.tsx - COMPLETE TIPTAP EDITOR
"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { Mention } from '@tiptap/extension-mention';
import { Button } from '@/components/ui/button';
import { 
  Bold, Italic, Code, List, ListOrdered, Link2, Send, 
  Smile, AtSign, Loader2, X, Strikethrough, Quote 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmojiPopover } from './popovers/emoji-popover';

interface RichTextEditorProps {
  placeholder?: string;
  onSend?: (html: string, text: string) => Promise<boolean> | void;
  disabled?: boolean;
  replyingTo?: { id: string; authorName: string; content: string } | null;
  onClearReply?: () => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  teamMembers?: Array<{ id: string; name: string; email: string }>;
  className?: string;
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) return null;

  const buttonClass = (isActive: boolean) =>
    cn(
      'h-8 w-8 p-0 hover:bg-muted transition-colors',
      isActive && 'bg-muted text-primary'
    );

  return (
    <div className="flex items-center gap-0.5 flex-wrap">
      <Button
        size="icon"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={buttonClass(editor.isActive('bold'))}
        title="Bold (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </Button>

      <Button
        size="icon"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={buttonClass(editor.isActive('italic'))}
        title="Italic (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </Button>

      <Button
        size="icon"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={buttonClass(editor.isActive('strike'))}
        title="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </Button>

      <Button
        size="icon"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleCode().run()}
        disabled={!editor.can().chain().focus().toggleCode().run()}
        className={buttonClass(editor.isActive('code'))}
        title="Code (Ctrl+E)"
      >
        <Code className="h-4 w-4" />
      </Button>

      <div className="w-px h-5 bg-border mx-1" />

      <Button
        size="icon"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={buttonClass(editor.isActive('bulletList'))}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </Button>

      <Button
        size="icon"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={buttonClass(editor.isActive('orderedList'))}
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>

      <Button
        size="icon"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={buttonClass(editor.isActive('blockquote'))}
        title="Quote"
      >
        <Quote className="h-4 w-4" />
      </Button>

      <Button
        size="icon"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={buttonClass(editor.isActive('codeBlock'))}
        title="Code Block"
      >
        <Code className="h-4 w-4" />
      </Button>
    </div>
  );
};

export function RichTextEditor({
  placeholder = 'Type a message...',
  onSend,
  disabled,
  replyingTo,
  onClearReply,
  onTypingStart,
  onTypingStop,
  teamMembers = [],
  className,
}: RichTextEditorProps) {
  const [isSending, setIsSending] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // Disable headings for chat
        horizontalRule: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 hover:underline',
        },
      }),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[60px] max-h-[200px] overflow-y-auto px-3 py-2.5',
      },
    },
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      
      // Handle typing indicators
      if (text.trim() && !isTyping) {
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
    },
  });

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTyping) {
        onTypingStop?.();
      }
    };
  }, [isTyping, onTypingStop]);

  const handleSend = useCallback(async () => {
    if (!editor || disabled || isSending) return;

    const html = editor.getHTML();
    const text = editor.getText().trim();

    if (!text) return;

    setIsSending(true);

    try {
      const result = await onSend?.(html, text);
      
      if (result !== false) {
        editor.commands.clearContent();
        if (isTyping) {
          onTypingStop?.();
          setIsTyping(false);
        }
      }
    } finally {
      setIsSending(false);
    }
  }, [editor, disabled, isSending, isTyping, onSend, onTypingStop]);

  const insertEmoji = useCallback(
    (emoji: string) => {
      editor?.chain().focus().insertContent(emoji).run();
    },
    [editor]
  );

  const insertMention = useCallback(() => {
    editor?.chain().focus().insertContent('@').run();
  }, [editor]);

  const canSend = editor?.getText().trim().length > 0 && !disabled && !isSending;

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSend();
      }
    };

    const element = editor.view.dom;
    element.addEventListener('keydown', handleKeyDown);

    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  }, [editor, handleSend]);

  return (
    <div className={cn('bg-white dark:bg-gray-900 px-3 py-2 sm:px-4 sm:py-3 border-t border-gray-200 dark:border-gray-800', className)}>
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

        {/* Editor Container */}
        <div className="flex flex-col border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden hover:border-gray-400 dark:hover:border-gray-600 transition-colors bg-white dark:bg-gray-800">
          {/* Tiptap Editor */}
          <EditorContent editor={editor} className="w-full" />

          {/* Toolbar */}
          <div className="flex items-center justify-between px-2 py-1.5 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-1">
              <MenuBar editor={editor} />

              <div className="w-px h-5 bg-border mx-1 hidden sm:block" />

              {/* Mention */}
              <Button
                size="icon"
                variant="ghost"
                onClick={insertMention}
                disabled={disabled}
                className="h-8 w-8 p-0 hidden sm:flex"
                title="Mention (@)"
              >
                <AtSign className="h-4 w-4" />
              </Button>

              {/* Emoji */}
              <EmojiPopover onEmojiSelect={insertEmoji} disabled={disabled} />
            </div>

            {/* Send Button */}
            <Button
              size="sm"
              onClick={handleSend}
              disabled={!canSend}
              className={cn(
                'h-7 w-7 p-0 rounded transition-all',
                canSend
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
              )}
              title="Send (Enter)"
            >
              {isSending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>

        {/* Helper Text */}
        <p className="text-xs text-muted-foreground px-1">
          Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> to send, <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
}