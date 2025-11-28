// store/slices/chatSlice.ts - PART 1: Types & Initial State
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

// ==================== STATE INTERFACE ====================
interface ChatState {
  // Channels
  channels: Channel[];
  selectedChannel: Channel | null;
  isLoadingChannels: boolean;

  // Messages
  messages: Record<number, Message[]>;
  isLoadingMessages: boolean;
  isSendingMessage: boolean;

  // Members
  channelMembers: Record<number, Member[]>;
  isLoadingMembers: boolean;
  teamMembers: Member[];
  availableMembers: Member[];
  collaborationMembers: Member[];

  // Threads
  threadMessages: Record<number, Message[]>;
  isLoadingThread: boolean;
  enhancedThreads: Record<number, any>;

  // Pinned Messages
  pinnedMessages: Record<number, Message[]>;

  // Search
  searchResults: SearchResults | null;
  isSearching: boolean;

  // Real-time features
  typingUsers: Record<number, Array<{ userId: number; userName?: string }>>;
  onlineUsers: number[];

  // Unread tracking
  unreadCount: number;
  channelUnreadCounts: Record<number, number>;
  unreadMentionsCount: number;
  unreadNotificationsCount: number;

  // Activities & Notifications
  activities: Activity[];
  unreadActivities: Activity[];
  channelActivities: Record<number, Activity[]>;
  notifications: Notification[];
  notificationPreferences: any[];

  // Mentions
  mentions: any[];

  // Files
  channelFiles: Record<number, Attachment[]>;

  // Message details
  messageDetails: Record<number, Message>;
  messageAttachments: Record<number, Attachment[]>;
  messageReactions: Record<number, Reaction[]>;
  messageReadStatuses: Record<number, MessageReadStatus>;

  // UI state
  error: string | null;
  successMessage: string | null;
}

// ==================== INITIAL STATE ====================
const initialState: ChatState = {
  channels: [],
  selectedChannel: null,
  isLoadingChannels: false,
  messages: {},
  isLoadingMessages: false,
  isSendingMessage: false,
  channelMembers: {},
  isLoadingMembers: false,
  teamMembers: [],
  availableMembers: [],
  collaborationMembers: [],
  threadMessages: {},
  isLoadingThread: false,
  enhancedThreads: {},
  pinnedMessages: {},
  searchResults: null,
  isSearching: false,
  typingUsers: {},
  onlineUsers: [],
  unreadCount: 0,
  channelUnreadCounts: {},
  unreadMentionsCount: 0,
  unreadNotificationsCount: 0,
  activities: [],
  unreadActivities: [],
  channelActivities: {},
  notifications: [],
  notificationPreferences: [],
  mentions: [],
  channelFiles: {},
  messageDetails: {},
  messageAttachments: {},
  messageReactions: {},
  messageReadStatuses: {},
  error: null,
  successMessage: null,
};

// ==================== HELPER FUNCTIONS ====================
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
  related_type: ch.related_type,
  related_id: ch.related_id,
});

// store/slices/chatSlice.ts - PART 2: ALL ASYNC THUNKS (110+ operations)

