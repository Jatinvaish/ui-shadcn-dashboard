"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Code,
  Smile,
  AtSign,
  Send,
} from "lucide-react";

// ==================== TYPES ====================
interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

// ==================== RICH TEXT EDITOR ====================
const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value = "",
  onChange,
  placeholder = "Type a message...",
  disabled = false,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojis = ["😊", "👍", "❤️", "🎉", "🚀", "👀", "🔥", "💯", "😂", "🤔", "👏", "🙌"];
  const isComposing = useRef(false);

  // Prevent cursor jump (backward typing fix)
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (editor.innerHTML !== value && !isComposing.current) {
      editor.innerHTML = value;
      placeCaretAtEnd(editor);
    }
  }, [value]);

  const placeCaretAtEnd = (element: HTMLElement) => {
    const range = document.createRange();
    const selection = window.getSelection();
    range.selectNodeContents(element);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
  };

  const execCommand = (command: string, val?: string) => {
    document.execCommand(command, false, val);
    editorRef.current?.focus();
  };

  const handleInput = () => {
    if (editorRef.current && onChange) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const insertEmoji = (emoji: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand("insertText", false, emoji);
      handleInput();
      setShowEmojiPicker(false);
    }
  };

  return (
    <div className="border border-gray-600 rounded-lg bg-gray-700 focus-within:border-blue-500 transition-colors relative">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-600">
        <button type="button" onClick={() => execCommand("bold")} className="p-1.5 hover:bg-gray-600 rounded">
          <Bold className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => execCommand("italic")} className="p-1.5 hover:bg-gray-600 rounded">
          <Italic className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => execCommand("underline")} className="p-1.5 hover:bg-gray-600 rounded">
          <Underline className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-gray-600 mx-1" />
        <button
          type="button"
          onClick={() => execCommand("insertUnorderedList")}
          className="p-1.5 hover:bg-gray-600 rounded"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand("insertOrderedList")}
          className="p-1.5 hover:bg-gray-600 rounded"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-gray-600 mx-1" />
        <button
          type="button"
          onClick={() => execCommand("formatBlock", "<blockquote>")}
          className="p-1.5 hover:bg-gray-600 rounded"
        >
          <Quote className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand("formatBlock", "<pre>")}
          className="p-1.5 hover:bg-gray-600 rounded"
        >
          <Code className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-gray-600 mx-1" />
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-1.5 hover:bg-gray-600 rounded"
            title="Emoji"
          >
            <Smile className="w-4 h-4" />
          </button>
          {showEmojiPicker && (
            <div className="absolute bottom-full left-0 mb-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-3 grid grid-cols-6 gap-2 z-10">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => insertEmoji(emoji)}
                  className="text-xl hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
        <button type="button" className="p-1.5 hover:bg-gray-600 rounded">
          <AtSign className="w-4 h-4" />
        </button>
      </div>

      {/* Editable Div + Placeholder */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable={!disabled}
          suppressContentEditableWarning
          onInput={handleInput}
          className="px-3 py-2 min-h-[60px] max-h-40 overflow-y-auto text-sm focus:outline-none"
          style={{
            wordWrap: "break-word",
            whiteSpace: "pre-wrap",
          }}
        />
        {(!value || value === "<br>") && (
          <span className="absolute left-3 top-2 text-gray-400 pointer-events-none select-none">
            {placeholder}
          </span>
        )}
      </div>
    </div>
  );
};
export default RichTextEditor;