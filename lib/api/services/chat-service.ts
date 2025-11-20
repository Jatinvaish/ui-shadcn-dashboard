// lib/api/services/chat-service.ts - ULTRA-OPTIMIZED v5.0
import { encryptedApiClient } from '../encrypted-client';
import { API_ENDPOINTS } from '../endpoints';

// ==================== HELPER ====================
const extractData = <T>(response: any): T => {
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data as T;
  }
  return response as T;
};

// ==================== ENUMS ====================
export enum ChannelType {
  DIRECT = 'direct',
  GROUP = 'group',
  CAMPAIGN = 'campaign',
  PROJECT = 'project',
  PUBLIC = 'public',
  PRIVATE = 'private',
}

export enum MemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  GUEST = 'guest',
}

export enum MessageType {
  TEXT = 'text',
  FILE = 'file',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  SYSTEM = 'system',
}

// ==================== INTERFACES ====================
export interface Channel {
  id: number;
  name: string;
  description?: string;
  channel_type: ChannelType;
  is_private: boolean;
  member_count: number;
  message_count: number;
  unread_count: number;
  last_message_preview?: string;
  last_message_at?: string;
  last_activity_at: string;
  user_role: MemberRole;
  is_muted: boolean;
  last_read_message_id?: number;
  last_read_at?: string;
  encrypted_channel_key?: string;
  encryption_version?: string;
  encryption_algorithm?: string;
}

export interface Message {
  id: number;
  channel_id: number;
  sender_user_id: number;
  sender_first_name: string;
  sender_last_name: string;
  sender_avatar_url?: string;
  message_type: MessageType;
  encrypted_content: string;
  encryption_iv: string;
  encryption_auth_tag: string;
  content_hash?: string;
  is_edited: boolean;
  edited_at?: string;
  is_deleted: boolean;
  is_pinned: boolean;
  reply_to_message_id?: number;
  thread_id?: number;
  sent_at: string;
  created_at: string;
  reaction_count: number;
  reply_count: number;
}

export interface Member {
  id: number;
  user_id: number;
  channel_id: number;
  role: MemberRole;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
  status?: string;
  last_active_at?: string;
  is_muted: boolean;
}

// ==================== PAYLOADS ====================
export interface SendMessagePayload {
  channelId: number;
  messageType?: MessageType;
  encryptedContent: string;
  encryptionIv: string;
  encryptionAuthTag: string;
  replyToMessageId?: number;
  threadId?: number;
  mentions?: number[];
}

export interface CreateChannelPayload {
  name: string;
  description?: string;
  channelType: ChannelType;
  isPrivate?: boolean;
  memberIds?: number[];
}

export interface UpdateChannelPayload {
  channelId: number;
  name?: string;
  description?: string;
}

export interface ArchiveChannelPayload {
  channelId: number;
  isArchived: boolean;
}

export interface UpdateMemberNotificationPayload {
  channelId: number;
  isMuted?: boolean;
  notificationSettings?: any;
}

export interface EditMessagePayload {
  messageId: number;
  encryptedContent: string;
  encryptionIv: string;
  encryptionAuthTag: string;
}

export interface DeleteMessagePayload {
  messageId: number;
  hardDelete?: boolean;
}

export interface MarkAsReadPayload {
  channelId: number;
  messageId?: number;
}

export interface GetThreadMessagesPayload {
  threadId: number;
  limit?: number;
  offset?: number;
}

// ==================== CHAT SERVICE ====================
export class ChatService {
  // ==================== ULTRA-FAST ENDPOINTS (V2) ====================

  /**
   * ✅ Send message using ultra-fast endpoint (<80ms target)
   */
  static async sendMessageUltraFast(payload: SendMessagePayload): Promise<Message> {
    const response = await encryptedApiClient.post(
      API_ENDPOINTS.CHAT.V2.SEND,
      payload
    );
    return extractData<Message>(response);
  }

