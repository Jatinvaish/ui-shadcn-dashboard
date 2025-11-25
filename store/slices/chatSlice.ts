// store/slices/chatSlice.ts - COMPLETE FIXED VERSION
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  ChatService,
  Channel,
  Message,
  Member,
  ChannelType,
  SendMessagePayload,
  CreateChannelPayload,
  UpdateChannelPayload,
  SearchResults,
  Activity,
  Notification,
  Reaction,
  Attachment,
  NotificationPreferencePayload
} from '../../lib/api/services/chat-service';

interface ChatState {
  channels: Channel[];
  selectedChannel: Channel | null;
  isLoadingChannels: boolean;
  messages: Record<number, Message[]>;
  isLoadingMessages: boolean;
  isSendingMessage: boolean;
  channelMembers: Record<number, Member[]>;
  isLoadingMembers: boolean;
  threadMessages: Record<number, Message[]>;
  isLoadingThread: boolean;
  pinnedMessages: Record<number, Message[]>;
  searchResults: SearchResults | null;
  isSearching: boolean;
  typingUsers: Record<number, number[]>;
  onlineUsers: number[];
  unreadCount: number;
  channelUnreadCounts: Record<number, number>;
  teamMembers: Member[];
  availableMembers: Member[];
  channelFiles: Record<number, any[]>;
  activities: Activity[];
  unreadActivities: Activity[];
  notifications: Notification[];
  unreadNotificationsCount: number;
  unreadMentionsCount: number;
  mentions: any[];
  notificationPreferences: any[];
  error: string | null;
  successMessage: string | null;
}

const initialState: ChatState = {
  channels: [],
  selectedChannel: null,
  isLoadingChannels: false,
  messages: {},
  isLoadingMessages: false,
  isSendingMessage: false,
  channelMembers: {},
  isLoadingMembers: false,
  threadMessages: {},
  isLoadingThread: false,
  pinnedMessages: {},
  searchResults: null,
  isSearching: false,
  typingUsers: {},
  onlineUsers: [],
  unreadCount: 0,
  channelUnreadCounts: {},
  teamMembers: [],
  availableMembers: [],
  channelFiles: {},
  activities: [],
  unreadActivities: [],
  notifications: [],
  unreadNotificationsCount: 0,
  unreadMentionsCount: 0,
  mentions: [],
  notificationPreferences: [],
  error: null,
  successMessage: null,
};

// Helper to normalize channel data
const normalizeChannel = (ch: any): Channel => ({
  id: parseInt(ch.id || ch.channel_id || 0),
  channel_id: ch.channel_id || ch.id?.toString(),
  name: ch.name || 'Unnamed',
  description: ch.description,
  channel_type: ch.channel_type || ChannelType.GROUP,
  is_private: ch.is_private || false,
  is_archived: ch.is_archived || false,
  member_count: ch.member_count || 0,
  message_count: ch.message_count || 0,
  unread_count: ch.unread_count || 0,
  last_message_at: ch.last_message_at,
  last_activity_at: ch.last_activity_at,
  is_muted: ch.is_muted || false,
  is_pinned: ch.is_pinned || false,
  role: ch.role,
  last_read_message_id: ch.last_read_message_id,
  created_at: ch.created_at,
  updated_at: ch.updated_at,
  isExisting: ch.isExisting,
});

// ==================== ASYNC THUNKS ====================

// ========== CHANNELS ==========
export const fetchUserChannels = createAsyncThunk<Channel[], number>(
  'chat/fetchUserChannels',
  async (limit = 50, { rejectWithValue }) => {
    try {
      const channels = await ChatService.getUserChannels(limit);
      return (Array.isArray(channels) ? channels : []).map(normalizeChannel);
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to fetch channels');
    }
  }
);

export const getChannelById = createAsyncThunk<Channel, number>(
  'chat/getChannelById',
  async (channelId, { rejectWithValue }) => {
    try {
      return normalizeChannel(await ChatService.getChannelById(channelId));
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to fetch channel');
    }
  }
);

export const createChannel = createAsyncThunk<Channel, CreateChannelPayload>(
  'chat/createChannel',
  async (payload, { rejectWithValue }) => {
    try {
      return normalizeChannel(await ChatService.createChannel(payload));
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to create channel');
    }
  }
);

export const updateChannel = createAsyncThunk<
  Channel,
  { channelId: number; payload: UpdateChannelPayload }
>(
  'chat/updateChannel',
  async ({ channelId, payload }, { rejectWithValue }) => {
    try {
      return normalizeChannel(await ChatService.updateChannel(channelId, payload));
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to update channel');
    }
  }
);

