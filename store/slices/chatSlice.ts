// store/slices/chatSlice.ts - ULTRA-OPTIMIZED v5.0
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  ChatService,
  Channel,
  Message,
  Member,
  SendMessagePayload,
  CreateChannelPayload,
  UpdateChannelPayload,
  ArchiveChannelPayload,
  UpdateMemberNotificationPayload,
  EditMessagePayload,
  DeleteMessagePayload,
  MarkAsReadPayload,
  GetThreadMessagesPayload,
} from '../../lib/api/services/chat-service';

// ==================== STATE INTERFACE ====================
interface ChatState {
  channels: Channel[];
  selectedChannel: Channel | null;
  isLoadingChannels: boolean;

  messages: { [channelId: number]: Message[] };
  isLoadingMessages: boolean;
  isSendingMessage: boolean;

  members: { [channelId: number]: Member[] };
  isLoadingMembers: boolean;

  threadMessages: { [threadId: number]: Message[] };
  pinnedMessages: { [channelId: number]: Message[] };

  typingUsers: { [channelId: number]: number[] };
  onlineUsers: number[];

  unreadCount: {
    total_unread: number;
    unread_channels: number;
  };

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
  threadMessages: {},
  pinnedMessages: {},
  typingUsers: {},
  onlineUsers: [],
  unreadCount: { total_unread: 0, unread_channels: 0 },
  error: null,
  successMessage: null,
};

// ==================== ASYNC THUNKS ====================

