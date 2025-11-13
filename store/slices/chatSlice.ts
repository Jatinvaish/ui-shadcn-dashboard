// store/slices/chatSlice.ts - UPDATED v4.0
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
  DeleteMessagePayload,
  GetMessagesPayload,
  ReactToMessagePayload,
  PinMessagePayload,
  ForwardMessagePayload,
  RotateChannelKeyPayload,
  MarkAsReadPayload,
  BulkMarkAsReadPayload,
  SearchMessagesPayload,
  GetThreadMessagesPayload,
  CreateDirectMessagePayload,
  Channel,
  Message,
  Member,
} from '../../lib/api/services/chat-service';

// ==================== INTERFACES ====================

interface ChatState {
  // Channels
  channels: Channel[];
  selectedChannel: Channel | null;
  isLoadingChannels: boolean;

  // Messages
  messages: { [channelId: number]: Message[] };
  isLoadingMessages: boolean;
  isSendingMessage: boolean;

  // Members
  members: { [channelId: number]: Member[] };
  isLoadingMembers: boolean;

  // Search & Threads
  searchResults: Message[];
  threadMessages: { [threadId: number]: Message[] };
  pinnedMessages: { [channelId: number]: Message[] };

  // Unread
  unreadCount: {
    total_unread: number;
    unread_channels: number;
  };

  // Loading states
  isLoading: boolean;
  isLoadingPinned: boolean;

  // Error & Success
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
  members: {},
  isLoadingMembers: false,
  searchResults: [],
  threadMessages: {},
  pinnedMessages: {},
  unreadCount: { total_unread: 0, unread_channels: 0 },
  isLoading: false,
  isLoadingPinned: false,
  error: null,
  successMessage: null,
};

// ==================== ASYNC THUNKS ====================

// ==================== CHANNELS ====================

