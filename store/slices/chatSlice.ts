// store/slices/chatSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  ChatService,
  CreateChannelPayload,
  UpdateChannelPayload,
  ArchiveChannelPayload,
  GetChannelsPayload,
  AddChannelMembersPayload,
  RemoveChannelMemberPayload,
  UpdateMemberRolePayload,
  UpdateMemberNotificationPayload,
  SendMessagePayload,
  EditMessagePayload,
  GetMessagesPayload,
  ReactToMessagePayload,
  PinMessagePayload,
  MarkAsReadPayload,
  SearchMessagesPayload,
  CreateDirectMessagePayload,
  GetThreadMessagesPayload,
} from '../../lib/api/services/chat-service';

// ==================== INTERFACES ====================
interface Channel {
  id: string;
  name: string;
  description?: string;
  channel_type: string;
  is_private: boolean;
  member_count: number;
  message_count: number;
  unread_count: number;
  last_message_preview?: string;
  last_message_at?: string;
  last_activity_at: string;
  user_role: string;
  is_muted: boolean;
  last_read_message_id?: string;
  last_read_at?: string;
}

interface Message {
  id: string;
  channel_id: string;
  sender_id: string;
  sender_first_name: string;
  sender_last_name: string;
  sender_avatar_url?: string;
  message_type: string;
  content: string;
  formatted_content?: string;
  sent_at: string;
  is_edited: boolean;
  edited_at?: string;
  is_pinned: boolean;
  is_deleted: boolean;
  reply_to_message_id?: string;
  thread_id?: string;
  attachments?: any[];
  mentions?: string[];
  reaction_count: number;
  reply_count: number;
}

interface Member {
  id: string;
  user_id: string;
  channel_id: string;
  role: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
  status?: string;
  last_active_at?: string;
  is_muted: boolean;
}

interface ChatState {
  channels: Channel[];
  selectedChannel: Channel | null;
  messages: { [channelId: string]: Message[] };
  members: { [channelId: string]: Member[] };
  unreadCount: { total_unread: number; unread_channels: number };
  isLoading: boolean;
  isLoadingMessages: boolean;
  isLoadingChannels: boolean;
  isSendingMessage: boolean;
  error: string | null;
  searchResults: Message[];
  pinnedMessages: { [channelId: string]: Message[] };
}

const initialState: ChatState = {
  channels: [],
  selectedChannel: null,
  messages: {},
  members: {},
  unreadCount: { total_unread: 0, unread_channels: 0 },
  isLoading: false,
  isLoadingMessages: false,
  isLoadingChannels: false,
  isSendingMessage: false,
  error: null,
  searchResults: [],
  pinnedMessages: {},
};

// ==================== ASYNC THUNKS ====================