// ULTRA-FAST Operations
export const sendMessageFast = createAsyncThunk(
  'chat/sendMessageFast',
  async (payload: SendMessagePayload, { rejectWithValue }) => {
    try {
      const startTime = performance.now();
      const response = await ChatService.sendMessageUltraFast(payload);
      const elapsed = performance.now() - startTime;
      console.log(`✅ Message sent in ${elapsed.toFixed(0)}ms`);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchMessagesFast = createAsyncThunk(
  'chat/fetchMessagesFast',
  async (
    { channelId, limit, beforeId }: { channelId: number; limit?: number; beforeId?: number },
    { rejectWithValue }
  ) => {
    try {
      const startTime = performance.now();
      const messages = await ChatService.getMessagesUltraFast(channelId, limit, beforeId);
      const elapsed = performance.now() - startTime;
      console.log(`✅ Messages fetched in ${elapsed.toFixed(0)}ms`);
      return { channelId, messages };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const markAsReadFast = createAsyncThunk(
  'chat/markAsReadFast',
  async ({ channelId, messageId }: { channelId: number; messageId?: number }) => {
    await ChatService.markAsReadUltraFast(channelId, messageId);
    return { channelId, messageId };
  }
);

// Standard Operations
export const fetchUserChannels = createAsyncThunk(
  'chat/fetchUserChannels',
  async (payload: any = {}, { rejectWithValue }) => {
    try {
      return await ChatService.getUserChannels(payload);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchChannelById = createAsyncThunk(
  'chat/fetchChannelById',
  async (channelId: number, { rejectWithValue }) => {
    try {
      return await ChatService.getChannelById(channelId);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createChannel = createAsyncThunk(
  'chat/createChannel',
  async (payload: CreateChannelPayload, { rejectWithValue }) => {
    try {
      return await ChatService.createChannel(payload);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateChannel = createAsyncThunk(
  'chat/updateChannel',
  async (payload: UpdateChannelPayload, { rejectWithValue }) => {
    try {
      return await ChatService.updateChannel(payload);
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

export const fetchChannelMembers = createAsyncThunk(
  'chat/fetchChannelMembers',
  async (channelId: number, { rejectWithValue }) => {
    try {
      const members = await ChatService.getChannelMembers(channelId);
      return { channelId, members };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateMemberNotification = createAsyncThunk(
  'chat/updateMemberNotification',
  async (payload: UpdateMemberNotificationPayload, { rejectWithValue }) => {
    try {
      return await ChatService.updateMemberNotification(payload);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async ({ channelId, ...payload }: any, { rejectWithValue }) => {
    try {
      const messages = await ChatService.getMessages(channelId, payload);
      return { channelId, messages };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (payload: SendMessagePayload, { rejectWithValue }) => {
    try {
      return await ChatService.sendMessage(payload);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const editMessage = createAsyncThunk(
  'chat/editMessage',
  async (payload: EditMessagePayload, { rejectWithValue }) => {
    try {
      return await ChatService.editMessage(payload);
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

export const fetchThreadMessages = createAsyncThunk(
  'chat/fetchThreadMessages',
  async (payload: GetThreadMessagesPayload, { rejectWithValue }) => {
    try {
      const messages = await ChatService.getThreadMessages(payload);
      return { threadId: payload.threadId, messages };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const replyToThread = createAsyncThunk(
  'chat/replyToThread',
  async (payload: SendMessagePayload, { rejectWithValue }) => {
    try {
      return await ChatService.replyToThread(payload);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'chat/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      return await ChatService.getUnreadCount();
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
    addMessageToChannel: (state, action: PayloadAction<Message>) =>{
      const channelId = action.payload.channel_id;
      if (!state.messages[channelId]) {
        state.messages[channelId] = [];
      }
      state.messages[channelId].push(action.payload);
    },
    updateMessageInChannel: (state, action: PayloadAction<Message>) => {
      const channelId = action.payload.channel_id;
      if (state.messages[channelId]) {
        const index = state.messages[channelId].findIndex(
          (m) => m.id === action.payload.id
        );
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
          (m) => m.id !== messageId
        );
      }
    },
    setTypingUsers: (
      state,
      action: PayloadAction<{ channelId: number; userIds: number[] }>
    ) => {
      state.typingUsers[action.payload.channelId] = action.payload.userIds;
    },
    addTypingUser: (
      state,
      action: PayloadAction<{ channelId: number; userId: number }>
    ) => {
      const { channelId, userId } = action.payload;
      if (!state.typingUsers[channelId]) {
        state.typingUsers[channelId] = [];
      }
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
    resetChatState: (state) => {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    // ==================== ULTRA-FAST OPERATIONS ====================
    builder
      .addCase(sendMessageFast.pending, (state) => {
        state.isSendingMessage = true;
      })
      .addCase(sendMessageFast.fulfilled, (state, action) => {
        state.isSendingMessage = false;
        const channelId = action.payload.channel_id;
        if (!state.messages[channelId]) {
          state.messages[channelId] = [];
        }
        state.messages[channelId].push(action.payload);
      })
      .addCase(sendMessageFast.rejected, (state, action) => {
        state.isSendingMessage = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(fetchMessagesFast.pending, (state) => {
        state.isLoadingMessages = true;
      })
      .addCase(fetchMessagesFast.fulfilled, (state, action) => {
        state.isLoadingMessages = false;
        state.messages[action.payload.channelId] = action.payload.messages;
      })
      .addCase(fetchMessagesFast.rejected, (state, action) => {
        state.isLoadingMessages = false;
        state.error = action.payload as string;
      });

    builder.addCase(markAsReadFast.fulfilled, (state, action) => {
      const channelIndex = state.channels.findIndex(
        (c) => c.id === action.payload.channelId
      );
      if (channelIndex !== -1) {
        state.channels[channelIndex].unread_count = 0;
      }
    });

    // ==================== CHANNELS ====================
    builder
      .addCase(fetchUserChannels.pending, (state) => {
        state.isLoadingChannels = true;
      })
      .addCase(fetchUserChannels.fulfilled, (state, action) => {
        state.isLoadingChannels = false;
        state.channels = action.payload;
      })
      .addCase(fetchUserChannels.rejected, (state, action) => {
        state.isLoadingChannels = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(createChannel.fulfilled, (state, action) => {
        state.channels.unshift(action.payload);
        state.selectedChannel = action.payload;
        state.successMessage = 'Channel created successfully';
      })
      .addCase(createChannel.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    builder
      .addCase(updateChannel.fulfilled, (state, action) => {
        const index = state.channels.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) {
          state.channels[index] = { ...state.channels[index], ...action.payload };
        }
        if (state.selectedChannel?.id === action.payload.id) {
          state.selectedChannel = { ...state.selectedChannel, ...action.payload };
        }
        state.successMessage = 'Channel updated';
      });

    builder
      .addCase(archiveChannel.fulfilled, (state, action) => {
        state.channels = state.channels.filter(
          (c) => c.id !== (action.payload as any).channelId
        );
        if (state.selectedChannel?.id === (action.payload as any).channelId) {
          state.selectedChannel = null;
        }
        state.successMessage = 'Channel archived';
      });

    builder
      .addCase(leaveChannel.fulfilled, (state, action) => {
        state.channels = state.channels.filter(
          (c) => c.id !== (action.payload as any).channelId
        );
        if (state.selectedChannel?.id === (action.payload as any).channelId) {
          state.selectedChannel = null;
        }
        state.successMessage = 'Left channel';
      });

    // ==================== MEMBERS ====================
    builder
      .addCase(fetchChannelMembers.pending, (state) => {
        state.isLoadingMembers = true;
      })
      .addCase(fetchChannelMembers.fulfilled, (state, action) => {
        state.isLoadingMembers = false;
        state.members[action.payload.channelId] = action.payload.members;
      })
      .addCase(fetchChannelMembers.rejected, (state, action) => {
        state.isLoadingMembers = false;
        state.error = action.payload as string;
      });

    // ==================== MESSAGES ====================
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
      Object.keys(state.messages).forEach((channelId) => {
        state.messages[parseInt(channelId)] = state.messages[
          parseInt(channelId)
        ].filter((m) => m.id !== (action.payload as any).messageId);
      });
      state.successMessage = 'Message deleted';
    });

    // ==================== THREADS ====================
    builder
      .addCase(fetchThreadMessages.fulfilled, (state, action) => {
        state.threadMessages[action.payload.threadId] = action.payload.messages;
      });

    builder
      .addCase(replyToThread.fulfilled, (state, action) => {
        const threadId = action.payload.thread_id;
        if (threadId && state.threadMessages[threadId]) {
          state.threadMessages[threadId].push(action.payload);
        }
      });

    // ==================== UNREAD ====================
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
  setTypingUsers,
  addTypingUser,
  removeTypingUser,
  setOnlineUsers,
  resetChatState,
} = chatSlice.actions;

export default chatSlice.reducer;