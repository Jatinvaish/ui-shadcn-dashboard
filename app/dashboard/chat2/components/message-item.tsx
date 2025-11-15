"use client";
import React, { useState } from "react";
import { MessageSquare, Smile, MoreVertical, Pin } from "lucide-react";
import { Message } from "@/types/chat";

// ==================== TYPES ====================
interface MessageItemProps {
  message: Message;
  currentUserId: string;
  onReaction: (messageId: string, emoji: string) => void;
  onOpenThread: (messageId: string) => void;
}

// ==================== COMPONENT ====================

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  currentUserId,
  onReaction,
  onOpenThread,
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const quickEmojis = ["👍", "❤️", "😊", "🎉", "🚀", "👀"];

  const initials = message.senderName
    .split(" ")
    .map((n) => n[0])
    .join("");

  const timeString = new Date(message.timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div
      className="group hover:bg-gray-800/50 -mx-4 px-4 py-2 rounded relative"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowEmojiPicker(false);
      }}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="w-9 h-9 rounded bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-sm font-semibold flex-shrink-0">
          {initials}
        </div>

        {/* Message Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-bold text-sm">{message.senderName}</span>
            <span className="text-xs text-gray-400">{timeString}</span>
            {message.edited && (
              <span className="text-xs text-gray-400">(edited)</span>
            )}
            {message.isPinned && <Pin className="w-3 h-3 text-gray-400" />}
          </div>

          {/* Message content */}
          <div
            className="text-sm text-gray-200 break-words prose prose-invert prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: message.content }}
          />

          {/* Reactions */}
          {message.reactions?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {message.reactions.map((reaction, idx) => (
                <button
                  key={idx}
                  onClick={() => onReaction(message.id, reaction.emoji)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                    reaction.userIds.includes(currentUserId)
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-gray-700 hover:bg-gray-600"
                  }`}
                >
                  <span>{reaction.emoji}</span>
                  <span>{reaction.count}</span>
                </button>
              ))}
            </div>
          )}

          {/* Thread Replies */}
          {message.threadCount && message.threadCount > 0 && (
            <button
              onClick={() => onOpenThread(message.id)}
              className="flex items-center gap-2 mt-2 text-xs text-blue-400 hover:text-blue-300"
            >
              <MessageSquare className="w-4 h-4" />
              {message.threadCount}{" "}
              {message.threadCount === 1 ? "reply" : "replies"}
            </button>
          )}
        </div>
      </div>

      {/* Hover Action Buttons */}
      {showActions && (
        <div className="absolute top-0 right-4 flex items-center gap-1 bg-gray-800 border border-gray-700 rounded shadow-lg px-1 py-1">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-1.5 hover:bg-gray-700 rounded"
          >
            <Smile className="w-4 h-4" />
          </button>
          <button
            onClick={() => onOpenThread(message.id)}
            className="p-1.5 hover:bg-gray-700 rounded"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          <button className="p-1.5 hover:bg-gray-700 rounded">
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="absolute top-full right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-2 grid grid-cols-3 gap-1 z-10">
              {quickEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onReaction(message.id, emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="text-xl hover:scale-125 transition-transform p-1"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default MessageItem;