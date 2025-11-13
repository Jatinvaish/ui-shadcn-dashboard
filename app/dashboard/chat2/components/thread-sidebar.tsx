// ============================================
// components/ThreadSidebar.tsx
// ============================================

"use client";

import React, { useState } from "react";
import { X, MessageSquare } from "lucide-react";
import RichTextEditor from "./text-editor";

// ==================== TYPES ====================
import { Thread } from "@/types/chat";

interface ThreadSidebarProps {
  thread: Thread;
  onClose: () => void;
  currentUserId: string;
}

// ==================== THREAD SIDEBAR COMPONENT ====================
const ThreadSidebar: React.FC<ThreadSidebarProps> = ({
  thread,
  onClose,
  currentUserId,
}) => {
  const [threadReply, setThreadReply] = useState("");

  return (
    <div className="w-full md:w-96 bg-gray-800 border-l border-gray-700 flex flex-col fixed md:relative inset-0 md:inset-auto z-40">
      {/* Header */}
      <div className="h-14 border-b border-gray-700 flex items-center justify-between px-4">
        <h3 className="font-bold">Thread</h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Thread Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-sm text-gray-400 mb-4">
          {thread.messages.length}{" "}
          {thread.messages.length === 1 ? "reply" : "replies"}
        </div>

        {thread.messages.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-600" />
            <p>No replies yet. Start the conversation!</p>
          </div>
        )}

        {/* Optional future: Map thread messages here */}
      </div>

      {/* Reply Input */}
      <div className="border-t border-gray-700 p-4">
        <RichTextEditor
          value={threadReply}
          onChange={setThreadReply}
          onSend={() => {
            // handle send reply
            setThreadReply("");
          }}
          placeholder="Reply in thread..."
          isSending={false}
        />
      </div>
    </div>
  );
};

export default ThreadSidebar;
