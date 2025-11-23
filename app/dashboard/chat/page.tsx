// app/dashboard/chat/page.tsx - COMPLETE WITH ALL FIXES
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
import type { Message } from "@/components/chat/message-list";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchUserChannels, fetchMessages, sendMessage, createChannel, markAsRead,
  fetchUnreadCount, setSelectedChannel, clearError, clearSuccessMessage,
  addReaction, deleteMessage, editMessage, pinMessage, pinChannel, muteChannel,
  archiveChannel, leaveChannel, updateChannel, replyInThread, fetchThreadMessages,
  resetUnreadCount, fetchTeamMembers, startTeamChat, forwardMessage,
} from "@/store/slices/chatSlice";
import { ChannelType, SendMessagePayload, MessageType } from "@/lib/api/services/chat-service";
import toast from "react-hot-toast";
import { selectUser } from "@/store/slices/authSlice";
import { ArrowLeft, Search } from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Button } from "@/components/ui/button";
import { ForwardMessageDialog } from "@/components/chat/dialogs/forward-message-dialog";
import { MessageInputSlack } from "@/components/chat/message-input";

const ChatPage = () => {
  const dispatch = useAppDispatch();
  const { 
    channels, selectedChannel, messages, threadMessages, typingUsers, 
    isLoadingChannels, isLoadingMessages, isSendingMessage, error, 
    successMessage, unreadCount, teamMembers, channelMembers 
  } = useAppSelector((state) => state.chat);
  
  const currentUser = useAppSelector(selectUser);
  const token = useAppSelector((state) => state.auth.accessToken);

  const { sendMessage: sendMessageWS, startTyping, stopTyping, isConnected } = useWebSocket(token, currentUser?.id || null);

  // UI State
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"chat" | "channels" | "activity">("chat");
  const [isPrimarySidebarOpen, setIsPrimarySidebarOpen] = useState(false);
  const [showThreadSidebar, setShowThreadSidebar] = useState(false);
  
  // Dialogs
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [forwardMessageId, setForwardMessageId] = useState<number | null>(null);
  const [forwardMessageContent, setForwardMessageContent] = useState("");

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // INITIALIZATION
  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([
          dispatch(fetchUserChannels(100)).unwrap(),
          dispatch(fetchUnreadCount()).unwrap(),
          dispatch(fetchTeamMembers()).unwrap(),
        ]);
      } catch (e: any) {
        toast.error("Failed to load chat data");
      }
    };
    init();
  }, [dispatch]);

  // LOAD CHANNEL DATA
  useEffect(() => {
    if (selectedChannel) {
      const loadData = async () => {
        try {
          await dispatch(fetchMessages({ channelId: selectedChannel.id, limit: 50 })).unwrap();
          const channelMsgs = messages[selectedChannel.id];
          if (channelMsgs?.length > 0) {
            dispatch(markAsRead({ channelId: selectedChannel.id, messageId: channelMsgs[channelMsgs.length - 1].id }));
          }
          dispatch(resetUnreadCount(selectedChannel.id));
        } catch (e: any) {
          toast.error("Failed to load messages");
        }
      };
      loadData();
    }
  }, [selectedChannel?.id, dispatch]);

  // LOAD THREAD MESSAGES
  useEffect(() => {
    if (selectedThreadId) {
      dispatch(fetchThreadMessages({ parentMessageId: selectedThreadId, limit: 50 }));
    }
  }, [selectedThreadId, dispatch]);

  // NOTIFICATIONS
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

  // Keyboard shortcut for search
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

  // MESSAGE CONVERSION
  const convertToFrontendMessage = useCallback((msg: any): Message => ({
    id: msg.id.toString(),
    authorId: msg.sender_user_id.toString(),
    authorName: `${msg.sender_first_name || "User"} ${msg.sender_last_name || ""}`.trim(),
    authorAvatar: msg.sender_avatar_url,
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
      authorName: "Previous User", 
      content: "Previous message" 
    } : undefined,
  }), []);

  const currentMessages: Message[] = React.useMemo(() => {
    if (!selectedChannel) return [];
    return (messages[selectedChannel.id] || []).map(convertToFrontendMessage);
  }, [selectedChannel, messages, convertToFrontendMessage]);

  const currentThreadMessages = React.useMemo(() => {
    if (!selectedThreadId) return [];
    return (threadMessages[selectedThreadId] || []).map(convertToFrontendMessage);
  }, [selectedThreadId, threadMessages, convertToFrontendMessage]);

  // HANDLERS
  const handleChannelClick = useCallback((channelId: string) => {
    const channel = channels?.find((c) => c.id.toString() === channelId);
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

  const handleSendMessage = useCallback(async (content: string) => {
    if (!selectedChannel || !content.trim()) return false;
    try {
      const payload: SendMessagePayload = {
        channelId: selectedChannel.id, 
        content: content.trim(), 
        messageType: MessageType.TEXT,
        replyToMessageId: replyingTo ? parseInt(replyingTo.id) : undefined,
        threadId: selectedThreadId || undefined,
      };
      
      if (isConnected) { 
        sendMessageWS(payload); 
      } else { 
        await dispatch(sendMessage(payload)).unwrap(); 
      }
      
      setReplyingTo(null);
      return true;
    } catch (e: any) { 
      toast.error("Failed to send message"); 
      return false; 
    }
  }, [selectedChannel, replyingTo, selectedThreadId, dispatch, isConnected, sendMessageWS]);

  const handleTypingStart = useCallback(() => {
    if (!selectedChannel) return;
    startTyping(selectedChannel.id);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => stopTyping(selectedChannel.id), 3000);
  }, [selectedChannel, startTyping, stopTyping]);

  const handleTypingStop = useCallback(() => {
    if (!selectedChannel) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    stopTyping(selectedChannel.id);
  }, [selectedChannel, stopTyping]);

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    if (!selectedChannel) return;
    try { 
      await dispatch(deleteMessage({ messageId: parseInt(messageId), channelId: selectedChannel.id })).unwrap(); 
    } catch (e: any) { 
      toast.error("Failed to delete message"); 
    }
  }, [dispatch, selectedChannel]);

  const handleEditMessage = useCallback(async (messageId: string, newContent: string) => {
    if (!selectedChannel) return;
    try { 
      await dispatch(editMessage({ messageId: parseInt(messageId), content: newContent, channelId: selectedChannel.id })).unwrap(); 
    } catch (e: any) { 
      toast.error("Failed to edit message"); 
    }
  }, [dispatch, selectedChannel]);

  const handlePinMessage = useCallback(async (messageId: string, isPinned: boolean) => {
    if (!selectedChannel) return;
    try { 
      await dispatch(pinMessage({ messageId: parseInt(messageId), isPinned, channelId: selectedChannel.id })).unwrap(); 
    } catch (e: any) { 
      toast.error("Failed to pin message"); 
    }
  }, [dispatch, selectedChannel]);

  const handleReplyToMessage = useCallback((messageId: string) => {
    const message = currentMessages.find((m) => m.id === messageId);
    if (message) setReplyingTo(message);
  }, [currentMessages]);

  const handleReaction = useCallback(async (messageId: string, emoji: string) => {
    try { 
      await dispatch(addReaction({ messageId: parseInt(messageId), emoji })).unwrap(); 
    } catch (e: any) { 
      toast.error("Failed to add reaction"); 
    }
  }, [dispatch]);

  const handleOpenThread = useCallback((messageId: string) => {
    setSelectedThreadId(parseInt(messageId));
    setShowThreadSidebar(true);
  }, []);

  const handleReplyInThread = useCallback(async (content: string, parentId: string) => {
    if (!content.trim()) return;
    try { 
      await dispatch(replyInThread({ parentMessageId: parseInt(parentId), content: content.trim() })).unwrap(); 
    } catch (e: any) { 
      toast.error("Failed to send reply"); 
    }
  }, [dispatch]);

  const handleCreateChannel = useCallback(async (name: string, isPrivate: boolean, description: string) => {
    if (!currentUser) return;
    try {
      await dispatch(createChannel({ 
        name: name || undefined, 
        description: description || undefined, 
        channelType: ChannelType.GROUP, 
        participantIds: [currentUser.id], 
        isPrivate 
      })).unwrap();
    } catch (e: any) { 
      toast.error("Failed to create channel"); 
    }
  }, [dispatch, currentUser]);

  const handleStartDirectMessage = useCallback(async (userId: string) => {
    if (!currentUser) return;
    try {
      await dispatch(startTeamChat({ memberIds: [parseInt(userId)] })).unwrap();
      toast.success("Chat started");
    } catch (e: any) { 
      toast.error("Failed to start chat"); 
    }
  }, [dispatch, currentUser]);

  const handlePinChannel = useCallback(async (isPinned: boolean) => {
    if (!selectedChannel) return;
    try { 
      await dispatch(pinChannel({ channelId: selectedChannel.id, isPinned })).unwrap(); 
    } catch (e: any) { 
      toast.error("Failed to pin channel"); 
    }
  }, [selectedChannel, dispatch]);

  const handleMuteChannel = useCallback(async () => {
    if (!selectedChannel) return;
    try { 
      await dispatch(muteChannel({ channelId: selectedChannel.id, isMuted: !selectedChannel.is_muted })).unwrap(); 
      toast.success(selectedChannel.is_muted ? "Channel unmuted" : "Channel muted"); 
    } catch (e: any) { 
      toast.error("Failed to mute channel"); 
    }
  }, [selectedChannel, dispatch]);

  const handleArchiveChannel = useCallback(async () => {
    if (!selectedChannel) return;
    try { 
      await dispatch(archiveChannel(selectedChannel.id)).unwrap(); 
    } catch (e: any) { 
      toast.error("Failed to archive channel"); 
    }
  }, [selectedChannel, dispatch]);

  const handleLeaveChannel = useCallback(async () => {
    if (!selectedChannel) return;
    try { 
      await dispatch(leaveChannel(selectedChannel.id)).unwrap(); 
    } catch (e: any) { 
      toast.error("Failed to leave channel"); 
    }
  }, [selectedChannel, dispatch]);

  const handleUpdateChannel = useCallback(async (name: string, description: string) => {
    if (!selectedChannel) return;
    try { 
      await dispatch(updateChannel({ channelId: selectedChannel.id, payload: { name, description } })).unwrap(); 
    } catch (e: any) { 
      toast.error("Failed to update channel"); 
    }
  }, [selectedChannel, dispatch]);

  const handleForwardMessage = useCallback((messageId: string) => {
    const msg = currentMessages.find(m => m.id === messageId);
    if (msg) {
      setForwardMessageId(parseInt(messageId));
      setForwardMessageContent(msg.content);
      setForwardDialogOpen(true);
    }
  }, [currentMessages]);

  const handleMembersAdded = useCallback(() => {
    if (selectedChannel) {
      dispatch(fetchUserChannels(100));
    }
  }, [selectedChannel, dispatch]);

  // ✅ CHECK IF USER IS ADMIN
  const isChannelAdmin = React.useMemo(() => {
    if (!selectedChannel || !currentUser) return false;
    const members = channelMembers[selectedChannel.id] || [];
    const currentMember = members.find(m => m.user_id === currentUser.id);
    return currentMember?.role === 'admin' || currentMember?.role === 'owner';
  }, [selectedChannel, currentUser, channelMembers]);

  // SIDEBAR DATA
  const sidebarChannels = React.useMemo(() => (channels || [])
    .filter((ch) => ch.channel_type !== ChannelType.DIRECT)
    .map((ch) => ({
      id: ch.id?.toString() || "", 
      name: ch.name || "Unnamed Channel", 
      isPrivate: ch.is_private || false, 
      isPinned: ch.is_pinned || false, 
      unread: ch.unread_count || 0,
    })), [channels]);

  const sidebarDMs = React.useMemo(() => (channels || [])
    .filter((ch) => ch.channel_type === ChannelType.DIRECT)
    .map((ch) => ({
      id: ch.id?.toString() || "", 
      name: ch.name || "Direct Message", 
      unread: ch.unread_count || 0,
    })), [channels]);

  const currentUserForSidebar = currentUser ? { 
    id: currentUser.id.toString(), 
    name: `${currentUser.firstName} ${currentUser.lastName}`, 
    email: currentUser.email, 
    status: "active" as const 
  } : undefined;

  const availableUsersForDM = teamMembers
    .filter((m: any) => m.id !== currentUser?.id)
    .map((m:any) => ({
      id: m?.id.toString(), 
      name: `${m.first_name} ${m.last_name}`, 
      email: m.email, 
      status: (m.status as any) || "offline"
    }));

  // ✅ TEAM MEMBERS FOR MENTIONS
  const teamMembersForMentions = React.useMemo(() => {
    return teamMembers.map((m: any) => ({
      id: m.id.toString(),
      name: `${m.first_name} ${m.last_name}`,
      email: m.email,
    }));
  }, [teamMembers]);

  const showSidebarOnMobile = !selectedChannel;
  const showChatOnMobile = !!selectedChannel;
  const currentTypingUsers = selectedChannel ? typingUsers[selectedChannel.id]?.filter((id) => id !== currentUser?.id) || [] : [];
  const isDirect = selectedChannel?.channel_type === ChannelType.DIRECT;

  return (
    <div className="bg-background flex h-screen w-full overflow-hidden">
      {!isConnected && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white text-center py-1 text-xs">
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
          activeId={selectedChannel?.id.toString()} 
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

      <div className={`bg-background flex h-screen w-full flex-1 flex-col overflow-hidden ${showChatOnMobile ? "flex" : "hidden"} md:flex`}>
        {/* Mobile Header */}
        <div className="border-border flex h-14 items-center border-b md:hidden">
          {selectedChannel && (
            <>
              <button onClick={handleBackToList} className="hover:bg-muted flex h-14 w-14 items-center justify-center transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex-1 px-3">
                <h2 className="font-display truncate text-sm font-bold">{selectedChannel.name}</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSearchDialogOpen(true)}>
                <Search className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>

        {/* Desktop Header */}
        {selectedChannel && (
          <div className="hidden md:flex">
            <ChatHeader 
              title={selectedChannel.name} 
              description={selectedChannel.description || `Welcome to ${selectedChannel.name}`} 
              memberCount={selectedChannel.member_count}
              channelId={selectedChannel.id}
              isPrivate={selectedChannel.is_private}
              isPinned={selectedChannel.is_pinned} 
              isMuted={selectedChannel.is_muted}
              onPinChange={handlePinChannel} 
              onUpdateChannel={handleUpdateChannel}
              onArchiveChannel={handleArchiveChannel} 
              onLeaveChannel={handleLeaveChannel} 
              onInviteUsers={isChannelAdmin ? () => setInviteDialogOpen(true) : undefined}
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
              <div className="px-4 py-2 text-xs text-muted-foreground">
                {currentTypingUsers.length === 1 
                  ? "Someone is typing..." 
                  : `${currentTypingUsers.length} people are typing...`}
              </div>
            )}

            <MessageInputSlack 
              onSend={handleSendMessage} 
              replyingTo={replyingTo} 
              onClearReply={() => setReplyingTo(null)} 
              disabled={isSendingMessage}
              onTypingStart={handleTypingStart} 
              onTypingStop={handleTypingStop} 
              placeholder={`Message ${isDirect ? selectedChannel.name : '#' + selectedChannel.name}`}
              teamMembers={teamMembersForMentions}
            />
          </>
        ) : (
          <div className="text-muted-foreground hidden md:flex flex-1 items-center justify-center">
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
          messages={currentThreadMessages} 
          currentUserId={currentUser?.id.toString()}
          onClose={() => setShowThreadSidebar(false)} 
          onReplyInThread={handleReplyInThread} 
        />
      )}

      {/* Dialogs */}
      {selectedChannel && isChannelAdmin && (
        <InviteMembersDialog 
          open={inviteDialogOpen} 
          onOpenChange={setInviteDialogOpen} 
          channelId={selectedChannel.id} 
          channelName={selectedChannel.name}
          onMembersAdded={handleMembersAdded}
        />
      )}
      
      {selectedChannel && (
        <ChannelMembersDialog 
          open={membersDialogOpen} 
          onOpenChange={setMembersDialogOpen} 
          channelId={selectedChannel.id} 
          channelName={selectedChannel.name}
          currentUserRole={selectedChannel.role} 
          onInviteClick={isChannelAdmin ? () => { 
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