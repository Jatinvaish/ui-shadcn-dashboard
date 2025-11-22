// store/slices/chatSlice.ts - COMPLETE SLACK-LIKE REDUX SLICE
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ChatService, Channel, Message, Member, ChannelType, SendMessagePayload, CreateChannelPayload, UpdateChannelPayload, SearchResults } from '../../lib/api/services/chat-service';

interface ChatState {
  channels: Channel[]; selectedChannel: Channel | null; isLoadingChannels: boolean;
  messages: { [channelId: number]: Message[] }; isLoadingMessages: boolean; isSendingMessage: boolean;
  channelMembers: { [channelId: number]: Member[] }; isLoadingMembers: boolean;
  threadMessages: { [parentId: number]: Message[] }; isLoadingThread: boolean;
  pinnedMessages: { [channelId: number]: Message[] };
  searchResults: SearchResults | null; isSearching: boolean;
  typingUsers: { [channelId: number]: number[] }; onlineUsers: number[];
  unreadCount: number; channelUnreadCounts: { [channelId: number]: number };
  teamMembers: Member[]; availableMembers: Member[];
  error: string | null; successMessage: string | null;
}

const initialState: ChatState = {
  channels: [], selectedChannel: null, isLoadingChannels: false,
  messages: {}, isLoadingMessages: false, isSendingMessage: false,
  channelMembers: {}, isLoadingMembers: false,
  threadMessages: {}, isLoadingThread: false,
  pinnedMessages: {},
  searchResults: null, isSearching: false,
  typingUsers: {}, onlineUsers: [],
  unreadCount: 0, channelUnreadCounts: {},
  teamMembers: [], availableMembers: [],
  error: null, successMessage: null,
};

const normalizeChannel = (ch: any): Channel => ({
  id: parseInt(ch.id || ch.channel_id || 0),
  channel_id: ch.channel_id || ch.id?.toString(),
  name: ch.name || 'Unnamed', description: ch.description,
  channel_type: ch.channel_type || ChannelType.GROUP,
  is_private: ch.is_private || false, is_archived: ch.is_archived || false,
  member_count: ch.member_count || 0, message_count: ch.message_count || 0,
  unread_count: ch.unread_count || 0, last_message_at: ch.last_message_at,
  is_muted: ch.is_muted || false, is_pinned: ch.is_pinned || false,
  role: ch.role, created_at: ch.created_at,
});

// ==================== ASYNC THUNKS ====================

// CHANNELS
export const fetchUserChannels = createAsyncThunk('chat/fetchUserChannels', async (limit: number = 50, { rejectWithValue }) => {
  try { const r = await ChatService.getUserChannels(limit); return (Array.isArray(r) ? r : []).map(normalizeChannel); }
  catch (e: any) { return rejectWithValue(e.message); }
});

export const createChannel = createAsyncThunk('chat/createChannel', async (payload: CreateChannelPayload, { rejectWithValue }) => {
  try { return normalizeChannel(await ChatService.createChannel(payload)); }
  catch (e: any) { return rejectWithValue(e.message); }
});

export const updateChannel = createAsyncThunk('chat/updateChannel', async ({ channelId, payload }: { channelId: number; payload: UpdateChannelPayload }, { rejectWithValue }) => {
  try { return normalizeChannel(await ChatService.updateChannel(channelId, payload)); }
  catch (e: any) { return rejectWithValue(e.message); }
});

export const archiveChannel = createAsyncThunk('chat/archiveChannel', async (channelId: number, { rejectWithValue }) => {
  try { await ChatService.archiveChannel(channelId); return channelId; }
  catch (e: any) { return rejectWithValue(e.message); }
});

export const leaveChannel = createAsyncThunk('chat/leaveChannel', async (channelId: number, { rejectWithValue }) => {
  try { await ChatService.leaveChannel(channelId); return channelId; }
  catch (e: any) { return rejectWithValue(e.message); }
});

export const deleteChannel = createAsyncThunk('chat/deleteChannel', async (channelId: number, { rejectWithValue }) => {
  try { await ChatService.deleteChannel(channelId); return channelId; }
  catch (e: any) { return rejectWithValue(e.message); }
});

export const pinChannel = createAsyncThunk('chat/pinChannel', async ({ channelId, isPinned }: { channelId: number; isPinned: boolean }, { rejectWithValue }) => {
  try { await ChatService.pinChannel(channelId, isPinned); return { channelId, isPinned }; }
  catch (e: any) { return rejectWithValue(e.message); }
});

