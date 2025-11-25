// store/slices/chatSlice.ts - COMPLETE UPDATED VERSION
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
  NotificationPreferencePayload,
  MessageReadStatus
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
  typingUsers: Record<number, Array<{ userId: number; userName?: string }>>;
  onlineUsers: number[];
  unreadCount: number;
  channelUnreadCounts: Record<number, number>;
  teamMembers: Member[];
  availableMembers: Member[];
  channelFiles: Record<number, Attachment[]>;
  activities: Activity[];
  unreadActivities: Activity[];
  notifications: Notification[];
  unreadNotificationsCount: number;
  unreadMentionsCount: number;
  mentions: any[];
  notificationPreferences: any[];
  messageReadStatuses: Record<number, MessageReadStatus>;
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
  messageReadStatuses: {},
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
  user_role: ch.user_role,
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
  { channelId: number; files: Attachment[] },
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
  { messageId: number; content: string; channelId: number; mentions?: number[] },
  { messageId: number; content: string; channelId: number; mentions?: number[] }
>(
  'chat/editMessage',
  async ({ messageId, content, channelId, mentions }, { rejectWithValue }) => {
    try {
      await ChatService.editMessage(messageId, content, mentions);
      return { messageId, content, channelId, mentions };
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

export const bulkMarkAsRead = createAsyncThunk<
  { channelId: number },
  { channelId: number; upToMessageId: number }
>(
  'chat/bulkMarkAsRead',
  async ({ channelId, upToMessageId }, { rejectWithValue }) => {
    try {
      await ChatService.bulkMarkAsRead(channelId, upToMessageId);
      return { channelId };
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to bulk mark as read');
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

export const fetchEnhancedThread = createAsyncThunk<
  any,
  { messageId: number; limit?: number }
>(
  'chat/fetchEnhancedThread',
  async ({ messageId, limit = 50 }, { rejectWithValue }) => {
    try {
      return await ChatService.getEnhancedThread(messageId, limit);
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to fetch enhanced thread');
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

// ========== DELIVERY & READ STATUS ==========
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

export const markAsDelivered = createAsyncThunk<
  { messageId: number },
  { messageId: number }
>(
  'chat/markAsDelivered',
  async ({ messageId }, { rejectWithValue }) => {
    try {
      await ChatService.markAsDelivered(messageId);
      return { messageId };
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to mark as delivered');
    }
  }
);

export const fetchMessageReadStatus = createAsyncThunk<
  { messageId: number; readStatus: MessageReadStatus },
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

export const fetchDetailedReadStatus = createAsyncThunk<
  { messageId: number; readStatus: MessageReadStatus },
  number
>(
  'chat/fetchDetailedReadStatus',
  async (messageId, { rejectWithValue }) => {
    try {
      const readStatus = await ChatService.getDetailedReadStatus(messageId);
      return { messageId, readStatus };
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to fetch detailed read status');
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

    // WebSocket real-time updates
    addMessageToChannel: (state, action: PayloadAction<Message>) => {
      const channelId = action.payload.channel_id;
      if (!state.messages[channelId]) {
        state.messages[channelId] = [];
      }
      if (!state.messages[channelId].some((m) => m.id === action.payload.id)) {
        state.messages[channelId].push(action.payload);
      }
    },
    // Add these to the reducers section of chatSlice:

    updateMessageDeliveryStatus: (
      state,
      action: PayloadAction<{
        messageId: number;
        deliveredBy: number;
        deliveredCount: number;
        timestamp: string;
      }>
    ) => {
      const { messageId, deliveredBy, deliveredCount, timestamp } = action.payload;

      Object.keys(state.messages).forEach((channelId) => {
        const messages = state.messages[+channelId];
        const messageIndex = messages?.findIndex((m) => m.id === messageId);

        if (messageIndex !== -1 && messages) {
          const message = messages[messageIndex];

          // Add deliveredBy to delivered_to_user_ids if not already there
          const deliveredIds = message.delivered_to_user_ids?.split(',').filter(Boolean) || [];
          if (!deliveredIds.includes(deliveredBy.toString())) {
            deliveredIds.push(deliveredBy.toString());
            message.delivered_to_user_ids = deliveredIds.join(',');
          }

          message.delivered_count = deliveredCount;
        }
      });
    },

    updateMessageReadStatus: (
      state,
      action: PayloadAction<{
        messageId: number;
        readBy: number;
        readByName?: string;
        readCount: number;
        timestamp: string;
      }>
    ) => {
      const { messageId, readBy, readCount } = action.payload;

      Object.keys(state.messages).forEach((channelId) => {
        const messages = state.messages[+channelId];
        const messageIndex = messages?.findIndex((m) => m.id === messageId);

        if (messageIndex !== -1 && messages) {
          const message = messages[messageIndex];

          // Add readBy to read_by_user_ids if not already there
          const readIds = message.read_by_user_ids?.split(',').filter(Boolean) || [];
          if (!readIds.includes(readBy.toString())) {
            readIds.push(readBy.toString());
            message.read_by_user_ids = readIds.join(',');
          }

          // Also mark as delivered
          const deliveredIds = message.delivered_to_user_ids?.split(',').filter(Boolean) || [];
          if (!deliveredIds.includes(readBy.toString())) {
            deliveredIds.push(readBy.toString());
            message.delivered_to_user_ids = deliveredIds.join(',');
          }

          message.read_count = readCount;
          message.is_read_by_me = true;
        }
      });
    },

    addReactionToMessage: (
      state,
      action: PayloadAction<{
        messageId: number;
        channelId: number;
        reaction: {
          emoji: string;
          userId: number;
          userName?: string;
          avatarUrl?: string;
          timestamp: string;
        };
      }>
    ) => {
      const { messageId, channelId, reaction } = action.payload;

      if (state.messages[channelId]) {
        const messageIndex = state.messages[channelId].findIndex(
          (m) => m.id === messageId
        );

        if (messageIndex !== -1) {
          const message = state.messages[channelId][messageIndex];

          if (!message.reactions) {
            message.reactions = [];
          }

          // Check if this user already reacted with this emoji
          const existingReaction = message.reactions.find(
            (r) => r.user_id === reaction.userId && r.emoji === reaction.emoji
          );

          if (!existingReaction) {
            message.reactions.push({
              id: Date.now(), // Temporary ID
              message_id: messageId, // ✅ FIX: Added missing field
              emoji: reaction.emoji,
              user_id: reaction.userId,
              created_at: reaction.timestamp,
              first_name: reaction.userName?.split(' ')[0] || '',
              last_name: reaction.userName?.split(' ').slice(1).join(' ') || '',
              avatar_url: reaction.avatarUrl || '',
            });

            message.reaction_count = (message.reaction_count || 0) + 1;
          }
        }
      }
    },

    removeReactionFromMessage: (
      state,
      action: PayloadAction<{
        messageId: number;
        channelId: number;
        emoji: string;
        userId: number;
      }>
    ) => {
      const { messageId, channelId, emoji, userId } = action.payload;

      if (state.messages[channelId]) {
        const messageIndex = state.messages[channelId].findIndex(
          (m) => m.id === messageId
        );

        if (messageIndex !== -1) {
          const message = state.messages[channelId][messageIndex];

          if (message.reactions) {
            message.reactions = message.reactions.filter(
              (r) => !(r.user_id === userId && r.emoji === emoji)
            );

            message.reaction_count = Math.max(0, (message.reaction_count || 0) - 1);
          }
        }
      }
    },

    pinMessageInChannel: (
      state,
      action: PayloadAction<{
        channelId: number;
        messageId: number;
        isPinned: boolean;
        pinnedBy?: number;
        pinnedAt?: string;
      }>
    ) => {
      const { channelId, messageId, isPinned, pinnedBy, pinnedAt } = action.payload;

      if (state.messages[channelId]) {
        const messageIndex = state.messages[channelId].findIndex(
          (m) => m.id === messageId
        );

        if (messageIndex !== -1) {
          const message = state.messages[channelId][messageIndex];
          message.is_pinned = isPinned;
          message.pinned_at = isPinned ? pinnedAt : undefined;
          message.pinned_by = isPinned ? pinnedBy : undefined;
        }
      }
    },

    updateThreadReplyCount: (
      state,
      action: PayloadAction<{
        messageId: number;
        increment: number;
      }>
    ) => {
      const { messageId, increment } = action.payload;

      Object.keys(state.messages).forEach((channelId) => {
        const messages = state.messages[+channelId];
        const messageIndex = messages?.findIndex((m) => m.id === messageId);

        if (messageIndex !== -1 && messages) {
          const message = messages[messageIndex];
          message.reply_count = (message.reply_count || 0) + increment;
        }
      });
    },

    // ✅ ADDITIONAL MISSING REDUCERS (from old chatSlice):

    updateMessageInChannel: (
      state,
      action: PayloadAction<{
        channelId: number;
        messageId: number;
        content: string;
        mentions?: number[];
        editedAt: string;
      }>
    ) => {
      const { channelId, messageId, content, mentions, editedAt } = action.payload;

      if (state.messages[channelId]) {
        const messageIndex = state.messages[channelId].findIndex(
          (m) => m.id === messageId
        );

        if (messageIndex !== -1) {
          const message = state.messages[channelId][messageIndex];
          message.content = content;
          message.is_edited = true;
          message.edited_at = editedAt;

          if (mentions && mentions.length > 0) {
            message.mentioned_user_ids = mentions.join(',');
            message.has_mentions = true;
          }
        }
      }
    },

    removeMessageFromChannel: (
      state,
      action: PayloadAction<{
        channelId: number;
        messageId: number;
      }>
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
      action: PayloadAction<{
        channelId: number;
        userId: number;
        userName?: string;
      }>
    ) => {
      const { channelId, userId, userName } = action.payload;

      if (!state.typingUsers[channelId]) {
        state.typingUsers[channelId] = [];
      }

      const existingIndex = state.typingUsers[channelId].findIndex(
        (u) => u.userId === userId
      );

      if (existingIndex === -1) {
        state.typingUsers[channelId].push({ userId, userName });
      }
    },

    removeTypingUser: (
      state,
      action: PayloadAction<{
        channelId: number;
        userId: number;
      }>
    ) => {
      const { channelId, userId } = action.payload;

      if (state.typingUsers[channelId]) {
        state.typingUsers[channelId] = state.typingUsers[channelId].filter(
          (u) => u.userId !== userId
        );
      }
    },

    setOnlineUsers: (state, action: PayloadAction<number[]>) => {
      state.onlineUsers = action.payload;
    },

    incrementUnreadCount: (state, action: PayloadAction<number>) => {
      const channelId = action.payload;
      state.unreadCount += 1;
      state.channelUnreadCounts[channelId] =
        (state.channelUnreadCounts[channelId] || 0) + 1;
    },

    resetUnreadCount: (state, action: PayloadAction<number>) => {
      const channelId = action.payload;
      const count = state.channelUnreadCounts[channelId] || 0;
      state.unreadCount = Math.max(0, state.unreadCount - count);
      state.channelUnreadCounts[channelId] = 0;
    },
    resetChatState: () => initialState,

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

        if (messageIndex !== -1 && messages) {
          const message = messages[messageIndex];

          if (status === 'delivered') {
            // Mark as delivered (no direct field, but we track via delivered_to_user_ids)
          } else if (status === 'read') {
            message.is_read_by_me = true;
          }
        }
      });
    },
  }
});

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
  updateMessageDeliveryStatus,
  updateMessageReadStatus,
  addReactionToMessage,
  removeReactionFromMessage,
  pinMessageInChannel,
  updateThreadReplyCount,
} = chatSlice.actions;

export default chatSlice.reducer;