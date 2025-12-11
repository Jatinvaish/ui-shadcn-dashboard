// components/chat/rich-text-editor.tsx - UPDATED WITH DIRECT FILE MESSAGE SENDING + DND & PASTE

"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  KeyboardEvent,
  DragEvent as ReactDragEvent
} from "react";
import { useEditor, EditorContent, ReactRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Mention from "@tiptap/extension-mention";
import Underline from "@tiptap/extension-underline";
import Strike from "@tiptap/extension-strike";
import Blockquote from "@tiptap/extension-blockquote";
import CodeBlock from "@tiptap/extension-code-block";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import { Button } from "@/components/ui/button";
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
  File as FileIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EmojiPopover } from "./popovers/emoji-popover";
import tippy, { Instance as TippyInstance } from "tippy.js";
import { ChatService, FileUploadProgress } from "@/lib/api/services/chat-service";
import toast from "react-hot-toast";
import { MessageContent } from "./message-content";

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
      if (event.key === "ArrowUp") {
        setSelectedIndex((prev) => (prev + props.items.length - 1) % props.items.length);
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelectedIndex((prev) => (prev + 1) % props.items.length);
        return true;
      }
      if (event.key === "Enter") {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    }
  }));

  return (
    <div className="bg-popover border-border max-h-48 overflow-hidden rounded-lg border shadow-lg">
      {props.items.length ? (
        props.items.map((item, index) => (
          <button
            key={item.id}
            onClick={() => selectItem(index)}
            className={cn(
              "flex w-full items-center gap-2 px-3 py-2 text-left transition-colors",
              index === selectedIndex ? "bg-accent" : "hover:bg-muted"
            )}>
            <div className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold">
              {item.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium">{item.name}</span>
          </button>
        ))
      ) : (
        <div className="text-muted-foreground px-3 py-2 text-sm">No results</div>
      )}
    </div>
  );
});
MentionList.displayName = "MentionList";

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
  const isImage = attachment.file.type.startsWith("image/");

  return (
    <div className="bg-muted group relative inline-flex items-center gap-1 rounded px-2 py-1 sm:gap-2">
      {isImage ? (
        <img
          src={attachment.preview}
          alt={attachment.file.name}
          className="h-8 w-8 rounded object-cover sm:h-10 sm:w-10"
        />
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-200 sm:h-10 sm:w-10 dark:bg-gray-700">
          <FileIcon className="text-muted-foreground h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      )}

      <div className="flex max-w-[100px] min-w-0 flex-col sm:max-w-[140px]">
        <span className="truncate text-[10px] font-medium sm:text-xs">{attachment.file.name}</span>
        <span className="text-muted-foreground text-[9px] sm:text-[10px]">
          {ChatService.formatFileSize(attachment.file.size)}
        </span>
      </div>

      {attachment.uploading && (
        <div className="bg-background/80 absolute inset-0 flex items-center justify-center rounded">
          <div className="flex flex-col items-center gap-1">
            <Loader2 className="text-primary h-4 w-4 animate-spin" />
            <span className="text-muted-foreground text-[9px]">{attachment.progress || 0}%</span>
          </div>
        </div>
      )}

      {attachment.error && (
        <div className="absolute inset-0 flex items-center justify-center rounded bg-red-500/10">
          <span className="text-[9px] text-red-500">Failed</span>
        </div>
      )}

      {attachment.sent && !attachment.uploading && (
        <div className="absolute top-0 right-0 flex h-3 w-3 items-center justify-center rounded-full bg-green-500">
          <span className="text-[8px] text-white">✓</span>
        </div>
      )}

      <button
        onClick={onRemove}
        className="bg-background absolute -top-1 -right-1 rounded-full p-0.5 opacity-0 shadow transition-opacity group-hover:opacity-100 hover:bg-red-100 sm:p-1 dark:hover:bg-red-900/30"
        disabled={attachment.uploading}>
        <X className="h-2.5 w-2.5 text-red-500 sm:h-3 sm:w-3" />
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
  placeholder = "Type a message...",
  onSend,
  onFileSent,
  disabled,
  replyingTo,
  onClearReply,
  onTypingStart,
  onTypingStop,
  teamMembers = [],
  className,
  channelId
}: RichTextEditorProps) {
  const [isSending, setIsSending] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        horizontalRule: false,
        bulletList: false,
        orderedList: false,
        listItem: false
      }),
      BulletList.configure({
        HTMLAttributes: { class: "list-disc pl-5 my-1 space-y-0.5" }
      }),
      OrderedList.configure({
        HTMLAttributes: { class: "list-decimal pl-5 my-1 space-y-0.5" }
      }),
      ListItem.configure({
        HTMLAttributes: { class: "ml-0 pl-0.5 leading-normal" }
      }),
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          class: "text-primary hover:underline cursor-pointer font-medium",
          target: "_blank",
          rel: "noopener noreferrer nofollow"
        }
      }),
      Blockquote.configure({
        HTMLAttributes: {
          class:
            "border-l-3 border-primary/40 pl-3 my-1 italic text-muted-foreground/90 leading-relaxed"
        }
      }),
      CodeBlock.configure({
        HTMLAttributes: {
          class:
            "bg-muted/60 border border-border rounded p-2 my-1 font-mono text-xs overflow-x-auto leading-relaxed"
        }
      }),
      Underline,
      Strike.configure({ HTMLAttributes: { class: "line-through" } }),
      Mention.configure({
        HTMLAttributes: {
          class: "text-primary bg-primary/10 px-1 py-0.5 rounded font-semibold"
        },
        renderLabel({ node }) {
          return `@${node.attrs.label}`;
        },
        suggestion: {
          items: ({ query }) =>
            teamMembers
              .filter((m) => m.name.toLowerCase().includes(query.toLowerCase()))
              .slice(0, 5),
          render: () => {
            let component: ReactRenderer<any>;
            let popup: TippyInstance[];

            return {
              onStart: (props) => {
                component = new ReactRenderer(MentionList, {
                  props,
                  editor: props.editor
                });
                popup = tippy("body", {
                  getReferenceClientRect: props.clientRect as any,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: "manual",
                  placement: "bottom-start"
                });
              },
              onUpdate(props) {
                component.updateProps(props);
                popup[0].setProps({ getReferenceClientRect: props.clientRect as any });
              },
              onKeyDown(props) {
                if (props.event.key === "Escape") {
                  popup[0].hide();
                  return true;
                }
                return component.ref?.onKeyDown(props) || false;
              },
              onExit() {
                popup[0].destroy();
                component.destroy();
              }
            };
          }
        }
      })
    ],
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[60px] max-h-[200px] overflow-y-auto px-3 py-2.5 text-sm leading-relaxed [&>p]:my-0.5 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0 [&_code]:bg-muted/60 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono"
      }
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
    }
  });

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTyping) onTypingStop?.();
      attachments.forEach((a) => URL.revokeObjectURL(a.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const extractMentions = useCallback(() => {
    if (!editor) return [];
    const mentionedUserIds: number[] = [];
    const json = editor.getJSON();

    const traverse = (node: any) => {
      if (node.type === "mention" && node.attrs?.id) {
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

  // Centralized files handler used by file input, drop, paste
  const handleFiles = useCallback((incoming: FileList | File[]) => {
    const maxFileSize = 100 * 1024 * 1024; // 100MB
    const newAttachments: FileAttachment[] = [];

    const addFile = (file: File |any) => {
      // Basic validation
      if (file.size > maxFileSize) {
        toast.error(`${file.name} is too large. Max size is 100MB.`);
        return;
      }
      // Avoid duplicates by name+size (simple heuristic)
      const exists = attachments.some((a) => a.file.name === file.name && a.file.size === file.size);
      if (exists) return;

      const preview = URL.createObjectURL(file);
      newAttachments.push({ file, preview });
    };

    if ("length" in incoming) {
      for (let i = 0; i < incoming.length; i++) {
        addFile(incoming[i]);
      }
    } else {
      // fallback
      Array.from(incoming).forEach(addFile);
    }

    if (newAttachments.length > 0) {
      setAttachments((prev) => [...prev, ...newAttachments]);
    }

    // reset file input so same file can be selected again later
    if (fileInputRef.current) fileInputRef.current.value = "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachments]);

  // ✅ Send ALL files as ONE message with multiple attachments
  const sendFilesAsOneMessage = useCallback(async (): Promise<boolean> => {
    if (!channelId || attachments.length === 0) return true;

    setIsUploading(true);
    setAttachments((prev) => prev.map((a) => ({ ...a, uploading: true, progress: 0 })));

    try {
      const files = attachments.map((a) => a.file);
      const caption = editor?.getText().trim() || "";

      // ✅ API call - creates message in DB
      const message = await ChatService.sendFilesAsOneMessage(
        files,
        channelId,
        {
          caption,
          replyToMessageId: replyingTo ? parseInt(replyingTo.id) : undefined
        },
        (progress: FileUploadProgress) => {
          setAttachments((prev) => prev.map((a) => ({ ...a, progress: progress.percentage })));
        }
      );

      setAttachments((prev) =>
        prev.map((a) => ({ ...a, uploading: false, sent: true, progress: 100 }))
      );

      // ✅ REMOVED: Don't call sendMessageWS - backend will broadcast via WebSocket gateway
      // The message is already created in DB and will be broadcasted automatically

      onFileSent?.(message);

      console.log("✅ Files sent as one message:", message);
      return true;
    } catch (error: any) {
      console.error("❌ Failed to send files:", error);
      setAttachments((prev) =>
        prev.map((a) => ({
          ...a,
          uploading: false,
          error: error?.message || "Failed"
        }))
      );
      toast.error("Failed to send files");
      return false;
    } finally {
      setIsUploading(false);
    }
  }, [channelId, attachments, editor, replyingTo, onFileSent]);

  // ✅ Update handleSend to use the new function
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
      // ✅ If we have files, send them ALL as ONE message
      if (hasFiles && channelId) {
        const success = await sendFilesAsOneMessage();

        if (success) {
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
    editor,
    disabled,
    isSending,
    isUploading,
    attachments,
    channelId,
    sendFilesAsOneMessage,
    extractMentions,
    onSend,
    isTyping,
    onTypingStop,
    onClearReply
  ]);

  const insertEmoji = useCallback(
    (emoji: string) => {
      editor?.chain().focus().insertContent(emoji).run();
    },
    [editor]
  );

  const insertMention = useCallback(() => {
    editor?.chain().focus().insertContent("@").run();
  }, [editor]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    handleFiles(files);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleFiles]);

  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const triggerFileUpload = () => fileInputRef.current?.click();

  const canSend =
    ((editor?.getText().trim().length ?? 0) > 0 || attachments.length > 0) && !isUploading;

  useEffect(() => {
    if (!editor) return;

    const handler = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleSend();
      }
    };

    const dom = editor.view.dom;
    dom.addEventListener("keydown", handler);
    return () => dom.removeEventListener("keydown", handler);
  }, [editor, handleSend]);

  // --- Drag & Drop handlers on wrapper div ---
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear when leaving the editor container entirely
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragging(false);
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (!e.dataTransfer) return;
    const dt = e.dataTransfer;

    // If files are present, use them
    if (dt.files && dt.files.length > 0) {
      handleFiles(dt.files);
      return;
    }

    // Fallback: try to get items that may contain blobs
    if (dt.items && dt.items.length > 0) {
      const files: File[] = [];
      for (let i = 0; i < dt.items.length; i++) {
        const item = dt.items[i];
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) handleFiles(files);
    }
  }, [handleFiles]);

  // --- Paste support (images/videos/files) ---
  useEffect(() => {
    if (!editor) return;

    const dom = editor.view.dom as HTMLElement;

    const onPaste = (e: ClipboardEvent) => {
      try {
        const clipboard = e.clipboardData;
        if (!clipboard) return;

        const files = clipboard.files;
        if (files && files.length > 0) {
          e.preventDefault();
          handleFiles(files);
          return;
        }

        // Sometimes images are in items
        const items = clipboard.items;
        if (items && items.length > 0) {
          const filesFromItems: File[] = [];
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.kind === "file") {
              const file = item.getAsFile();
              if (file) filesFromItems.push(file);
            }
          }
          if (filesFromItems.length > 0) {
            e.preventDefault();
            handleFiles(filesFromItems);
          }
        }
      } catch (err) {
        // swallow errors to avoid breaking editor paste behavior
        // console.debug("paste handler error", err);
      }
    };

    dom.addEventListener("paste", onPaste as EventListener);
    return () => dom.removeEventListener("paste", onPaste as EventListener);
  }, [editor, handleFiles]);

  // Also attach dragover/drop to the editor container via a ref wrapper — done inline in JSX

  return (
    <div className={cn("bg-background border-border border-t px-2 py-2 sm:px-4", className)}>
      <div className="w-full space-y-2">
        {replyingTo && (
          <div className="bg-muted border-primary flex items-start gap-2 rounded border-l-2 p-2 text-xs sm:text-sm">
            <div className="min-w-0 flex-1">
              <span className="text-primary font-semibold">
                Replying to {replyingTo.authorName}
              </span>
              <div className="text-muted-foreground line-clamp-1"><MessageContent isOwn={false} content={replyingTo.content} /></div>
            </div>
            <button
              onClick={onClearReply}
              className="text-muted-foreground hover:text-foreground p-1">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <div
          // Editor container with DnD handlers
          onDragOver={onDragOver}
          onDragEnter={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={cn(
            "border-border hover:border-primary/50 bg-background focus-within:border-primary focus-within:ring-primary/20 flex flex-col overflow-hidden rounded-lg border transition-colors focus-within:ring-1 relative"
          )}>
          {/* Drop overlay */}
          {isDragging && (
            <div
              aria-hidden
              className="absolute inset-0 z-20 flex items-center justify-center rounded bg-white/60 dark:bg-black/40">
              <div className="flex flex-col items-center gap-2 rounded border border-dashed border-border bg-transparent px-6 py-4">
                <Paperclip className="h-6 w-6" />
                <div className="text-sm font-medium">Drop files here to attach</div>
                <div className="text-xs text-muted-foreground">You can drop images, videos or documents</div>
              </div>
            </div>
          )}

          {/* File Attachments Preview */}
          {attachments.length > 0 && (
            <div className="border-border flex flex-wrap gap-2 border-b px-2 py-2 sm:px-3">
              {attachments.map((att, idx) => (
                <FilePreview
                  key={`${att.file.name}-${idx}`}
                  attachment={att}
                  onRemove={() => removeAttachment(idx)}
                />
              ))}
            </div>
          )}

          <EditorContent editor={editor} className="w-full relative z-10" />

          <div className="bg-muted/50 border-border flex items-center justify-between border-t px-1 py-1.5 sm:px-2">
            <div className="flex flex-wrap items-center gap-0.5 sm:gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => editor?.chain().focus().toggleBold().run()}
                disabled={disabled}
                className={cn(
                  "h-6 w-6 p-0 transition-colors sm:h-7 sm:w-7",
                  editor?.isActive("bold") && "bg-primary/15 text-primary hover:bg-primary/20"
                )}
                title="Bold (Ctrl+B)">
                <Bold className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                disabled={disabled}
                className={cn(
                  "h-6 w-6 p-0 transition-colors sm:h-7 sm:w-7",
                  editor?.isActive("italic") && "bg-primary/15 text-primary hover:bg-primary/20"
                )}
                title="Italic (Ctrl+I)">
                <Italic className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => editor?.chain().focus().toggleUnderline().run()}
                disabled={disabled}
                className={cn(
                  "h-6 w-6 p-0 transition-colors sm:h-7 sm:w-7",
                  editor?.isActive("underline") && "bg-primary/15 text-primary hover:bg-primary/20"
                )}
                title="Underline (Ctrl+U)">
                <UnderlineIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => editor?.chain().focus().toggleStrike().run()}
                disabled={disabled}
                className={cn(
                  "h-6 w-6 p-0 transition-colors sm:h-7 sm:w-7",
                  editor?.isActive("strike") && "bg-primary/15 text-primary hover:bg-primary/20"
                )}
                title="Strikethrough">
                <Strikethrough className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => editor?.chain().focus().toggleCode().run()}
                disabled={disabled}
                className={cn(
                  "h-6 w-6 p-0 transition-colors sm:h-7 sm:w-7",
                  editor?.isActive("code") && "bg-primary/15 text-primary hover:bg-primary/20"
                )}
                title="Inline code">
                <Code className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </Button>

              <div className="bg-border mx-0.5 hidden h-4 w-px sm:mx-1 sm:block sm:h-5" />

              <Button
                size="icon"
                variant="ghost"
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                disabled={disabled}
                className={cn(
                  "h-6 w-6 p-0 transition-colors sm:h-7 sm:w-7",
                  editor?.isActive("bulletList") && "bg-primary/15 text-primary hover:bg-primary/20"
                )}
                title="Bullet list">
                <ListIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                disabled={disabled}
                className={cn(
                  "h-6 w-6 p-0 transition-colors sm:h-7 sm:w-7",
                  editor?.isActive("orderedList") &&
                  "bg-primary/15 text-primary hover:bg-primary/20"
                )}
                title="Numbered list">
                <ListOrdered className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                disabled={disabled}
                className={cn(
                  "h-6 w-6 p-0 transition-colors sm:h-7 sm:w-7",
                  editor?.isActive("blockquote") && "bg-primary/15 text-primary hover:bg-primary/20"
                )}
                title="Quote">
                <Quote className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
                disabled={disabled}
                className={cn(
                  "h-6 w-6 p-0 transition-colors sm:h-7 sm:w-7",
                  editor?.isActive("codeBlock") && "bg-primary/15 text-primary hover:bg-primary/20"
                )}
                title="Code block">
                <Code className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </Button>

              <div className="bg-border mx-0.5 hidden h-4 w-px sm:mx-1 sm:block sm:h-5" />

              <Button
                size="icon"
                variant="ghost"
                onClick={insertMention}
                disabled={disabled}
                className="h-6 w-6 p-0 sm:h-7 sm:w-7"
                title="Mention (@)">
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
                  "h-6 w-6 p-0 sm:h-7 sm:w-7",
                  attachments.length > 0 && "text-primary"
                )}
                title={channelId ? "Attach file" : "Select a channel first"}>
                {isUploading ? (
                  <Loader2 className="h-3 w-3 animate-spin sm:h-3.5 sm:w-3.5" />
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
                    fileInputRef.current.accept = "image/*";
                    fileInputRef.current.click();
                    setTimeout(() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.accept =
                          "image/*,application/pdf,.doc,.docx,.txt,.zip,.rar,.xlsx,.xls,.pptx,.ppt";
                      }
                    }, 100);
                  }
                }}
                disabled={disabled || isUploading || !channelId}
                className="h-6 w-6 p-0 sm:h-7 sm:w-3"
                title={channelId ? "Add image" : "Select a channel first"}>
                <ImageIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </Button>
            </div>

            <Button
              size="sm"
              onClick={handleSend}
              disabled={!canSend || disabled || isSending}
              className={cn(
                "h-6 w-6 rounded p-0 transition-all sm:h-7 sm:w-7",
                canSend && !disabled && !isSending
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
              title="Send (Enter)">
              {isSending ? (
                <Loader2 className="h-3 w-3 animate-spin sm:h-3.5 sm:w-3.5" />
              ) : (
                <Send className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              )}
            </Button>
          </div>
        </div>

        <p className="text-muted-foreground px-1 text-[10px] sm:text-xs">
          <kbd className="bg-muted rounded px-1 py-0.5 text-[10px] sm:text-xs">Enter</kbd> to send,{" "}
          <kbd className="bg-muted rounded px-1 py-0.5 text-[10px] sm:text-xs">Shift+Enter</kbd> for
          new line
          {attachments.length > 0 && (
            <span className="text-primary ml-2">
              • {attachments.length} file{attachments.length > 1 ? "s" : ""} will be sent as message
              {attachments.length > 1 ? "s" : ""}
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
