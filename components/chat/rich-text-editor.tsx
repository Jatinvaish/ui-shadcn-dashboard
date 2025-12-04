// components/chat/rich-text-editor.tsx - UPDATED WITH DIRECT FILE MESSAGE SENDING

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
  Underline as UnderlineIcon,
  Strikethrough,
  Paperclip,
  Image as ImageIcon,
  File as FileIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmojiPopover } from './popovers/emoji-popover';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import { ChatService, FileUploadProgress } from '@/lib/api/services/chat-service';
import toast from 'react-hot-toast';

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

// ✅ File Attachment Interface
interface FileAttachment {
  file: File;
  preview: string;
  uploading?: boolean;
  progress?: number;
  error?: string;
  sent?: boolean;
}

interface FilePreviewProps {
  attachment: FileAttachment;
  onRemove: () => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({ attachment, onRemove }) => {
  const isImage = attachment.file.type.startsWith('image/');
  
  return (
    <div className="relative inline-flex items-center gap-1 sm:gap-2 bg-muted rounded px-2 py-1 group">
      {isImage ? (
        <img 
          src={attachment.preview} 
          alt={attachment.file.name} 
          className="w-8 h-8 sm:w-10 sm:h-10 rounded object-cover" 
        />
      ) : (
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <FileIcon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
        </div>
      )}
      
      <div className="flex flex-col min-w-0 max-w-[100px] sm:max-w-[140px]">
        <span className="text-[10px] sm:text-xs truncate font-medium">
          {attachment.file.name}
        </span>
        <span className="text-[9px] sm:text-[10px] text-muted-foreground">
          {ChatService.formatFileSize(attachment.file.size)}
        </span>
      </div>
      
      {attachment.uploading && (
        <div className="absolute inset-0 bg-background/80 rounded flex items-center justify-center">
          <div className="flex flex-col items-center gap-1">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-[9px] text-muted-foreground">
              {attachment.progress || 0}%
            </span>
          </div>
        </div>
      )}
      
      {attachment.error && (
        <div className="absolute inset-0 bg-red-500/10 rounded flex items-center justify-center">
          <span className="text-[9px] text-red-500">Failed</span>
        </div>
      )}
      
      {attachment.sent && !attachment.uploading && (
        <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
          <span className="text-[8px] text-white">✓</span>
        </div>
      )}
      
      <button 
        onClick={onRemove} 
        className="absolute -top-1 -right-1 bg-background rounded-full p-0.5 sm:p-1 shadow opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 dark:hover:bg-red-900/30"
        disabled={attachment.uploading}
      >
        <X className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-500" />
      </button>
    </div>
  );
};

interface RichTextEditorProps {
  placeholder?: string;
  onSend?: (
    html: string,
    text: string,
    mentions?: number[],
    attachmentIds?: number[]
  ) => Promise<boolean> | void;
  onFileSent?: (message: any) => void; // ✅ NEW: Callback when file message is sent
  disabled?: boolean;
  replyingTo?: { id: string; authorName: string; content: string } | null;
  onClearReply?: () => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  teamMembers?: Array<{ id: string; name: string; email: string }>;
  className?: string;
  channelId?: number; // ✅ NEW: Required for sending files as messages
}

export function RichTextEditor({
  placeholder = 'Type a message...',
  onSend,
  onFileSent,
  disabled,
  replyingTo,
  onClearReply,
  onTypingStart,
  onTypingStop,
  teamMembers = [],
  className,
  channelId,
}: RichTextEditorProps) {
  const [isSending, setIsSending] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
        HTMLAttributes: { class: 'list-disc pl-5 my-1 space-y-0.5' },
      }),
      OrderedList.configure({
        HTMLAttributes: { class: 'list-decimal pl-5 my-1 space-y-0.5' },
      }),
      ListItem.configure({
        HTMLAttributes: { class: 'ml-0 pl-0.5 leading-normal' },
      }),
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
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
      Strike.configure({ HTMLAttributes: { class: 'line-through' } }),
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
                popup[0].setProps({ getReferenceClientRect: props.clientRect as any });
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

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTyping) onTypingStop?.();
      attachments.forEach((a) => URL.revokeObjectURL(a.preview));
    };
  }, []);

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

  // ✅ Send files as messages directly
  const sendFilesAsMessages = useCallback(async (): Promise<boolean> => {
    if (!channelId || attachments.length === 0) return true;

    setIsUploading(true);
    let allSuccess = true;

    for (let i = 0; i < attachments.length; i++) {
      const attachment = attachments[i];
      
      // Skip already sent files
      if (attachment.sent) continue;

      // Update status to uploading
      setAttachments(prev => prev.map((a, idx) => 
        idx === i ? { ...a, uploading: true, progress: 0 } : a
      ));

      try {
        // ✅ Use sendFileMessage - sends file and creates message in one call
        const message = await ChatService.sendFileMessage(
          attachment.file,
          channelId,
          {
            caption: i === 0 ? editor?.getText().trim() : undefined,
            replyToMessageId: replyingTo ? parseInt(replyingTo.id) : undefined,
          },
          (progress) => {
            setAttachments(prev => prev.map((a, idx) => 
              idx === i ? { ...a, progress: progress.percentage } : a
            ));
          }
        );

        // Mark as sent
        setAttachments(prev => prev.map((a, idx) => 
          idx === i ? { ...a, uploading: false, sent: true, progress: 100 } : a
        ));

        // Notify parent about the sent message
        onFileSent?.(message);

        console.log('✅ File message sent:', message);
      } catch (error: any) {
        console.error('❌ Failed to send file:', error);
        setAttachments(prev => prev.map((a, idx) => 
          idx === i ? { ...a, uploading: false, error: error?.message || 'Failed' } : a
        ));
        toast.error(`Failed to send ${attachment.file.name}`);
        allSuccess = false;
      }
    }

    setIsUploading(false);
    return allSuccess;
  }, [channelId, attachments, editor, replyingTo, onFileSent]);

  const handleSend = useCallback(async () => {
    if (!editor || disabled || isSending || isUploading) return;

    const html = editor.getHTML();
    const plainText = editor.getText().trim();
    const hasFiles = attachments.length > 0;
    const hasText = plainText.length > 0;

    // Nothing to send
    if (!hasText && !hasFiles) return;

    setIsSending(true);

    try {
      // ✅ If we have files, send them as messages directly
      if (hasFiles && channelId) {
        const success = await sendFilesAsMessages();
        
        if (success) {
          // Clear editor only if files were sent (text goes as caption with first file)
          editor.commands.clearContent();
          attachments.forEach((a) => URL.revokeObjectURL(a.preview));
          setAttachments([]);
          onClearReply?.();
        }
      } 
      // ✅ Text only message (no files)
      else if (hasText && !hasFiles) {
        const mentions = extractMentions();
        const result = await onSend?.(html, plainText, mentions, undefined);

        if (result !== false) {
          editor.commands.clearContent();
          onClearReply?.();
        }
      }

      if (isTyping) {
        onTypingStop?.();
        setIsTyping(false);
      }
    } finally {
      setIsSending(false);
    }
  }, [
    editor, disabled, isSending, isUploading, attachments, channelId,
    sendFilesAsMessages, extractMentions, onSend, isTyping, onTypingStop, onClearReply
  ]);

  const insertEmoji = useCallback((emoji: string) => {
    editor?.chain().focus().insertContent(emoji).run();
  }, [editor]);

  const insertMention = useCallback(() => {
    editor?.chain().focus().insertContent('@').run();
  }, [editor]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: FileAttachment[] = [];
    const maxFileSize = 100 * 1024 * 1024; // 100MB

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (file.size > maxFileSize) {
        toast.error(`${file.name} is too large. Max size is 100MB.`);
        continue;
      }

      const preview = URL.createObjectURL(file);
      newAttachments.push({ file, preview });
    }

    if (newAttachments.length > 0) {
      setAttachments((prev) => [...prev, ...newAttachments]);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const triggerFileUpload = () => fileInputRef.current?.click();

  const canSend = ((editor?.getText().trim().length ?? 0) > 0 || attachments.length > 0) && !isUploading;

  useEffect(() => {
    if (!editor) return;

    const handler = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSend();
      }
    };

    const dom = editor.view.dom;
    dom.addEventListener('keydown', handler);
    return () => dom.removeEventListener('keydown', handler);
  }, [editor, handleSend]);

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
          {/* File Attachments Preview */}
          {attachments.length > 0 && (
            <div className="px-2 sm:px-3 py-2 border-b border-border flex flex-wrap gap-2">
              {attachments.map((att, idx) => (
                <FilePreview 
                  key={`${att.file.name}-${idx}`}
                  attachment={att}
                  onRemove={() => removeAttachment(idx)}
                />
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
                onClick={() => editor?.chain().focus().toggleBulletList().run()} 
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
                onClick={() => editor?.chain().focus().toggleOrderedList().run()} 
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
                onClick={() => editor?.chain().focus().toggleBlockquote().run()} 
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
                onClick={() => editor?.chain().focus().toggleCodeBlock().run()} 
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
              
              {/* File Upload Button */}
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={triggerFileUpload} 
                disabled={disabled || isUploading || !channelId} 
                className={cn(
                  "h-6 w-6 sm:h-7 sm:w-7 p-0",
                  attachments.length > 0 && "text-primary"
                )}
                title={channelId ? "Attach file" : "Select a channel first"}
              >
                {isUploading ? (
                  <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" />
                ) : (
                  <Paperclip className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                )}
              </Button>
              
              {/* Image Upload Button */}
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = 'image/*';
                    fileInputRef.current.click();
                    setTimeout(() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.accept = 'image/*,application/pdf,.doc,.docx,.txt,.zip,.rar,.xlsx,.xls,.pptx,.ppt';
                      }
                    }, 100);
                  }
                }} 
                disabled={disabled || isUploading || !channelId} 
                className="h-6 w-6 sm:h-7 sm:w-7 p-0" 
                title={channelId ? "Add image" : "Select a channel first"}
              >
                <ImageIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
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
          {attachments.length > 0 && (
            <span className="ml-2 text-primary">
              • {attachments.length} file{attachments.length > 1 ? 's' : ''} will be sent as message{attachments.length > 1 ? 's' : ''}
            </span>
          )}
        </p>
      </div>

      {/* Hidden file input */}
      <input 
        ref={fileInputRef} 
        type="file" 
        multiple 
        className="hidden" 
        accept="image/*,application/pdf,.doc,.docx,.txt,.zip,.rar,.xlsx,.xls,.pptx,.ppt" 
        onChange={handleFileInput} 
      />
    </div>
  );
}