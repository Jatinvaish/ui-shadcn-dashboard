// lib/api/services/chat-service.ts - MATCHES YOUR BACKEND 100%
import { encryptedApiClient } from '../encrypted-client';

// ==================== HELPER ====================
const extractData = <T>(response: any): T => {
  if (response && typeof response === 'object') {
    if (response.data && response.data.channels) {
      return response.data.channels as T;
    }
    if (response.data && response.data.messages) {
      return response.data.messages as T;
    }
    if (response.data && response.data.members) {
      return response.data.members as T;
    }
    if ('data' in response) {
      return response.data as T;
    }
  }
  return response as T;
};

// ==================== ENUMS ====================
export enum ChannelType {
  DIRECT = 'direct',
  GROUP = 'group',
  CAMPAIGN = 'campaign',
}

export enum MessageType {
  TEXT = 'text',
  FILE = 'file',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
}

// ==================== INTERFACES ====================
export interface Channel {
  id: number;
  channel_id?: string;
  name: string;
  description?: string;
  channel_type: ChannelType;
  is_private?: boolean;
  member_count: number;
  message_count: number;
  unread_count: number;
  last_message_at?: string;
  last_activity_at?: string;
  is_muted?: boolean;
  last_read_message_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Message {
  id: number;
  channel_id: number;
  sender_user_id: number;
  sender_tenant_id: number;
  sender_first_name?: string;
  sender_last_name?: string;
  sender_avatar_url?: string;
  message_type: MessageType;
  content: string; // Plain text - NO encryption
  has_attachments?: boolean;
  has_mentions?: boolean;
  is_edited?: boolean;
  edited_at?: string;
  is_deleted?: boolean;
  is_pinned?: boolean;
  reply_to_message_id?: number;
  thread_id?: number;
  sent_at: string;
  created_at: string;
  reaction_count?: number;
  reply_count?: number;
  reactions?: Reaction[];
}

export interface Reaction {
  id: number;
  message_id: number;
  user_id: number;
  emoji: string;
  created_at: string;
}

export interface Member {
  id: number;
  user_id: number;
  channel_id: number;
  role: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
  is_muted?: boolean;
  joined_at: string;
}

// ==================== PAYLOADS ====================
export interface SendMessagePayload {
  channelId: number;
  content: string; // Plain text content
  messageType?: string;
  attachments?: number[];
  mentions?: number[];
  replyToMessageId?: number;
  threadId?: number;
}

export interface CreateChannelPayload {
  name?: string;
  description?: string;
  channelType?: string;
  participantIds: number[];
  relatedType?: string;
  relatedId?: number;
}

export interface UpdateChannelPayload {
  name?: string;
  description?: string;
  settings?: any;
}

export interface MarkAsReadPayload {
  channelId: number;
  messageId: number;
}

export interface AddReactionPayload {
  messageId: number;
  emoji: string;
}

export interface StartTeamChatPayload {
  memberIds: number[];
  name?: string;
}

// ==================== CHAT SERVICE ====================
export class ChatService {
  // ==================== MESSAGES ====================

  /**
   * Send message (plain text - no encryption)
   * POST /api/chat/messages/send
   */
  static async sendMessage(payload: SendMessagePayload): Promise<Message> {
    const response = await encryptedApiClient.post('/chat/messages/send', payload);
    return extractData<Message>(response);
  }

  /**
   * Get messages
   * GET /api/chat/messages?channelId=X&limit=50&beforeId=Y
   */
  static async getMessages(
    channelId: number,
    limit: number = 50,
    beforeId?: number
  ): Promise<Message[]> {
    const response = await encryptedApiClient.get('/chat/messages', {
      params: { channelId, limit, beforeId },
    });
    return extractData<Message[]>(response);
  }

  /**
   * Mark as read
   * POST /api/chat/messages/mark-read
   */
  static async markAsRead(channelId: number, messageId: number): Promise<void> {
    await encryptedApiClient.post('/chat/messages/mark-read', {
      channelId,
      messageId,
    });
  }

  /**
   * Get unread count
   * GET /api/chat/unread
   */
  static async getUnreadCount(): Promise<{ unread: number }> {
    const response = await encryptedApiClient.get('/chat/unread');
    return extractData(response);
  }

  // ==================== REACTIONS ====================

  /**
   * Add reaction
   * POST /api/chat/messages/reaction
   */
  static async addReaction(messageId: number, emoji: string): Promise<void> {
    await encryptedApiClient.post('/chat/messages/reaction', {
      messageId,
      emoji,
    });
  }

  /**
   * Remove reaction
   * POST /api/chat/messages/reaction/remove
   */
  static async removeReaction(messageId: number, emoji: string): Promise<void> {
    await encryptedApiClient.post('/chat/messages/reaction/remove', {
      messageId,
      emoji,
    });
  }

  // ==================== CHANNELS ====================

  /**
   * Get user's channels
   * GET /api/chat/channels?limit=50
   */
  static async getUserChannels(limit: number = 50): Promise<Channel[]> {
    const response = await encryptedApiClient.get('/chat/channels', {
      params: { limit },
    });
    return extractData<Channel[]>(response);
  }

  /**
   * Get channel by ID
   * GET /api/chat/channels/:id
   */
  static async getChannelById(channelId: number): Promise<Channel> {
    const response = await encryptedApiClient.get('/chat/channels/:id', {
      params: { id: channelId },
    });
    return extractData<Channel>(response);
  }

  /**
   * Create channel
   * POST /api/chat/channels/create
   */
  static async createChannel(payload: CreateChannelPayload): Promise<Channel> {
    const response = await encryptedApiClient.post('/chat/channels/create', payload);
    return extractData<Channel>(response);
  }

  // ==================== TEAM COLLABORATION ====================

  /**
   * Get team members
   * GET /api/chat/team/members
   */
  static async getTeamMembers(): Promise<Member[]> {
    const response = await encryptedApiClient.get('/chat/team/members');
    return extractData<Member[]>(response);
  }

  /**
   * Start team chat
   * POST /api/chat/team/start-chat
   */
  static async startTeamChat(payload: StartTeamChatPayload): Promise<Channel> {
    const response = await encryptedApiClient.post('/chat/team/start-chat', payload);
    return extractData<Channel>(response);
  }

  // ==================== HEALTH CHECK ====================

  /**
   * Health check
   * GET /api/chat/health
   */
  static async getHealth(): Promise<any> {
    const response = await encryptedApiClient.get('/chat/health');
    return extractData(response);
  }
}