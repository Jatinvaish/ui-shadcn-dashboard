// components/chat/rich-text-editor.tsx
"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  KeyboardEvent,
} from 'react';
import { useEditor, EditorContent, ReactRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Mention from '@tiptap/extension-mention';
import Underline from '@tiptap/extension-underline';
import Strike from '@tiptap/extension-strike';
import Blockquote from '@tiptap/extension-blockquote';
import CodeBlock from '@tiptap/extension-code-block';
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
  Camera,
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
        setSelectedIndex(
          (prev) => (prev + props.items.length - 1) % props.items.length
        );
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
        <div className="px-3 py-2 text-sm text-muted-foreground">
          No results
        </div>
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

  // Attachments state: keep original File + preview URL
  const [attachments, setAttachments] = useState<
    Array<{ file: File; preview: string }>
  >([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleTypingStart = useCallback(() => {
    if (!isTyping) {
      console.log('⌨️ RTE: Start typing');
      setIsTyping(true);
      onTypingStart?.();
    }
  }, [isTyping, onTypingStart]);

  const handleTypingStop = useCallback(() => {
    if (isTyping) {
      console.log('⌨️ RTE: Stop typing');
      setIsTyping(false);
      onTypingStop?.();
    }
  }, [isTyping, onTypingStop]);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        horizontalRule: false,
      }),
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-primary hover:underline' },
      }),
      Blockquote,
      CodeBlock,
      Underline,
      Strike,
      Mention.configure({
        HTMLAttributes: {
          class:
            'text-primary bg-primary/10 px-1 rounded font-semibold',
        },
        suggestion: {
          items: ({ query }) =>
            teamMembers
              .filter((m) =>
                m.name.toLowerCase().includes(query.toLowerCase())
              )
              .slice(0, 5),
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
              onUpdate: ({ editor }) => {
                const text = editor.getText();

                if (text.trim() && !isTyping) {
                  handleTypingStart();
                }

                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

                typingTimeoutRef.current = setTimeout(() => {
                  handleTypingStop();
                }, 2000); // Reduced to 2 seconds for faster response
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
        class:
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[60px] max-h-[250px] overflow-y-auto px-3 py-2.5',
      },
    },
    onUpdate: ({ editor }) => {
      const text = editor.getText();
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
    },
  });

  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTyping) onTypingStop?.();
    };
  }, [isTyping, onTypingStop]);

  // Extract mentioned user IDs
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
    const text = editor.getText().trim();

    if (!text && attachments.length === 0) return;

    const mentions = extractMentions();

    setIsSending(true);
    try {
      // Pass the actual File objects + previews (you'll handle upload on the parent/backend later)
      const result = await onSend?.(html, text, mentions, attachments);

      if (result !== false) {
        editor.commands.clearContent();
        setAttachments([]);
        attachments.forEach((a) => URL.revokeObjectURL(a.preview)); // cleanup object URLs
        if (isTyping) {
          onTypingStop?.();
          setIsTyping(false);
        }
      }
    } finally {
      setIsSending(false);
    }
  }, [
    editor,
    disabled,
    isSending,
    attachments,
    extractMentions,
    onSend,
    isTyping,
    onTypingStop,
  ]);

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
  const toggleUnderline = () =>
    editor?.chain().focus().toggleMark('underline').run();
  const toggleStrike = () => editor?.chain().focus().toggleStrike().run();

  const canSend =
    (editor?.getText().trim().length ?? 0) > 0 ||
    attachments.length > 0 ||
    false;

  // Send on Enter (not Shift+Enter)
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

  // --------------------- Attachments (frontend only) ---------------------
  const createPreviewUrl = (file: File): string => {
    return URL.createObjectURL(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: Array<{ file: File; preview: string }> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const preview = createPreviewUrl(file);
      newAttachments.push({ file, preview });
    }

    setAttachments((prev) => [...prev, ...newAttachments]);

    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const openFilePicker = () => fileInputRef.current?.click();

  return (
    <div
      className={cn(
        'bg-background px-3 py-2 sm:px-4 sm:py-3 border-t border-border',
        className
      )}
    >
      <div className="w-full space-y-2">
        {/* Reply indicator */}
        {replyingTo && (
          <div className="flex items-start gap-2 p-2 bg-muted rounded border-l-2 border-primary">
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-primary">
                Replying to {replyingTo.authorName}
              </span>
              <div className="text-xs text-muted-foreground line-clamp-1">
                {replyingTo.content}
              </div>
            </div>
            <button
              onClick={onClearReply}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <div className="flex flex-col border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors bg-background">
          {/* Attachments preview */}
          {attachments.length > 0 && (
            <div className="px-3 py-2 border-b border-border flex flex-wrap gap-2">
              {attachments.map((att, idx) => (
                <div
                  key={idx}
                  className="relative inline-flex items-center gap-2 bg-muted rounded px-2 py-1"
                >
                  {att.file.type.startsWith('image/') ? (
                    <img
                      src={att.preview}
                      alt={att.file.name}
                      className="w-10 h-10 rounded object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-gray-200 border-2 border-dashed flex items-center justify-center">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="text-xs max-w-[160px] truncate">
                    {att.file.name}
                  </div>
                  <button
                    onClick={() => removeAttachment(idx)}
                    className="absolute -top-1 -right-1 bg-background rounded-full p-1 shadow"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Editor */}
          <EditorContent editor={editor} className="w-full" />

          {/* Toolbar */}
          <div className="flex items-center justify-between px-2 py-1.5 bg-muted border-t border-border">
            <div className="flex items-center gap-1">
              {/* Formatting */}
              <Button
                size="icon"
                variant="ghost"
                onClick={() => editor?.chain().focus().toggleBold().run()}
                disabled={disabled}
                className="h-7 w-7 p-0"
              >
                <Bold className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                disabled={disabled}
                className="h-7 w-7 p-0"
              >
                <Italic className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => editor?.chain().focus().toggleCode().run()}
                disabled={disabled}
                className="h-7 w-7 p-0"
                title="Inline code"
              >
                <Code className="h-3.5 w-3.5" />
              </Button>

              <div className="w-px h-5 bg-border mx-1" />

              <Button
                size="icon"
                variant="ghost"
                onClick={toggleBulletList}
                disabled={disabled}
                className="h-7 w-7 p-0"
                title="Bullet list"
              >
                <ListIcon className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleOrderedList}
                disabled={disabled}
                className="h-7 w-7 p-0"
                title="Numbered list"
              >
                <ListOrdered className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleBlockquote}
                disabled={disabled}
                className="h-7 w-7 p-0"
                title="Quote"
              >
                <Quote className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleCodeBlock}
                disabled={disabled}
                className="h-7 w-7 p-0"
                title="Code block"
              >
                <Code className="h-3.5 w-3.5" />
              </Button>

              <div className="w-px h-5 bg-border mx-1" />

              <Button
                size="icon"
                variant="ghost"
                onClick={toggleStrike}
                disabled={disabled}
                className="h-7 w-7 p-0"
                title="Strikethrough"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10 12h4" />
                  <path d="M3 12h18" />
                </svg>
              </Button>

              <Button
                size="icon"
                variant="ghost"
                onClick={toggleUnderline}
                disabled={disabled}
                className="h-7 w-7 p-0"
                title="Underline"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 4v6a6 6 0 0 0 12 0V4" />
                  <path d="M4 20h16" />
                </svg>
              </Button>

              <div className="w-px h-5 bg-border mx-1" />

              {/* Mention & Emoji */}
              <Button
                size="icon"
                variant="ghost"
                onClick={insertMention}
                disabled={disabled}
                className="h-7 w-7 p-0"
                title="Mention (@)"
              >
                <AtSign className="h-3.5 w-3.5" />
              </Button>
              <EmojiPopover onEmojiSelect={insertEmoji} disabled={disabled} />

              {/* File / Image buttons */}
              <div className="hidden sm:flex items-center gap-0.5">
                <div className="w-px h-5 bg-border mx-1" />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={openFilePicker}
                  disabled={disabled}
                  className="h-7 w-7 p-0"
                  title="Attach file"
                >
                  <Upload className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={openFilePicker}
                  disabled={disabled}
                  className="h-7 w-7 p-0"
                  title="Attach image"
                >
                  <Camera className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Send button */}
            <Button
              size="sm"
              onClick={handleSend}
              disabled={!canSend || disabled || isSending}
              className={cn(
                'h-7 w-7 p-0 rounded transition-all',
                canSend && !disabled && !isSending
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
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

        <p className="text-xs text-muted-foreground px-1">
          Press{' '}
          <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> to
          send,{' '}
          <kbd className="px-1 py-0.5 bg-muted rounded text-xs">
            Shift+Enter
          </kbd>{' '}
          for new line
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        accept="image/*,application/pdf,.doc,.docx,.txt"
        onChange={handleFileInput}
      />
    </div>
  );
}