  /**
   * ✅ Get messages using ultra-fast endpoint (<50ms target)
   */
  static async getMessagesUltraFast(
    channelId: number,
    limit: number = 50,
    beforeId?: number
  ): Promise<Message[]> {
    const response = await encryptedApiClient.get(
      API_ENDPOINTS.CHAT.V2.GET_MESSAGES,
      {
        params: { channelId, limit, beforeId },
      }
    );
    return extractData<Message[]>(response);
  }

  /**
   * ✅ Batch send messages
   */
  static async sendMessageBatch(messages: SendMessagePayload[]): Promise<any> {
    const response = await encryptedApiClient.post(
      API_ENDPOINTS.CHAT.V2.BATCH_SEND,
      { messages }
    );
    return extractData(response);
  }

  /**
   * ✅ Mark as read (fire and forget - 202 Accepted)
   */
  static async markAsReadUltraFast(channelId: number, messageId?: number): Promise<void> {
    await encryptedApiClient.post(API_ENDPOINTS.CHAT.V2.MARK_READ, {
      channelId,
      messageId,
    });
  }

  /**
   * ✅ Get unread count (cached)
   */
  static async getUnreadCountUltraFast(): Promise<any> {
    const response = await encryptedApiClient.get(API_ENDPOINTS.CHAT.V2.UNREAD_COUNT);
    return extractData(response);
  }

  // ==================== CHANNELS ====================

  static async getUserChannels(payload: any = {}): Promise<Channel[]> {
    const response = await encryptedApiClient.post(
      API_ENDPOINTS.CHAT.CHANNELS.LIST,
      payload
    );
    return extractData<Channel[]>(response);
  }

  static async getChannelById(channelId: number): Promise<Channel> {
    const response = await encryptedApiClient.post(
      API_ENDPOINTS.CHAT.CHANNELS.GET_BY_ID,
      { channelId }
    );
    return extractData<Channel>(response);
  }

  static async createChannel(payload: CreateChannelPayload): Promise<Channel> {
    const response = await encryptedApiClient.post(
      API_ENDPOINTS.CHAT.CHANNELS.CREATE,
      payload
    );
    return extractData<Channel>(response);
  }

  static async updateChannel(payload: UpdateChannelPayload): Promise<Channel> {
    const response = await encryptedApiClient.post(
      API_ENDPOINTS.CHAT.CHANNELS.UPDATE,
      payload
    );
    return extractData<Channel>(response);
  }

  static async archiveChannel(payload: ArchiveChannelPayload): Promise<any> {
    const response = await encryptedApiClient.post(
      API_ENDPOINTS.CHAT.CHANNELS.ARCHIVE,
      payload
    );
    return extractData(response);
  }

  static async deleteChannel(channelId: number): Promise<any> {
    const response = await encryptedApiClient.post(
      API_ENDPOINTS.CHAT.CHANNELS.DELETE,
      { channelId }
    );
    return extractData(response);
  }

  static async leaveChannel(channelId: number): Promise<any> {
    const response = await encryptedApiClient.post(
      API_ENDPOINTS.CHAT.CHANNELS.LEAVE,
      { channelId }
    );
    return extractData(response);
  }

  // ==================== MEMBERS ====================

  static async getChannelMembers(channelId: number): Promise<Member[]> {
    const response = await encryptedApiClient.post(
      API_ENDPOINTS.CHAT.MEMBERS.LIST,
      { channelId }
    );
    return extractData<Member[]>(response);
  }

  static async addChannelMembers(payload: any): Promise<any> {
    const response = await encryptedApiClient.post(
      API_ENDPOINTS.CHAT.MEMBERS.ADD,
      payload
    );
    return extractData(response);
  }

  static async removeChannelMember(payload: any): Promise<any> {
    const response = await encryptedApiClient.post(
      API_ENDPOINTS.CHAT.MEMBERS.REMOVE,
      payload
    );
    return extractData(response);
  }

