// components/chat/message-input-slack.tsx - EXACT SLACK-LIKE INPUT
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Send, X, Paperclip, Smile, AtSign, Bold, Italic, Code } from "lucide-react";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Mention from '@tiptap/extension-mention';
import type { Message } from "./message-list";
import { EmojiPopover } from "./popovers/emoji-popover";
import { cn } from "@/lib/utils";

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

// ✅ MENTION POPUP COMPONENT
const MentionSuggestionList = React.forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command({ id: item.id, label: item.name });
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev === 0 ? props.items.length - 1 : prev - 1));
        return true;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev === props.items.length - 1 ? 0 : prev + 1));
        return true;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        selectItem(selectedIndex);
        return true;
      }
      return false;
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [selectedIndex, props.items]);

  if (props.items.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2">
        <p className="text-sm text-gray-500 dark:text-gray-400 px-3 py-2">No members found</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-1 max-h-64 overflow-y-auto">
      {props.items.map((item: any, index: number) => (
        <button
          key={item.id}
          onClick={() => selectItem(index)}
          className={cn(
            "w-full text-left px-3 py-2 rounded flex items-center gap-2 transition-colors",
            index === selectedIndex 
              ? "bg-blue-500 text-white" 
              : "hover:bg-gray-100 dark:hover:bg-gray-700"
          )}
        >
          <div className={cn(
            "h-6 w-6 rounded flex items-center justify-center text-xs font-semibold",
            index === selectedIndex 
              ? "bg-white text-blue-500" 
              : "bg-blue-500 text-white"
          )}>
            {item.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className={cn(
              "text-sm font-medium",
              index === selectedIndex ? "text-white" : "text-gray-900 dark:text-gray-100"
            )}>
              {item.name}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
});

MentionSuggestionList.displayName = 'MentionSuggestionList';

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
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [showFormatting, setShowFormatting] = useState(false);
  const isTypingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionRef = useRef<any>(null);

  // ✅ CONVERT HTML TO PLAIN TEXT WITH @MENTIONS
  const htmlToPlainText = (html: string): string => {
    // Create temporary element
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Find all mention spans and replace with @username
    const mentions = temp.querySelectorAll('[data-type="mention"]');
    mentions.forEach((mention) => {
      const label = mention.getAttribute('data-label') || '';
      mention.textContent = `@${label}`;
    });

    // Get clean text
    let text = temp.textContent || '';
    
    // Clean up extra whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
  };

  // ✅ TIPTAP EDITOR
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        //todo
        //@ts-ignore
        hardBreak: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
      Mention.configure({
        HTMLAttributes: {
          class: 'mention inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 rounded text-sm',
        },
        renderLabel({ options, node }) {
          return `@${node.attrs.label}`;
        },
        suggestion: {
          char: '@',
          items: ({ query }) => {
            return teamMembers
              .filter((member) =>
                member.name.toLowerCase().includes(query.toLowerCase())
              )
              .slice(0, 10);
          },
          render: () => {
            let popup: HTMLDivElement | null = null;

            return {
              onStart: (props: any) => {
                suggestionRef.current = props;
                
                if (!props.clientRect) return;

                popup = document.createElement('div');
                popup.style.position = 'fixed';
                popup.style.zIndex = '9999';
                document.body.appendChild(popup);

                const render = () => {
                  if (!popup) return;
                  const rect = props.clientRect();
                  if (rect) {
                    popup.style.top = `${rect.bottom + 8}px`;
                    popup.style.left = `${rect.left}px`;
                  }
                };

                render();
                
                // Use React to render
                const root = document.createElement('div');
                popup.appendChild(root);
                
                import('react-dom/client').then(({ createRoot }) => {
                  const reactRoot = createRoot(root);
                  reactRoot.render(
                    React.createElement(MentionSuggestionList, props)
                  );
                });
              },
              onUpdate: (props: any) => {
                suggestionRef.current = props;
                if (popup) {
                  const rect = props.clientRect();
                  if (rect) {
                    popup.style.top = `${rect.bottom + 8}px`;
                    popup.style.left = `${rect.left}px`;
                  }
                }
              },
              onKeyDown: (props: any) => {
                if (props.event.key === 'Escape') {
                  popup?.remove();
                  popup = null;
                  return true;
                }
                return false;
              },
              onExit: () => {
                popup?.remove();
                popup = null;
              },
            };
          },
        },
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none p-3 min-h-[44px] max-h-[200px] overflow-y-auto text-sm',
      },
    },
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      
      if (text.trim().length > 0) {
        if (!isTypingRef.current) {
          onTypingStart?.();
          isTypingRef.current = true;
        }

        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          onTypingStop?.();
          isTypingRef.current = false;
        }, 3000);
      } else {
        if (isTypingRef.current) {
          onTypingStop?.();
          isTypingRef.current = false;
        }
      }
    },
  });

  const handleSend = async () => {
    if (!editor) return;

    const html = editor.getHTML();
    const plainText = htmlToPlainText(html);
    
    if (plainText.trim() || uploadedFiles.length > 0) {
      // ✅ SEND PLAIN TEXT (NOT HTML)
      const result = await onSend?.(plainText);
      
      if (result !== false) {
        editor.commands.clearContent();
        setUploadedFiles([]);
        
        if (isTypingRef.current) {
          onTypingStop?.();
          isTypingRef.current = false;
        }
      }
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const insertEmoji = (emoji: string) => {
    editor?.commands.insertContent(emoji);
    editor?.commands.focus();
  };

  const toggleBold = () => {
    editor?.chain().focus().toggleBold().run();
  };

  const toggleItalic = () => {
    editor?.chain().focus().toggleItalic().run();
  };

  const toggleCode = () => {
    editor?.chain().focus().toggleCode().run();
  };

  const insertMention = () => {
    editor?.commands.insertContent('@');
    editor?.commands.focus();
  };

  useEffect(() => {
    return () => {
      if (isTypingRef.current) {
        onTypingStop?.();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [onTypingStop]);

  if (!editor) return null;

  return (
    <div className="bg-white dark:bg-gray-900 px-4 py-3 border-t border-gray-200 dark:border-gray-800">
      <div className="w-full space-y-2">
        {/* Reply Preview - Slack Style */}
        {replyingTo && (
          <div className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded border-l-2 border-blue-500">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
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
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* File Preview */}
        {uploadedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-2 bg-white dark:bg-gray-700 px-3 py-2 rounded border">
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

        {/* Main Input - Slack Style */}
        <div 
          className="flex flex-col border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden hover:border-gray-400 dark:hover:border-gray-600 transition-colors bg-white dark:bg-gray-800"
          onKeyDown={handleKeyDown}
        >
          {/* Editor */}
          <div className="relative">
            <EditorContent 
              editor={editor} 
              className="slack-editor"
            />
          </div>

          {/* Toolbar - Slack Style */}
          <div className="flex items-center justify-between px-2 py-1.5 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-1">
              {/* Formatting Buttons */}
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleBold}
                disabled={disabled}
                className={cn(
                  "h-7 w-7 p-0",
                  editor.isActive('bold') && "bg-gray-200 dark:bg-gray-700"
                )}
                title="Bold (Ctrl+B)"
              >
                <Bold className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleItalic}
                disabled={disabled}
                className={cn(
                  "h-7 w-7 p-0",
                  editor.isActive('italic') && "bg-gray-200 dark:bg-gray-700"
                )}
                title="Italic (Ctrl+I)"
              >
                <Italic className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleCode}
                disabled={disabled}
                className={cn(
                  "h-7 w-7 p-0",
                  editor.isActive('code') && "bg-gray-200 dark:bg-gray-700"
                )}
                title="Code"
              >
                <Code className="h-3.5 w-3.5" />
              </Button>

              <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

              {/* Attachment */}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleFileSelect}
                disabled={disabled}
                className="h-7 w-7 p-0"
                title="Attach file"
              >
                <Paperclip className="h-3.5 w-3.5" />
              </Button>

              {/* Mention */}
              <Button
                size="sm"
                variant="ghost"
                onClick={insertMention}
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
            </div>

            {/* Send Button - Slack Style */}
            <Button
              size="sm"
              onClick={handleSend}
              disabled={(!editor.getText().trim() && uploadedFiles.length === 0) || disabled}
              className={cn(
                "h-7 w-7 p-0 rounded",
                editor.getText().trim() || uploadedFiles.length > 0
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
          onChange={handleFileChange}
          accept="*/*"
        />
      </div>

      <style jsx global>{`
        .slack-editor .ProseMirror {
          outline: none;
        }
        
        .slack-editor .ProseMirror p.is-editor-empty:first-child::before {
          color: #9ca3af;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }

        .slack-editor .mention {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-weight: 600;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          background-color: rgb(239 246 255);
          color: rgb(37 99 235);
        }

        .dark .slack-editor .mention {
          background-color: rgb(30 58 138 / 0.5);
          color: rgb(96 165 250);
        }

        .slack-editor strong {
          font-weight: 700;
        }

        .slack-editor em {
          font-style: italic;
        }

        .slack-editor code {
          background-color: rgb(243 244 246);
          color: rgb(239 68 68);
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-size: 0.875em;
          font-family: 'Monaco', 'Courier New', monospace;
        }

        .dark .slack-editor code {
          background-color: rgb(31 41 55);
          color: rgb(248 113 113);
        }
      `}</style>
    </div>
  );
}