export const fetchUserChannels = createAsyncThunk(
  'chat/fetchUserChannels',
  async (payload: GetChannelsPayload = {}, { rejectWithValue }) => {
    try {
      const response = await ChatService.getUserChannels(payload);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchChannelById = createAsyncThunk(
  'chat/fetchChannelById',
  async (channelId: number, { rejectWithValue }) => {
    try {
      const response = await ChatService.getChannelById(channelId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createChannel = createAsyncThunk(
  'chat/createChannel',
  async (payload: CreateChannelPayload, { rejectWithValue }) => {
    try {
      const response = await ChatService.createChannel(payload);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateChannel = createAsyncThunk(
  'chat/updateChannel',
  async (payload: UpdateChannelPayload, { rejectWithValue }) => {
    try {
      const response = await ChatService.updateChannel(payload);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const archiveChannel = createAsyncThunk(
  'chat/archiveChannel',
  async (payload: ArchiveChannelPayload, { rejectWithValue }) => {
    try {
      const response = await ChatService.archiveChannel(payload);
      return { ...response, channelId: payload.channelId };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteChannel = createAsyncThunk(
  'chat/deleteChannel',
  async (channelId: number, { rejectWithValue }) => {
    try {
      const response = await ChatService.deleteChannel(channelId);
      return { ...response, channelId };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const leaveChannel = createAsyncThunk(
  'chat/leaveChannel',
  async (channelId: number, { rejectWithValue }) => {
    try {
      const response = await ChatService.leaveChannel(channelId);
      return { ...response, channelId };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const rotateChannelKey = createAsyncThunk(
  'chat/rotateChannelKey',
  async (payload: RotateChannelKeyPayload, { rejectWithValue }) => {
    try {
      const response = await ChatService.rotateChannelKey(payload);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// ==================== MEMBERS ====================

export const fetchChannelMembers = createAsyncThunk(
  'chat/fetchChannelMembers',
  async (channelId: number, { rejectWithValue }) => {
    try {
      const response = await ChatService.getChannelMembers(channelId);
      return { channelId, members: response };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const addChannelMembers = createAsyncThunk(
  'chat/addChannelMembers',
  async (payload: AddChannelMembersPayload, { rejectWithValue }) => {
    try {
      const response = await ChatService.addChannelMembers(payload);
      return { channelId: payload.channelId, ...response };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const removeChannelMember = createAsyncThunk(
  'chat/removeChannelMember',
  async (payload: RemoveChannelMemberPayload, { rejectWithValue }) => {
    try {
      const response = await ChatService.removeChannelMember(payload);
      return { ...payload, ...response };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateMemberRole = createAsyncThunk(
  'chat/updateMemberRole',
  async (payload: UpdateMemberRolePayload, { rejectWithValue }) => {
    try {
      const response = await ChatService.updateMemberRole(payload);
      return { ...payload, ...response };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateMemberNotification = createAsyncThunk(
  'chat/updateMemberNotification',
  async (payload: UpdateMemberNotificationPayload, { rejectWithValue }) => {
    try {
      const response = await ChatService.updateMemberNotification(payload);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// ==================== MESSAGES ====================

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (payload: GetMessagesPayload, { rejectWithValue }) => {
    try {
      const response = await ChatService.getMessages(payload);
      return { channelId: payload.channelId, messages: response };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (payload: SendMessagePayload, { rejectWithValue }) => {
    try {
      const response = await ChatService.sendMessage(payload);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const editMessage = createAsyncThunk(
  'chat/editMessage',
  async (payload: EditMessagePayload, { rejectWithValue }) => {
    try {
      const response = await ChatService.editMessage(payload);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteMessage = createAsyncThunk(
  'chat/deleteMessage',
  async (payload: DeleteMessagePayload, { rejectWithValue }) => {
    try {
      const response = await ChatService.deleteMessage(payload);
      return { messageId: payload.messageId, ...response };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const bulkDeleteMessages = createAsyncThunk(
  'chat/bulkDeleteMessages',
  async (messageIds: number[], { rejectWithValue }) => {
    try {
      const response = await ChatService.bulkDeleteMessages(messageIds);
      return { messageIds, ...response };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const forwardMessage = createAsyncThunk(
  'chat/forwardMessage',
  async (payload: ForwardMessagePayload, { rejectWithValue }) => {
    try {
      const response = await ChatService.forwardMessage(payload);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const getMessageStatus = createAsyncThunk(
  'chat/getMessageStatus',
  async (messageId: number, { rejectWithValue }) => {
    try {
      const response = await ChatService.getMessageStatus(messageId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const getBulkMessageStatus = createAsyncThunk(
  'chat/getBulkMessageStatus',
  async (messageIds: number[], { rejectWithValue }) => {
    try {
      const response = await ChatService.getBulkMessageStatus(messageIds);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const reactToMessage = createAsyncThunk(
  'chat/reactToMessage',
  async (payload: ReactToMessagePayload, { rejectWithValue }) => {
    try {
      const response = await ChatService.reactToMessage(payload);
      return { ...payload, ...response };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const getMessageReactions = createAsyncThunk(
  'chat/getMessageReactions',
  async (messageId: number, { rejectWithValue }) => {
    try {
      const response = await ChatService.getMessageReactions(messageId);
      return { messageId, reactions: response };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const pinMessage = createAsyncThunk(
  'chat/pinMessage',
  async (payload: PinMessagePayload, { rejectWithValue }) => {
    try {
      const response = await ChatService.pinMessage(payload);
      return { ...payload, ...response };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchPinnedMessages = createAsyncThunk(
  'chat/fetchPinnedMessages',
  async (channelId: number, { rejectWithValue }) => {
    try {
      const response = await ChatService.getPinnedMessages(channelId);
      return { channelId, messages: response };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// ==================== THREADS ====================

export const fetchThreadMessages = createAsyncThunk(
  'chat/fetchThreadMessages',
  async (payload: GetThreadMessagesPayload, { rejectWithValue }) => {
    try {
      const response = await ChatService.getThreadMessages(payload);
      return { threadId: payload.threadId, messages: response };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const replyToThread = createAsyncThunk(
  'chat/replyToThread',
  async (payload: SendMessagePayload, { rejectWithValue }) => {
    try {
      const response = await ChatService.replyToThread(payload);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// ==================== SEARCH ====================

export const searchMessages = createAsyncThunk(
  'chat/searchMessages',
  async (payload: SearchMessagesPayload, { rejectWithValue }) => {
    try {
      const response = await ChatService.searchMessages(payload);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// ==================== DIRECT MESSAGES ====================

export const createDirectMessage = createAsyncThunk(
  'chat/createDirectMessage',
  async (payload: CreateDirectMessagePayload, { rejectWithValue }) => {
    try {
      const response = await ChatService.createDirectMessage(payload);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// ==================== READ RECEIPTS ====================

export const markAsRead = createAsyncThunk(
  'chat/markAsRead',
  async (payload: MarkAsReadPayload, { rejectWithValue }) => {
    try {
      const response = await ChatService.markAsRead(payload);
      return { ...payload, ...response };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const bulkMarkAsRead = createAsyncThunk(
  'chat/bulkMarkAsRead',
  async (payload: BulkMarkAsReadPayload, { rejectWithValue }) => {
    try {
      const response = await ChatService.bulkMarkAsRead(payload);
      return { ...payload, ...response };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'chat/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await ChatService.getUnreadCount();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
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
    removeMessageFromChannel: (
      state,
      action: PayloadAction<{ channelId: number; messageId: number }>
    ) => {
      const { channelId, messageId } = action.payload;
      if (state.messages[channelId]) {
        state.messages[channelId] = state.messages[channelId].filter(
          m => m.id !== messageId
        );
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
    // ==================== FETCH CHANNELS ====================
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
      });

    // ==================== CREATE CHANNEL ====================
    builder
      .addCase(createChannel.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createChannel.fulfilled, (state, action) => {
        state.isLoading = false;
        state.channels.unshift(action.payload);
        state.selectedChannel = action.payload;
        state.successMessage = 'Channel created successfully';
      })
      .addCase(createChannel.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ==================== UPDATE CHANNEL ====================
    builder
      .addCase(updateChannel.fulfilled, (state, action) => {
        const index = state.channels.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.channels[index] = { ...state.channels[index], ...action.payload };
        }
        if (state.selectedChannel?.id === action.payload.id) {
          state.selectedChannel = { ...state.selectedChannel, ...action.payload };
        }
        state.successMessage = 'Channel updated successfully';
      })
      .addCase(updateChannel.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // ==================== ARCHIVE/DELETE/LEAVE CHANNEL ====================
    builder
      .addCase(archiveChannel.fulfilled, (state, action) => {
        state.channels = state.channels.filter(c => c.id !== (action.payload as any).channelId);
        if (state.selectedChannel?.id === (action.payload as any).channelId) {
          state.selectedChannel = null;
        }
        state.successMessage = 'Channel archived';
      })
      .addCase(deleteChannel.fulfilled, (state, action) => {
        state.channels = state.channels.filter(c => c.id !== (action.payload as any).channelId);
        if (state.selectedChannel?.id === (action.payload as any).channelId) {
          state.selectedChannel = null;
        }
        state.successMessage = 'Channel deleted';
      })
      .addCase(leaveChannel.fulfilled, (state, action) => {
        state.channels = state.channels.filter(c => c.id !== (action.payload as any).channelId);
        if (state.selectedChannel?.id === (action.payload as any).channelId) {
          state.selectedChannel = null;
        }
        state.successMessage = 'Left channel';
      });

    // ==================== FETCH MEMBERS ====================
    builder
      .addCase(fetchChannelMembers.pending, (state) => {
        state.isLoadingMembers = true;
      })
      .addCase(fetchChannelMembers.fulfilled, (state, action) => {
        state.isLoadingMembers = false;
        state.members[(action.payload as any).channelId] = (action.payload as any).members;
      })
      .addCase(fetchChannelMembers.rejected, (state, action) => {
        state.isLoadingMembers = false;
        state.error = action.payload as string;
      });

    // ==================== FETCH MESSAGES ====================
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.isLoadingMessages = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.isLoadingMessages = false;
        state.messages[(action.payload as any).channelId] = (action.payload as any).messages;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoadingMessages = false;
        state.error = action.payload as string;
      });

    // ==================== SEND MESSAGE ====================
    builder
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
        state.successMessage = 'Message sent';
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isSendingMessage = false;
        state.error = action.payload as string;
      });

    // ==================== EDIT MESSAGE ====================
    builder
      .addCase(editMessage.fulfilled, (state, action) => {
        const channelId = action.payload.channel_id;
        if (state.messages[channelId]) {
          const index = state.messages[channelId].findIndex(m => m.id === action.payload.id);
          if (index !== -1) {
            state.messages[channelId][index] = action.payload;
          }
        }
        state.successMessage = 'Message updated';
      });

    // ==================== DELETE MESSAGE ====================
    builder
      .addCase(deleteMessage.fulfilled, (state, action) => {
        Object.keys(state.messages).forEach(channelId => {
          state.messages[parseInt(channelId)] = state.messages[parseInt(channelId)].filter(
            m => m.id !== (action.payload as any).messageId
          );
        });
        state.successMessage = 'Message deleted';
      });

    // ==================== PIN MESSAGE ====================
    builder
      .addCase(pinMessage.fulfilled, (state, action) => {
        Object.keys(state.messages).forEach(channelId => {
          const message = state.messages[parseInt(channelId)].find(
            m => m.id === (action.payload as any).messageId
          );
          if (message) {
            message.is_pinned = (action.payload as any).isPinned;
          }
        });
        state.successMessage = (action.payload as any).isPinned ? 'Message pinned' : 'Message unpinned';
      });

    // ==================== FETCH PINNED MESSAGES ====================
    builder
      .addCase(fetchPinnedMessages.pending, (state) => {
        state.isLoadingPinned = true;
      })
      .addCase(fetchPinnedMessages.fulfilled, (state, action) => {
        state.isLoadingPinned = false;
        state.pinnedMessages[(action.payload as any).channelId] = (action.payload as any).messages;
      });

    // ==================== SEARCH MESSAGES ====================
    builder
      .addCase(searchMessages.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(searchMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ==================== MARK AS READ ====================
    builder
      .addCase(markAsRead.fulfilled, (state, action) => {
        const channelIndex = state.channels.findIndex(
          c => c.id === (action.payload as any).channelId
        );
        if (channelIndex !== -1) {
          state.channels[channelIndex].unread_count = 0;
        }
      });

    // ==================== FETCH UNREAD COUNT ====================
    builder
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      });

    // ==================== ROTATE CHANNEL KEY ====================
    builder
      .addCase(rotateChannelKey.fulfilled, (state) => {
        state.successMessage = 'Channel key rotated successfully';
      })
      .addCase(rotateChannelKey.rejected, (state, action) => {
        state.error = action.payload as string;
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
  clearMessages,
  resetChatState,
} = chatSlice.actions;

export default chatSlice.reducer;