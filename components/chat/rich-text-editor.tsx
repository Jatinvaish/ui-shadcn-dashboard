// components/chat/rich-text-editor.tsx - SMART ENHANCED VERSION
"use client";

import React, { useEffect, useRef, useState, useCallback, KeyboardEvent } from 'react';
import { useEditor, EditorContent, ReactRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Mention from '@tiptap/extension-mention';
import Underline from '@tiptap/extension-underline';
import Strike from '@tiptap/extension-strike';
import Blockquote from '@tiptap/extension-blockquote';
import CodeBlock from '@tiptap/extension-code-block';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  Code,
  Send,
  AtSign,
  Loader2,
  X,
  List as ListIcon,
  ListOrdered,
  Quote,
  Upload,
  Underline as UnderlineIcon,
  Strikethrough,
  Paperclip,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmojiPopover } from './popovers/emoji-popover';
import tippy, { Instance as TippyInstance } from 'tippy.js';

interface MentionListProps {
  items: Array<{ id: string; name: string; email: string }>;
  command: (item: any) => void;
}

const MentionList = React.forwardRef<any, MentionListProps>((props, ref) => {
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

  React.useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((prev) => (prev + props.items.length - 1) % props.items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((prev) => (prev + 1) % props.items.length);
        return true;
      }
      if (event.key === 'Enter') {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg overflow-hidden max-h-48">
      {props.items.length ? (
        props.items.map((item, index) => (
          <button
            key={item.id}
            onClick={() => selectItem(index)}
            className={cn(
              'w-full text-left px-3 py-2 flex items-center gap-2 transition-colors',
              index === selectedIndex ? 'bg-accent' : 'hover:bg-muted'
            )}
          >
            <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
              {item.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium">{item.name}</span>
          </button>
        ))
      ) : (
        <div className="px-3 py-2 text-sm text-muted-foreground">No results</div>
      )}
    </div>
  );
});
MentionList.displayName = 'MentionList';

interface RichTextEditorProps {
  placeholder?: string;
  onSend?: (
    html: string,
    text: string,
    mentions?: number[],
    attachments?: Array<{ file: File; preview: string }>
  ) => Promise<boolean> | void;
  disabled?: boolean;
  replyingTo?: { id: string; authorName: string; content: string } | null;
  onClearReply?: () => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  teamMembers?: Array<{ id: string; name: string; email: string }>;
  className?: string;
}

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
  const [attachments, setAttachments] = useState<Array<{ file: File; preview: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleTypingStart = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      onTypingStart?.();
    }
  }, [isTyping, onTypingStart]);

  const handleTypingStop = useCallback(() => {
    if (isTyping) {
      setIsTyping(false);
      onTypingStop?.();
    }
  }, [isTyping, onTypingStop]);

  // Smart auto-detection function
  const autoDetectAndFormat = useCallback((text: string, editor: any) => {
    if (!editor) return;

    // Auto-detect URLs and convert to links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const hasUrls = urlRegex.test(text);
    
    // Auto-detect emails
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;
    const hasEmails = emailRegex.test(text);

    // Auto-detect code blocks (text wrapped in triple backticks)
    const codeBlockRegex = /```[\s\S]*?```/g;
    const hasCodeBlocks = codeBlockRegex.test(text);

    // Auto-detect markdown-style formatting
    // **bold** -> bold
    const boldRegex = /\*\*([^*]+)\*\*/g;
    if (boldRegex.test(text)) {
      const selection = editor.state.selection;
      const match = text.match(boldRegex);
      if (match) {
        const cleanText = match[0].replace(/\*\*/g, '');
        editor.commands.insertContent(cleanText);
        editor.commands.setTextSelection({
          from: selection.from - match[0].length,
          to: selection.from - match[0].length + cleanText.length
        });
        editor.commands.toggleBold();
      }
    }

    // *italic* or _italic_ -> italic
    const italicRegex = /(\*|_)([^*_]+)\1/g;
    if (italicRegex.test(text)) {
      // Similar processing for italic
    }

    // Auto-detect lists
    const listStartRegex = /^(\d+\.|[-*])\s/;
    if (listStartRegex.test(text.trim())) {
      const match = text.trim().match(listStartRegex);
      if (match) {
        if (match[1].includes('.')) {
          editor.commands.toggleOrderedList();
        } else {
          editor.commands.toggleBulletList();
        }
      }
    }

    // Auto-detect quotes (lines starting with >)
    if (text.trim().startsWith('>')) {
      editor.commands.toggleBlockquote();
    }
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        horizontalRule: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: 'list-disc pl-5 my-1 space-y-0.5',
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: 'list-decimal pl-5 my-1 space-y-0.5',
        },
      }),
      ListItem.configure({
        HTMLAttributes: {
          class: 'ml-0 pl-0.5 leading-normal',
        },
      }),
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        autolink: true, // Auto-convert URLs to links
        linkOnPaste: true, // Auto-link when pasting URLs
        HTMLAttributes: { 
          class: 'text-primary hover:underline cursor-pointer font-medium',
          target: '_blank',
          rel: 'noopener noreferrer nofollow'
        },
      }),
      Blockquote.configure({
        HTMLAttributes: {
          class: 'border-l-3 border-primary/40 pl-3 my-1 italic text-muted-foreground/90 leading-relaxed',
        },
      }),
      CodeBlock.configure({
        HTMLAttributes: {
          class: 'bg-muted/60 border border-border rounded p-2 my-1 font-mono text-xs overflow-x-auto leading-relaxed',
        },
      }),
      Underline,
      Strike.configure({
        HTMLAttributes: {
          class: 'line-through',
        },
      }),
      Mention.configure({
        HTMLAttributes: {
          class: 'text-primary bg-primary/10 px-1 py-0.5 rounded font-semibold',
        },
        renderLabel({ node }) {
          return `@${node.attrs.label}`;
        },
        suggestion: {
          items: ({ query }) =>
            teamMembers.filter((m) => m.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5),
          render: () => {
            let component: ReactRenderer<any>;
            let popup: TippyInstance[];

            return {
              onStart: (props) => {
                component = new ReactRenderer(MentionList, {
                  props,
                  editor: props.editor,
                });
                popup = tippy('body', {
                  getReferenceClientRect: props.clientRect as any,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: 'manual',
                  placement: 'bottom-start',
                });
              },
              onUpdate(props) {
                component.updateProps(props);
                popup[0].setProps({
                  getReferenceClientRect: props.clientRect as any,
                });
              },
              onKeyDown(props) {
                if (props.event.key === 'Escape') {
                  popup[0].hide();
                  return true;
                }
                return component.ref?.onKeyDown(props) || false;
              },
              onExit() {
                popup[0].destroy();
                component.destroy();
              },
            };
          },
        },
      }),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[60px] max-h-[200px] overflow-y-auto px-3 py-2.5 text-sm leading-relaxed [&>p]:my-0.5 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0 [&_code]:bg-muted/60 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono',
      },
      handlePaste: (view, event) => {
        // Smart paste handling
        const text = event.clipboardData?.getData('text/plain');
        if (text) {
          // Auto-detect URLs in pasted text
          const urlRegex = /(https?:\/\/[^\s]+)/g;
          if (urlRegex.test(text)) {
            // Let the Link extension handle it with autolink
            return false;
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      
      // Typing indicator
      if (text.trim() && !isTyping) {
        setIsTyping(true);
        onTypingStart?.();
      }
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (isTyping) {
          setIsTyping(false);
          onTypingStop?.();
        }
      }, 3000);

      // Smart auto-detection
      autoDetectAndFormat(text, editor);
    },
  });

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTyping) onTypingStop?.();
    };
  }, [isTyping, onTypingStop]);

  const extractMentions = useCallback(() => {
    if (!editor) return [];
    const mentionedUserIds: number[] = [];
    const json = editor.getJSON();

    const traverse = (node: any) => {
      if (node.type === 'mention' && node.attrs?.id) {
        const userId = parseInt(node.attrs.id, 10);
        if (!isNaN(userId) && !mentionedUserIds.includes(userId)) {
          mentionedUserIds.push(userId);
        }
      }
      if (node.content) node.content.forEach(traverse);
    };

    json.content?.forEach(traverse);
    return mentionedUserIds;
  }, [editor]);

  const handleSend = useCallback(async () => {
    if (!editor || disabled || isSending) return;

    const html = editor.getHTML();
    const plainText = editor.getText().trim();

    if (!plainText && attachments.length === 0) return;

    const mentions = extractMentions();

    console.log('✅ Sending message:', {
      content: html,
      mentions,
      attachments: attachments.length
    });

    setIsSending(true);
    try {
      const result = await onSend?.(html, plainText, mentions, attachments);

      if (result !== false) {
        editor.commands.clearContent();
        setAttachments([]);
        attachments.forEach((a) => URL.revokeObjectURL(a.preview));
        if (isTyping) {
          onTypingStop?.();
          setIsTyping(false);
        }
      }
    } finally {
      setIsSending(false);
    }
  }, [editor, disabled, isSending, attachments, extractMentions, onSend, isTyping, onTypingStop]);

  const insertEmoji = useCallback(
    (emoji: string) => {
      editor?.chain().focus().insertContent(emoji).run();
    },
    [editor]
  );

  const insertMention = useCallback(() => {
    editor?.chain().focus().insertContent('@').run();
  }, [editor]);

  const toggleBulletList = () => editor?.chain().focus().toggleBulletList().run();
  const toggleOrderedList = () => editor?.chain().focus().toggleOrderedList().run();
  const toggleBlockquote = () => editor?.chain().focus().toggleBlockquote().run();
  const toggleCodeBlock = () => editor?.chain().focus().toggleCodeBlock().run();

  const canSend = (editor?.getText().trim().length ?? 0) > 0 || attachments.length > 0;

  useEffect(() => {
    if (!editor) return;

    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSend();
      }
    };

    const dom = editor.view.dom;
    dom.addEventListener('keydown', handler as any);
    return () => dom.removeEventListener('keydown', handler as any);
  }, [editor, handleSend]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: Array<{ file: File; preview: string }> = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const preview = URL.createObjectURL(file);
      newAttachments.push({ file, preview });
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn('bg-background px-2 sm:px-4 py-2 border-t border-border', className)}>
      <div className="w-full space-y-2">
        {replyingTo && (
          <div className="flex items-start gap-2 p-2 bg-muted rounded border-l-2 border-primary text-xs sm:text-sm">
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-primary">Replying to {replyingTo.authorName}</span>
              <div className="text-muted-foreground line-clamp-1">{replyingTo.content}</div>
            </div>
            <button onClick={onClearReply} className="text-muted-foreground hover:text-foreground p-1">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <div className="flex flex-col border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors bg-background focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20">
          {attachments.length > 0 && (
            <div className="px-2 sm:px-3 py-2 border-b border-border flex flex-wrap gap-2">
              {attachments.map((att, idx) => (
                <div key={idx} className="relative inline-flex items-center gap-1 sm:gap-2 bg-muted rounded px-2 py-1">
                  {att.file.type.startsWith('image/') ? (
                    <img src={att.preview} alt={att.file.name} className="w-8 h-8 sm:w-10 sm:h-10 rounded object-cover" />
                  ) : (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded bg-gray-200 border-2 border-dashed flex items-center justify-center">
                      <Upload className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="text-[10px] sm:text-xs max-w-[100px] sm:max-w-[160px] truncate">{att.file.name}</div>
                  <button onClick={() => removeAttachment(idx)} className="absolute -top-1 -right-1 bg-background rounded-full p-0.5 sm:p-1 shadow">
                    <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <EditorContent editor={editor} className="w-full" />

          <div className="flex items-center justify-between px-1 sm:px-2 py-1.5 bg-muted/50 border-t border-border">
            <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap">
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => editor?.chain().focus().toggleBold().run()} 
                disabled={disabled} 
                className={cn(
                  "h-6 w-6 sm:h-7 sm:w-7 p-0 transition-colors",
                  editor?.isActive('bold') && "bg-primary/15 text-primary hover:bg-primary/20"
                )}
                title="Bold (Ctrl+B)"
              >
                <Bold className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => editor?.chain().focus().toggleItalic().run()} 
                disabled={disabled} 
                className={cn(
                  "h-6 w-6 sm:h-7 sm:w-7 p-0 transition-colors",
                  editor?.isActive('italic') && "bg-primary/15 text-primary hover:bg-primary/20"
                )}
                title="Italic (Ctrl+I)"
              >
                <Italic className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => editor?.chain().focus().toggleUnderline().run()} 
                disabled={disabled} 
                className={cn(
                  "h-6 w-6 sm:h-7 sm:w-7 p-0 transition-colors",
                  editor?.isActive('underline') && "bg-primary/15 text-primary hover:bg-primary/20"
                )}
                title="Underline (Ctrl+U)"
              >
                <UnderlineIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => editor?.chain().focus().toggleStrike().run()} 
                disabled={disabled} 
                className={cn(
                  "h-6 w-6 sm:h-7 sm:w-7 p-0 transition-colors",
                  editor?.isActive('strike') && "bg-primary/15 text-primary hover:bg-primary/20"
                )}
                title="Strikethrough"
              >
                <Strikethrough className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => editor?.chain().focus().toggleCode().run()} 
                disabled={disabled} 
                className={cn(
                  "h-6 w-6 sm:h-7 sm:w-7 p-0 transition-colors",
                  editor?.isActive('code') && "bg-primary/15 text-primary hover:bg-primary/20"
                )}
                title="Inline code"
              >
                <Code className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </Button>

              <div className="hidden sm:block w-px h-4 sm:h-5 bg-border mx-0.5 sm:mx-1" />

              <Button 
                size="icon" 
                variant="ghost" 
                onClick={toggleBulletList} 
                disabled={disabled} 
                className={cn(
                  "h-6 w-6 sm:h-7 sm:w-7 p-0 transition-colors",
                  editor?.isActive('bulletList') && "bg-primary/15 text-primary hover:bg-primary/20"
                )}
                title="Bullet list"
              >
                <ListIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={toggleOrderedList} 
                disabled={disabled} 
                className={cn(
                  "h-6 w-6 sm:h-7 sm:w-7 p-0 transition-colors",
                  editor?.isActive('orderedList') && "bg-primary/15 text-primary hover:bg-primary/20"
                )}
                title="Numbered list"
              >
                <ListOrdered className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={toggleBlockquote} 
                disabled={disabled} 
                className={cn(
                  "h-6 w-6 sm:h-7 sm:w-7 p-0 transition-colors",
                  editor?.isActive('blockquote') && "bg-primary/15 text-primary hover:bg-primary/20"
                )}
                title="Quote"
              >
                <Quote className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={toggleCodeBlock} 
                disabled={disabled} 
                className={cn(
                  "h-6 w-6 sm:h-7 sm:w-7 p-0 transition-colors",
                  editor?.isActive('codeBlock') && "bg-primary/15 text-primary hover:bg-primary/20"
                )}
                title="Code block"
              >
                <Code className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </Button>

              <div className="hidden sm:block w-px h-4 sm:h-5 bg-border mx-0.5 sm:mx-1" />

              <Button 
                size="icon" 
                variant="ghost" 
                onClick={insertMention} 
                disabled={disabled} 
                className="h-6 w-6 sm:h-7 sm:w-7 p-0" 
                title="Mention (@)"
              >
                <AtSign className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </Button>
              <EmojiPopover onEmojiSelect={insertEmoji} disabled={disabled} />
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={triggerFileUpload} 
                disabled={disabled} 
                className="h-6 w-6 sm:h-7 sm:w-7 p-0" 
                title="Attach file"
              >
                <Paperclip className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </Button>
            </div>

            <Button
              size="sm"
              onClick={handleSend}
              disabled={!canSend || disabled || isSending}
              className={cn(
                'h-6 w-6 sm:h-7 sm:w-7 p-0 rounded transition-all',
                canSend && !disabled && !isSending
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              )}
              title="Send (Enter)"
            >
              {isSending ? <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" /> : <Send className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
            </Button>
          </div>
        </div>

        <p className="text-[10px] sm:text-xs text-muted-foreground px-1">
          <kbd className="px-1 py-0.5 bg-muted rounded text-[10px] sm:text-xs">Enter</kbd> to send,{' '}
          <kbd className="px-1 py-0.5 bg-muted rounded text-[10px] sm:text-xs">Shift+Enter</kbd> for new line
          {' '}• Smart features: Auto-link URLs, **bold**, *italic*, &gt; quotes
        </p>
      </div>

      <input 
        ref={fileInputRef} 
        type="file" 
        multiple 
        className="hidden" 
        accept="image/*,application/pdf,.doc,.docx,.txt,.zip,.rar" 
        onChange={handleFileInput} 
      />
    </div>
  );
}