export const archiveChannel = createAsyncThunk<number, number>(
  'chat/archiveChannel',
  async (channelId, { rejectWithValue }) => {
    try {
      await ChatService.archiveChannel(channelId);
      return channelId;
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to archive channel');
    }
  }
);

export const unarchiveChannel = createAsyncThunk<number, number>(
  'chat/unarchiveChannel',
  async (channelId, { rejectWithValue }) => {
    try {
      await ChatService.unarchiveChannel(channelId);
      return channelId;
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to unarchive channel');
    }
  }
);

export const leaveChannel = createAsyncThunk<number, number>(
  'chat/leaveChannel',
  async (channelId, { rejectWithValue }) => {
    try {
      await ChatService.leaveChannel(channelId);
      return channelId;
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to leave channel');
    }
  }
);

export const deleteChannel = createAsyncThunk<number, number>(
  'chat/deleteChannel',
  async (channelId, { rejectWithValue }) => {
    try {
      await ChatService.deleteChannel(channelId);
      return channelId;
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to delete channel');
    }
  }
);

export const pinChannel = createAsyncThunk<
  { channelId: number; isPinned: boolean },
  { channelId: number; isPinned: boolean }
>(
  'chat/pinChannel',
  async ({ channelId, isPinned }, { rejectWithValue }) => {
    try {
      await ChatService.pinChannel(channelId, isPinned);
      return { channelId, isPinned };
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to pin channel');
    }
  }
);

export const muteChannel = createAsyncThunk<
  { channelId: number; isMuted: boolean },
  { channelId: number; isMuted: boolean; muteUntil?: string }
>(
  'chat/muteChannel',
  async ({ channelId, isMuted, muteUntil }, { rejectWithValue }) => {
    try {
      await ChatService.muteChannel(channelId, isMuted, muteUntil);
      return { channelId, isMuted };
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to mute channel');
    }
  }
);

export const fetchChannelFiles = createAsyncThunk<
  { channelId: number; files: any[] },
  { channelId: number; limit?: number }
>(
  'chat/fetchChannelFiles',
  async ({ channelId, limit = 50 }, { rejectWithValue }) => {
    try {
      const files = await ChatService.getChannelFiles(channelId, limit);
      return { channelId, files };
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to fetch files');
    }
  }
);

// ========== MESSAGES ==========
export const fetchMessages = createAsyncThunk<
  { channelId: number; messages: Message[] },
  { channelId: number; limit?: number; beforeId?: number }
>(
  'chat/fetchMessages',
  async ({ channelId, limit = 50, beforeId }, { rejectWithValue }) => {
    try {
      const messages = await ChatService.getMessages(channelId, limit, beforeId);
      return { channelId, messages: Array.isArray(messages) ? messages : [] };
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to fetch messages');
    }
  }
);

export const sendMessage = createAsyncThunk<Message, SendMessagePayload>(
  'chat/sendMessage',
  async (payload, { rejectWithValue }) => {
    try {
      return await ChatService.sendMessage(payload);
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to send message');
    }
  }
);

export const editMessage = createAsyncThunk<
  { messageId: number; content: string; channelId: number },
  { messageId: number; content: string; channelId: number }
>(
  'chat/editMessage',
  async ({ messageId, content, channelId }, { rejectWithValue }) => {
    try {
      await ChatService.editMessage(messageId, content);
      return { messageId, content, channelId };
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to edit message');
    }
  }
);

export const deleteMessage = createAsyncThunk<
  { messageId: number; channelId: number },
  { messageId: number; channelId: number }
>(
  'chat/deleteMessage',
  async ({ messageId, channelId }, { rejectWithValue }) => {
    try {
      await ChatService.deleteMessage(messageId);
      return { messageId, channelId };
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to delete message');
    }
  }
);

export const pinMessage = createAsyncThunk<
  { messageId: number; isPinned: boolean; channelId: number },
  { messageId: number; isPinned: boolean; channelId: number }
>(
  'chat/pinMessage',
  async ({ messageId, isPinned, channelId }, { rejectWithValue }) => {
    try {
      await ChatService.pinMessage(messageId, isPinned);
      return { messageId, isPinned, channelId };
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to pin message');
    }
  }
);

export const fetchPinnedMessages = createAsyncThunk<
  { channelId: number; messages: Message[] },
  number
>(
  'chat/fetchPinnedMessages',
  async (channelId, { rejectWithValue }) => {
    try {
      const messages = await ChatService.getPinnedMessages(channelId);
      return { channelId, messages };
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to fetch pinned messages');
    }
  }
);

export const forwardMessage = createAsyncThunk<
  any,
  { messageId: number; targetChannelIds: number[] }
