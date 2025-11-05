// lib/api/chat.service.ts
import { encryptedApiClient } from "../encrypted-client";
import { API_ENDPOINTS } from "../endpoints";

// ==================== TYPES ====================
export enum ChannelType {
  PUBLIC = 'public',
  PRIVATE = 'private',
  DIRECT = 'direct',
  PROJECT = 'project',
}

export enum MemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

export enum MessageType {
  TEXT = 'text',
  FILE = 'file',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
}

// ==================== CHANNEL INTERFACES ====================
export interface CreateChannelPayload {
  name: string;
  description?: string;
  channelType: ChannelType;
  relatedType?: string;
  relatedId?: string;
  isPrivate?: boolean;
  memberIds?: string[];
}

export interface UpdateChannelPayload {
  channelId: string;
  name?: string;
  description?: string;
  isPrivate?: boolean;
  settings?: any;
}

export interface ArchiveChannelPayload {
  channelId: string;
  isArchived: boolean;
}

export interface GetChannelsPayload {
  channelType?: ChannelType;
  isArchived?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

// ==================== MEMBER INTERFACES ====================
export interface AddChannelMembersPayload {
  channelId: string;
  userIds: string[];
  role?: MemberRole;
}

export interface RemoveChannelMemberPayload {
  channelId: string;
  userId: string;
}

export interface UpdateMemberRolePayload {
  channelId: string;
  userId: string;
  role: MemberRole;
}

export interface UpdateMemberNotificationPayload {
  channelId: string;
  isMuted?: boolean;
  notificationSettings?: any;
}

// ==================== MESSAGE INTERFACES ====================
export interface SendMessagePayload {
  channelId: number;
  content: string;
  messageType?: MessageType;
  formattedContent?: string;
  replyToMessageId?: string;
  threadId?: string;
  attachments?: any[];
  mentions?: string[];
}

export interface EditMessagePayload {
  messageId: string;
  content: string;
  formattedContent?: string;
}

export interface GetMessagesPayload {
  channelId: string;
  limit?: number;
  offset?: number;
  beforeMessageId?: string;
  afterMessageId?: string;
  includeDeleted?: boolean;
}

export interface ReactToMessagePayload {
  messageId: string;
  emoji: string;
}

export interface PinMessagePayload {
  messageId: string;
  isPinned: boolean;
}

export interface MarkAsReadPayload {
  channelId: string;
  messageId?: string;
}

// ==================== SEARCH & DM INTERFACES ====================
export interface SearchMessagesPayload {
  query: string;
  channelId?: string;
  userId?: string;
  messageType?: MessageType;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface CreateDirectMessagePayload {
  recipientUserId: string;
  content: string;
  attachments?: any[];
}

export interface GetThreadMessagesPayload {
  limit?: number;
  offset?: number;
}

// ==================== CHAT SERVICE ====================
export class ChatService {
  // ==================== CHANNELS ====================
  static async getUserChannels(payload: GetChannelsPayload) {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.CHANNELS.LIST, payload);
  }

  static async getChannelById(channelId: string) {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.CHANNELS.GET_BY_ID, { channelId: parseInt(channelId) });
  }

  static async createChannel(payload: CreateChannelPayload) {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.CHANNELS.CREATE, payload);
  }

  static async updateChannel(payload: UpdateChannelPayload) {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.CHANNELS.UPDATE, payload);
  }

  static async archiveChannel(payload: ArchiveChannelPayload) {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.CHANNELS.ARCHIVE, payload);
  }

  static async deleteChannel(channelId: string) {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.CHANNELS.DELETE, { channelId: parseInt(channelId) });
  }

  // ==================== CHANNEL MEMBERS ====================
  static async getChannelMembers(channelId: string) {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.MEMBERS.LIST, { channelId: parseInt(channelId) });
  }

  static async addChannelMembers(payload: AddChannelMembersPayload) {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.MEMBERS.ADD, payload);
  }

  static async removeChannelMember(payload: RemoveChannelMemberPayload) {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.MEMBERS.REMOVE, {
      channelId: parseInt(payload.channelId),
      userId: parseInt(payload.userId)
    });
  }

  static async updateMemberRole(payload: UpdateMemberRolePayload) {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.MEMBERS.UPDATE_ROLE, payload);
  }

  static async updateMemberNotification(payload: UpdateMemberNotificationPayload) {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.NOTIFICATIONS.UPDATE, payload);
  }

  static async leaveChannel(channelId: string) {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.CHANNELS.LEAVE, { channelId: parseInt(channelId) });
  }

  // ==================== MESSAGES ====================
  static async getMessages(payload: GetMessagesPayload) {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.MESSAGES.LIST, payload);
  }

  static async sendMessage(payload: SendMessagePayload) {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.MESSAGES.SEND, payload);
  }

  static async editMessage(payload: EditMessagePayload) {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.MESSAGES.EDIT, payload);
  }

  static async deleteMessage(messageId: string, hardDelete: boolean = false) {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.MESSAGES.DELETE, {
      messageId: parseInt(messageId),
      hardDelete
    });
  }

  static async reactToMessage(payload: ReactToMessagePayload) {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.REACTIONS.ADD, payload);
  }

  static async getMessageReactions(messageId: string) {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.REACTIONS.LIST, { messageId: parseInt(messageId) });
  }

  static async pinMessage(payload: PinMessagePayload) {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.MESSAGES.PIN, payload);
  }

  static async getPinnedMessages(channelId: string) {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.CHANNELS.PINNED_MESSAGES, { channelId: parseInt(channelId) });
  }

  // ==================== THREADS ====================
  static async getThreadMessages(threadId: string, payload: GetThreadMessagesPayload) {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.THREADS.MESSAGES, {
      threadId: parseInt(threadId),
      ...payload
    });
  }

  // ==================== SEARCH ====================
  static async searchMessages(payload: SearchMessagesPayload) {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.SEARCH, payload);
  }

  // ==================== DIRECT MESSAGES ====================
  static async createDirectMessage(payload: CreateDirectMessagePayload) {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.DIRECT.SEND, payload);
  }

  // ==================== READ RECEIPTS ====================
  static async markAsRead(payload: MarkAsReadPayload) {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.MARK_READ, payload);
  }

  static async getUnreadCount() {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.UNREAD.COUNT, {});
  }

  // ==================== FILES ====================
  static async getChannelFiles(channelId: string, limit: number = 50, offset: number = 0) {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.FILES.LIST, {
      channelId: parseInt(channelId),
      limit,
      offset
    });
  }

  static async uploadFile(channelId: string, file: File, caption?: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('channelId', channelId);
    if (caption) formData.append('caption', caption);

    return encryptedApiClient.post(API_ENDPOINTS.CHAT.FILES.UPLOAD, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
}