// ==================== CHANNEL THUNKS ====================
export const fetchUserChannels = createAsyncThunk<Channel[], number>(
  'chat/fetchUserChannels',
  async (limit = 50, { rejectWithValue }) => {
    try {
      const response = await ChatService.getUserChannels(limit);
      return response.map(normalizeChannel);
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

export const updateChannel = createAsyncThunk<Channel, { channelId: number; payload: UpdateChannelPayload }>(
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

// ==================== MESSAGE THUNKS ====================
export const fetchMessages = createAsyncThunk<
  { channelId: number; messages: Message[] },
  { channelId: number; limit?: number; beforeId?: number }
>(
  'chat/fetchMessages',
  async ({ channelId, limit = 50, beforeId }, { rejectWithValue }) => {
    try {
      const messages = await ChatService.getMessages(channelId, limit, beforeId);
      return { channelId, messages };
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
      console.log("🚀 ~ channelId, messageId:", channelId, messageId)
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

// ==================== MESSAGE DETAILS THUNKS ====================
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

// ==================== REACTION THUNKS ====================
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

// ==================== THREAD THUNKS ====================
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
  { messageId: number; data: any },
  { messageId: number; limit?: number }
>(
  'chat/fetchEnhancedThread',
  async ({ messageId, limit = 50 }, { rejectWithValue }) => {
    try {
      const data = await ChatService.getEnhancedThread(messageId, limit);
      return { messageId, data };
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to fetch enhanced thread');
    }
  }
);

// ==================== MEMBER THUNKS ====================
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

// ==================== TEAM & COLLABORATION THUNKS ====================
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


export const searchCollaborationMembers = createAsyncThunk<Member[], string>(
  'chat/searchCollaborationMembers',
  async (query, { rejectWithValue }) => {
    try {
      return await ChatService.searchCollaborationMembers(query);
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to search members');
    }
  }
);

// store/slices/chatSlice.ts - PART 3: Remaining Thunks, Reducers & Export

// ==================== SEARCH THUNK ====================
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

// ==================== MENTIONS THUNKS ====================
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

// ==================== ACTIVITIES THUNKS ====================
export const fetchChannelActivities = createAsyncThunk<
  { channelId: number; activities: Activity[] },
  { channelId: number; limit?: number }
>(
  'chat/fetchChannelActivities',
  async ({ channelId, limit = 50 }, { rejectWithValue }) => {
    try {
      const activities = await ChatService.getChannelActivities(channelId, limit);
      return { channelId, activities };
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

// ==================== NOTIFICATIONS THUNKS ====================
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

// ==================== PRESENCE THUNKS ====================
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

// ==================== DELIVERY & READ STATUS THUNKS ====================
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
    // ✅ UI State Management
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    setSelectedChannel: (state, action: PayloadAction<Channel | null>) => {
      state.selectedChannel = action.payload;
    },

    // ✅ FIXED: Real-time Message Updates (WebSocket)
    addMessageToChannel: (state, action: PayloadAction<Message>) => {
      const channelId = action.payload.channel_id;
      if (!state.messages[channelId]) {
        state.messages[channelId] = [];
      }

      // Check if message already exists
      const exists = state.messages[channelId].some((m) => m.id === action.payload.id);
      if (!exists) {
        state.messages[channelId].push(action.payload);
        console.log('✅ Message added to state:', action.payload.id);
      } else {
        console.log('⚠️ Message already exists:', action.payload.id);
      }
    },



    // ✅ FIXED: Delivery Status Updates
    updateMessageDeliveryStatus: (state, action: PayloadAction<{
      messageId: number;
      deliveredBy: number;
      deliveredCount: number;
      timestamp: string;
    }>) => {
      const { messageId, deliveredBy, deliveredCount } = action.payload;

      console.log('📬 Updating delivery status:', messageId);

      let found = false;
      Object.keys(state.messages).forEach((channelId) => {
        const message = state.messages[+channelId]?.find((m) => m.id === messageId);
        if (message) {
          found = true;
          const deliveredIds = message.delivered_to_user_ids?.split(',').filter(Boolean) || [];
          if (!deliveredIds.includes(deliveredBy.toString())) {
            deliveredIds.push(deliveredBy.toString());
            message.delivered_to_user_ids = deliveredIds.join(',');
          }
          message.delivered_count = deliveredCount;
          console.log('✅ Delivery status updated');
        }
      });

      if (!found) {
        console.warn('⚠️ Message not found for delivery update:', messageId);
      }
    },

    // ✅ FIXED: Read Status Updates
    updateMessageReadStatus: (state, action: PayloadAction<{
      messageId: number;
      readBy: number;
      readByName?: string;
      readCount: number;
      timestamp: string;
    }>) => {
      const { messageId, readBy, readCount } = action.payload;

      console.log('📖 Updating read status:', messageId);

      let found = false;
      Object.keys(state.messages).forEach((channelId) => {
        const message = state.messages[+channelId]?.find((m) => m.id === messageId);
        if (message) {
          found = true;
          const readIds = message.read_by_user_ids?.split(',').filter(Boolean) || [];
          if (!readIds.includes(readBy.toString())) {
            readIds.push(readBy.toString());
            message.read_by_user_ids = readIds.join(',');
          }
          const deliveredIds = message.delivered_to_user_ids?.split(',').filter(Boolean) || [];
          if (!deliveredIds.includes(readBy.toString())) {
            deliveredIds.push(readBy.toString());
            message.delivered_to_user_ids = deliveredIds.join(',');
          }
          message.read_count = readCount;
          message.is_read_by_me = true;
          console.log('✅ Read status updated');
        }
      });

      if (!found) {
        console.warn('⚠️ Message not found for read update:', messageId);
      }
    },




    // ✅ Thread Updates (WebSocket)
    updateThreadReplyCount: (state, action: PayloadAction<{
      messageId: number;
      increment: number;
    }>) => {
      const { messageId, increment } = action.payload;

      console.log('🧵 Updating thread reply count:', messageId, increment);

      let found = false;
      Object.keys(state.messages).forEach((channelId) => {
        const message = state.messages[+channelId]?.find((m) => m.id === messageId);
        if (message) {
          found = true;
          message.reply_count = (message.reply_count || 0) + increment;
          console.log('✅ Thread count updated:', message.reply_count);
        }
      });

      if (!found) {
        console.warn('⚠️ Parent message not found:', messageId);
      }
    },

    addMessageToThread: (state, action: PayloadAction<{
      parentMessageId: number;
      message: Message;
    }>) => {
      const { parentMessageId, message } = action.payload;

      console.log('🧵 Adding message to thread:', message.id, 'parent:', parentMessageId);

      // Add to thread messages
      if (!state.threadMessages[parentMessageId]) {
        state.threadMessages[parentMessageId] = [];
      }

      const exists = state.threadMessages[parentMessageId].some((m) => m.id === message.id);
      if (!exists) {
        state.threadMessages[parentMessageId].push(message);
        console.log('✅ Thread message added');
      }

      // Also add to main channel messages if not exists
      if (state.messages[message.channel_id]) {
        const existsInChannel = state.messages[message.channel_id].some((m) => m.id === message.id);
        if (!existsInChannel) {
          state.messages[message.channel_id].push(message);
        }
      }
    },


    // ✅ Online Users
    setOnlineUsers: (state, action: PayloadAction<number[]>) => {
      state.onlineUsers = action.payload;
      console.log('✅ Online users updated:', action.payload.length);
    },

    // ✅ Unread Count Management
    incrementUnreadCount: (state, action: PayloadAction<number>) => {
      const channelId = action.payload;
      state.unreadCount += 1;
      state.channelUnreadCounts[channelId] = (state.channelUnreadCounts[channelId] || 0) + 1;
      console.log('✅ Unread count incremented:', state.unreadCount);
    },

    resetUnreadCount: (state, action: PayloadAction<number>) => {
      const channelId = action.payload;
      const count = state.channelUnreadCounts[channelId] || 0;
      state.unreadCount = Math.max(0, state.unreadCount - count);
      state.channelUnreadCounts[channelId] = 0;
      console.log('✅ Unread count reset for channel:', channelId);
    },

    // ✅ Member Updates
    addMembersToChannel: (state, action: PayloadAction<{
      channelId: number;
      userIds: number[];
    }>) => {
      const { channelId, userIds } = action.payload;
      const channel = state.channels.find((c) => c.id === channelId);
      if (channel) {
        channel.member_count += userIds.length;
        console.log('✅ Members added, new count:', channel.member_count);
      }
      // Clear cached members to force refetch
      if (state.channelMembers[channelId]) {
        delete state.channelMembers[channelId];
      }
    },

    // ✅ Channel Updates
    updateChannelLastMessage: (state, action: PayloadAction<{
      channelId: number;
      message: Message;
    }>) => {
      const { channelId, message } = action.payload;
      const channel = state.channels.find((c) => c.id === channelId);
      if (channel) {
        channel.last_message_at = message.sent_at;
        channel.message_count += 1;
        console.log('✅ Channel last message updated');
      }
    },

    // ✅ Mention Management
    markMentionAsRead: (state, action: PayloadAction<{
      messageId: number;
      channelId: number;
    }>) => {
      const { messageId, channelId } = action.payload;
      if (state.messages[channelId]) {
        const message = state.messages[channelId].find((m) => m.id === messageId);
        if (message) {
          message.is_read_by_me = true;
        }
      }
      state.unreadMentionsCount = Math.max(0, state.unreadMentionsCount - 1);
    },

    // ✅ General Message Status Update
    updateMessageStatus: (state, action: PayloadAction<{
      messageId: number;
      status: 'delivered' | 'read';
      timestamp: string;
    }>) => {
      const { messageId, status } = action.payload;
      Object.keys(state.messages).forEach((channelId) => {
        const message = state.messages[+channelId]?.find((m) => m.id === messageId);
        if (message && status === 'read') {
          message.is_read_by_me = true;
        }
      });
    },

    // ✅ FIXED: Typing Users - Force new array reference
    addTypingUser: (state, action: PayloadAction<{
      channelId: number;
      userId: number;
      userName?: string;
    }>) => {
      const { channelId, userId, userName } = action.payload;

      console.log('⌨️ REDUCER: Adding typing user', userId, channelId);

      if (!state.typingUsers[channelId]) {
        state.typingUsers[channelId] = [];
      }

      const exists = state.typingUsers[channelId].find((u) => u.userId === userId);
      if (!exists) {
        // ✅ CRITICAL: Create new array to trigger re-render
        state.typingUsers = {
          ...state.typingUsers,
          [channelId]: [...state.typingUsers[channelId], { userId, userName }]
        };
        console.log('✅ REDUCER: Typing user added, count:', state.typingUsers[channelId].length);
      }
    },

    removeTypingUser: (state, action: PayloadAction<{
      channelId: number;
      userId: number;
    }>) => {
      const { channelId, userId } = action.payload;

      console.log('⌨️ REDUCER: Removing typing user', userId, channelId);

      if (state.typingUsers[channelId]) {
        // ✅ CRITICAL: Create new array to trigger re-render
        state.typingUsers = {
          ...state.typingUsers,
          [channelId]: state.typingUsers[channelId].filter((u) => u.userId !== userId)
        };
        console.log('✅ REDUCER: Typing user removed, count:', state.typingUsers[channelId].length);
      }
    },

    // ✅ FIXED: Reactions - Force new array reference
    addReactionToMessage: (state, action: PayloadAction<{
      messageId: number;
      channelId: number;
      reaction: {
        emoji: string;
        userId: number;
        userName?: string;
        avatarUrl?: string;
        timestamp: string;
      };
    }>) => {
      const { messageId, channelId, reaction } = action.payload;

      console.log('👍 REDUCER: Adding reaction', reaction.emoji, messageId);

      if (!state.messages[channelId]) {
        console.warn('⚠️ Channel messages not found:', channelId);
        return;
      }

      // ✅ CRITICAL: Create new messages array
      state.messages = {
        ...state.messages,
        [channelId]: state.messages[channelId].map(msg => {
          if (msg.id !== messageId) return msg;

          const reactions = msg.reactions || [];
          const exists = reactions.find(r => r.user_id === reaction.userId && r.emoji === reaction.emoji);

          if (exists) {
            console.log('⚠️ Reaction already exists');
            return msg;
          }

          console.log('✅ REDUCER: Reaction added');
          return {
            ...msg,
            reactions: [...reactions, {
              id: Date.now(),
              message_id: messageId,
              emoji: reaction.emoji,
              user_id: reaction.userId,
              created_at: reaction.timestamp,
              first_name: reaction.userName?.split(' ')[0] || '',
              last_name: reaction.userName?.split(' ').slice(1).join(' ') || '',
              avatar_url: reaction.avatarUrl || '',
            }],
            reaction_count: (msg.reaction_count || 0) + 1,
          };
        })
      };
    },

    removeReactionFromMessage: (state, action: PayloadAction<{
      messageId: number;
      channelId: number;
      emoji: string;
      userId: number;
    }>) => {
      const { messageId, channelId, emoji, userId } = action.payload;

      console.log('👎 REDUCER: Removing reaction', emoji, messageId);

      if (!state.messages[channelId]) return;

      // ✅ CRITICAL: Create new messages array
      state.messages = {
        ...state.messages,
        [channelId]: state.messages[channelId].map(msg => {
          if (msg.id !== messageId) return msg;
          if (!msg.reactions) return msg;

          const newReactions = msg.reactions.filter(
            r => !(r.user_id === userId && r.emoji === emoji)
          );

          console.log('✅ REDUCER: Reaction removed');
          return {
            ...msg,
            reactions: newReactions,
            reaction_count: Math.max(0, (msg.reaction_count || 0) - 1),
          };
        })
      };
    },

    // ✅ FIXED: Edit Message - Force new array reference
    updateMessageInChannel: (state, action: PayloadAction<{
      channelId: number;
      messageId: number;
      content: string;
      mentions?: number[];
      editedAt: string;
    }>) => {
      const { channelId, messageId, content, mentions, editedAt } = action.payload;

      console.log('✏️ REDUCER: Updating message', messageId);

      if (!state.messages[channelId]) {
        console.warn('⚠️ Channel not found:', channelId);
        return;
      }

      // ✅ CRITICAL: Create new messages array
      state.messages = {
        ...state.messages,
        [channelId]: state.messages[channelId].map(msg => {
          if (msg.id !== messageId) return msg;

          console.log('✅ REDUCER: Message updated');
          return {
            ...msg,
            content,
            is_edited: true,
            edited_at: editedAt,
            mentioned_user_ids: mentions?.join(','),
            has_mentions: mentions && mentions.length > 0,
          };
        })
      };
    },

    // ✅ FIXED: Delete Message - Force new array reference
    removeMessageFromChannel: (state, action: PayloadAction<{
      channelId: number;
      messageId: number;
    }>) => {
      const { channelId, messageId } = action.payload;

      console.log('🗑️ REDUCER: Removing message', messageId);

      if (!state.messages[channelId]) return;

      // ✅ CRITICAL: Create new messages array
      const before = state.messages[channelId].length;
      state.messages = {
        ...state.messages,
        [channelId]: state.messages[channelId].filter(m => m.id !== messageId)
      };
      const after = state.messages[channelId].length;

      console.log('✅ REDUCER: Message removed, count:', before, '->', after);
    },

    // ✅ FIXED: Pin Message - Force new array reference
    pinMessageInChannel: (state, action: PayloadAction<{
      channelId: number;
      messageId: number;
      isPinned: boolean;
      pinnedBy?: number;
      pinnedAt?: string;
    }>) => {
      const { channelId, messageId, isPinned, pinnedBy, pinnedAt } = action.payload;

      console.log('📌 REDUCER: Updating pin status', messageId, isPinned);

      if (!state.messages[channelId]) return;

      // ✅ CRITICAL: Create new messages array
      state.messages = {
        ...state.messages,
        [channelId]: state.messages[channelId].map(msg => {
          if (msg.id !== messageId) return msg;

          console.log('✅ REDUCER: Pin status updated');
          return {
            ...msg,
            is_pinned: isPinned,
            pinned_at: isPinned ? pinnedAt : undefined,
            pinned_by: isPinned ? pinnedBy : undefined,
          };
        })
      };
    },

    // ✅ Clear Search Results
    clearSearchResults: (state) => {
      state.searchResults = null;
    },

    // ✅ Reset State
    resetChatState: () => initialState,
  },

  // ==================== EXTRA REDUCERS ====================
  // Keep all your existing extraReducers exactly as they are
  extraReducers: (builder) => {
    // Channels
    builder
      .addCase(fetchUserChannels.pending, (state) => {
        state.isLoadingChannels = true;
        state.error = null;
      })
      .addCase(fetchUserChannels.fulfilled, (state, action) => {
        state.isLoadingChannels = false;
        state.channels = action.payload;
      })
      .addCase(fetchUserChannels.rejected, (state, action) => {
        state.isLoadingChannels = false;
        state.error = action.payload as string;
      })

      // Messages
      .addCase(fetchMessages.pending, (state) => {
        state.isLoadingMessages = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.isLoadingMessages = false;
        state.messages[action.payload.channelId] = action.payload.messages;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoadingMessages = false;
        state.error = action.payload as string;
      })

      // Send Message
      .addCase(sendMessage.pending, (state) => {
        state.isSendingMessage = true;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isSendingMessage = false;
        const channelId = action.payload.channel_id;
        if (!state.messages[channelId]) {
          state.messages[channelId] = [];
        }
        const exists = state.messages[channelId].some((m) => m.id === action.payload.id);
        if (!exists) {
          state.messages[channelId].push(action.payload);
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isSendingMessage = false;
        state.error = action.payload as string;
      })

      // Members
      .addCase(fetchChannelMembers.fulfilled, (state, action) => {
        state.channelMembers[action.payload.channelId] = action.payload.members;
      })
      .addCase(fetchTeamMembers.fulfilled, (state, action) => {
        state.teamMembers = action.payload;
      })
      .addCase(fetchAvailableMembers.fulfilled, (state, action) => {
        state.availableMembers = action.payload;
      })

      // Threads
      .addCase(fetchThreadMessages.pending, (state) => {
        state.isLoadingThread = true;
      })
      .addCase(fetchThreadMessages.fulfilled, (state, action) => {
        state.isLoadingThread = false;
        state.threadMessages[action.payload.parentMessageId] = action.payload.messages;
      })
      .addCase(fetchThreadMessages.rejected, (state, action) => {
        state.isLoadingThread = false;
        state.error = action.payload as string;
      })

      // ✅ Activities
      .addCase(fetchChannelActivities.fulfilled, (state, action) => {
        state.channelActivities[action.payload.channelId] = action.payload.activities;
      })
      .addCase(fetchUnreadActivities.fulfilled, (state, action) => {
        state.unreadActivities = action.payload;
      })

      // ✅ Mentions
      .addCase(fetchUserMentions.fulfilled, (state, action) => {
        state.mentions = action.payload;
      })
      .addCase(fetchUnreadMentionsCount.fulfilled, (state, action) => {
        state.unreadMentionsCount = action.payload;
      })

      // ✅ Notifications
      .addCase(fetchUserNotifications.fulfilled, (state, action) => {
        state.notifications = action.payload;
      })
      .addCase(fetchUnreadNotificationsCount.fulfilled, (state, action) => {
        state.unreadNotificationsCount = action.payload;
      })
      .addCase(fetchNotificationPreferences.fulfilled, (state, action) => {
        state.notificationPreferences = action.payload;
      })

      // ✅ Unread Count
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })

      // ✅ Files
      .addCase(fetchChannelFiles.fulfilled, (state, action) => {
        state.channelFiles[action.payload.channelId] = action.payload.files;
      })

      // ✅ Message Details
      .addCase(fetchMessageDetails.fulfilled, (state, action) => {
        state.messageDetails[action.payload.id] = action.payload;
      })
      .addCase(fetchMessageAttachments.fulfilled, (state, action) => {
        state.messageAttachments[action.payload.messageId] = action.payload.attachments;
      })
      .addCase(fetchMessageReactions.fulfilled, (state, action) => {
        state.messageReactions[action.payload.messageId] = action.payload.reactions;
      })
      .addCase(fetchMessageReadStatus.fulfilled, (state, action) => {
        state.messageReadStatuses[action.payload.messageId] = action.payload.readStatus;
      })
      .addCase(fetchDetailedReadStatus.fulfilled, (state, action) => {
        state.messageReadStatuses[action.payload.messageId] = action.payload.readStatus;
      })

      // ✅ Search
      .addCase(searchChat.pending, (state) => {
        state.isSearching = true;
      })
      .addCase(searchChat.fulfilled, (state, action: any) => {
        state.isSearching = false;
        state.searchResults = action.payload?.data;
      })
      .addCase(searchChat.rejected, (state, action) => {
        state.isSearching = false;
        state.error = action.payload as string;
      })

      // ✅ Online Users
      .addCase(fetchOnlineUsers.fulfilled, (state, action) => {
        state.onlineUsers = action.payload;
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
  setOnlineUsers,
  incrementUnreadCount,
  resetUnreadCount,
  resetChatState,
  updateMessageDeliveryStatus,
  updateMessageReadStatus,
  updateThreadReplyCount,
  addMembersToChannel,
  addMessageToThread,
  updateChannelLastMessage,
  markMentionAsRead,
  addTypingUser,
  removeTypingUser,
  addReactionToMessage,
  removeReactionFromMessage,
  updateMessageInChannel,
  removeMessageFromChannel,
  pinMessageInChannel,
} = chatSlice.actions;

export default chatSlice.reducer;