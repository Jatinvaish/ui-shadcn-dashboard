// app/dashboard/chat/page.tsx - FINAL WORKING VERSION
"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { PrimarySidebar } from "@/components/chat/primary-sidebar";
import { Sidebar } from "@/components/chat/sidebar";
import { ChatHeader } from "@/components/chat/chat-header";
import { MessageList } from "@/components/chat/message-list";
import { ThreadSidebar } from "@/components/chat/thread-sidebar";
import { InviteMembersDialog } from "@/components/chat/dialogs/invite-members-dialog";
import { ChannelMembersDialog } from "@/components/chat/dialogs/channel-members-dialog";
import { SearchDialog } from "@/components/chat/dialogs/search-dialog";
import { ForwardMessageDialog } from "@/components/chat/dialogs/forward-message-dialog";
import { RichTextEditor } from "@/components/chat/rich-text-editor";
import type { Message } from "@/components/chat/message-list";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectUser } from "@/store/slices/authSlice";
import { ArrowLeft, Search } from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

import {
  fetchUserChannels,
  fetchMessages,
  fetchUnreadCount,
  fetchTeamMembers,
  fetchChannelMembers,
  setSelectedChannel,
  clearError,
  clearSuccessMessage,
  resetUnreadCount,
  markAsRead,
  fetchThreadMessages,
  replyInThread,
} from "@/store/slices/chatSlice";

import { ChatService, ChannelType, MessageType, SendMessagePayload } from "@/lib/api/services/chat-service";