>(
  'chat/forwardMessage',
  async ({ messageId, targetChannelIds }, { rejectWithValue }) => {
    try {
      return await ChatService.forwardMessage(messageId, targetChannelIds);
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to forward message');
    }
  }
);

export const markAsRead = createAsyncThunk<
  { channelId: number },
  { channelId: number; messageId: number }
>(
  'chat/markAsRead',
  async ({ channelId, messageId }, { rejectWithValue }) => {
    try {
      await ChatService.markAsRead(channelId, messageId);
      return { channelId };
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to mark as read');
    }
  }
);

// ========== MESSAGE DETAILS ==========
export const fetchMessageDetails = createAsyncThunk<Message, number>(
  'chat/fetchMessageDetails',
  async (messageId, { rejectWithValue }) => {
    try {
      return await ChatService.getMessageDetails(messageId);
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to fetch message details');
    }
  }
);

export const fetchMessageAttachments = createAsyncThunk<
  { messageId: number; attachments: Attachment[] },
  number
>(
  'chat/fetchMessageAttachments',
  async (messageId, { rejectWithValue }) => {
    try {
      const attachments = await ChatService.getMessageAttachments(messageId);
      return { messageId, attachments };
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to fetch attachments');
    }
  }
);

export const fetchMessageReactions = createAsyncThunk<
  { messageId: number; reactions: Reaction[] },
  number
>(
  'chat/fetchMessageReactions',
  async (messageId, { rejectWithValue }) => {
    try {
      const reactions = await ChatService.getMessageReactions(messageId);
      return { messageId, reactions };
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to fetch reactions');
    }
  }
);

// ========== REACTIONS ==========
export const addReaction = createAsyncThunk<
  { messageId: number; emoji: string },
  { messageId: number; emoji: string }
>(
  'chat/addReaction',
  async ({ messageId, emoji }, { rejectWithValue }) => {
    try {
      await ChatService.addReaction(messageId, emoji);
      return { messageId, emoji };
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to add reaction');
    }
  }
);

export const removeReaction = createAsyncThunk<
  { messageId: number; emoji: string },
  { messageId: number; emoji: string }
>(
  'chat/removeReaction',
  async ({ messageId, emoji }, { rejectWithValue }) => {
    try {
      await ChatService.removeReaction(messageId, emoji);
      return { messageId, emoji };
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to remove reaction');
    }
  }
);

// ========== THREADS ==========
export const fetchThreadMessages = createAsyncThunk<
  { parentMessageId: number; messages: Message[] },
  { parentMessageId: number; limit?: number }
>(
  'chat/fetchThreadMessages',
  async ({ parentMessageId, limit = 50 }, { rejectWithValue }) => {
    try {
      const messages = await ChatService.getThreadMessages(parentMessageId, limit);
      return { parentMessageId, messages };
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to fetch thread');
    }
  }
);

export const replyInThread = createAsyncThunk<
  { parentMessageId: number; message: Message },
  { parentMessageId: number; content: string }
>(
  'chat/replyInThread',
  async ({ parentMessageId, content }, { rejectWithValue }) => {
    try {
      const message = await ChatService.replyInThread(parentMessageId, content);
      return { parentMessageId, message };
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to reply');
    }
  }
);

// ========== MEMBERS ==========
export const fetchChannelMembers = createAsyncThunk<
  { channelId: number; members: Member[] },
  number
>(
  'chat/fetchChannelMembers',
  async (channelId, { rejectWithValue }) => {
    try {
      const members = await ChatService.getChannelMembers(channelId);
      return { channelId, members };
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to fetch members');
    }
  }
);

export const addMembers = createAsyncThunk<
  { channelId: number; addedMembers: number[] },
  { channelId: number; userIds: number[] }
>(
  'chat/addMembers',
  async ({ channelId, userIds }, { rejectWithValue }) => {
    try {
      const result = await ChatService.addMembers(channelId, userIds);
      return { channelId, addedMembers: (result as any)?.addedMembers || userIds };
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to add members');
    }
  }
);

export const removeMember = createAsyncThunk<
  { channelId: number; userId: number },
  { channelId: number; userId: number }
>(
  'chat/removeMember',
  async ({ channelId, userId }, { rejectWithValue }) => {
    try {
      await ChatService.removeMember(channelId, userId);
      return { channelId, userId };
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to remove member');
    }
  }
);

export const updateMemberRole = createAsyncThunk<
  { channelId: number; userId: number; role: string },
  { channelId: number; userId: number; role: string }
>(
  'chat/updateMemberRole',
  async ({ channelId, userId, role }, { rejectWithValue }) => {
    try {
      await ChatService.updateMemberRole(channelId, userId, role);
      return { channelId, userId, role };
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to update role');
    }
  }
);