// Channels
export const fetchUserChannels = createAsyncThunk(
  'chat/fetchUserChannels',
  async (payload: GetChannelsPayload = {}, { rejectWithValue }) => {
    try {
      const response = await ChatService.getUserChannels(payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchChannelById = createAsyncThunk(
  'chat/fetchChannelById',
  async (channelId: string, { rejectWithValue }) => {
    try {
      const response = await ChatService.getChannelById(channelId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createChannel = createAsyncThunk(
  'chat/createChannel',
  async (payload: CreateChannelPayload, { rejectWithValue }) => {
    try {
      const response = await ChatService.createChannel(payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateChannel = createAsyncThunk(
  'chat/updateChannel',
  async (payload: UpdateChannelPayload, { rejectWithValue }) => {
    try {
      const response = await ChatService.updateChannel(payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const archiveChannel = createAsyncThunk(
  'chat/archiveChannel',
  async (payload: ArchiveChannelPayload, { rejectWithValue }) => {
    try {
      const response = await ChatService.archiveChannel(payload);
      return { ...response.data, channelId: payload.channelId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteChannel = createAsyncThunk(
  'chat/deleteChannel',
  async (channelId: string, { rejectWithValue }) => {
    try {
      const response = await ChatService.deleteChannel(channelId);
      return { ...response.data, channelId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const leaveChannel = createAsyncThunk(
  'chat/leaveChannel',
  async (channelId: string, { rejectWithValue }) => {
    try {
      const response = await ChatService.leaveChannel(channelId);
      return { ...response.data, channelId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Members
export const fetchChannelMembers = createAsyncThunk(
  'chat/fetchChannelMembers',
  async (channelId: string, { rejectWithValue }) => {
    try {
      const response = await ChatService.getChannelMembers(channelId);
      return { channelId, members: response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const addChannelMembers = createAsyncThunk(
  'chat/addChannelMembers',
  async (payload: AddChannelMembersPayload, { rejectWithValue }) => {
    try {
      const response = await ChatService.addChannelMembers(payload);
      return { channelId: payload.channelId, ...response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const removeChannelMember = createAsyncThunk(
  'chat/removeChannelMember',
  async (payload: RemoveChannelMemberPayload, { rejectWithValue }) => {
    try {
      const response = await ChatService.removeChannelMember(payload);
      return { ...payload, ...response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateMemberRole = createAsyncThunk(
  'chat/updateMemberRole',
  async (payload: UpdateMemberRolePayload, { rejectWithValue }) => {
    try {
      const response = await ChatService.updateMemberRole(payload);
      return { ...payload, ...response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateMemberNotification = createAsyncThunk(
  'chat/updateMemberNotification',
  async (payload: UpdateMemberNotificationPayload, { rejectWithValue }) => {
    try {
      const response = await ChatService.updateMemberNotification(payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Messages
export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (payload: GetMessagesPayload, { rejectWithValue }) => {
    try {
      const response = await ChatService.getMessages(payload);
      return { channelId: payload.channelId, messages: response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (payload: SendMessagePayload, { rejectWithValue }) => {
    try {
      const response = await ChatService.sendMessage(payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const editMessage = createAsyncThunk(
  'chat/editMessage',
  async (payload: EditMessagePayload, { rejectWithValue }) => {
    try {
      const response = await ChatService.editMessage(payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteMessage = createAsyncThunk(
  'chat/deleteMessage',
  async ({ messageId, hardDelete = false }: { messageId: string; hardDelete?: boolean }, { rejectWithValue }) => {
    try {
      const response = await ChatService.deleteMessage(messageId, hardDelete);
      return { messageId, ...response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const reactToMessage = createAsyncThunk(
  'chat/reactToMessage',
  async (payload: ReactToMessagePayload, { rejectWithValue }) => {
    try {
      const response = await ChatService.reactToMessage(payload);
      return { ...payload, ...response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const pinMessage = createAsyncThunk(
  'chat/pinMessage',
  async (payload: PinMessagePayload, { rejectWithValue }) => {
    try {
      const response = await ChatService.pinMessage(payload);
      return { ...payload, ...response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchPinnedMessages = createAsyncThunk(
  'chat/fetchPinnedMessages',
  async (channelId: string, { rejectWithValue }) => {
    try {
      const response = await ChatService.getPinnedMessages(channelId);
      return { channelId, messages: response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Search & Others
export const searchMessages = createAsyncThunk(
  'chat/searchMessages',
  async (payload: SearchMessagesPayload, { rejectWithValue }) => {
    try {
      const response = await ChatService.searchMessages(payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createDirectMessage = createAsyncThunk(
  'chat/createDirectMessage',
  async (payload: CreateDirectMessagePayload, { rejectWithValue }) => {
    try {
      const response = await ChatService.createDirectMessage(payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const markAsRead = createAsyncThunk(
  'chat/markAsRead',
  async (payload: MarkAsReadPayload, { rejectWithValue }) => {
    try {
      const response = await ChatService.markAsRead(payload);
      return { ...payload, ...response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'chat/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await ChatService.getUnreadCount();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchThreadMessages = createAsyncThunk(
  'chat/fetchThreadMessages',
  async ({ threadId, payload }: { threadId: string; payload: GetThreadMessagesPayload }, { rejectWithValue }) => {
    try {
      const response = await ChatService.getThreadMessages(threadId, payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
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
    setSelectedChannel: (state, action: PayloadAction<Channel | null>) => {
      state.selectedChannel = action.payload;
    },
    addMessageToChannel: (state, action: PayloadAction<Message>) => {
      const channelId = action.payload.channel_id;
      if (!state.messages[channelId]) {
        state.messages[channelId] = [];
      }
      state.messages[channelId].push(action.payload);
    },
    updateMessageInChannel: (state, action: PayloadAction<Message>) => {
      const channelId = action.payload.channel_id;
      if (state.messages[channelId]) {
        const index = state.messages[channelId].findIndex(m => m.id === action.payload.id);
        if (index !== -1) {
          state.messages[channelId][index] = action.payload;
        }
      }
    },
    removeMessageFromChannel: (state, action: PayloadAction<{ channelId: string; messageId: string }>) => {
      const { channelId, messageId } = action.payload;
      if (state.messages[channelId]) {
        state.messages[channelId] = state.messages[channelId].filter(m => m.id !== messageId);
      }
    },
    clearMessages: (state) => {
      state.messages = {};
    },
    resetChatState: (state) => {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Channels
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
      // Fetch Channel By ID
      .addCase(fetchChannelById.fulfilled, (state, action) => {
        const existingIndex = state.channels.findIndex(c => c.id === action.payload.id);
        if (existingIndex !== -1) {
          state.channels[existingIndex] = action.payload;
        } else {
          state.channels.push(action.payload);
        }
      })
      // Create Channel
      .addCase(createChannel.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createChannel.fulfilled, (state, action) => {
        state.isLoading = false;
        state.channels.unshift(action.payload);
        state.selectedChannel = action.payload;
      })
      .addCase(createChannel.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update Channel
      .addCase(updateChannel.fulfilled, (state, action) => {
        const index = state.channels.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.channels[index] = { ...state.channels[index], ...action.payload };
        }
        if (state.selectedChannel?.id === action.payload.id) {
          state.selectedChannel = { ...state.selectedChannel, ...action.payload };
        }
      })
      // Archive/Delete/Leave Channel
      .addCase(archiveChannel.fulfilled, (state, action) => {
        state.channels = state.channels.filter(c => c.id !== action.payload.channelId);
        if (state.selectedChannel?.id === action.payload.channelId) {
          state.selectedChannel = null;
        }
      })
      .addCase(deleteChannel.fulfilled, (state, action) => {
        state.channels = state.channels.filter(c => c.id !== action.payload.channelId);
        if (state.selectedChannel?.id === action.payload.channelId) {
          state.selectedChannel = null;
        }
      })
      .addCase(leaveChannel.fulfilled, (state, action) => {
        state.channels = state.channels.filter(c => c.id !== action.payload.channelId);
        if (state.selectedChannel?.id === action.payload.channelId) {
          state.selectedChannel = null;
        }
      })
      // Fetch Members
      .addCase(fetchChannelMembers.fulfilled, (state, action) => {
        state.members[action.payload.channelId] = action.payload.members;
      })
      // Fetch Messages
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
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isSendingMessage = false;
        const channelId = action.payload.channel_id;
        if (!state.messages[channelId]) {
          state.messages[channelId] = [];
        }
        state.messages[channelId].push(action.payload);
        
        // Update channel last activity
        const channelIndex = state.channels.findIndex(c => c.id === channelId);
        if (channelIndex !== -1) {
          state.channels[channelIndex].last_activity_at = action.payload.sent_at;
          state.channels[channelIndex].last_message_preview = action.payload.content;
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isSendingMessage = false;
        state.error = action.payload as string;
      })
      // Edit Message
      .addCase(editMessage.fulfilled, (state, action) => {
        const channelId = action.payload.channel_id;
        if (state.messages[channelId]) {
          const index = state.messages[channelId].findIndex(m => m.id === action.payload.id);
          if (index !== -1) {
            state.messages[channelId][index] = action.payload;
          }
        }
      })
      // Delete Message
      .addCase(deleteMessage.fulfilled, (state, action) => {
        Object.keys(state.messages).forEach(channelId => {
          state.messages[channelId] = state.messages[channelId].filter(
            m => m.id !== action.payload.messageId
          );
        });
      })
      // Pin Message
      .addCase(pinMessage.fulfilled, (state, action) => {
        Object.keys(state.messages).forEach(channelId => {
          const message = state.messages[channelId].find(m => m.id === action.payload.messageId);
          if (message) {
            message.is_pinned = action.payload.isPinned;
          }
        });
      })
      // Fetch Pinned Messages
      .addCase(fetchPinnedMessages.fulfilled, (state, action) => {
        state.pinnedMessages[action.payload.channelId] = action.payload.messages;
      })
      // Search Messages
      .addCase(searchMessages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Mark As Read
      .addCase(markAsRead.fulfilled, (state, action) => {
        const channelIndex = state.channels.findIndex(c => c.id === action.payload.channelId);
        if (channelIndex !== -1) {
          state.channels[channelIndex].unread_count = 0;
        }
      })
      // Fetch Unread Count
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      // Create Direct Message
      .addCase(createDirectMessage.fulfilled, (state, action) => {
        const channelId = action.payload.channel_id;
        if (!state.messages[channelId]) {
          state.messages[channelId] = [];
        }
        state.messages[channelId].push(action.payload);
      });
  },
});

export const {
  clearError,
  setSelectedChannel,
  addMessageToChannel,
  updateMessageInChannel,
  removeMessageFromChannel,
  clearMessages,
  resetChatState,
} = chatSlice.actions;

export default chatSlice.reducer;