export const muteChannel = createAsyncThunk('chat/muteChannel', async ({ channelId, isMuted, muteUntil }: { channelId: number; isMuted: boolean; muteUntil?: string }, { rejectWithValue }) => {
  try { await ChatService.muteChannel(channelId, isMuted, muteUntil); return { channelId, isMuted }; }
  catch (e: any) { return rejectWithValue(e.message); }
});

// MESSAGES
export const fetchMessages = createAsyncThunk('chat/fetchMessages', async ({ channelId, limit, beforeId }: { channelId: number; limit?: number; beforeId?: number }, { rejectWithValue }) => {
  try { const msgs = await ChatService.getMessages(channelId, limit, beforeId); return { channelId, messages: Array.isArray(msgs) ? msgs : [] }; }
  catch (e: any) { return rejectWithValue(e.message); }
});

export const sendMessage = createAsyncThunk('chat/sendMessage', async (payload: SendMessagePayload, { rejectWithValue }) => {
  try { return await ChatService.sendMessage(payload); }
  catch (e: any) { return rejectWithValue(e.message); }
});

export const editMessage = createAsyncThunk('chat/editMessage', async ({ messageId, content, channelId }: { messageId: number; content: string; channelId: number }, { rejectWithValue }) => {
  try { await ChatService.editMessage(messageId, content); return { messageId, content, channelId }; }
  catch (e: any) { return rejectWithValue(e.message); }
});

export const deleteMessage = createAsyncThunk('chat/deleteMessage', async ({ messageId, channelId }: { messageId: number; channelId: number }, { rejectWithValue }) => {
  try { await ChatService.deleteMessage(messageId); return { messageId, channelId }; }
  catch (e: any) { return rejectWithValue(e.message); }
});

export const pinMessage = createAsyncThunk('chat/pinMessage', async ({ messageId, isPinned, channelId }: { messageId: number; isPinned: boolean; channelId: number }, { rejectWithValue }) => {
  try { await ChatService.pinMessage(messageId, isPinned); return { messageId, isPinned, channelId }; }
  catch (e: any) { return rejectWithValue(e.message); }
});

export const fetchPinnedMessages = createAsyncThunk('chat/fetchPinnedMessages', async (channelId: number, { rejectWithValue }) => {
  try { const msgs = await ChatService.getPinnedMessages(channelId); return { channelId, messages: msgs }; }
  catch (e: any) { return rejectWithValue(e.message); }
});

export const forwardMessage = createAsyncThunk('chat/forwardMessage', async ({ messageId, targetChannelIds }: { messageId: number; targetChannelIds: number[] }, { rejectWithValue }) => {
  try { return await ChatService.forwardMessage(messageId, targetChannelIds); }
  catch (e: any) { return rejectWithValue(e.message); }
});

// THREADS
export const fetchThreadMessages = createAsyncThunk('chat/fetchThreadMessages', async ({ parentMessageId, limit }: { parentMessageId: number; limit?: number }, { rejectWithValue }) => {
  try { const msgs = await ChatService.getThreadMessages(parentMessageId, limit); return { parentMessageId, messages: msgs }; }
  catch (e: any) { return rejectWithValue(e.message); }
});

export const replyInThread = createAsyncThunk('chat/replyInThread', async ({ parentMessageId, content }: { parentMessageId: number; content: string }, { rejectWithValue }) => {
  try { const msg = await ChatService.replyInThread(parentMessageId, content); return { parentMessageId, message: msg }; }
  catch (e: any) { return rejectWithValue(e.message); }
});

// REACTIONS
export const addReaction = createAsyncThunk('chat/addReaction', async ({ messageId, emoji }: { messageId: number; emoji: string }, { rejectWithValue }) => {
  try { await ChatService.addReaction(messageId, emoji); return { messageId, emoji }; }
  catch (e: any) { return rejectWithValue(e.message); }
});

export const removeReaction = createAsyncThunk('chat/removeReaction', async ({ messageId, emoji }: { messageId: number; emoji: string }, { rejectWithValue }) => {
  try { await ChatService.removeReaction(messageId, emoji); return { messageId, emoji }; }
  catch (e: any) { return rejectWithValue(e.message); }
});

