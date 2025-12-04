// store/slices/chatSlice.ts
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
  Reaction,
  Attachment,
  UploadedFile,
  FileUploadProgress,
} from '../../lib/api/services/chat-service';

// ==================== STATE INTERFACE ====================
interface ChatState {
  channels: Channel[];
  selectedChannel: Channel | null;
  isLoadingChannels: boolean;

  messages: Record<number, Message[]>;
  isLoadingMessages: boolean;
  isSendingMessage: boolean;

  channelMembers: Record<number, Member[]>;
  isLoadingMembers: boolean;
  teamMembers: Member[];

  threadMessages: Record<number, Message[]>;
  isLoadingThread: boolean;

  pinnedMessages: Record<number, Message[]>;

  searchResults: SearchResults | null;
  isSearching: boolean;

  typingUsers: Record<number, Array<{ userId: number; userName?: string }>>;
  onlineUsers: number[];

  unreadCount: number;

  // ✅ File Upload State
  uploadingFiles: Record<string, {
    fileName: string;
    progress: number;
    status: 'uploading' | 'completed' | 'error';
    error?: string;
    result?: UploadedFile;
  }>;
  isUploading: boolean;

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
  threadMessages: {},
  isLoadingThread: false,
  pinnedMessages: {},
  searchResults: null,
  isSearching: false,
  typingUsers: {},
  onlineUsers: [],
  unreadCount: 0,
  // ✅ File Upload Initial State
  uploadingFiles: {},
  isUploading: false,
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
});

// ==================== FILE UPLOAD THUNKS ====================

export const uploadMessageFile = createAsyncThunk<
  UploadedFile,
  { file: File; messageId?: number; uploadId: string },
  { rejectValue: string }
>(
  'chat/uploadMessageFile',
  async ({ file, messageId, uploadId }, { dispatch, rejectWithValue }) => {
    try {
      const result = await ChatService.uploadMessageFile(
        file,
        messageId,
        (progress) => {
          dispatch(updateFileUploadProgress({
            uploadId,
            progress: progress.percentage,
          }));
        }
      );
      return result;
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to upload file');
    }
  }
);

export const uploadMultipleMessageFiles = createAsyncThunk<
  UploadedFile[],
  { files: File[]; messageId?: number },
  { rejectValue: string }
>(
  'chat/uploadMultipleMessageFiles',
  async ({ files, messageId }, { rejectWithValue }) => {
    try {
      const results = await ChatService.uploadMultipleMessageFiles(files, messageId);
      return results;
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to upload files');
    }
  }
);

export const deleteAttachment = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>(
  'chat/deleteAttachment',
  async (attachmentId, { rejectWithValue }) => {
    try {
      await ChatService.deleteAttachment(attachmentId);
      return attachmentId;
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Failed to delete attachment');
    }
  }
);

// ==================== ASYNC THUNKS ====================

// Channels
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

// Messages
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

// Members
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

// Threads
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

// Search
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

export const forwardMessage = createAsyncThunk(
  'chat/forwardMessage',
  async ({ messageId, targetChannelIds }: { messageId: number; targetChannelIds: number[] }, { rejectWithValue }) => {
    try {
      const response = await ChatService.forwardMessage(messageId, targetChannelIds);
      return response;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message || 'Failed to forward message');
    }
  }
);

