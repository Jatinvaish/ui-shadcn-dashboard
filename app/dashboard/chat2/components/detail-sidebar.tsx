"use client";
import React from "react";
import {
  X,
  UserPlus,
  BellOff,
  Pin,
  Archive,
  LogOut,
  Trash2,
} from "lucide-react";
import { Channel, User } from "@/types/chat";

// ==================== TYPES ====================



// For temporary display until connected to real data
declare const MOCK_USERS: User[];

interface ChannelDetailsSidebarProps {
  channel: Channel;
  onClose: () => void;
  onToggleMute: (channelId: string) => void;
  onInvite: () => void;
}

// ==================== COMPONENT ====================

export const ChannelDetailsSidebar: React.FC<ChannelDetailsSidebarProps> = ({
  channel,
  onClose,
  onToggleMute,
  onInvite,
}) => {
  return (
    <div className="w-full md:w-80 bg-gray-800 border-l border-gray-700 flex flex-col fixed md:relative inset-0 md:inset-auto z-40">
      {/* Header */}
      <div className="h-14 border-b border-gray-700 flex items-center justify-between px-4">
        <h3 className="font-bold">Channel Details</h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* About Section */}
        <div>
          <h4 className="font-semibold mb-2">About</h4>
          <p className="text-sm text-gray-400">
            {channel.description || `This is the #${channel.name} channel.`}
          </p>
        </div>

        {/* Members Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">Members</h4>
            <span className="text-xs text-gray-400">
              {channel.memberCount}
            </span>
          </div>

          <div className="space-y-2">
            {MOCK_USERS.slice(0, 5).map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-2 hover:bg-gray-700 p-2 rounded"
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-semibold">
                    {user.firstName[0]}
                    {user.lastName[0]}
                  </div>
                  <div
                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 ${
                      user.status === "online"
                        ? "bg-green-500"
                        : user.status === "away"
                        ? "bg-yellow-500"
                        : "bg-gray-500"
                    } border-2 border-gray-800 rounded-full`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {user.email}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Channel Actions */}
        <div className="space-y-1 pt-4 border-t border-gray-700">
          <button
            onClick={onInvite}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded text-sm"
          >
            <UserPlus className="w-4 h-4" />
            Add members
          </button>

          <button
            onClick={() => onToggleMute(channel.id)}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded text-sm"
          >
            <BellOff className="w-4 h-4" />
            {channel.isMuted ? "Unmute" : "Mute"} channel
          </button>

          <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded text-sm">
            <Pin className="w-4 h-4" />
            Pin channel
          </button>

          <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded text-sm">
            <Archive className="w-4 h-4" />
            Archive channel
          </button>

          <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded text-sm text-red-400">
            <LogOut className="w-4 h-4" />
            Leave channel
          </button>

          <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded text-sm text-red-400">
            <Trash2 className="w-4 h-4" />
            Delete channel
          </button>
        </div>
      </div>
    </div>
  );
};
export default ChannelDetailsSidebar;