// MEMBERS
export const fetchChannelMembers = createAsyncThunk('chat/fetchChannelMembers', async (channelId: number, { rejectWithValue }) => {
  try { const members = await ChatService.getChannelMembers(channelId); return { channelId, members }; }
  catch (e: any) { return rejectWithValue(e.message); }
});

export const addMembers = createAsyncThunk('chat/addMembers', async ({ channelId, userIds }: { channelId: number; userIds: number[] }, { rejectWithValue }) => {
  try { const r = await ChatService.addMembers(channelId, userIds); return { channelId, addedMembers: r.addedMembers }; }
  catch (e: any) { return rejectWithValue(e.message); }
});

export const removeMember = createAsyncThunk('chat/removeMember', async ({ channelId, userId }: { channelId: number; userId: number }, { rejectWithValue }) => {
  try { await ChatService.removeMember(channelId, userId); return { channelId, userId }; }
  catch (e: any) { return rejectWithValue(e.message); }
});

export const updateMemberRole = createAsyncThunk('chat/updateMemberRole', async ({ channelId, userId, role }: { channelId: number; userId: number; role: string }, { rejectWithValue }) => {
  try { await ChatService.updateMemberRole(channelId, userId, role); return { channelId, userId, role }; }
  catch (e: any) { return rejectWithValue(e.message); }
});

export const fetchAvailableMembers = createAsyncThunk('chat/fetchAvailableMembers', async (channelId: number, { rejectWithValue }) => {
  try { return await ChatService.getAvailableMembersForChannel(channelId); }
  catch (e: any) { return rejectWithValue(e.message); }
});

// TEAM
export const fetchTeamMembers = createAsyncThunk('chat/fetchTeamMembers', async (search?: string, { rejectWithValue }) => {
  try { return await ChatService.getTeamMembers(search); }
  catch (e: any) { return rejectWithValue(e.message); }
});

export const startTeamChat = createAsyncThunk('chat/startTeamChat', async ({ memberIds, name }: { memberIds: number[]; name?: string }, { rejectWithValue }) => {
  try { return normalizeChannel(await ChatService.startTeamChat(memberIds, name)); }
  catch (e: any) { return rejectWithValue(e.message); }
});

// SEARCH
export const searchChat = createAsyncThunk('chat/search', async ({ query, opts }: { query: string; opts?: any }, { rejectWithValue }) => {
  try { return await ChatService.search(query, opts); }
  catch (e: any) { return rejectWithValue(e.message); }
});

// UNREAD
export const markAsRead = createAsyncThunk('chat/markAsRead', async ({ channelId, messageId }: { channelId: number; messageId: number }) => {
  await ChatService.markAsRead(channelId, messageId); return { channelId };
});

export const fetchUnreadCount = createAsyncThunk('chat/fetchUnreadCount', async (_, { rejectWithValue }) => {
  try { const r = await ChatService.getUnreadCount(); return r.unread; }
  catch (e: any) { return rejectWithValue(e.message); }
});

// PRESENCE
export const fetchOnlineUsers = createAsyncThunk('chat/fetchOnlineUsers', async (_, { rejectWithValue }) => {
  try { return await ChatService.getOnlineUsers(); }
  catch (e: any) { return rejectWithValue(e.message); }
});