// ==================== SLICE ====================
const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // UI State
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

    // ✅ File Upload Reducers
    startFileUpload: (state, action: PayloadAction<{ uploadId: string; fileName: string }>) => {
      state.uploadingFiles[action.payload.uploadId] = {
        fileName: action.payload.fileName,
        progress: 0,
        status: 'uploading',
      };
      state.isUploading = true;
    },

    updateFileUploadProgress: (state, action: PayloadAction<{ uploadId: string; progress: number }>) => {
      const upload = state.uploadingFiles[action.payload.uploadId];
      if (upload) {
        upload.progress = action.payload.progress;
      }
    },

    completeFileUpload: (state, action: PayloadAction<{ uploadId: string; result: UploadedFile }>) => {
      const upload = state.uploadingFiles[action.payload.uploadId];
      if (upload) {
        upload.status = 'completed';
        upload.progress = 100;
        upload.result = action.payload.result;
      }
      // Check if all uploads are complete
      const uploading = Object.values(state.uploadingFiles).some(u => u.status === 'uploading');
      state.isUploading = uploading;
    },

    failFileUpload: (state, action: PayloadAction<{ uploadId: string; error: string }>) => {
      const upload = state.uploadingFiles[action.payload.uploadId];
      if (upload) {
        upload.status = 'error';
        upload.error = action.payload.error;
      }
      const uploading = Object.values(state.uploadingFiles).some(u => u.status === 'uploading');
      state.isUploading = uploading;
    },

    clearFileUpload: (state, action: PayloadAction<string>) => {
      delete state.uploadingFiles[action.payload];
      const uploading = Object.values(state.uploadingFiles).some(u => u.status === 'uploading');
      state.isUploading = uploading;
    },

    clearAllFileUploads: (state) => {
      state.uploadingFiles = {};
      state.isUploading = false;
    },

    // Real-time Message Updates
    addMessageToChannel: (state, action: PayloadAction<Message>) => {
      const channelId = action.payload.channel_id;

      if (!state.messages[channelId]) {
        state.messages[channelId] = [];
      }

      const exists = state.messages[channelId].some((m) => m.id === action.payload.id);
      if (!exists) {
        state.messages[channelId] = [...state.messages[channelId], action.payload];
      }
    },

    updateMessageInChannel: (state, action: PayloadAction<{
      channelId: number;
      messageId: number;
      content?: string;
      mentions?: number[];
      editedAt?: string;
    }>) => {
      const { channelId, messageId, content, mentions, editedAt } = action.payload;

      const messages = state.messages[channelId];
      if (!messages) return;

      const message = messages.find(m => Number(m.id) === Number(messageId));
      if (!message) return;

      if (content !== undefined) message.content = content;
      if (mentions !== undefined) message.mentions = mentions;
      message.is_edited = true;
      message.edited_at = editedAt || new Date().toISOString();
    },


    removeMessageFromChannel: (state, action: PayloadAction<{
      channelId: number;
      messageId: number;
    }>) => {
      const { channelId, messageId } = action.payload;

      const messages = state.messages[channelId];
      if (!messages) return;

      state.messages[channelId] = messages.filter(m => Number(m.id) !== Number(messageId));
    },


    // Reactions
    addReactionToMessage: (state, action: PayloadAction<{
      messageId: number;
      channelId: number;
      reaction: {
        emoji: string;
        userId: number;
        userName?: string;
        avatarUrl?: string;
        timestamp?: string;
      };
    }>) => {
      const { messageId, channelId, reaction } = action.payload;

      const messages = state.messages[channelId];
      if (!messages) return;

      const message = messages.find(m =>
        Number(m.id) === Number(messageId) || m.id === messageId
      );

      if (!message) {
        console.error('❌ Message not found:', messageId);
        console.log('Available IDs:', messages.map(m => m.id));
        return;
      }

      if (!message.reactions) {
        message.reactions = [];
      }

      const existingReactionIndex = message.reactions.findIndex(
        r => r.emoji === reaction.emoji && r.user_id === reaction.userId
      );

      if (existingReactionIndex === -1) {
        message.reactions = [
          ...message.reactions,
          {
            user_id: reaction.userId,
            user_name: reaction.userName,
            emoji: reaction.emoji,
            avatar_url: reaction.avatarUrl,
            reacted_at: reaction.timestamp || new Date().toISOString(),
          }
        ];
      }
    },


    removeReactionFromMessage: (state, action: PayloadAction<{
      messageId: number;
      channelId: number;
      emoji: string;
      userId: number;
    }>) => {
      const { messageId, channelId, emoji, userId } = action.payload;

      const messages = state.messages[channelId];
      if (!messages) return;

      const message = messages.find(m => Number(m.id) === Number(messageId));
      if (!message || !message.reactions) return;

      message.reactions = message.reactions.filter(
        r => !(r.emoji === emoji && r.user_id === userId)
      );
    },


    // Pin Message
    pinMessageInChannel: (state, action: PayloadAction<{
      channelId: number;
      messageId: number;
      isPinned: boolean;
      pinnedBy?: number;
      pinnedAt?: string;
    }>) => {
      const { channelId, messageId, isPinned, pinnedBy, pinnedAt } = action.payload;

      const messages = state.messages[channelId];
      if (!messages) return;

      const message = messages.find(m => Number(m.id) === Number(messageId));
      if (!message) return;

      message.is_pinned = isPinned;
      if (isPinned) {
        message.pinned_by = pinnedBy;
        message.pinned_at = pinnedAt;
      }
    },


    // Delivery & Read Status
    updateMessageDeliveryStatus: (state, action: PayloadAction<{
      messageId: number;
      deliveredBy: number | string;
      deliveredCount?: number | string;
      timestamp?: string;
    }>) => {
      const { messageId, deliveredBy, deliveredCount, timestamp } = action.payload;

      for (const channelId in state.messages) {
        const messages = state.messages[channelId];
        const message = messages.find(m => Number(m.id) === Number(messageId));

        if (message) {
          message.is_delivered = true;
          message.delivered_count = typeof deliveredCount === 'string' ? parseInt(deliveredCount) : deliveredCount;

          if (!message.delivered_to_user_ids) {
            message.delivered_to_user_ids = String(deliveredBy);
          } else {
            const deliveredArray = message.delivered_to_user_ids.split(',').map(id => id.trim());
            const deliveredByStr = String(deliveredBy);
            if (!deliveredArray.includes(deliveredByStr)) {
              message.delivered_to_user_ids = [...deliveredArray, deliveredByStr].join(',');
            }
          }
          return;
        }
      }
    },



    updateMessageReadStatus: (state, action: PayloadAction<{
      messageId: number;
      readBy: number | string;
      readByName?: string;
      readCount?: number | string;
      timestamp?: string;
    }>) => {
      const { messageId, readBy, readByName, readCount, timestamp } = action.payload;

      for (const channelId in state.messages) {
        const messages = state.messages[channelId];
        const message = messages.find(m => Number(m.id) === Number(messageId));

        if (message) {
          message.is_read = true;
          message.read_count = typeof readCount === 'string' ? parseInt(readCount) : readCount;

          if (!message.read_by_user_ids) {
            message.read_by_user_ids = String(readBy);
          } else {
            const readByArray = message.read_by_user_ids.split(',').map(id => id.trim());
            const readByStr = String(readBy);
            if (!readByArray.includes(readByStr)) {
              message.read_by_user_ids = [...readByArray, readByStr].join(',');
            }
          }
          return;
        }
      }
    },


    // Thread Updates
    updateThreadReplyCount: (state, action: PayloadAction<{
      messageId: number;
      increment: number;
    }>) => {
      const { messageId, increment } = action.payload;

      for (const channelId in state.messages) {
        const messages = state.messages[channelId];
        const message = messages.find(m => Number(m.id) === Number(messageId));

        if (message) {
          message.reply_count = (message.reply_count || 0) + increment;
          return;
        }
      }
    },


    addMessageToThread: (state, action: PayloadAction<{
      parentMessageId: number;
      message: Message;
    }>) => {
      const { parentMessageId, message } = action.payload;

      if (!state.threadMessages[parentMessageId]) {
        state.threadMessages[parentMessageId] = [];
      }

      const exists = state.threadMessages[parentMessageId].some((m) => m.id === message.id);
      if (!exists) {
        state.threadMessages[parentMessageId] = [...state.threadMessages[parentMessageId], message];
      }

      if (state.messages[message.channel_id]) {
        const existsInChannel = state.messages[message.channel_id].some((m) => m.id === message.id);
        if (!existsInChannel) {
          state.messages[message.channel_id] = [...state.messages[message.channel_id], message];
        }
      }
    },

    // Typing Indicators
    addTypingUser: (state, action: PayloadAction<{
      channelId: number;
      userId: number;
      userName?: string;
    }>) => {
      const { channelId, userId, userName } = action.payload;
      console.log('🔴 Redux: addTypingUser', { channelId, userId, userName });

      const currentTyping = state.typingUsers[channelId] || [];
      const exists = currentTyping.some(u => Number(u.userId) === Number(userId));

      if (!exists) {
        state.typingUsers = {
          ...state.typingUsers,
          [channelId]: [
            ...currentTyping,
            { userId: Number(userId), userName: userName || `User ${userId}` }
          ]
        };
        console.log('✅ Typing user added. New state:', state.typingUsers[channelId]);
      } else {
        console.log('⚠️ User already typing');
      }
    },

    removeTypingUser: (state, action: PayloadAction<{
      channelId: number;
      userId: number;
    }>) => {
      const { channelId, userId } = action.payload;
      console.log('🔴 Redux: removeTypingUser', { channelId, userId });

      const currentTyping = state.typingUsers[channelId];
      if (currentTyping && currentTyping.length > 0) {
        state.typingUsers = {
          ...state.typingUsers,
          [channelId]: currentTyping.filter(u => Number(u.userId) !== Number(userId))
        };
        console.log('✅ Typing user removed. Remaining:', state.typingUsers[channelId]);
      }
    },


    // Member Management
    addMembersToChannel: (state, action: PayloadAction<{
      channelId: number;
      userIds: number[];
    }>) => {
      const { channelId, userIds } = action.payload;
      const channel = state.channels.find((c) => c.id === channelId);
      if (channel) {
        channel.member_count += userIds.length;
      }
      if (state.channelMembers[channelId]) {
        delete state.channelMembers[channelId];
      }
    },

    // Unread Management
    incrementUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount += 1;
    },

    resetUnreadCount: (state, action: PayloadAction<number>) => {
      const channelId = action.payload;
      const channel = state.channels.find((c) => c.id === channelId);
      if (channel) {
        state.unreadCount = Math.max(0, state.unreadCount - channel.unread_count);
        channel.unread_count = 0;
      }
    },

    // Online Users
    setOnlineUsers: (state, action: PayloadAction<number[]>) => {
      state.onlineUsers = action.payload;
    },

    resetChatState: () => initialState,
  },

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
          state.messages[channelId] = [...state.messages[channelId], action.payload];
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isSendingMessage = false;
        state.error = action.payload as string;
      })

      // Members
      .addCase(fetchChannelMembers.pending, (state) => {
        state.isLoadingMembers = true;
      })
      .addCase(fetchChannelMembers.fulfilled, (state, action) => {
        state.isLoadingMembers = false;
        state.channelMembers[action.payload.channelId] = action.payload.members;
      })
      .addCase(fetchChannelMembers.rejected, (state) => {
        state.isLoadingMembers = false;
      })
      .addCase(fetchTeamMembers.fulfilled, (state, action) => {
        state.teamMembers = action.payload;
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

      // Search
      .addCase(searchChat.pending, (state) => {
        state.isSearching = true;
      })
      .addCase(searchChat.fulfilled, (state, action: any) => {
        state.isSearching = false;
        state.searchResults = action.payload?.data || action.payload;
      })
      .addCase(searchChat.rejected, (state, action) => {
        state.isSearching = false;
        state.error = action.payload as string;
      })

      // Unread Count
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })

      // ✅ File Upload Cases
      .addCase(uploadMessageFile.pending, (state, action) => {
        const uploadId = action.meta.arg.uploadId;
        state.uploadingFiles[uploadId] = {
          fileName: action.meta.arg.file.name,
          progress: 0,
          status: 'uploading',
        };
        state.isUploading = true;
      })
      .addCase(uploadMessageFile.fulfilled, (state, action) => {
        const uploadId = action.meta.arg.uploadId;
        if (state.uploadingFiles[uploadId]) {
          state.uploadingFiles[uploadId].status = 'completed';
          state.uploadingFiles[uploadId].progress = 100;
          state.uploadingFiles[uploadId].result = action.payload;
        }
        const uploading = Object.values(state.uploadingFiles).some(u => u.status === 'uploading');
        state.isUploading = uploading;
      })
      .addCase(uploadMessageFile.rejected, (state, action) => {
        const uploadId = action.meta.arg.uploadId;
        if (state.uploadingFiles[uploadId]) {
          state.uploadingFiles[uploadId].status = 'error';
          state.uploadingFiles[uploadId].error = action.payload as string;
        }
        const uploading = Object.values(state.uploadingFiles).some(u => u.status === 'uploading');
        state.isUploading = uploading;
      })

      .addCase(uploadMultipleMessageFiles.pending, (state) => {
        state.isUploading = true;
      })
      .addCase(uploadMultipleMessageFiles.fulfilled, (state) => {
        state.isUploading = false;
      })
      .addCase(uploadMultipleMessageFiles.rejected, (state, action) => {
        state.isUploading = false;
        state.error = action.payload as string;
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
  setOnlineUsers,
  incrementUnreadCount,
  resetUnreadCount,
  resetChatState,
  updateMessageDeliveryStatus,
  updateMessageReadStatus,
  updateThreadReplyCount,
  addMembersToChannel,
  addMessageToThread,
  addTypingUser,
  removeTypingUser,
  addReactionToMessage,
  removeReactionFromMessage,
  updateMessageInChannel,
  removeMessageFromChannel,
  pinMessageInChannel,
  // ✅ File Upload Actions
  startFileUpload,
  updateFileUploadProgress,
  completeFileUpload,
  failFileUpload,
  clearFileUpload,
  clearAllFileUploads,
} = chatSlice.actions;

export default chatSlice.reducer;