export const fetchAvailableMembers = createAsyncThunk<Member[], number>(
  'chat/fetchAvailableMembers',
  async (channelId, { rejectWithValue }) => {
    try {
      return await ChatService.getAvailableMembersForChannel(channelId);
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to fetch available members');
    }
  }
);

// ========== TEAM ==========
export const fetchTeamMembers = createAsyncThunk<Member[], string | undefined>(
  'chat/fetchTeamMembers',
  async (search, { rejectWithValue }) => {
    try {
      return await ChatService.getTeamMembers(search);
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to fetch team members');
    }
  }
);

export const startTeamChat = createAsyncThunk<
  Channel,
  { memberIds: number[]; name?: string }
>(
  'chat/startTeamChat',
  async ({ memberIds, name }, { rejectWithValue }) => {
    try {
      return normalizeChannel(await ChatService.startTeamChat(memberIds, name));
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to start chat');
    }
  }
);

// ========== SEARCH ==========
export const searchChat = createAsyncThunk<
  SearchResults,
  { query: string; opts?: any }
>(
  'chat/search',
  async ({ query, opts }, { rejectWithValue }) => {
    try {
      return await ChatService.search(query, opts);
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Search failed');
    }
  }
);

// ========== MENTIONS ==========
export const fetchUserMentions = createAsyncThunk<any[], number>(
  'chat/fetchUserMentions',
  async (limit = 50, { rejectWithValue }) => {
    try {
      return await ChatService.getUserMentions(limit);
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to fetch mentions');
    }
  }
);

export const fetchUnreadMentionsCount = createAsyncThunk<number, void>(
  'chat/fetchUnreadMentionsCount',
  async (_, { rejectWithValue }) => {
    try {
      const result = await ChatService.getUnreadMentionsCount();
      return result.count;
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to fetch mentions count');
    }
  }
);

// ========== ACTIVITIES ==========
export const fetchChannelActivities = createAsyncThunk<
  Activity[],
  { channelId: number; limit?: number }
>(
  'chat/fetchChannelActivities',
  async ({ channelId, limit = 50 }, { rejectWithValue }) => {
    try {
      return await ChatService.getChannelActivities(channelId, limit);
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to fetch activities');
    }
  }
);

export const fetchUnreadActivities = createAsyncThunk<Activity[], number>(
  'chat/fetchUnreadActivities',
  async (limit = 50, { rejectWithValue }) => {
    try {
      return await ChatService.getUnreadActivities(limit);
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to fetch unread activities');
    }
  }
);

export const markActivitiesAsRead = createAsyncThunk<number[], number[]>(
  'chat/markActivitiesAsRead',
  async (activityIds, { rejectWithValue }) => {
    try {
      await ChatService.markActivitiesAsRead(activityIds);
      return activityIds;
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to mark activities as read');
    }
  }
);

// ========== NOTIFICATIONS ==========
export const fetchUnreadNotificationsCount = createAsyncThunk<number, void>(
  'chat/fetchUnreadNotificationsCount',
  async (_, { rejectWithValue }) => {
    try {
      const result = await ChatService.getUnreadNotificationsCount();
      return result.count;
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to fetch notifications count');
    }
  }
);

export const fetchUserNotifications = createAsyncThunk<
  Notification[],
  { limit?: number; page?: number }
>(
  'chat/fetchUserNotifications',
  async ({ limit = 50, page = 1 }, { rejectWithValue }) => {
    try {
      return await ChatService.getUserNotifications(limit, page);
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to fetch notifications');
    }
  }
);

export const markNotificationsAsRead = createAsyncThunk<number[], number[]>(
  'chat/markNotificationsAsRead',
  async (notificationIds, { rejectWithValue }) => {
    try {
      await ChatService.markNotificationsAsRead(notificationIds);
      return notificationIds;
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to mark notifications as read');
    }
  }
);

export const fetchNotificationPreferences = createAsyncThunk<any[], void>(
  'chat/fetchNotificationPreferences',
  async (_, { rejectWithValue }) => {
    try {
      return await ChatService.getNotificationPreferences();
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to fetch preferences');
    }
  }
);

export const updateNotificationPreferences = createAsyncThunk<
  any,
  NotificationPreferencePayload
>(
  'chat/updateNotificationPreferences',
  async (payload, { rejectWithValue }) => {
    try {
      return await ChatService.updateNotificationPreferences(payload);
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to update preferences');
    }
  }
);