// ==================== SLICE ====================
const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    clearError: (state) => { state.error = null; },
    clearSuccessMessage: (state) => { state.successMessage = null; },
    setSelectedChannel: (state, action: PayloadAction<Channel | null>) => { state.selectedChannel = action.payload; },
    clearSearchResults: (state) => { state.searchResults = null; },
    addMessageToChannel: (state, action: PayloadAction<Message>) => {
      const cid = action.payload.channel_id;
      if (!state.messages[cid]) state.messages[cid] = [];
      if (!state.messages[cid].some(m => m.id === action.payload.id)) state.messages[cid].push(action.payload);
    },
    updateMessageInChannel: (state, action: PayloadAction<Message>) => {
      const cid = action.payload.channel_id;
      if (state.messages[cid]) {
        const idx = state.messages[cid].findIndex(m => m.id === action.payload.id);
        if (idx !== -1) state.messages[cid][idx] = action.payload;
      }
    },
    removeMessageFromChannel: (state, action: PayloadAction<{ channelId: number; messageId: number }>) => {
      const { channelId, messageId } = action.payload;
      if (state.messages[channelId]) state.messages[channelId] = state.messages[channelId].filter(m => m.id !== messageId);
    },
    addTypingUser: (state, action: PayloadAction<{ channelId: number; userId: number }>) => {
      const { channelId, userId } = action.payload;
      if (!state.typingUsers[channelId]) state.typingUsers[channelId] = [];
      if (!state.typingUsers[channelId].includes(userId)) state.typingUsers[channelId].push(userId);
    },
    removeTypingUser: (state, action: PayloadAction<{ channelId: number; userId: number }>) => {
      const { channelId, userId } = action.payload;
      if (state.typingUsers[channelId]) state.typingUsers[channelId] = state.typingUsers[channelId].filter(id => id !== userId);
    },
    setOnlineUsers: (state, action: PayloadAction<number[]>) => { state.onlineUsers = action.payload; },
    incrementUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount += 1;
      state.channelUnreadCounts[action.payload] = (state.channelUnreadCounts[action.payload] || 0) + 1;
    },
    resetUnreadCount: (state, action: PayloadAction<number>) => {
      const cid = action.payload;
      state.unreadCount = Math.max(0, state.unreadCount - (state.channelUnreadCounts[cid] || 0));
      state.channelUnreadCounts[cid] = 0;
    },
    resetChatState: () => initialState,
  },
  extraReducers: (builder) => {
    // Channels
    builder.addCase(fetchUserChannels.pending, (s) => { s.isLoadingChannels = true; s.error = null; });
    builder.addCase(fetchUserChannels.fulfilled, (s, a) => { s.isLoadingChannels = false; s.channels = a.payload || []; });
    builder.addCase(fetchUserChannels.rejected, (s, a) => { s.isLoadingChannels = false; s.error = a.payload as string; });
    builder.addCase(createChannel.fulfilled, (s, a) => { s.channels.unshift(a.payload); s.selectedChannel = a.payload; s.successMessage = 'Channel created'; });
    builder.addCase(updateChannel.fulfilled, (s, a) => { const idx = s.channels.findIndex(c => c.id === a.payload.id); if (idx !== -1) s.channels[idx] = a.payload; if (s.selectedChannel?.id === a.payload.id) s.selectedChannel = a.payload; s.successMessage = 'Channel updated'; });
    builder.addCase(archiveChannel.fulfilled, (s, a) => { s.channels = s.channels.filter(c => c.id !== a.payload); if (s.selectedChannel?.id === a.payload) s.selectedChannel = null; s.successMessage = 'Channel archived'; });
    builder.addCase(leaveChannel.fulfilled, (s, a) => { s.channels = s.channels.filter(c => c.id !== a.payload); if (s.selectedChannel?.id === a.payload) s.selectedChannel = null; s.successMessage = 'Left channel'; });
    builder.addCase(deleteChannel.fulfilled, (s, a) => { s.channels = s.channels.filter(c => c.id !== a.payload); if (s.selectedChannel?.id === a.payload) s.selectedChannel = null; s.successMessage = 'Channel deleted'; });
    builder.addCase(pinChannel.fulfilled, (s, a) => { const idx = s.channels.findIndex(c => c.id === a.payload.channelId); if (idx !== -1) s.channels[idx].is_pinned = a.payload.isPinned; });
    builder.addCase(muteChannel.fulfilled, (s, a) => { const idx = s.channels.findIndex(c => c.id === a.payload.channelId); if (idx !== -1) s.channels[idx].is_muted = a.payload.isMuted; });

    // Messages
    builder.addCase(fetchMessages.pending, (s) => { s.isLoadingMessages = true; });
    builder.addCase(fetchMessages.fulfilled, (s, a) => { s.isLoadingMessages = false; s.messages[a.payload.channelId] = a.payload.messages; });
    builder.addCase(fetchMessages.rejected, (s, a) => { s.isLoadingMessages = false; s.error = a.payload as string; });
    builder.addCase(sendMessage.pending, (s) => { s.isSendingMessage = true; });
    builder.addCase(sendMessage.fulfilled, (s, a) => { s.isSendingMessage = false; const cid = a.payload.channel_id; if (!s.messages[cid]) s.messages[cid] = []; s.messages[cid].push(a.payload); });
    builder.addCase(sendMessage.rejected, (s, a) => { s.isSendingMessage = false; s.error = a.payload as string; });
    builder.addCase(editMessage.fulfilled, (s, a) => { const msgs = s.messages[a.payload.channelId]; if (msgs) { const idx = msgs.findIndex(m => m.id === a.payload.messageId); if (idx !== -1) { msgs[idx].content = a.payload.content; msgs[idx].is_edited = true; } } s.successMessage = 'Message edited'; });
    builder.addCase(deleteMessage.fulfilled, (s, a) => { if (s.messages[a.payload.channelId]) s.messages[a.payload.channelId] = s.messages[a.payload.channelId].filter(m => m.id !== a.payload.messageId); s.successMessage = 'Message deleted'; });
    builder.addCase(pinMessage.fulfilled, (s, a) => { const msgs = s.messages[a.payload.channelId]; if (msgs) { const idx = msgs.findIndex(m => m.id === a.payload.messageId); if (idx !== -1) msgs[idx].is_pinned = a.payload.isPinned; } });
    builder.addCase(fetchPinnedMessages.fulfilled, (s, a) => { s.pinnedMessages[a.payload.channelId] = a.payload.messages; });

    // Threads
    builder.addCase(fetchThreadMessages.pending, (s) => { s.isLoadingThread = true; });
    builder.addCase(fetchThreadMessages.fulfilled, (s, a) => { s.isLoadingThread = false; s.threadMessages[a.payload.parentMessageId] = a.payload.messages; });
    builder.addCase(replyInThread.fulfilled, (s, a) => { if (!s.threadMessages[a.payload.parentMessageId]) s.threadMessages[a.payload.parentMessageId] = []; s.threadMessages[a.payload.parentMessageId].push(a.payload.message); });

    // Members
    builder.addCase(fetchChannelMembers.pending, (s) => { s.isLoadingMembers = true; });
    builder.addCase(fetchChannelMembers.fulfilled, (s, a) => { s.isLoadingMembers = false; s.channelMembers[a.payload.channelId] = a.payload.members; });
    builder.addCase(addMembers.fulfilled, (s, a) => { s.successMessage = `Added ${a.payload.addedMembers?.length || 0} members`; });
    builder.addCase(removeMember.fulfilled, (s, a) => { if (s.channelMembers[a.payload.channelId]) s.channelMembers[a.payload.channelId] = s.channelMembers[a.payload.channelId].filter(m => m.user_id !== a.payload.userId); s.successMessage = 'Member removed'; });
    builder.addCase(updateMemberRole.fulfilled, (s, a) => { const members = s.channelMembers[a.payload.channelId]; if (members) { const idx = members.findIndex(m => m.user_id === a.payload.userId); if (idx !== -1) members[idx].role = a.payload.role; } s.successMessage = 'Role updated'; });
    builder.addCase(fetchAvailableMembers.fulfilled, (s, a) => { s.availableMembers = a.payload; });

    // Team
    builder.addCase(fetchTeamMembers.fulfilled, (s, a) => { s.teamMembers = a.payload; });
    builder.addCase(startTeamChat.fulfilled, (s, a) => { if (!a.payload.isExisting) s.channels.unshift(a.payload); s.selectedChannel = a.payload; });

    // Search
    builder.addCase(searchChat.pending, (s) => { s.isSearching = true; });
    builder.addCase(searchChat.fulfilled, (s, a) => { s.isSearching = false; s.searchResults = a.payload; });
    builder.addCase(searchChat.rejected, (s) => { s.isSearching = false; });

    // Unread
    builder.addCase(markAsRead.fulfilled, (s, a) => { const idx = s.channels.findIndex(c => c.id === a.payload.channelId); if (idx !== -1) s.channels[idx].unread_count = 0; const cu = s.channelUnreadCounts[a.payload.channelId] || 0; s.unreadCount = Math.max(0, s.unreadCount - cu); s.channelUnreadCounts[a.payload.channelId] = 0; });
    builder.addCase(fetchUnreadCount.fulfilled, (s, a) => { s.unreadCount = a.payload; });

    // Presence
    builder.addCase(fetchOnlineUsers.fulfilled, (s, a) => { s.onlineUsers = a.payload; });
  },
});

export const { clearError, clearSuccessMessage, setSelectedChannel, clearSearchResults, addMessageToChannel, updateMessageInChannel, removeMessageFromChannel, addTypingUser, removeTypingUser, setOnlineUsers, incrementUnreadCount, resetUnreadCount, resetChatState } = chatSlice.actions;
export default chatSlice.reducer;