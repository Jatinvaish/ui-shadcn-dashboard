"use client";

import React, { useState, useCallback, useEffect } from "react";
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
  fetchChannelMembers,
  fetchMessages,
  sendMessage,
  createChannel,
  updateChannel,
  archiveChannel,
  leaveChannel,
  deleteMessage,
  updateMemberNotification,
  setSelectedChannel,
  clearError,
  clearSuccessMessage,
  removeMessageFromChannel,
  fetchThreadMessages,
  replyToThread,
  fetchUnreadCount
} from "@/store/slices/chatSlice";
import {
  ChannelType,
  SendMessagePayload,
  MessageType,
  CreateChannelPayload,
  UpdateChannelPayload,
  ArchiveChannelPayload,
  UpdateMemberNotificationPayload
} from "@/lib/api/services/chat-service";
import toast from "react-hot-toast";
import * as crypto from "crypto";
import { selectUser } from "@/store/slices/authSlice";
import { Menu, ArrowLeft } from "lucide-react";

const encryptMessageContent = (content: string, channelKey: string) => {
  const ALGORITHM = "aes-256-gcm";
  const IV_LENGTH = 16;

  try {
    const key = crypto.pbkdf2Sync(channelKey, "message-salt", 100000, 32, "sha256");
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    const encrypted = Buffer.concat([cipher.update(content, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
      encryptedContent: encrypted.toString("base64"),
      encryptionIv: iv.toString("base64"),
      encryptionAuthTag: authTag.toString("base64")
    };
  } catch (error) {
    console.error("Message encryption failed:", error);
    throw new Error("Failed to encrypt message");
  }
};

const decryptMessageContent = (
  encryptedContent: string,
  encryptionIv: string,
  encryptionAuthTag: string,
  channelKey: string
): string => {
  const ALGORITHM = "aes-256-gcm";

  try {
    const key = crypto.pbkdf2Sync(channelKey, "message-salt", 100000, 32, "sha256");
    const iv = Buffer.from(encryptionIv, "base64");
    const authTag = Buffer.from(encryptionAuthTag, "base64");
    const encrypted = Buffer.from(encryptedContent, "base64");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf8");
  } catch (error) {
    console.error("Message decryption failed:", error);
    return "[Encrypted message - cannot decrypt]";
  }
};

const Page = () => {
  const dispatch = useAppDispatch();
  const {
    channels,
    selectedChannel,
    messages,
    members,
    threadMessages,
    isLoadingChannels,
    isLoadingMessages,
    isSendingMessage,
    error,
    successMessage
  } = useAppSelector((state) => state.chat);

  const currentUser = useAppSelector(selectUser);

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"chat" | "channels" | "activity">("chat");
  const [isPrimarySidebarOpen, setIsPrimarySidebarOpen] = useState(false);

  useEffect(() => {
    const initializeChat = async () => {
      try {
        await dispatch(fetchUserChannels({})).unwrap();
        await dispatch(fetchUnreadCount()).unwrap();
      } catch (error: any) {
        console.error("Failed to initialize chat:", error);
        toast.error("Failed to load chat data");
      }
    };

    initializeChat();
  }, [dispatch]);

  useEffect(() => {
    if (selectedChannel) {
      const loadChannelData = async () => {
        try {
          await Promise.all([
            dispatch(fetchMessages({ channelId: selectedChannel.id, limit: 50 })).unwrap(),
            dispatch(fetchChannelMembers(selectedChannel.id)).unwrap()
          ]);
        } catch (error: any) {
          console.error("Failed to load channel data:", error);
          toast.error("Failed to load channel messages");
        }
      };

      loadChannelData();
    }
  }, [selectedChannel, dispatch]);

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

  const convertToFrontendMessage = useCallback(
    (backendMessage: any): Message => {
      const channelKey = selectedChannel?.encrypted_channel_key || "default-key";
      let decryptedContent = backendMessage.encrypted_content;
      try {
        if (backendMessage.encryption_iv && backendMessage.encryption_auth_tag) {
          decryptedContent = decryptMessageContent(
            backendMessage.encrypted_content,
            backendMessage.encryption_iv,
            backendMessage.encryption_auth_tag,
            channelKey
          );
        }
      } catch (error) {
        console.error("Decryption failed for message:", backendMessage.id);
      }

      return {
        id: backendMessage.id.toString(),
        authorId: backendMessage.sender_user_id.toString(),
        authorName: `${backendMessage.sender_first_name} ${backendMessage.sender_last_name}`,
        authorAvatar: backendMessage.sender_avatar_url,
        content: decryptedContent,
        timestamp: new Date(backendMessage.sent_at || backendMessage.created_at),
        edited: backendMessage.is_edited,
        reactions: [],
        threadReplies: backendMessage.reply_count || 0,
        replyTo: backendMessage.reply_to_message_id
          ? {
              messageId: backendMessage.reply_to_message_id.toString(),
              authorName: "Previous User",
              content: "Previous message"
            }
          : undefined
      };
    },
    [selectedChannel]
  );

  const currentMessages: Message[] = React.useMemo(() => {
    if (!selectedChannel) return [];
    const channelMessages = messages[selectedChannel.id] || [];
    return channelMessages.map(convertToFrontendMessage);
  }, [selectedChannel, messages, convertToFrontendMessage]);

  const currentThreadMessages: Message[] = React.useMemo(() => {
    if (!selectedThreadId) return [];
    const threadMsgs = threadMessages[parseInt(selectedThreadId)] || [];
    return threadMsgs.map(convertToFrontendMessage);
  }, [selectedThreadId, threadMessages, convertToFrontendMessage]);

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
        const channelKey = selectedChannel.encrypted_channel_key || "default-key";
        const { encryptedContent, encryptionIv, encryptionAuthTag } = encryptMessageContent(
          content,
          channelKey
        );

        const payload: SendMessagePayload = {
          channelId: selectedChannel.id,
          messageType: MessageType.TEXT,
          encryptedContent,
          encryptionIv,
          encryptionAuthTag,
          replyToMessageId: replyingTo ? parseInt(replyingTo.id) : undefined
        };

        await dispatch(sendMessage(payload)).unwrap();
        setReplyingTo(null);
      } catch (error: any) {
        console.error("Failed to send message:", error);
        toast.error("Failed to send message");
      }
    },
    [selectedChannel, replyingTo, dispatch]
  );

  const handleSendThreadReply = useCallback(
    async (content: string, parentId: string) => {
      if (!selectedChannel || !content.trim()) return;

      try {
        const channelKey = selectedChannel.encrypted_channel_key || "default-key";
        const { encryptedContent, encryptionIv, encryptionAuthTag } = encryptMessageContent(
          content,
          channelKey
        );

        const payload: SendMessagePayload = {
          channelId: selectedChannel.id,
          messageType: MessageType.TEXT,
          encryptedContent,
          encryptionIv,
          encryptionAuthTag,
          threadId: parseInt(parentId)
        };

        await dispatch(replyToThread(payload)).unwrap();
      } catch (error: any) {
        console.error("Failed to send thread reply:", error);
        toast.error("Failed to send reply");
      }
    },
    [selectedChannel, dispatch]
  );

  const handleDeleteMessage = useCallback(
    async (messageId: string) => {
      try {
        await dispatch(deleteMessage({ messageId: parseInt(messageId) })).unwrap();

        if (selectedChannel) {
          dispatch(
            removeMessageFromChannel({
              channelId: selectedChannel.id,
              messageId: parseInt(messageId)
            })
          );
        }
      } catch (error: any) {
        console.error("Failed to delete message:", error);
        toast.error("Failed to delete message");
      }
    },
    [selectedChannel, dispatch]
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

  const handleOpenThread = useCallback(
    async (messageId: string) => {
      setSelectedThreadId(messageId);

      try {
        await dispatch(
          fetchThreadMessages({
            threadId: parseInt(messageId),
            limit: 50
          })
        ).unwrap();
      } catch (error: any) {
        console.error("Failed to load thread messages:", error);
        toast.error("Failed to load thread");
      }
    },
    [dispatch]
  );

  const handleCreateChannel = useCallback(
    async (name: string, isPrivate: boolean, description: string) => {
      try {
        const payload: CreateChannelPayload = {
          name,
          description,
          channelType: ChannelType.GROUP,
          isPrivate
        };

        await dispatch(createChannel(payload)).unwrap();
        toast.success("Channel created successfully");
      } catch (error: any) {
        console.error("Failed to create channel:", error);
        toast.error("Failed to create channel");
      }
    },
    [dispatch]
  );

  const handleUpdateChannel = useCallback(
    async (name: string, description: string) => {
      if (!selectedChannel) return;

      try {
        const payload: UpdateChannelPayload = {
          channelId: selectedChannel.id,
          name,
          description
        };

        await dispatch(updateChannel(payload)).unwrap();
      } catch (error: any) {
        console.error("Failed to update channel:", error);
        toast.error("Failed to update channel");
      }
    },
    [selectedChannel, dispatch]
  );

  const handleArchiveChannel = useCallback(async () => {
    if (!selectedChannel) return;

    try {
      const payload: ArchiveChannelPayload = {
        channelId: selectedChannel.id,
        isArchived: true
      };

      await dispatch(archiveChannel(payload)).unwrap();
      dispatch(setSelectedChannel(null));
    } catch (error: any) {
      console.error("Failed to archive channel:", error);
      toast.error("Failed to archive channel");
    }
  }, [selectedChannel, dispatch]);

  const handleLeaveChannel = useCallback(async () => {
    if (!selectedChannel) return;

    try {
      await dispatch(leaveChannel(selectedChannel.id)).unwrap();
      dispatch(setSelectedChannel(null));
    } catch (error: any) {
      console.error("Failed to leave channel:", error);
      toast.error("Failed to leave channel");
    }
  }, [selectedChannel, dispatch]);

  const handleInviteUsers = useCallback(
    async (emails: string[]) => {
      if (!selectedChannel) return;
      toast.info("User invitation feature requires additional backend support");
    },
    [selectedChannel]
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

      try {
        const payload: UpdateMemberNotificationPayload = {
          channelId: selectedChannel.id,
          notificationSettings: { isPinned }
        };
        await dispatch(updateMemberNotification(payload)).unwrap();
      } catch (error) {
        console.error("Failed to update pin status:", error);
      }
    },
    [selectedChannel, pinnedIds, dispatch]
  );

  const sidebarChannels = channels
    ?.filter((ch) => ch.channel_type !== ChannelType.DIRECT)
    ?.map((ch) => ({
      id: ch.id.toString(),
      name: ch.name,
      isPrivate: ch.is_private,
      isPinned: pinnedIds.has(ch.id.toString()),
      unread: ch.unread_count
    }));

  const sidebarDMs = channels
    ?.filter((ch) => ch.channel_type === ChannelType.DIRECT)
    ?.map((ch) => ({
      id: ch.id.toString(),
      name: ch.name,
      unread: ch.unread_count
    }));

  const currentUserForSidebar = currentUser
    ? {
        id: currentUser.id.toString(),
        name: `${currentUser.firstName} ${currentUser.lastName}`,
        email: currentUser.email,
        status: "active" as const
      }
    : undefined;

  const totalUnread = (sidebarDMs?.reduce((sum, dm) => sum + (dm.unread || 0), 0) || 0) +
    (sidebarChannels?.reduce((sum, ch) => sum + (ch.unread || 0), 0) || 0);

  // Mobile: Show sidebar when no channel selected, show chat when channel selected
  // Tablet+: Always show both
  const showSidebarOnMobile = !selectedChannel;
  const showChatOnMobile = !!selectedChannel;

  return (
    <div className="bg-background flex h-screen w-full overflow-hidden">
      {/* Primary Sidebar - Desktop/Tablet vertical (md+), Mobile overlay */}
      <PrimarySidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        unreadCount={totalUnread}
        isOpen={isPrimarySidebarOpen}
        onClose={() => setIsPrimarySidebarOpen(false)}
      />

      {/* Secondary Sidebar - Mobile: full screen when no channel, Tablet+: always visible */}
      <div className={`${showSidebarOnMobile ? 'flex' : 'hidden'} md:flex`}>
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

      {/* Main Chat Content - Mobile: full screen when channel selected, Tablet+: always visible */}
      <div className={`bg-background flex h-screen w-full flex-1 flex-col overflow-hidden ${showChatOnMobile ? 'flex' : 'hidden'} md:flex`}>
        {/* Mobile header with back button */}
        <div className="border-border flex h-14 items-center border-b md:hidden">
          {selectedChannel && (
            <>
              <button
                onClick={handleBackToList}
                className="hover:bg-muted flex h-14 w-14 items-center justify-center transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex-1 px-3">
                <h2 className="font-display truncate text-sm font-bold">{selectedChannel.name}</h2>
              </div>
            </>
          )}
        </div>

        {/* Desktop/Tablet header */}
        {selectedChannel && (
          <div className="hidden h-14 items-center md:flex">
            <ChatHeader
              title={selectedChannel.name}
              description={selectedChannel.description || `Welcome to ${selectedChannel.name}`}
              memberCount={selectedChannel.member_count}
              isPinned={pinnedIds.has(selectedChannel.id.toString())}
              onPinChange={handlePinChange}
              onUpdateChannel={handleUpdateChannel}
              onArchiveChannel={handleArchiveChannel}
              onLeaveChannel={handleLeaveChannel}
              onInviteUsers={handleInviteUsers}
            />
          </div>
        )}

        {/* Messages and Input */}
        {selectedChannel ? (
          <>
            <MessageList
              messages={currentMessages}
              currentUserId={currentUser?.id.toString() || "user-1"}
              isDirect={selectedChannel.channel_type === ChannelType.DIRECT}
              onReply={handleReplyToMessage}
              onReact={(id, emoji) => console.log("React", emoji, "to", id)}
              onOpenThread={handleOpenThread}
              onDelete={handleDeleteMessage}
              onReplyInThread={handleOpenThread}
            />
            <MessageInput
              onSend={handleSendMessage}
              replyingTo={replyingTo}
              onClearReply={() => setReplyingTo(null)}
              disabled={isSendingMessage}
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

      {/* Thread sidebar */}
      {selectedThreadId && (
        <ThreadSidebar
          threadId={selectedThreadId}
          messages={currentThreadMessages}
          currentUserId={currentUser?.id.toString() || "user-1"}
          onClose={() => setSelectedThreadId(null)}
          onReplyInThread={handleSendThreadReply}
        />
      )}
    </div>
  );
};

export default Page;