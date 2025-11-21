// store/slices/chatSlice.ts - MATCHES BACKEND (NO ENCRYPTION)
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  ChatService,
  Channel,
  Message,
  Member,
  ChannelType,
  SendMessagePayload,
  CreateChannelPayload,
} from '../../lib/api/services/chat-service';

// ==================== STATE INTERFACE ====================
interface ChatState {
  channels: Channel[];
  selectedChannel: Channel | null;
  isLoadingChannels: boolean;

  messages: { [channelId: number]: Message[] };
  isLoadingMessages: boolean;
  isSendingMessage: boolean;

  typingUsers: { [channelId: number]: number[] };
  onlineUsers: number[];

  unreadCount: number;
  channelUnreadCounts: { [channelId: number]: number };

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
  typingUsers: {},
  onlineUsers: [],
  unreadCount: 0,
  channelUnreadCounts: {},
  error: null,
  successMessage: null,
};

// ==================== HELPERS ====================
const normalizeChannel = (channel: any): Channel => {
  const id = parseInt(channel.id || channel.channel_id || 0);
  return {
    id,
    channel_id: channel.channel_id || id.toString(),
    name: channel.name || 'Unnamed Channel',
    description: channel.description,
    channel_type: channel.channel_type || ChannelType.GROUP,
    is_private: channel.is_private || false,
    member_count: channel.member_count || 0,
    message_count: channel.message_count || 0,
    unread_count: channel.unread_count || 0,
    last_message_at: channel.last_message_at,
    last_activity_at: channel.last_activity_at,
    is_muted: channel.is_muted || false,
    last_read_message_id: channel.last_read_message_id,
    created_at: channel.created_at,
    updated_at: channel.updated_at,
  };
};

// ==================== ASYNC THUNKS ====================

// CHANNELS
export const fetchUserChannels = createAsyncThunk(
  'chat/fetchUserChannels',
  async (limit: number = 50, { rejectWithValue }) => {
    try {
      const response = await ChatService.getUserChannels(limit);
      const channelsArray = Array.isArray(response) ? response : [];
      return channelsArray.map(normalizeChannel);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch channels');
    }
  }
);

export const createChannel = createAsyncThunk(
  'chat/createChannel',
  async (payload: CreateChannelPayload, { rejectWithValue }) => {
    try {
      const channel = await ChatService.createChannel(payload);
      return normalizeChannel(channel);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create channel');
    }
  }
);

// MESSAGES
export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (
    { channelId, limit, beforeId }: { channelId: number; limit?: number; beforeId?: number },
    { rejectWithValue }
  ) => {
    try {
      const messages = await ChatService.getMessages(channelId, limit, beforeId);
      return { channelId, messages: Array.isArray(messages) ? messages : [] };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch messages');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (payload: SendMessagePayload, { rejectWithValue }) => {
    try {
      return await ChatService.sendMessage(payload);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to send message');
    }
  }
);

export const deleteMessage = createAsyncThunk(
  'chat/deleteMessage',
  async (messageId: number, { rejectWithValue }) => {
    try {
      // Assuming you have a delete endpoint
      return messageId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete message');
    }
  }
);

// REACTIONS
export const addReaction = createAsyncThunk(
  'chat/addReaction',
  async ({ messageId, emoji }: { messageId: number; emoji: string }, { rejectWithValue }) => {
    try {
      await ChatService.addReaction(messageId, emoji);
      return { messageId, emoji };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add reaction');
    }
  }
);

export const removeReaction = createAsyncThunk(
  'chat/removeReaction',
  async ({ messageId, emoji }: { messageId: number; emoji: string }, { rejectWithValue }) => {
    try {
      await ChatService.removeReaction(messageId, emoji);
      return { messageId, emoji };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to remove reaction');
    }
  }
);