const ChatPage = () => {
  const dispatch = useAppDispatch();
  
  // ✅ SUBSCRIBE TO REDUX STATE - This triggers re-renders
  const selectedChannel = useAppSelector((state) => state.chat.selectedChannel);
  const allMessages = useAppSelector((state) => state.chat.messages);
  const threadMessages = useAppSelector((state) => state.chat.threadMessages);
  const typingUsers = useAppSelector((state) => state.chat.typingUsers);
  const channels = useAppSelector((state) => state.chat.channels);
  const channelMembers = useAppSelector((state) => state.chat.channelMembers);
  const teamMembers = useAppSelector((state) => state.chat.teamMembers);
  const unreadCount = useAppSelector((state) => state.chat.unreadCount);
  const isLoadingChannels = useAppSelector((state) => state.chat.isLoadingChannels);
  const isLoadingMessages = useAppSelector((state) => state.chat.isLoadingMessages);
  const error = useAppSelector((state) => state.chat.error);
  const successMessage = useAppSelector((state) => state.chat.successMessage);

  const currentUser = useAppSelector(selectUser);
  const token = useAppSelector((state) => state.auth.accessToken);

  const {
    sendMessage: sendMessageWS,
    startTyping: startTypingWS,
    stopTyping: stopTypingWS,
    markAsRead: markAsReadWS,
    addReaction: addReactionWS,
    removeReaction: removeReactionWS,
    editMessage: editMessageWS,
    deleteMessage: deleteMessageWS,
    pinMessage: pinMessageWS,
    replyInThread: replyInThreadWS,
    inviteMembers: inviteMembersWS,
    isConnected
  } = useWebSocket(token, currentUser?.id || null);

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"chat" | "channels" | "activity">("chat");
  const [isPrimarySidebarOpen, setIsPrimarySidebarOpen] = useState(false);
  const [showThreadSidebar, setShowThreadSidebar] = useState(false);

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [forwardMessageId, setForwardMessageId] = useState<number | null>(null);
  const [forwardMessageContent, setForwardMessageContent] = useState("");

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ==================== INITIALIZATION ====================
  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([
          dispatch(fetchUserChannels(100)).unwrap(),
          dispatch(fetchUnreadCount()).unwrap(),
          dispatch(fetchTeamMembers()).unwrap(),
        ]);
      } catch (e: any) {
        console.error('Init error:', e);
        toast.error("Failed to load chat data");
      }
    };
    init();
  }, [dispatch]);

  // ==================== LOAD CHANNEL DATA ====================
  useEffect(() => {
    if (selectedChannel) {
      const loadChannelData = async () => {
        try {
          const result = await dispatch(fetchMessages({
            channelId: selectedChannel.id,
            limit: 50
          })).unwrap();

          await dispatch(fetchChannelMembers(selectedChannel.id)).unwrap();

          if (result?.messages && result.messages.length > 0) {
            const lastMessage = result.messages[result.messages.length - 1];
            if (isConnected) {
              markAsReadWS(lastMessage.id, selectedChannel.id);
            } else {
              dispatch(markAsRead({
                channelId: selectedChannel.id,
                messageId: lastMessage.id
              }));
            }
          }

          dispatch(resetUnreadCount(selectedChannel.id));
        } catch (e: any) {
          console.error('Load channel data error:', e);
          toast.error("Failed to load channel data");
        }
      };
      loadChannelData();
    }
  }, [selectedChannel?.id, dispatch, isConnected, markAsReadWS]);

  // ==================== LOAD THREAD ====================
  useEffect(() => {
    if (selectedThreadId) {
      const loadThread = async () => {
        try {
          await dispatch(fetchThreadMessages({
            parentMessageId: selectedThreadId,
            limit: 50
          })).unwrap();
        } catch (e: any) {
          console.error('Load thread error:', e);
          toast.error("Failed to load thread");
        }
      };
      loadThread();
    }
  }, [selectedThreadId, dispatch]);

  // ==================== TOAST NOTIFICATIONS ====================
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

  // ==================== KEYBOARD SHORTCUTS ====================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchDialogOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ==================== MESSAGE CONVERSION ====================
  const convertToFrontendMessage = useCallback((msg: any): Message => {
    const senderFirstName = msg.sender_first_name || msg.first_name || '';
    const senderLastName = msg.sender_last_name || msg.last_name || '';
    const senderName = `${senderFirstName} ${senderLastName}`.trim() ||
      msg.sender_email ||
      msg.email ||
      'Unknown User';

    return {
      id: msg.id.toString(),
      authorId: msg.sender_user_id?.toString() || msg.sender_id?.toString() || '0',
      authorName: senderName,
      authorAvatar: msg.sender_avatar_url || msg.avatar_url,
      content: msg.content || "",
      timestamp: new Date(msg.sent_at || msg.created_at),
      edited: msg.is_edited || false,
      reactions: msg.reactions || [],
      threadReplies: msg.reply_count || 0,
      isPinned: msg.is_pinned || false,
      threadId: msg.thread_id?.toString(),
      parentId: msg.reply_to_message_id?.toString(),
      replyTo: msg.reply_to_message_id ? {
        messageId: msg.reply_to_message_id.toString(),
        authorName: msg.reply_to_author_name || "User",
        content: msg.reply_to_content || "Previous message"
      } : undefined,
      is_sent: true,
      is_delivered: (msg.delivered_count || 0) > 0,
      is_read: (msg.read_count || 0) > 0,
      read_count: msg.read_count,
      delivered_count: msg.delivered_count,
      read_by_user_ids: msg.read_by_user_ids,
      delivered_to_user_ids: msg.delivered_to_user_ids,
      am_i_mentioned: msg.am_i_mentioned || false,
    } as Message;
  }, []);

  // ==================== CHANNEL DISPLAY NAME ====================
  const getChannelDisplayName = useCallback((channel: any): string => {
    if (channel.channel_type === ChannelType.DIRECT) {
      const members = channelMembers[channel.id] || [];
      const otherMember = members.find(m => m.user_id !== currentUser?.id);
      if (otherMember) {
        const firstName = otherMember.first_name || '';
        const lastName = otherMember.last_name || '';
        return `${firstName} ${lastName}`.trim() || otherMember.email || 'Unknown User';
      }
    }
    return channel.name || "New Channel";
  }, [channelMembers, currentUser]);

  // ✅ GET MESSAGES FROM REDUX - This will update when Redux updates
  const rawMessages = selectedChannel ? (allMessages[selectedChannel.id] || []) : [];
  const currentMessages: Message[] = rawMessages.map(convertToFrontendMessage);

  const rawThreadMessages = selectedThreadId ? (threadMessages[selectedThreadId] || []) : [];
  const currentThreadMessages = rawThreadMessages.map(convertToFrontendMessage);

  const sidebarChannels = (channels || [])
    .filter((ch) => ch.channel_type !== ChannelType.DIRECT)
    .map((ch) => ({
      id: ch.channel_id || ch.id?.toString() || "",
      name: ch.name || "Unnamed Channel",
      isPrivate: ch.is_private || false,
      isPinned: Boolean(ch.is_pinned),
      unread: ch.unread_count || 0,
    }));

  const sidebarDMs = (channels || [])
    .filter((ch) => ch.channel_type === ChannelType.DIRECT)
    .map((ch) => ({
      id: ch.channel_id || ch.id?.toString() || "",
      name: getChannelDisplayName(ch),
      unread: ch.unread_count || 0,
    }));

  const currentUserForSidebar = currentUser ? {
    id: currentUser.id.toString(),
    name: `${currentUser.firstName} ${currentUser.lastName}`,
    email: currentUser.email,
    status: "active" as const
  } : undefined;

  const availableUsersForDM = teamMembers
    .filter((m: any) => m.id !== currentUser?.id)
    .map((m: any) => ({
      id: m?.id.toString(),
      name: `${m.first_name} ${m.last_name}`,
      email: m.email,
      status: (m.status as any) || "offline"
    }));

  const teamMembersForMentions = teamMembers.map((m: any) => ({
    id: m.id.toString(),
    name: `${m.first_name} ${m.last_name}`,
    email: m.email,
  }));

  // ✅ TYPING USERS - Direct from Redux
  const typingInChannel = selectedChannel ? (typingUsers[selectedChannel.id] || []) : [];
  const currentTypingUsers = typingInChannel
    .filter((t) => t.userId !== currentUser?.id)
    .map(t => t.userName || 'Someone');

  const isChannelAdmin = React.useMemo(() => {
    if (!selectedChannel || !currentUser) return false;
    const members = channelMembers[selectedChannel.id] || [];
    const currentMember = members.find(m => m.user_id === currentUser.id);
    return currentMember?.role === 'admin' || currentMember?.role === 'owner';
  }, [selectedChannel, currentUser, channelMembers]);

  const isDirect = selectedChannel?.channel_type === ChannelType.DIRECT;
  const currentChannelDisplayName = selectedChannel ? getChannelDisplayName(selectedChannel) : "";
  const showSidebarOnMobile = !selectedChannel;
  const showChatOnMobile = !!selectedChannel;

  // ✅ LOG UPDATES
  useEffect(() => {
    console.log('🔄 Messages updated:', currentMessages.length);
  }, [currentMessages.length]);

  useEffect(() => {
    console.log('⌨️ Typing users:', currentTypingUsers);
  }, [currentTypingUsers.length]);
  // app/dashboard/chat/page.tsx - HANDLERS AND RENDER (CONTINUED)

  // ==================== MARK AS READ LISTENER ====================
  useEffect(() => {
    const handleMarkAsRead = (event: CustomEvent) => {
      const { messageId, channelId } = event.detail;
      if (isConnected) {
        markAsReadWS(parseInt(messageId), channelId);
      } else {
        dispatch(markAsRead({ channelId, messageId: parseInt(messageId) }));
      }
    };
    window.addEventListener('markMessageAsRead', handleMarkAsRead as EventListener);
    return () => window.removeEventListener('markMessageAsRead', handleMarkAsRead as EventListener);
  }, [isConnected, markAsReadWS, dispatch]);

  // ==================== CHANNEL HANDLERS ====================
  const handleChannelClick = useCallback((channelId: string) => {
    const channel = channels?.find((c) => c.id.toString() === channelId || c.channel_id === channelId);
    if (channel) {
      dispatch(setSelectedChannel(channel));
      setSelectedThreadId(null);
      setReplyingTo(null);
      setShowThreadSidebar(false);
    }
  }, [channels, dispatch]);

  const handleBackToList = useCallback(() => {
    dispatch(setSelectedChannel(null));
    setSelectedThreadId(null);
    setReplyingTo(null);
    setShowThreadSidebar(false);
  }, [dispatch]);

  const handleCreateChannel = useCallback(async (name: string, isPrivate: boolean, description: string) => {
    if (!currentUser) return;
    try {
      await ChatService.createChannel({
        name: name || undefined,
        description: description || undefined,
        channelType: ChannelType.GROUP,
        participantIds: [currentUser.id],
        isPrivate
      });
      await dispatch(fetchUserChannels(100)).unwrap();
      toast.success("Channel created");
    } catch (e: any) {
      toast.error(e?.message || "Failed to create channel");
    }
  }, [currentUser, dispatch]);

  const handleStartDirectMessage = useCallback(async (userId: string) => {
    if (!currentUser) return;
    try {
      const existingDM = channels.find(ch =>
        ch.channel_type === ChannelType.DIRECT &&
        channelMembers[ch.id]?.some(m => m.user_id === parseInt(userId))
      );
      if (existingDM) {
        dispatch(setSelectedChannel(existingDM));
        return;
      }
      await ChatService.startTeamChat([parseInt(userId)]);
      await dispatch(fetchUserChannels(100)).unwrap();
    } catch (e: any) {
      toast.error(e?.message || "Failed to start chat");
    }
  }, [currentUser, channels, channelMembers, dispatch]);

  const handlePinChannel = useCallback(async (isPinned: boolean) => {
    if (!selectedChannel) return;
    try {
      await ChatService.pinChannel(selectedChannel.id, isPinned);
      await dispatch(fetchUserChannels(100)).unwrap();
    } catch (e: any) {
      toast.error(e?.message || "Failed to pin channel");
    }
  }, [selectedChannel, dispatch]);

  const handleMuteChannel = useCallback(async () => {
    if (!selectedChannel) return;
    try {
      await ChatService.muteChannel(selectedChannel.id, !selectedChannel.is_muted);
      await dispatch(fetchUserChannels(100)).unwrap();
    } catch (e: any) {
      toast.error(e?.message || "Failed to mute channel");
    }
  }, [selectedChannel, dispatch]);

  const handleArchiveChannel = useCallback(async () => {
    if (!selectedChannel) return;
    try {
      await ChatService.archiveChannel(selectedChannel.id);
      await dispatch(fetchUserChannels(100)).unwrap();
    } catch (e: any) {
      toast.error(e?.message || "Failed to archive channel");
    }
  }, [selectedChannel, dispatch]);

  const handleLeaveChannel = useCallback(async () => {
    if (!selectedChannel) return;
    try {
      await ChatService.leaveChannel(selectedChannel.id);
      await dispatch(fetchUserChannels(100)).unwrap();
    } catch (e: any) {
      toast.error(e?.message || "Failed to leave channel");
    }
  }, [selectedChannel, dispatch]);

  const handleUpdateChannel = useCallback(async (name: string, description: string) => {
    if (!selectedChannel) return;
    try {
      await ChatService.updateChannel(selectedChannel.id, { name, description });
      await dispatch(fetchUserChannels(100)).unwrap();
    } catch (e: any) {
      toast.error(e?.message || "Failed to update channel");
    }
  }, [selectedChannel, dispatch]);

  // ==================== MESSAGE HANDLERS ====================
  const handleSendMessage = useCallback(async (
    html: string,
    text: string,
    mentions?: number[],
  ): Promise<boolean> => {
    if (!selectedChannel || !text.trim()) return false;
    try {
      const payload: SendMessagePayload = {
        channelId: selectedChannel.id,
        content: text.trim(),
        messageType: MessageType.TEXT,
        replyToMessageId: replyingTo ? parseInt(replyingTo.id) : undefined,
        threadId: selectedThreadId || undefined,
        mentions: mentions && mentions.length > 0 ? mentions : undefined,
      };
      if (isConnected) {
        await sendMessageWS(payload);
      } else {
        await ChatService.sendMessage(payload);
      }
      setReplyingTo(null);
      return true;
    } catch (e: any) {
      toast.error(e?.message || "Failed to send message");
      return false;
    }
  }, [selectedChannel, replyingTo, selectedThreadId, isConnected, sendMessageWS]);

  // ==================== TYPING HANDLERS ====================
  const handleTypingStart = useCallback(() => {
    if (!selectedChannel || !isConnected) return;
    startTypingWS(selectedChannel.id);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      stopTypingWS(selectedChannel.id);
    }, 3000);
  }, [selectedChannel, isConnected, startTypingWS, stopTypingWS]);

  const handleTypingStop = useCallback(() => {
    if (!selectedChannel || !isConnected) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    stopTypingWS(selectedChannel.id);
  }, [selectedChannel, isConnected, stopTypingWS]);

  // ==================== MESSAGE ACTIONS ====================
  const handleDeleteMessage = useCallback((messageId: string) => {
    if (!selectedChannel || !isConnected) return;
    deleteMessageWS(parseInt(messageId), selectedChannel.id);
  }, [selectedChannel, isConnected, deleteMessageWS]);

  const handleEditMessage = useCallback((messageId: string, newContent: string) => {
    if (!selectedChannel || !isConnected) return;
    editMessageWS(parseInt(messageId), newContent, selectedChannel.id);
  }, [selectedChannel, isConnected, editMessageWS]);

  const handlePinMessage = useCallback((messageId: string, isPinned: boolean) => {
    if (!selectedChannel || !isConnected) return;
    pinMessageWS(parseInt(messageId), selectedChannel.id, isPinned);
  }, [selectedChannel, isConnected, pinMessageWS]);

  const handleReaction = useCallback((messageId: string, emoji: string) => {
    if (!selectedChannel || !isConnected) return;
    const message = currentMessages.find(m => m.id === messageId);
    if (!message) return;
    const existingReaction = message.reactions?.find(
      (r: any) => r.emoji === emoji && r.user_id?.toString() === currentUser?.id?.toString()
    );
    if (existingReaction) {
      removeReactionWS(parseInt(messageId), emoji, selectedChannel.id);
    } else {
      addReactionWS(parseInt(messageId), emoji, selectedChannel.id);
    }
  }, [currentMessages, currentUser, selectedChannel, isConnected, addReactionWS, removeReactionWS]);

  const handleReplyToMessage = useCallback((messageId: string) => {
    const message = currentMessages.find((m) => m.id === messageId);
    if (message) {
      setReplyingTo(message);
      setShowThreadSidebar(false);
      setSelectedThreadId(null);
    }
  }, [currentMessages]);

  const handleOpenThread = useCallback((messageId: string) => {
    if (isDirect) {
      handleReplyToMessage(messageId);
    } else {
      setSelectedThreadId(parseInt(messageId));
      setShowThreadSidebar(true);
      setReplyingTo(null);
    }
  }, [isDirect, handleReplyToMessage]);

  const handleReplyInThread = useCallback(async (content: string, parentId: number): Promise<boolean> => {
    if (!content.trim()) return false;
    try {
      if (isConnected && selectedChannel) {
        replyInThreadWS(parentId, content.trim(), selectedChannel.id);
        return true;
      }
      return false;
    } catch (e: any) {
      toast.error(e?.message || "Failed to send reply");
      return false;
    }
  }, [isConnected, selectedChannel, replyInThreadWS]);

  const handleForwardMessage = useCallback((messageId: string) => {
    const msg = currentMessages.find(m => m.id === messageId);
    if (msg) {
      setForwardMessageId(parseInt(messageId));
      setForwardMessageContent(msg.content);
      setForwardDialogOpen(true);
    }
  }, [currentMessages]);

  const handleMembersAdded = useCallback((channelId: number, userIds: number[]) => {
    if (isConnected) {
      inviteMembersWS(channelId, userIds);
    }
    if (selectedChannel) {
      dispatch(fetchUserChannels(100));
      dispatch(fetchChannelMembers(selectedChannel.id));
    }
  }, [selectedChannel, dispatch, isConnected, inviteMembersWS]);

  // ==================== RENDER ====================
  return (
    <div className="flex w-full overflow-hidden bg-background h-[calc(100vh-var(--header-height))]">
      {!isConnected && (
        <div className="fixed top-[var(--header-height)] left-0 right-0 z-50 bg-yellow-500 text-white text-center py-1 text-xs lg:left-[var(--sidebar-collapsed-width)]">
          ⚠️ Reconnecting...
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
          channels={sidebarChannels}
          directMessages={sidebarDMs}
          activeId={selectedChannel?.channel_id || selectedChannel?.id.toString()}
          activeTab={activeTab}
          onChannelClick={handleChannelClick}
          onDirectMessageClick={handleChannelClick}
          currentUser={currentUserForSidebar}
          availableUsers={availableUsersForDM}
          onCreateChannel={handleCreateChannel}
          onStartDirectMessage={handleStartDirectMessage}
          onStatusChange={() => {}}
          onMenuClick={() => setIsPrimarySidebarOpen(true)}
        />
      </div>

      <div className={`flex w-full flex-1 flex-col overflow-hidden bg-background ${showChatOnMobile ? "flex" : "hidden"} md:flex`}>
        <div className="flex h-14 items-center border-b border-border md:hidden bg-card">
          {selectedChannel && (
            <>
              <button onClick={handleBackToList} className="flex h-14 w-14 items-center justify-center hover:bg-muted">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex-1 px-3">
                <h2 className="truncate text-sm font-bold">{currentChannelDisplayName}</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSearchDialogOpen(true)}>
                <Search className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>

        {selectedChannel && (
          <div className="hidden md:flex">
            <ChatHeader
              title={currentChannelDisplayName}
              description={selectedChannel.description || `Welcome to ${currentChannelDisplayName}`}
              memberCount={selectedChannel.member_count}
              channelId={selectedChannel.id}
              isPrivate={selectedChannel.is_private}
              isPinned={Boolean(selectedChannel.is_pinned)}
              isMuted={selectedChannel.is_muted}
              onPinChange={handlePinChannel}
              onUpdateChannel={handleUpdateChannel}
              onArchiveChannel={handleArchiveChannel}
              onLeaveChannel={handleLeaveChannel}
              onInviteUsers={isChannelAdmin && !isDirect ? () => setInviteDialogOpen(true) : undefined}
              onMembersClick={() => setMembersDialogOpen(true)}
              onSearchClick={() => setSearchDialogOpen(true)}
              onMuteChannel={handleMuteChannel}
            />
          </div>
        )}

        {selectedChannel ? (
          <>
            <MessageList
              messages={currentMessages}
              currentUserId={currentUser?.id.toString() || ""}
              isDirect={isDirect}
              onReply={handleReplyToMessage}
              onReact={handleReaction}
              onOpenThread={handleOpenThread}
              onDelete={handleDeleteMessage}
              onEdit={handleEditMessage}
              onPin={handlePinMessage}
              onReplyInThread={handleReplyInThread}
              onForward={handleForwardMessage}
            />

            {currentTypingUsers.length > 0 && (
              <div className="px-4 py-2 text-xs text-muted-foreground animate-pulse">
                {currentTypingUsers.length === 1
                  ? `${currentTypingUsers[0]} is typing...`
                  : `${currentTypingUsers.length} people are typing...`}
              </div>
            )}

            <RichTextEditor
              onSend={handleSendMessage}
              replyingTo={replyingTo}
              onClearReply={() => setReplyingTo(null)}
              onTypingStart={handleTypingStart}
              onTypingStop={handleTypingStop}
              placeholder={`Message ${isDirect ? currentChannelDisplayName : '#' + currentChannelDisplayName}`}
              teamMembers={teamMembersForMentions}
              disabled={!isConnected}
            />
          </>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center text-muted-foreground">
            <div className="text-center px-4">
              <p className="text-base font-medium mb-2">Select a chat to start messaging</p>
              <p className="text-sm">Choose from your recent conversations or start a new one</p>
              <Button variant="outline" className="mt-4" onClick={() => setSearchDialogOpen(true)}>
                <Search className="h-4 w-4 mr-2" /> Search (⌘K)
              </Button>
            </div>
          </div>
        )}
      </div>

      {showThreadSidebar && selectedThreadId && (
        <ThreadSidebar
          threadId={selectedThreadId.toString()}
          parentMessageId={selectedThreadId}
          currentUserId={currentUser?.id.toString()}
          onClose={() => setShowThreadSidebar(false)}
          onReplyInThread={handleReplyInThread}
          teamMembers={teamMembersForMentions}
        />
      )}

      {selectedChannel && isChannelAdmin && !isDirect && (
        <InviteMembersDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          channelId={selectedChannel.id}
          channelName={currentChannelDisplayName}
          onMembersAdded={handleMembersAdded}
        />
      )}

      {selectedChannel && (
        <ChannelMembersDialog
          open={membersDialogOpen}
          onOpenChange={setMembersDialogOpen}
          channelId={selectedChannel.id}
          channelName={currentChannelDisplayName}
          currentUserRole={selectedChannel.role || selectedChannel.user_role}
          onInviteClick={isChannelAdmin && !isDirect ? () => {
            setMembersDialogOpen(false);
            setInviteDialogOpen(true);
          } : undefined}
        />
      )}

      <SearchDialog
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        onStartDM={handleStartDirectMessage}
      />

      {forwardMessageId && (
        <ForwardMessageDialog
          open={forwardDialogOpen}
          onOpenChange={setForwardDialogOpen}
          messageId={forwardMessageId}
          messageContent={forwardMessageContent}
        />
      )}
    </div>
  );
};

export default ChatPage;