import { Channel } from "@/types/chat";
import { Hash, Lock } from "lucide-react";
import { JSX } from "react";


// ==================== RENDER FUNCTIONS ====================
const renderChannelIcon = (channel: Channel): JSX.Element => {
  if (channel.type === "direct") {
    return (
      <div className="relative mr-2">
        <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-semibold">
          {channel.name?.substring(0, 2).toUpperCase()}
        </div>
        <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border-2 border-gray-800 rounded-full"></div>
      </div>
    );
  }

  if (channel.type === "private") {
    return <Lock className="w-4 h-4 mr-2 text-gray-400" />;
  }

  return <Hash className="w-4 h-4 mr-2 text-gray-400" />;
};

export default renderChannelIcon;