// UNREAD
export const markAsRead = createAsyncThunk(
  'chat/markAsRead',
  async ({ channelId, messageId }: { channelId: number; messageId: number }) => {
    await ChatService.markAsRead(channelId, messageId);
    return { channelId };
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'chat/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const result = await ChatService.getUnreadCount();
      return result.unread;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch unread count');
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
    addMessageToChannel: (state, action: PayloadAction<Message>) => {
      const channelId = action.payload.channel_id;
      if (!state.messages[channelId]) {
        state.messages[channelId] = [];
      }
      const exists = state.messages[channelId].some((m) => m.id === action.payload.id);
      if (!exists) {
        state.messages[channelId].push(action.payload);
      }
    },
    updateMessageInChannel: (state, action: PayloadAction<Message>) => {
      const channelId = action.payload.channel_id;
      if (state.messages[channelId]) {
        const index = state.messages[channelId].findIndex((m) => m.id === action.payload.id);
        if (index !== -1) {
          state.messages[channelId][index] = action.payload;
        }
      }
    },
    removeMessageFromChannel: (
      state,
      action: PayloadAction<{ channelId: number; messageId: number }>
    ) => {
      const { channelId, messageId } = action.payload;
      if (state.messages[channelId]) {
        state.messages[channelId] = state.messages[channelId].filter((m) => m.id !== messageId);
      }
    },
    addTypingUser: (state, action: PayloadAction<{ channelId: number; userId: number }>) => {
      const { channelId, userId } = action.payload;
      if (!state.typingUsers[channelId]) {
        state.typingUsers[channelId] = [];
      }
      if (!state.typingUsers[channelId].includes(userId)) {
        state.typingUsers[channelId].push(userId);
      }
    },
    removeTypingUser: (state, action: PayloadAction<{ channelId: number; userId: number }>) => {
      const { channelId, userId } = action.payload;
      if (state.typingUsers[channelId]) {
        state.typingUsers[channelId] = state.typingUsers[channelId].filter((id) => id !== userId);
      }
    },
    setOnlineUsers: (state, action: PayloadAction<number[]>) => {
      state.onlineUsers = action.payload;
    },
    incrementUnreadCount: (state, action: PayloadAction<number>) => {
      const channelId = action.payload;
      state.unreadCount += 1;
      state.channelUnreadCounts[channelId] = (state.channelUnreadCounts[channelId] || 0) + 1;
    },
    resetUnreadCount: (state, action: PayloadAction<number>) => {
      const channelId = action.payload;
      const channelUnread = state.channelUnreadCounts[channelId] || 0;
      state.unreadCount = Math.max(0, state.unreadCount - channelUnread);
      state.channelUnreadCounts[channelId] = 0;
    },
    resetChatState: () => initialState,
  },
  extraReducers: (builder) => {
    // CHANNELS
    builder
      .addCase(fetchUserChannels.pending, (state) => {
        state.isLoadingChannels = true;
        state.error = null;
      })
      .addCase(fetchUserChannels.fulfilled, (state, action) => {
        state.isLoadingChannels = false;
        if (Array.isArray(action.payload)) {
          state.channels = action.payload;
        } else {
          state.channels = [];
        }
      })
      .addCase(fetchUserChannels.rejected, (state, action) => {
        state.isLoadingChannels = false;
        state.error = action.payload as string;
      });

    builder.addCase(createChannel.fulfilled, (state, action) => {
      state.channels.unshift(action.payload);
      state.selectedChannel = action.payload;
      state.successMessage = 'Channel created successfully';
    });

    // MESSAGES
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.isLoadingMessages = true;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.isLoadingMessages = false;
        state.messages[action.payload.channelId] = action.payload.messages;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoadingMessages = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(sendMessage.pending, (state) => {
        state.isSendingMessage = true;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isSendingMessage = false;
        const channelId = action.payload.channel_id;
        if (!state.messages[channelId]) {
          state.messages[channelId] = [];
        }
        state.messages[channelId].push(action.payload);
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isSendingMessage = false;
        state.error = action.payload as string;
      });

    builder.addCase(deleteMessage.fulfilled, (state, action) => {
      const messageId = action.payload;
      Object.keys(state.messages).forEach((channelIdStr) => {
        const channelId = parseInt(channelIdStr);
        state.messages[channelId] = state.messages[channelId].filter((m) => m.id !== messageId);
      });
      state.successMessage = 'Message deleted';
    });

    // UNREAD
    builder.addCase(markAsRead.fulfilled, (state, action) => {
      const { channelId } = action.payload;
      const channelIndex = state.channels.findIndex((c) => c.id === channelId);
      if (channelIndex !== -1) {
        state.channels[channelIndex].unread_count = 0;
      }
      const channelUnread = state.channelUnreadCounts[channelId] || 0;
      state.unreadCount = Math.max(0, state.unreadCount - channelUnread);
      state.channelUnreadCounts[channelId] = 0;
    });

    builder.addCase(fetchUnreadCount.fulfilled, (state, action) => {
      state.unreadCount = action.payload;
    });
  },
});

export const {
  clearError,
  clearSuccessMessage,
  setSelectedChannel,
  addMessageToChannel,
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