// ============================================
// components/CreateChannelModal.tsx
// ============================================

"use client";

import React, { useState } from "react";
import { X, Hash, Lock } from "lucide-react";

// ==================== TYPES ====================
interface CreateChannelModalProps {
  onClose: () => void;
}

// ==================== CREATE CHANNEL MODAL ====================
const CreateChannelModal: React.FC<CreateChannelModalProps> = ({ onClose }) => {
  const [channelName, setChannelName] = useState("");
  const [channelType, setChannelType] = useState<"public" | "private">("public");
  const [description, setDescription] = useState("");

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold">Create a channel</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Channel Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Channel name
            </label>
            <input
              type="text"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              placeholder="e.g. marketing-team"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this channel about?"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          {/* Channel Type */}
          <div>
            <label className="block text-sm font-medium mb-3">Channel type</label>
            <div className="space-y-2">
              <button
                onClick={() => setChannelType("public")}
                className={`w-full flex items-start gap-3 p-3 rounded border-2 ${
                  channelType === "public"
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-gray-600"
                }`}
              >
                <Hash className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="text-left flex-1">
                  <div className="font-medium">Public</div>
                  <div className="text-xs text-gray-400">Anyone can join</div>
                </div>
              </button>

              <button
                onClick={() => setChannelType("private")}
                className={`w-full flex items-start gap-3 p-3 rounded border-2 ${
                  channelType === "private"
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-gray-600"
                }`}
              >
                <Lock className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="text-left flex-1">
                  <div className="font-medium">Private</div>
                  <div className="text-xs text-gray-400">
                    Only invited members
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium hover:text-white"
          >
            Cancel
          </button>
          <button
            disabled={!channelName.trim()}
            className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded"
          >
            Create Channel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateChannelModal;