// ========== PRESENCE ==========
export const setUserOnline = createAsyncThunk<void, void>(
  'chat/setUserOnline',
  async (_, { rejectWithValue }) => {
    try {
      await ChatService.setOnline();
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to set online status');
    }
  }
);

export const setUserOffline = createAsyncThunk<void, void>(
  'chat/setUserOffline',
  async (_, { rejectWithValue }) => {
    try {
      await ChatService.setOffline();
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to set offline status');
    }
  }
);

export const fetchOnlineUsers = createAsyncThunk<number[], void>(
  'chat/fetchOnlineUsers',
  async (_, { rejectWithValue }) => {
    try {
      return await ChatService.getOnlineUsers();
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to fetch online users');
    }
  }
);

// ========== DELIVERY STATUS ==========
export const updateDeliveryStatus = createAsyncThunk<
  { messageId: number; status: 'delivered' | 'read' },
  { messageId: number; status: 'delivered' | 'read' }
>(
  'chat/updateDeliveryStatus',
  async ({ messageId, status }, { rejectWithValue }) => {
    try {
      await ChatService.updateDeliveryStatus(messageId, status);
      return { messageId, status };
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to update delivery status');
    }
  }
);

export const fetchMessageReadStatus = createAsyncThunk<
  { messageId: number; readStatus: { total: number; delivered: number; read: number } },
  number
>(
  'chat/fetchMessageReadStatus',
  async (messageId, { rejectWithValue }) => {
    try {
      const readStatus = await ChatService.getMessageReadStatus(messageId);
      return { messageId, readStatus };
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to fetch read status');
    }
  }
);

// ========== UNREAD COUNT ==========
export const fetchUnreadCount = createAsyncThunk<number, void>(
  'chat/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const result = await ChatService.getUnreadCount();
      return (result as any)?.unread || 0;
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to fetch unread count');
    }
  }
);

