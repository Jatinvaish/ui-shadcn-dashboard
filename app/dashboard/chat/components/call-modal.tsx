"use client";
import React, { useState, useEffect, FC } from "react";
import { Mic, MicOff, Video, VideoOff, Volume2, PhoneOff } from "lucide-react";

// ==================== TYPES ====================
interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelName: string;
  isVideo?: boolean;
}

// ==================== CALL MODAL COMPONENT ====================
const CallModal: FC<CallModalProps> = ({ isOpen, onClose, channelName, isVideo = false }) => {
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVideoOff, setIsVideoOff] = useState<boolean>(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
      return () => clearInterval(interval);
    } else {
      setCallDuration(0);
    }
  }, [isOpen]);

  // Handle ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50">
      <div className="w-full max-w-4xl mx-4 text-center">
        {isVideo && !isVideoOff ? (
          <div className="mb-8 relative">
            <div className="w-full aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
              <div className="text-gray-400">Video Feed</div>
            </div>
            <div className="absolute bottom-4 right-4 w-32 h-24 bg-gray-900 rounded-lg border-2 border-gray-700 flex items-center justify-center text-xs text-gray-400">
              You
            </div>
          </div>
        ) : (
          <div className="mb-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-3xl font-bold mx-auto mb-4">
              {channelName.substring(0, 2).toUpperCase()}
            </div>
            <h2 className="text-2xl font-bold mb-2">#{channelName}</h2>
          </div>
        )}

        <p className="text-gray-400 mb-6">
          {isVideo ? "Video" : "Voice"} call • {formatDuration(callDuration)}
        </p>

        <div className="flex items-center justify-center gap-4">
          {/* Mute / Unmute */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-4 rounded-full transition-colors ${
              isMuted ? "bg-red-600 hover:bg-red-700" : "bg-gray-700 hover:bg-gray-600"
            }`}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          {/* Video On / Off */}
          {isVideo && (
            <button
              onClick={() => setIsVideoOff(!isVideoOff)}
              className={`p-4 rounded-full transition-colors ${
                isVideoOff ? "bg-red-600 hover:bg-red-700" : "bg-gray-700 hover:bg-gray-600"
              }`}
              title={isVideoOff ? "Turn on video" : "Turn off video"}
            >
              {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            </button>
          )}

          {/* Speaker On / Off */}
          <button
            onClick={() => setIsSpeakerOn(!isSpeakerOn)}
            className={`p-4 rounded-full transition-colors ${
              !isSpeakerOn ? "bg-red-600 hover:bg-red-700" : "bg-gray-700 hover:bg-gray-600"
            }`}
            title={isSpeakerOn ? "Mute speaker" : "Unmute speaker"}
          >
            <Volume2 className="w-6 h-6" />
          </button>

          {/* End Call */}
          <button
            onClick={onClose}
            className="p-4 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
            title="End call"
          >
            <PhoneOff className="w-6 h-6 rotate-[135deg]" />
          </button>
        </div>

        <div className="mt-8 text-sm text-gray-400">
          <p>Press ESC to end call</p>
        </div>
      </div>
    </div>
  );
};

export default CallModal;