  static async updateMemberNotification(
    payload: UpdateMemberNotificationPayload
  ): Promise<any> {
    const response = await encryptedApiClient.post(
      API_ENDPOINTS.CHAT.NOTIFICATIONS.UPDATE,
      payload
    );
    return extractData(response);
  }

  // ==================== MESSAGES ====================

  static async getMessages(channelId: number, payload: any = {}): Promise<Message[]> {
    const response = await encryptedApiClient.post(
      API_ENDPOINTS.CHAT.MESSAGES.LIST,
      { channelId, ...payload }
    );
    return extractData<Message[]>(response);
  }

  static async sendMessage(payload: SendMessagePayload): Promise<Message> {
    const response = await encryptedApiClient.post(
      API_ENDPOINTS.CHAT.MESSAGES.SEND,
      payload
    );
    return extractData<Message>(response);
  }

  static async editMessage(payload: EditMessagePayload): Promise<Message> {
    const response = await encryptedApiClient.post(
      API_ENDPOINTS.CHAT.MESSAGES.EDIT,
      payload
    );
    return extractData<Message>(response);
  }

  static async deleteMessage(payload: DeleteMessagePayload): Promise<any> {
    const response = await encryptedApiClient.post(
      API_ENDPOINTS.CHAT.MESSAGES.DELETE,
      payload
    );
    return extractData(response);
  }

  static async reactToMessage(messageId: number, emoji: string): Promise<any> {
    const response = await encryptedApiClient.post(
      API_ENDPOINTS.CHAT.REACTIONS.ADD,
      { messageId, emoji }
    );
    return extractData(response);
  }

  static async pinMessage(messageId: number, isPinned: boolean): Promise<any> {
    const response = await encryptedApiClient.post(
      API_ENDPOINTS.CHAT.MESSAGES.PIN,
      { messageId, isPinned }
    );
    return extractData(response);
  }

  // ==================== THREADS ====================

  static async getThreadMessages(payload: GetThreadMessagesPayload): Promise<Message[]> {
    const response = await encryptedApiClient.post(
      API_ENDPOINTS.CHAT.THREADS.MESSAGES,
      payload
    );
    return extractData<Message[]>(response);
  }

  static async replyToThread(payload: SendMessagePayload): Promise<Message> {
    const response = await encryptedApiClient.post(
      API_ENDPOINTS.CHAT.THREADS.REPLY,
      payload
    );
    return extractData<Message>(response);
  }

  // ==================== READ RECEIPTS ====================

  static async markAsRead(payload: MarkAsReadPayload): Promise<any> {
    const response = await encryptedApiClient.post(
      API_ENDPOINTS.CHAT.MARK_READ,
      payload
    );
    return extractData(response);
  }

  static async getUnreadCount(): Promise<any> {
    const response = await encryptedApiClient.post(
      API_ENDPOINTS.CHAT.UNREAD.COUNT,
      {}
    );
    return extractData(response);
  }

  // ==================== PRESENCE ====================

  static async updatePresence(status: 'online' | 'away' | 'offline'): Promise<any> {
    const response = await encryptedApiClient.post(
      API_ENDPOINTS.CHAT.PRESENCE.UPDATE,
      { status }
    );
    return extractData(response);
  }

  static async startTyping(channelId: number): Promise<void> {
    await encryptedApiClient.post(API_ENDPOINTS.CHAT.PRESENCE.TYPING_START, {
      channelId,
    });
  }

  static async stopTyping(channelId: number): Promise<void> {
    await encryptedApiClient.post(API_ENDPOINTS.CHAT.PRESENCE.TYPING_STOP, {
      channelId,
    });
  }

  // ==================== SEARCH ====================

  static async searchMessages(payload: any): Promise<Message[]> {
    const response = await encryptedApiClient.post(
      API_ENDPOINTS.CHAT.SEARCH,
      payload
    );
    return extractData<Message[]>(response);
  }
}