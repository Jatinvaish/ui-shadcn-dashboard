"use client";

import React, { useEffect, useCallback } from "react";
import { Sidebar } from "@/components/chat/sidebar";
import { ChatHeader } from "@/components/chat/chat-header";
import { MessageList, type Message } from "@/components/chat/message-list";
import { MessageInput } from "@/components/chat/message-input";
import { ThreadSidebar } from "@/components/chat/thread-sidebar";
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
  addChannelMembers,
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
  AddChannelMembersPayload,
  UpdateMemberNotificationPayload
} from "@/lib/api/services/chat-service";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import * as crypto from "crypto";
import { selectUser } from "@/store/slices/authSlice";

// Helper function to encrypt message content
const encryptMessageContent = (content: string, channelKey: string) => {
  const ALGORITHM = "aes-256-gcm";
  const IV_LENGTH = 16; // 12 bytes -> 16 base64 chars

  try {
    const key = crypto.pbkdf2Sync(channelKey, "message-salt", 100000, 32, "sha256");
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    const encrypted = Buffer.concat([cipher.update(content, "utf8"), cipher.final()]);

    const authTag = cipher.getAuthTag();

    return {
      encryptedContent: encrypted.toString("base64"),
      encryptionIv: iv.toString("base64"), // 12 bytes  → 16 base64 chars
      encryptionAuthTag: authTag.toString("base64") // 16 bytes → 24 base64 chars
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

    // Decode all base64 inputs
    const iv = Buffer.from(encryptionIv, "base64"); // 16 bytes
    const authTag = Buffer.from(encryptionAuthTag, "base64"); // 16 bytes
    const encrypted = Buffer.from(encryptedContent, "base64"); // ciphertext

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

    return decrypted.toString("utf8");
  } catch (error) {
    console.error("Message decryption failed:", error);
    return "[Encrypted message - cannot decrypt]";
  }
};

export default function ChatPage() {
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

  console.log("Selected Channel:", selectedChannel);
  console.log("Channels:", channels);
  console.log("Messages:", messages);

  // const currentUser = useAppSelector((state) => state.auth.user)
  const currentUser = useAppSelector(selectUser);

  console.log("Current User:", currentUser);

  const [selectedThreadId, setSelectedThreadId] = React.useState<string | null>(null);
  const [replyingTo, setReplyingTo] = React.useState<Message | null>(null);
  const [pinnedIds, setPinnedIds] = React.useState<Set<string>>(new Set());

  // Fetch initial data
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

  // Handle channel selection
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

  // Handle success messages
  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearSuccessMessage());
    }
  }, [successMessage, dispatch]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Convert backend messages to frontend format
  const convertToFrontendMessage = useCallback(
    (backendMessage: any): Message => {
      const channelKey = selectedChannel?.encrypted_channel_key || "default-key";
      debugger;
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
        reactions: [], // You can map reactions here if available
        threadReplies: backendMessage.reply_count || 0,
        replyTo: backendMessage.reply_to_message_id
          ? {
              messageId: backendMessage.reply_to_message_id.toString(),
              authorName: "Previous User", // You'd need to fetch this
              content: "Previous message" // You'd need to fetch this
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
    async (content: string) => {
      if (!selectedThreadId || !selectedChannel || !content.trim()) return;

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
          threadId: parseInt(selectedThreadId)
        };

        await dispatch(replyToThread(payload)).unwrap();
      } catch (error: any) {
        console.error("Failed to send thread reply:", error);
        toast.error("Failed to send reply");
      }
    },
    [selectedThreadId, selectedChannel, dispatch]
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

      // Note: This would need a backend endpoint to convert emails to user IDs
      toast.info("User invitation feature requires additional backend support");
    },
    [selectedChannel]
  );

  const handlePinChange = useCallback(
    async (channelId: string, isPinned: boolean) => {
      const newPinned = new Set(pinnedIds);
      if (isPinned) {
        newPinned.add(channelId);
      } else {
        newPinned.delete(channelId);
      }
      setPinnedIds(newPinned);

      // You could also persist this to backend if needed
      try {
        const payload: UpdateMemberNotificationPayload = {
          channelId: parseInt(channelId),
          notificationSettings: { isPinned }
        };
        await dispatch(updateMemberNotification(payload)).unwrap();
      } catch (error) {
        console.error("Failed to update pin status:", error);
      }
    },
    [pinnedIds, dispatch]
  );

  const parentMessage = selectedThreadId
    ? currentMessages.find((m) => m.id === selectedThreadId)
    : null;

  const isChannelView = selectedChannel?.channel_type !== ChannelType.DIRECT;
  const currentChannelName = selectedChannel?.name || "general";
  const isPinned = selectedChannel ? pinnedIds.has(selectedChannel.id.toString()) : false;

  // Transform channels for sidebar
  const sidebarChannels = channels
    ?.filter((ch) => ch.channel_type !== ChannelType.DIRECT)
    ?.map((ch) => ({
      id: ch.id.toString(),
      name: ch.name,
      isPrivate: ch.is_private,
      isPinned: pinnedIds.has(ch.id.toString()),
      unread: ch.unread_count
    }));

  // Transform direct messages for sidebar
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

  const availableUsers = (selectedChannel ? members[selectedChannel.id] || [] : []).map((m) => ({
    id: m.user_id.toString(),
    name: `${m.first_name} ${m.last_name}`,
    email: m.email,
    status: m.status as "active" | "away" | "offline" | undefined
  }));

  if (isLoadingChannels) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-background flex h-screen">
      {/* Sidebar */}
      <Sidebar
        channels={sidebarChannels}
        directMessages={sidebarDMs}
        activeId={selectedChannel?.id.toString()}
        onChannelClick={handleChannelClick}
        onDirectMessageClick={handleChannelClick}
        currentUser={currentUserForSidebar}
        availableUsers={availableUsers}
        onCreateChannel={handleCreateChannel}
        onStartDirectMessage={(userId) => {
          toast.info("Direct message feature requires additional setup");
        }}
        onStatusChange={(status, message) => {
          toast.success(`Status updated to ${status}`);
        }}
      />

      {/* Main chat area */}
      <div className="flex flex-1 flex-col">
        {selectedChannel ? (
          <>
            <ChatHeader
              title={currentChannelName}
              description={selectedChannel.description || `Welcome to ${currentChannelName}`}
              memberCount={isChannelView ? selectedChannel.member_count : undefined}
              isPinned={isPinned}
              onPinChange={(pinned) => handlePinChange(selectedChannel.id.toString(), pinned)}
              onUpdateChannel={handleUpdateChannel}
              onArchiveChannel={handleArchiveChannel}
              onLeaveChannel={handleLeaveChannel}
              onInviteUsers={handleInviteUsers}
            />
            <MessageList
              messages={currentMessages}
              currentUserId={currentUser?.id.toString() || "user-1"}
              isDirect={!isChannelView}
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
          <div className="text-muted-foreground flex flex-1 items-center justify-center">
            <p>Select a channel to start chatting</p>
          </div>
        )}
      </div>

      {selectedThreadId && parentMessage && (
        <ThreadSidebar
          parentMessage={parentMessage}
          threadMessages={currentThreadMessages}
          currentUserId={currentUser?.id.toString() || "user-1"}
          onClose={() => setSelectedThreadId(null)}
          onSendReply={handleSendThreadReply}
        />
      )}
    </div>
  );
}
