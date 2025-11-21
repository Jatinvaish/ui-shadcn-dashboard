// app/dashboard/chat/page.tsx - PLAIN TEXT (NO ENCRYPTION)
"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { PrimarySidebar } from "@/components/chat/primary-sidebar";
import { Sidebar } from "@/components/chat/sidebar";
import { ChatHeader } from "@/components/chat/chat-header";
import { MessageList } from "@/components/chat/message-list";
import { MessageInput } from "@/components/chat/message-input";
import { ThreadSidebar } from "@/components/chat/thread-sidebar";
import type { Message } from "@/components/chat/message-list";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchUserChannels,
  fetchMessages,
  sendMessage,
  createChannel,
  markAsRead,
  fetchUnreadCount,
  setSelectedChannel,
  clearError,
  clearSuccessMessage,
  addReaction,
  removeReaction,
  deleteMessage,
  resetUnreadCount,
} from "@/store/slices/chatSlice";
import {
  ChannelType,
  SendMessagePayload,
  MessageType,
  CreateChannelPayload,
} from "@/lib/api/services/chat-service";
import toast from "react-hot-toast";
import { selectUser } from "@/store/slices/authSlice";
import { ArrowLeft } from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";

// ==================== MAIN COMPONENT ====================
const ChatPage = () => {
  const dispatch = useAppDispatch();
  const {
    channels,
    selectedChannel,
    messages,
    typingUsers,
    isLoadingChannels,
    isLoadingMessages,
    isSendingMessage,
    error,
    successMessage,
    unreadCount,
  } = useAppSelector((state) => state.chat);

  const currentUser = useAppSelector(selectUser);
  const token = useAppSelector((state) => state.auth.token);

  // WebSocket connection
  const { sendMessage: sendMessageWS, startTyping, stopTyping, isConnected } = useWebSocket(
    token,
    currentUser?.id || null
  );

  // UI State
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"chat" | "channels" | "activity">("chat");
  const [isPrimarySidebarOpen, setIsPrimarySidebarOpen] = useState(false);

  // Typing debounce
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ==================== INITIALIZATION ====================
  useEffect(() => {
    const initializeChat = async () => {
      try {
        await Promise.all([
          dispatch(fetchUserChannels(100)).unwrap(),
          dispatch(fetchUnreadCount()).unwrap(),
        ]);
      } catch (error: any) {
        console.error("Failed to initialize chat:", error);
        toast.error("Failed to load chat data");
      }
    };

    initializeChat();
  }, [dispatch]);

  // ==================== LOAD CHANNEL DATA ====================
  useEffect(() => {
    if (selectedChannel) {
      const loadChannelData = async () => {
        try {
          await dispatch(
            fetchMessages({
              channelId: selectedChannel.id,
              limit: 50,
            })
          ).unwrap();

          // Mark first message as read
          const channelMessages = messages[selectedChannel.id];
          if (channelMessages && channelMessages.length > 0) {
            const latestMessage = channelMessages[channelMessages.length - 1];
            dispatch(
              markAsRead({
                channelId: selectedChannel.id,
                messageId: latestMessage.id,
              })
            );
          }

          dispatch(resetUnreadCount(selectedChannel.id));
        } catch (error: any) {
          console.error("Failed to load channel data:", error);
          toast.error("Failed to load channel messages");
        }
      };

      loadChannelData();
    }
  }, [selectedChannel?.id, dispatch]);

  // ==================== NOTIFICATIONS ====================
  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearSuccessMessage());
    }
  }, [successMessage, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // ==================== MESSAGE CONVERSION ====================
  const convertToFrontendMessage = useCallback((backendMessage: any): Message => {
    return {
      id: backendMessage.id.toString(),
      authorId: backendMessage.sender_user_id.toString(),
      authorName: `${backendMessage.sender_first_name || "User"} ${
        backendMessage.sender_last_name || ""
      }`.trim(),
      authorAvatar: backendMessage.sender_avatar_url,
      content: backendMessage.content, // Plain text - no decryption needed
      timestamp: new Date(backendMessage.sent_at || backendMessage.created_at),
      edited: backendMessage.is_edited || false,
      reactions: backendMessage.reactions || [],
      threadReplies: backendMessage.reply_count || 0,
      isPinned: backendMessage.is_pinned || false,
      replyTo: backendMessage.reply_to_message_id
        ? {
            messageId: backendMessage.reply_to_message_id.toString(),
            authorName: "Previous User",
            content: "Previous message",
          }
        : undefined,
    };
  }, []);

  const currentMessages: Message[] = React.useMemo(() => {
    if (!selectedChannel) return [];
    const channelMessages = messages[selectedChannel.id] || [];
    return channelMessages.map(convertToFrontendMessage);
  }, [selectedChannel, messages, convertToFrontendMessage]);

  // ==================== HANDLERS ====================

  const handleChannelClick = useCallback(
    (channelId: string) => {
      const channel = channels?.find((c) => c.id.toString() === channelId);
      if (channel) {
        dispatch(setSelectedChannel(channel));
        setSelectedThreadId(null);
        setReplyingTo(null);
      }
    },
    [channels, dispatch]
  );

  const handleBackToList = useCallback(() => {
    dispatch(setSelectedChannel(null));
    setSelectedThreadId(null);
    setReplyingTo(null);
  }, [dispatch]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!selectedChannel || !content.trim()) return;

      try {
        const payload: SendMessagePayload = {
          channelId: selectedChannel.id,
          content: content.trim(), // Plain text - no encryption
          messageType: MessageType.TEXT,
          replyToMessageId: replyingTo ? parseInt(replyingTo.id) : undefined,
        };

        // Try WebSocket first, fallback to HTTP
        if (isConnected) {
          const sent = sendMessageWS(payload);
          if (!sent) {
            await dispatch(sendMessage(payload)).unwrap();
          }
        } else {
          await dispatch(sendMessage(payload)).unwrap();
        }

        setReplyingTo(null);
      } catch (error: any) {
        console.error("Failed to send message:", error);
        toast.error("Failed to send message");
      }
    },
    [selectedChannel, replyingTo, dispatch, isConnected, sendMessageWS]
  );

  const handleTypingStart = useCallback(() => {
    if (!selectedChannel) return;

    startTyping(selectedChannel.id);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(selectedChannel.id);
    }, 3000);
  }, [selectedChannel, startTyping, stopTyping]);

  const handleTypingStop = useCallback(() => {
    if (!selectedChannel) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    stopTyping(selectedChannel.id);
  }, [selectedChannel, stopTyping]);

  const handleDeleteMessage = useCallback(
    async (messageId: string) => {
      if (!confirm("Are you sure you want to delete this message?")) return;

      try {
        await dispatch(deleteMessage(parseInt(messageId))).unwrap();
        toast.success("Message deleted");
      } catch (error: any) {
        console.error("Failed to delete message:", error);
        toast.error("Failed to delete message");
      }
    },
    [dispatch]
  );

  const handleReplyToMessage = useCallback(
    (messageId: string) => {
      const message = currentMessages.find((m) => m.id === messageId);
      if (message) {
        setReplyingTo(message);
      }
    },
    [currentMessages]
  );

  const handleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      try {
        await dispatch(
          addReaction({
            messageId: parseInt(messageId),
            emoji,
          })
        ).unwrap();
      } catch (error: any) {
        console.error("Failed to add reaction:", error);
        toast.error("Failed to add reaction");
      }
    },
    [dispatch]
  );

  const handleCreateChannel = useCallback(
    async (name: string, isPrivate: boolean, description: string) => {
      if (!currentUser) return;

      try {
        const payload: CreateChannelPayload = {
          name: name || undefined,
          description: description || undefined,
          channelType: ChannelType.GROUP,
          participantIds: [currentUser.id], // Include self
        };

        await dispatch(createChannel(payload)).unwrap();
        toast.success("Channel created successfully");
      } catch (error: any) {
        console.error("Failed to create channel:", error);
        toast.error("Failed to create channel");
      }
    },
    [dispatch, currentUser]
  );

  const handlePinChange = useCallback(
    async (isPinned: boolean) => {
      if (!selectedChannel) return;

      const newPinned = new Set(pinnedIds);
      const channelId = selectedChannel.id.toString();

      if (isPinned) {
        newPinned.add(channelId);
      } else {
        newPinned.delete(channelId);
      }
      setPinnedIds(newPinned);

      toast.success(isPinned ? "Channel pinned" : "Channel unpinned");
    },
    [selectedChannel, pinnedIds]
  );

  // ==================== SIDEBAR DATA ====================
  const sidebarChannels = React.useMemo(() => {
    if (!Array.isArray(channels)) return [];

    return channels
      .filter((ch) => ch.channel_type !== ChannelType.DIRECT)
      .map((ch) => ({
        id: ch.id?.toString() || "",
        name: ch.name || "Unnamed Channel",
        isPrivate: ch.is_private || false,
        isPinned: pinnedIds.has(ch.id?.toString() || ""),
        unread: ch.unread_count || 0,
      }));
  }, [channels, pinnedIds]);

  const sidebarDMs = React.useMemo(() => {
    if (!Array.isArray(channels)) return [];

    return channels
      .filter((ch) => ch.channel_type === ChannelType.DIRECT)
      .map((ch) => ({
        id: ch.id?.toString() || "",
        name: ch.name || "Direct Message",
        unread: ch.unread_count || 0,
      }));
  }, [channels]);

  const currentUserForSidebar = currentUser
    ? {
        id: currentUser.id.toString(),
        name: `${currentUser.firstName} ${currentUser.lastName}`,
        email: currentUser.email,
        status: "active" as const,
      }
    : undefined;

  const showSidebarOnMobile = !selectedChannel;
  const showChatOnMobile = !!selectedChannel;

  const currentTypingUsers = selectedChannel
    ? typingUsers[selectedChannel.id]?.filter((id) => id !== currentUser?.id) || []
    : [];

  // ==================== RENDER ====================
  return (
    <div className="bg-background flex h-screen w-full overflow-hidden">
      {/* Connection Status */}
      {!isConnected && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white text-center py-1 text-xs">
          ⚠️ Reconnecting to chat server...
        </div>
      )}

      <PrimarySidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unreadCount={unreadCount}
        isOpen={isPrimarySidebarOpen}
        onClose={() => setIsPrimarySidebarOpen(false)}
      />

      <div className={`${showSidebarOnMobile ? "flex" : "hidden"} md:flex`}>
        <Sidebar
          channels={sidebarChannels || []}
          directMessages={sidebarDMs || []}
          activeId={selectedChannel?.id.toString()}
          activeTab={activeTab}
          onChannelClick={handleChannelClick}
          onDirectMessageClick={handleChannelClick}
          currentUser={currentUserForSidebar}
          availableUsers={[]}
          onCreateChannel={handleCreateChannel}
          onStartDirectMessage={() => {}}
          onStatusChange={() => {}}
          onMenuClick={() => setIsPrimarySidebarOpen(true)}
        />
      </div>

      <div
        className={`bg-background flex h-screen w-full flex-1 flex-col overflow-hidden ${
          showChatOnMobile ? "flex" : "hidden"
        } md:flex`}
      >
        <div className="border-border flex h-14 items-center border-b md:hidden">
          {selectedChannel && (
            <>
              <button
                onClick={handleBackToList}
                className="hover:bg-muted flex h-14 w-14 items-center justify-center transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex-1 px-3">
                <h2 className="font-display truncate text-sm font-bold">
                  {selectedChannel.name}
                </h2>
              </div>
            </>
          )}
        </div>

        {selectedChannel && (
          <div className="hidden h-14 items-center md:flex">
            <ChatHeader
              title={selectedChannel.name}
              description={`Welcome to ${selectedChannel.name}`}
              memberCount={selectedChannel.member_count}
              isPinned={pinnedIds.has(selectedChannel.id.toString())}
              onPinChange={handlePinChange}
              onUpdateChannel={() => {}}
              onArchiveChannel={() => {}}
              onLeaveChannel={() => {}}
              onInviteUsers={() => {}}
            />
          </div>
        )}

        {selectedChannel ? (
          <>
            <MessageList
              messages={currentMessages}
              currentUserId={currentUser?.id.toString() || ""}
              isDirect={selectedChannel.channel_type === ChannelType.DIRECT}
              onReply={handleReplyToMessage}
              onReact={handleReaction}
              onOpenThread={() => {}}
              onDelete={handleDeleteMessage}
              onReplyInThread={() => {}}
            />

            {currentTypingUsers.length > 0 && (
              <div className="px-4 py-2 text-xs text-muted-foreground">
                {currentTypingUsers.length === 1
                  ? "Someone is typing..."
                  : `${currentTypingUsers.length} people are typing...`}
              </div>
            )}

            <MessageInput
              onSend={handleSendMessage}
              replyingTo={replyingTo}
              onClearReply={() => setReplyingTo(null)}
              disabled={isSendingMessage}
              onTypingStart={handleTypingStart}
              onTypingStop={handleTypingStop}
            />
          </>
        ) : (
          <div className="text-muted-foreground hidden md:flex flex-1 items-center justify-center">
            <div className="text-center px-4">
              <p className="text-base font-medium mb-2">Select a chat to start messaging</p>
              <p className="text-sm">Choose from your recent conversations or start a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;