// ==================== SLICE ====================
const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    setSelectedChannel: (state, action: PayloadAction<Channel | null>) => {
      state.selectedChannel = action.payload;
    },
    clearSearchResults: (state) => {
      state.searchResults = null;
    },
    addMessageToChannel: (state, action: PayloadAction<Message>) => {
      const channelId = action.payload.channel_id;
      if (!state.messages[channelId]) {
        state.messages[channelId] = [];
      }
      if (!state.messages[channelId].some((m) => m.id === action.payload.id)) {
        state.messages[channelId].push(action.payload);
      }
    },
    updateMessageStatus: (
      state,
      action: PayloadAction<{
        messageId: number;
        status: 'delivered' | 'read';
        timestamp: string;
      }>
    ) => {
      const { messageId, status, timestamp } = action.payload;

      Object.keys(state.messages).forEach((channelId) => {
        const messages = state.messages[+channelId];
        const messageIndex = messages?.findIndex((m) => m.id === messageId);

        if (messageIndex !== -1) {
          const message = messages[messageIndex];
          if (status === 'delivered') {
            message.is_delivered = true;
            message.delivered_at = timestamp;
          } else if (status === 'read') {
            message.is_delivered = true;
            message.is_read = true;
            message.read_at = timestamp;
          }
        }
      });
    },
    updateMessageInChannel: (state, action: PayloadAction<Message>) => {
      const channelId = action.payload.channel_id;
      if (state.messages[channelId]) {
        const messageIndex = state.messages[channelId].findIndex(
          (m) => m.id === action.payload.id
        );
        if (messageIndex !== -1) {
          state.messages[channelId][messageIndex] = action.payload;
        }
      }
    },
    removeMessageFromChannel: (
      state,
      action: PayloadAction<{ channelId: number; messageId: number }>
    ) => {
      const { channelId, messageId } = action.payload;
      if (state.messages[channelId]) {
        state.messages[channelId] = state.messages[channelId].filter(
          (m) => m.id !== messageId
        );
      }
    },
    addTypingUser: (
      state,
      action: PayloadAction<{ channelId: number; userId: number }>
    ) => {
      const { channelId, userId } = action.payload;
      if (!state.typingUsers[channelId]) state.typingUsers[channelId] = [];
      if (!state.typingUsers[channelId].includes(userId)) {
        state.typingUsers[channelId].push(userId);
      }
    },
    removeTypingUser: (
      state,
      action: PayloadAction<{ channelId: number; userId: number }>
    ) => {
      const { channelId, userId } = action.payload;
      if (state.typingUsers[channelId]) {
        state.typingUsers[channelId] = state.typingUsers[channelId].filter(
          (id) => id !== userId
        );
      }
    },
    setOnlineUsers: (state, action: PayloadAction<number[]>) => {
      state.onlineUsers = action.payload;
    },
    incrementUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount += 1;
      state.channelUnreadCounts[action.payload] =
        (state.channelUnreadCounts[action.payload] || 0) + 1;
    },
    resetUnreadCount: (state, action: PayloadAction<number>) => {
      const cid = action.payload;
      state.unreadCount = Math.max(
        0,
        state.unreadCount - (state.channelUnreadCounts[cid] || 0)
      );
      state.channelUnreadCounts[cid] = 0;
    },
    resetChatState: () => initialState,
  },
  extraReducers: (builder) => {
    // ==================== CHANNELS ====================
    builder
      .addCase(fetchUserChannels.pending, (s) => {
        s.isLoadingChannels = true;
        s.error = null;
      })
      .addCase(fetchUserChannels.fulfilled, (s, a) => {
        s.isLoadingChannels = false;
        s.channels = a.payload;
      })
      .addCase(fetchUserChannels.rejected, (s, a) => {
        s.isLoadingChannels = false;
        s.error = a.payload as string;
      })

      .addCase(createChannel.fulfilled, (s, a) => {
        s.channels.unshift(a.payload);
        s.selectedChannel = a.payload;
        s.successMessage = 'Channel created successfully';
      })
      .addCase(createChannel.rejected, (s, a) => {
        s.error = a.payload as string;
      })

      .addCase(updateChannel.fulfilled, (s, a) => {
        const idx = s.channels.findIndex((c) => c.id === a.payload.id);
        if (idx !== -1) s.channels[idx] = a.payload;
        if (s.selectedChannel?.id === a.payload.id) s.selectedChannel = a.payload;
        s.successMessage = 'Channel updated';
      })

      .addCase(archiveChannel.fulfilled, (s, a) => {
        s.channels = s.channels.filter((c) => c.id !== a.payload);
        if (s.selectedChannel?.id === a.payload) s.selectedChannel = null;
        s.successMessage = 'Channel archived';
      })

      .addCase(leaveChannel.fulfilled, (s, a) => {
        s.channels = s.channels.filter((c) => c.id !== a.payload);
        if (s.selectedChannel?.id === a.payload) s.selectedChannel = null;
        s.successMessage = 'Left channel';
      })

      .addCase(deleteChannel.fulfilled, (s, a) => {
        s.channels = s.channels.filter((c) => c.id !== a.payload);
        if (s.selectedChannel?.id === a.payload) s.selectedChannel = null;
        s.successMessage = 'Channel deleted';
      })

      .addCase(pinChannel.fulfilled, (s, a) => {
        const idx = s.channels.findIndex((c) => c.id === a.payload.channelId);
        if (idx !== -1) s.channels[idx].is_pinned = a.payload.isPinned;
        if (s.selectedChannel?.id === a.payload.channelId) {
          s.selectedChannel.is_pinned = a.payload.isPinned;
        }
        s.successMessage = a.payload.isPinned ? 'Channel pinned' : 'Channel unpinned';
      })

      .addCase(muteChannel.fulfilled, (s, a) => {
        const idx = s.channels.findIndex((c) => c.id === a.payload.channelId);
        if (idx !== -1) s.channels[idx].is_muted = a.payload.isMuted;
        if (s.selectedChannel?.id === a.payload.channelId) {
          s.selectedChannel.is_muted = a.payload.isMuted;
        }
      })

      .addCase(unarchiveChannel.fulfilled, (s, a) => {
        s.successMessage = 'Channel unarchived';
      })

      .addCase(getChannelById.fulfilled, (s, a) => {
        const idx = s.channels.findIndex((c) => c.id === a.payload.id);
        if (idx !== -1) {
          s.channels[idx] = a.payload;
        }
      })

      .addCase(fetchChannelFiles.fulfilled, (s, a) => {
        s.channelFiles[a.payload.channelId] = a.payload.files;
      });

    // ==================== MESSAGES ====================
    builder
      .addCase(fetchMessages.pending, (s) => {
        s.isLoadingMessages = true;
      })
      .addCase(fetchMessages.fulfilled, (s, a) => {
        s.isLoadingMessages = false;
        s.messages[a.payload.channelId] = a.payload.messages;
      })
      .addCase(fetchMessages.rejected, (s, a) => {
        s.isLoadingMessages = false;
        s.error = a.payload as string;
      })

      .addCase(sendMessage.pending, (s) => {
        s.isSendingMessage = true;
      })
      .addCase(sendMessage.fulfilled, (s, a) => {
        s.isSendingMessage = false;
        const cid = a.payload.channel_id;
        if (!s.messages[cid]) s.messages[cid] = [];
        s.messages[cid].push(a.payload);
      })
      .addCase(sendMessage.rejected, (s, a) => {
        s.isSendingMessage = false;
        s.error = a.payload as string;
      })

      .addCase(editMessage.fulfilled, (s, a) => {
        const msgs = s.messages[a.payload.channelId];
        if (msgs) {
          const idx = msgs.findIndex((m) => m.id === a.payload.messageId);
          if (idx !== -1) {
            msgs[idx].content = a.payload.content;
            msgs[idx].is_edited = true;
            msgs[idx].edited_at = new Date().toISOString();
          }
        }
      })

      .addCase(deleteMessage.fulfilled, (s, a) => {
        if (s.messages[a.payload.channelId]) {
          s.messages[a.payload.channelId] = s.messages[a.payload.channelId].filter(
            (m) => m.id !== a.payload.messageId
          );
        }
      })

      .addCase(pinMessage.fulfilled, (s, a) => {
        const msgs = s.messages[a.payload.channelId];
        if (msgs) {
          const idx = msgs.findIndex((m) => m.id === a.payload.messageId);
          if (idx !== -1) {
            msgs[idx].is_pinned = a.payload.isPinned;
            msgs[idx].pinned_at = a.payload.isPinned ? new Date().toISOString() : undefined;
          }
        }
      })

      .addCase(fetchPinnedMessages.fulfilled, (s, a) => {
        s.pinnedMessages[a.payload.channelId] = a.payload.messages;
      })

      .addCase(forwardMessage.fulfilled, (s) => {
        s.successMessage = 'Message forwarded successfully';
      })

      .addCase(fetchMessageDetails.fulfilled, (s, a) => {
        const cid = a.payload.channel_id;
        if (s.messages[cid]) {
          const idx = s.messages[cid].findIndex((m) => m.id === a.payload.id);
          if (idx !== -1) {
            s.messages[cid][idx] = a.payload;
          }
        }
      })

      .addCase(fetchMessageAttachments.fulfilled, (s, a) => {
        const { messageId, attachments } = a.payload;
        Object.keys(s.messages).forEach((channelId) => {
          const idx = s.messages[+channelId].findIndex((m) => m.id === messageId);
          if (idx !== -1) {
            s.messages[+channelId][idx].attachments = attachments;
          }
        });
      })

      .addCase(fetchMessageReactions.fulfilled, (s, a) => {
        const { messageId, reactions } = a.payload;
        Object.keys(s.messages).forEach((channelId) => {
          const idx = s.messages[+channelId].findIndex((m) => m.id === messageId);
          if (idx !== -1) {
            s.messages[+channelId][idx].reactions = reactions;
          }
        });
      });

    // ==================== REACTIONS ====================
    builder
      .addCase(addReaction.fulfilled, (s, a) => {
        // Will be updated by real-time event
      })
      .addCase(removeReaction.fulfilled, (s, a) => {
        // Will be updated by real-time event
      });

    // ==================== THREADS ====================
    builder
      .addCase(fetchThreadMessages.pending, (s) => {
        s.isLoadingThread = true;
      })
      .addCase(fetchThreadMessages.fulfilled, (s, a) => {
        s.isLoadingThread = false;
        s.threadMessages[a.payload.parentMessageId] = a.payload.messages;
      })
      .addCase(fetchThreadMessages.rejected, (s, a) => {
        s.isLoadingThread = false;
        s.error = a.payload as string;
      })

      .addCase(replyInThread.fulfilled, (s, a) => {
        if (!s.threadMessages[a.payload.parentMessageId]) {
          s.threadMessages[a.payload.parentMessageId] = [];
        }
        s.threadMessages[a.payload.parentMessageId].push(a.payload.message);
        s.successMessage = 'Reply sent';
      });

    // ==================== MEMBERS ====================
    builder
      .addCase(fetchChannelMembers.pending, (s) => {
        s.isLoadingMembers = true;
      })
      .addCase(fetchChannelMembers.fulfilled, (s, a) => {
        s.isLoadingMembers = false;
        s.channelMembers[a.payload.channelId] = a.payload.members;
      })
      .addCase(fetchChannelMembers.rejected, (s, a) => {
        s.isLoadingMembers = false;
        s.error = a.payload as string;
      })

      .addCase(addMembers.fulfilled, (s, a) => {
        s.successMessage = `Added ${a.payload.addedMembers?.length || 0} member(s)`;
      })
      .addCase(addMembers.rejected, (s, a) => {
        s.error = a.payload as string;
      })

      .addCase(removeMember.fulfilled, (s, a) => {
        if (s.channelMembers[a.payload.channelId]) {
          s.channelMembers[a.payload.channelId] = s.channelMembers[
            a.payload.channelId
          ].filter((m) => m.user_id !== a.payload.userId);
        }
        s.successMessage = 'Member removed';
      })

      .addCase(updateMemberRole.fulfilled, (s, a) => {
        const members = s.channelMembers[a.payload.channelId];
        if (members) {
          const idx = members.findIndex((m) => m.user_id === a.payload.userId);
          if (idx !== -1) members[idx].role = a.payload.role;
        }
        s.successMessage = 'Role updated';
      })

      .addCase(fetchAvailableMembers.fulfilled, (s, a) => {
        s.availableMembers = a.payload;
      });

    // ==================== TEAM ====================
    builder
      .addCase(fetchTeamMembers.fulfilled, (s, a) => {
        s.teamMembers = a.payload;
      })
      .addCase(startTeamChat.fulfilled, (s, a) => {
        if (!a.payload.isExisting) {
          s.channels.unshift(a.payload);
        }
        s.selectedChannel = a.payload;
        s.successMessage = 'Chat started';
      })
      .addCase(startTeamChat.rejected, (s, a) => {
        s.error = a.payload as string;
      });

    // ==================== SEARCH ====================
    builder
      .addCase(searchChat.pending, (s) => {
        s.isSearching = true;
      })
      .addCase(searchChat.fulfilled, (s, a) => {
        s.isSearching = false;
        s.searchResults = a.payload;
      })
      .addCase(searchChat.rejected, (s, a) => {
        s.isSearching = false;
        s.error = a.payload as string;
      });

    // ==================== MENTIONS ====================
    builder
      .addCase(fetchUserMentions.fulfilled, (s, a) => {
        s.mentions = a.payload;
      })
      .addCase(fetchUnreadMentionsCount.fulfilled, (s, a) => {
        s.unreadMentionsCount = a.payload;
      });

    // ==================== ACTIVITIES ====================
    builder
      .addCase(fetchChannelActivities.fulfilled, (s, a) => {
        s.activities = a.payload;
      })
      .addCase(fetchUnreadActivities.fulfilled, (s, a) => {
        s.unreadActivities = a.payload;
      })
      .addCase(markActivitiesAsRead.fulfilled, (s) => {
        s.successMessage = 'Activities marked as read';
      });

    // ==================== NOTIFICATIONS ====================
    builder
      .addCase(fetchUserNotifications.fulfilled, (s, a) => {
        s.notifications = a.payload;
      })
      .addCase(fetchUnreadNotificationsCount.fulfilled, (s, a) => {
        s.unreadNotificationsCount = a.payload;
      })
      .addCase(markNotificationsAsRead.fulfilled, (s) => {
        s.successMessage = 'Notifications marked as read';
      })
      .addCase(fetchNotificationPreferences.fulfilled, (s, a) => {
        s.notificationPreferences = a.payload;
      })
      .addCase(updateNotificationPreferences.fulfilled, (s) => {
        s.successMessage = 'Notification preferences updated';
      });

    // ==================== UNREAD ====================
    builder
      .addCase(markAsRead.fulfilled, (s, a) => {
        const idx = s.channels.findIndex((c) => c.id === a.payload.channelId);
        if (idx !== -1) s.channels[idx].unread_count = 0;
        const cu = s.channelUnreadCounts[a.payload.channelId] || 0;
        s.unreadCount = Math.max(0, s.unreadCount - cu);
        s.channelUnreadCounts[a.payload.channelId] = 0;
      })
      .addCase(fetchUnreadCount.fulfilled, (s, a) => {
        s.unreadCount = a.payload;
      });

    // ==================== PRESENCE ====================
    builder
      .addCase(setUserOnline.fulfilled, (s) => {
        // Status updated
      })
      .addCase(setUserOffline.fulfilled, (s) => {
        // Status updated
      })
      .addCase(fetchOnlineUsers.fulfilled, (s, a) => {
        s.onlineUsers = a.payload;
      });

    // ==================== DELIVERY STATUS ====================
    builder
      .addCase(updateDeliveryStatus.fulfilled, (s, a) => {
        // Status will be updated via WebSocket
      })
      .addCase(fetchMessageReadStatus.fulfilled, (s, a) => {
        // Store read status if needed
      });
  },
});

// ==================== EXPORTS ====================
export const {
  clearError,
  clearSuccessMessage,
  setSelectedChannel,
  clearSearchResults,
  addMessageToChannel,
  updateMessageStatus,
  updateMessageInChannel,
  removeMessageFromChannel,
  addTypingUser,
  removeTypingUser,
  setOnlineUsers,
  incrementUnreadCount,
  resetUnreadCount,
  resetChatState,
} = chatSlice.actions;

export default chatSlice.reducer;