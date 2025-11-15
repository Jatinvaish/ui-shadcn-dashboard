"use client";
import React, { useState } from "react";
import { ChevronDown, ChevronRight, Plus, BellOff } from "lucide-react";
import { Channel } from "@/lib/api/services/chat-service";

// ==================== TYPES ====================

interface ChannelSectionProps {
  title: string;
  channels: Channel[];
  currentChannel: Channel | null;
  onChannelSelect: (channel: Channel) => void;
  onToggleStar?: (channelId: string, isDM?: boolean) => void;
  onAddClick?: () => void;
  renderIcon: (channel: Channel) => React.ReactNode;
  isDM?: boolean;
}

// ==================== COMPONENT ====================

export const ChannelSection: React.FC<ChannelSectionProps> = ({
  title,
  channels,
  currentChannel,
  onChannelSelect,
  onToggleStar,
  onAddClick,
  renderIcon,
  isDM = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Don’t render Starred section if empty
  if (channels.length === 0 && title === "Starred") return null;

  return (
    <div className="px-3 py-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center text-sm font-semibold text-gray-300 hover:text-white"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 mr-1" />
          ) : (
            <ChevronRight className="w-4 h-4 mr-1" />
          )}
          {title}
        </button>

        {onAddClick && (
          <button
            onClick={onAddClick}
            className="p-1 hover:bg-gray-700 rounded"
            title={`Add ${isDM ? "Direct Message" : "Channel"}`}
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Channels List */}
      {isExpanded && (
        <div className="space-y-0.5">
          {channels.map((channel) => (
            <div
              key={channel.id}
              onClick={() => onChannelSelect(channel)}
              className={`flex items-center justify-between px-2 py-1.5 rounded text-sm cursor-pointer group ${
                currentChannel?.id === channel.id
                  ? "bg-blue-600 text-white"
                  : "hover:bg-gray-700 text-gray-300"
              }`}
            >
              <div className="flex items-center min-w-0 flex-1">
                {renderIcon(channel)}
                <span className="truncate">{channel.name}</span>
              </div>

              <div className="flex items-center gap-1">
                {channel.isMuted && (
                  <BellOff className="w-3 h-3 text-gray-400" />
                )}
                {channel.unreadCount && channel.unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-semibold min-w-[20px] text-center">
                    {channel.unreadCount > 99
                      ? "99+"
                      : channel.unreadCount}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChannelSection;