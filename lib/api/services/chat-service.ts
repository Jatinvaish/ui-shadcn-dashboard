// lib/api/services/chat-service.ts - COMPLETE & ALIGNED WITH BACKEND
import { encryptedApiClient } from '../encrypted-client';
import { API_ENDPOINTS } from '../endpoints';

// ==================== HELPER ====================
const extractData = <T>(response: any): T => {
  if (response?.data?.channels) return response.data.channels as T;
  if (response?.data?.messages) return response.data.messages as T;
  if (response?.data?.members) return response.data.members as T;
  if (response?.data?.data) return response.data.data as T;
  if (response?.data) return response.data as T;
  if (response?.channels) return response.channels as T;
  if (response?.messages) return response.messages as T;
  return response as T;
};

// ==================== ENUMS ====================
export enum ChannelType {
  DIRECT = 'direct',
  GROUP = 'group',
  CAMPAIGN = 'campaign',
  PROJECT = 'project'
}

export enum MessageType {
  TEXT = 'text',
  FILE = 'file',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  SYSTEM = 'system'
}

// ==================== INTERFACES ====================
export interface Channel {
  id: number;
  channel_id?: string;
  name: string;
  description?: string;
  channel_type: ChannelType;
  is_private?: boolean;
  is_archived?: boolean;
  member_count: number;
  message_count: number;
  unread_count: number;
  last_message_at?: string;
  last_activity_at?: string;
  is_muted?: boolean;
  is_pinned?: number | boolean;
  mute_until?: string;
  role?: string;
  user_role?: string;
  last_read_message_id?: number;
  created_at?: string;
  updated_at?: string;
  isExisting?: boolean;
  related_type?: string;
  related_id?: number;
}

export interface Reaction {
  id: number;
  message_id: number;
  user_id: number;
  emoji: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Attachment {
  id: number;
  message_id?: number;
  file_name: string;
  file_size: number;
  content_type?: string;
  mime_type?: string;
  file_url: string;
  thumbnail_url?: string;
  created_at: string;
}

export interface Message {
  id: number;
  channel_id: number;
  sender_user_id: number;
  sender_tenant_id: number;
  first_name?: string;
  last_name?: string;
  sender_first_name?: string;
  sender_last_name?: string;
  sender_email?: string;
  avatar_url?: string;
  sender_avatar_url?: string;
  message_type: MessageType;
  content: string;
  
  // Flags
  has_attachments?: boolean;
  has_mentions?: boolean;
  is_edited?: boolean;
  is_deleted?: boolean;
  is_pinned?: boolean;
  
  // Timestamps
  sent_at: string;
  created_at: string;
  edited_at?: string;
  pinned_at?: string;
  pinned_by?: number;
  deleted_at?: string;
  
  // Thread info
  reply_to_message_id?: number;
  thread_id?: number;
  reply_count?: number;
  reply_to_author_name?: string;
  reply_to_content?: string;
  
  // Counts
  reaction_count?: number;
  attachment_count?: number;
  read_count?: number;
  delivered_count?: number;
  
  // Related data
  reactions?: Reaction[];
  attachments?: Attachment[];
  mentions?: number[];
  mentioned_user_ids?: string;
  mention_ids?: string;
  
  // Read status
  is_read_by_me?: boolean;
  am_i_mentioned?: boolean;
  read_by_user_ids?: string;
  delivered_to_user_ids?: string;
  
  // Additional
  channel_name?: string;
  metadata?: any;
}

export interface Member {
  id?: number;
  user_id: number;
  channel_id?: number;
  role: string;
  first_name: string;
  last_name: string;
  display_name?: string;
  email: string;
  avatar_url?: string;
  status?: string;
  last_active_at?: string;
  is_muted?: boolean;
  mute_until?: string;
  joined_at?: string;
  is_active?: number;
}

export interface SearchResults {
  messages?: Message[];
  channels?: Channel[];
  members?: Member[];
}

export interface Activity {
  id: number;
  activity_type: string;
  subject_type: string;
  subject_id: number;
  action: string;
  description: string;
  metadata?: any;
  is_read: number;
  created_at: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}

export interface Notification {
  id: number;
  event_type: string;
  channel: string;
  subject?: string;
  message: string;
  data?: any;
  priority: string;
  read_at?: string;
  created_at: string;
}

export interface MessageReadStatus {
  messageId: number;
  read_by_user_ids?: string;
  delivered_to_user_ids?: string;
  readByUserIds?: number[];
  deliveredToUserIds?: number[];
  readCount: number;
  deliveredCount: number;
  readBy?: any[];
  deliveredTo?: any[];
}

// ==================== PAYLOADS ====================
export interface SendMessagePayload {
  channelId: number;
  content: string;
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
  isPrivate?: boolean;
  relatedType?: string;
  relatedId?: number;
}

export interface UpdateChannelPayload {
  name?: string;
  description?: string;
  isPrivate?: boolean;
}

export interface MuteChannelPayload {
  isMuted: boolean;
  muteUntil?: string;
}

export interface UpdateMemberRolePayload {
  role: 'admin' | 'member' | 'owner';
}

export interface NotificationPreferencePayload {
  eventType: string;
  emailEnabled?: boolean;
  smsEnabled?: boolean;
  pushEnabled?: boolean;
  inAppEnabled?: boolean;
}

// ==================== CHAT SERVICE ====================
export class ChatService {
  // ==================== MESSAGES ====================
  
  static async sendMessage(payload: SendMessagePayload): Promise<Message> {
    const response = await encryptedApiClient.post(API_ENDPOINTS.CHAT.MESSAGES.SEND, payload);
    return extractData(response);
  }

  static async getMessages(channelId: number, limit = 50, beforeId?: number): Promise<Message[]> {
    const response = await encryptedApiClient.get(API_ENDPOINTS.CHAT.MESSAGES.LIST, {
      params: { channelId, limit, beforeId }
    });
    const messages = extractData<Message[]>(response);
    return Array.isArray(messages) ? messages : [];
  }

  static async editMessage(messageId: number, content: string, mentions?: number[]): Promise<any> {
    return encryptedApiClient.put(API_ENDPOINTS.CHAT.MESSAGES.EDIT(messageId), { 
      content,
      mentions,
      hasMentions: mentions && mentions.length > 0
    });
  }

  static async deleteMessage(messageId: number): Promise<any> {
    return encryptedApiClient.delete(API_ENDPOINTS.CHAT.MESSAGES.DELETE(messageId));
  }

  static async markAsRead(channelId: number, messageId: number): Promise<any> {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.MESSAGES.MARK_READ, { 
      channelId, 
      messageId 
    });
  }

  static async bulkMarkAsRead(channelId: number, upToMessageId: number): Promise<any> {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.MESSAGES.BULK_MARK_READ, { 
      channelId, 
      upToMessageId 
    });
  }

  static async pinMessage(messageId: number, isPinned: boolean): Promise<any> {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.MESSAGES.PIN, { 
      messageId, 
      isPinned 
    });
  }

  static async getPinnedMessages(channelId: number): Promise<Message[]> {
    const response = await encryptedApiClient.get(API_ENDPOINTS.CHAT.MESSAGES.PINNED, { 
      params: { channelId } 
    });
    return extractData(response);
  }

  static async forwardMessage(messageId: number, targetChannelIds: number[]): Promise<any> {
    return extractData(await encryptedApiClient.post(API_ENDPOINTS.CHAT.MESSAGES.FORWARD, { 
      messageId, 
      targetChannelIds 
    }));
  }

  static async getUnreadCount(): Promise<{ unread: number }> {
    return extractData(await encryptedApiClient.get(API_ENDPOINTS.CHAT.UNREAD));
  }

  // ==================== MESSAGE DETAILS ====================
  
  static async getMessageDetails(messageId: number): Promise<Message> {
    return extractData(await encryptedApiClient.get(
      API_ENDPOINTS.CHAT.MESSAGES.DETAILS(messageId)
    ));
  }

  static async getMessageAttachments(messageId: number): Promise<Attachment[]> {
    return extractData(await encryptedApiClient.get(
      API_ENDPOINTS.CHAT.MESSAGES.ATTACHMENTS(messageId)
    ));
  }

  static async getMessageReactions(messageId: number): Promise<Reaction[]> {
    return extractData(await encryptedApiClient.get(
      API_ENDPOINTS.CHAT.MESSAGES.REACTIONS_LIST(messageId)
    ));
  }

  // ==================== REACTIONS ====================
  
  static async addReaction(messageId: number, emoji: string): Promise<any> {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.REACTIONS.ADD, { 
      messageId, 
      emoji 
    });
  }

  static async removeReaction(messageId: number, emoji: string): Promise<any> {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.REACTIONS.REMOVE, { 
      messageId, 
      emoji 
    });
  }

  // ==================== THREADS ====================
  
  static async getThreadMessages(messageId: number, limit = 50): Promise<Message[]> {
    return extractData(await encryptedApiClient.get(
      API_ENDPOINTS.CHAT.THREADS.GET(messageId), 
      { params: { limit } }
    ));
  }

  static async replyInThread(parentMessageId: number, content: string): Promise<Message> {
    return extractData(await encryptedApiClient.post(
      API_ENDPOINTS.CHAT.THREADS.REPLY(parentMessageId), 
      { content }
    ));
  }

  static async getEnhancedThread(messageId: number, limit = 50): Promise<any> {
    return extractData(await encryptedApiClient.get(
      API_ENDPOINTS.CHAT.THREADS.ENHANCED(messageId), 
      { params: { limit } }
    ));
  }

  // ==================== CHANNELS ====================
  
  static async getUserChannels(limit = 50): Promise<Channel[]> {
    const response = await encryptedApiClient.get(API_ENDPOINTS.CHAT.CHANNELS.LIST, { 
      params: { limit } 
    });
    const channels = extractData<Channel[]>(response);
    return Array.isArray(channels) ? channels : [];
  }

  static async getChannelById(channelId: number): Promise<Channel> {
    return extractData(await encryptedApiClient.get(
      API_ENDPOINTS.CHAT.CHANNELS.GET(channelId)
    ));
  }

  static async createChannel(payload: CreateChannelPayload): Promise<Channel> {
    return extractData(await encryptedApiClient.post(
      API_ENDPOINTS.CHAT.CHANNELS.CREATE, 
      payload
    ));
  }

  static async updateChannel(channelId: number, payload: UpdateChannelPayload): Promise<Channel> {
    return extractData(await encryptedApiClient.put(
      API_ENDPOINTS.CHAT.CHANNELS.UPDATE(channelId), 
      payload
    ));
  }

  static async archiveChannel(channelId: number): Promise<any> {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.CHANNELS.ARCHIVE(channelId));
  }

  static async unarchiveChannel(channelId: number): Promise<any> {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.CHANNELS.UNARCHIVE(channelId));
  }

  static async leaveChannel(channelId: number): Promise<any> {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.CHANNELS.LEAVE(channelId));
  }

  static async deleteChannel(channelId: number): Promise<any> {
    return encryptedApiClient.delete(API_ENDPOINTS.CHAT.CHANNELS.DELETE(channelId));
  }

  static async pinChannel(channelId: number, isPinned: boolean): Promise<any> {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.CHANNELS.PIN(channelId), { 
      isPinned 
    });
  }

  static async muteChannel(channelId: number, isMuted: boolean, muteUntil?: string): Promise<any> {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.CHANNELS.MUTE(channelId), { 
      isMuted, 
      muteUntil 
    });
  }

  static async getChannelFiles(channelId: number, limit = 50): Promise<Attachment[]> {
    return extractData(await encryptedApiClient.get(
      API_ENDPOINTS.CHAT.CHANNELS.FILES(channelId), 
      { params: { limit } }
    ));
  }

  // ==================== CHANNEL MEMBERS ====================
  
  static async getChannelMembers(channelId: number): Promise<Member[]> {
    return extractData(await encryptedApiClient.get(
      API_ENDPOINTS.CHAT.MEMBERS.LIST(channelId)
    ));
  }

  static async addMembers(channelId: number, userIds: number[]): Promise<any> {
    return extractData(await encryptedApiClient.post(
      API_ENDPOINTS.CHAT.MEMBERS.ADD(channelId), 
      { userIds }
    ));
  }

  static async removeMember(channelId: number, userId: number): Promise<any> {
    return encryptedApiClient.delete(
      API_ENDPOINTS.CHAT.MEMBERS.REMOVE(channelId, userId)
    );
  }

  static async updateMemberRole(channelId: number, userId: number, role: string): Promise<any> {
    return encryptedApiClient.put(
      API_ENDPOINTS.CHAT.MEMBERS.UPDATE_ROLE(channelId, userId), 
      { role }
    );
  }

  // ==================== SEARCH ====================
  
  static async search(
    query: string, 
    opts?: { channelId?: number; type?: string; limit?: number }
  ): Promise<SearchResults> {
    return extractData(await encryptedApiClient.get(API_ENDPOINTS.CHAT.SEARCH, { 
      params: { q: query, ...opts } 
    }));
  }

  // ==================== TEAM ====================
  
  static async getTeamMembers(search?: string): Promise<Member[]> {
    return extractData(await encryptedApiClient.get(API_ENDPOINTS.CHAT.TEAM.MEMBERS, { 
      params: { search } 
    }));
  }

  static async getAvailableMembersForChannel(channelId: number): Promise<Member[]> {
    return extractData(await encryptedApiClient.get(
      API_ENDPOINTS.CHAT.TEAM.AVAILABLE_MEMBERS, 
      { params: { channelId } }
    ));
  }

  static async startTeamChat(memberIds: number[], name?: string): Promise<Channel> {
    return extractData(await encryptedApiClient.post(
      API_ENDPOINTS.CHAT.TEAM.START_CHAT, 
      { memberIds, name }
    ));
  }

  // ==================== MENTIONS ====================
  
  static async getUserMentions(limit = 50): Promise<any[]> {
    return extractData(await encryptedApiClient.get(
      API_ENDPOINTS.CHAT.MENTIONS.LIST, 
      { params: { limit } }
    ));
  }

  static async getUnreadMentionsCount(): Promise<{ count: number }> {
    return extractData(await encryptedApiClient.get(
      API_ENDPOINTS.CHAT.MENTIONS.UNREAD_COUNT
    ));
  }

  // ==================== ACTIVITIES ====================
  
  static async getChannelActivities(channelId: number, limit = 50): Promise<Activity[]> {
    return extractData(await encryptedApiClient.get(
      API_ENDPOINTS.CHAT.ACTIVITIES.CHANNEL, 
      { params: { channelId, limit } }
    ));
  }

  static async getUnreadActivities(limit = 50): Promise<Activity[]> {
    return extractData(await encryptedApiClient.get(
      API_ENDPOINTS.CHAT.ACTIVITIES.UNREAD, 
      { params: { limit } }
    ));
  }

  static async markActivitiesAsRead(activityIds: number[]): Promise<any> {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.ACTIVITIES.MARK_READ, { 
      activityIds 
    });
  }

  // ==================== NOTIFICATIONS ====================
  
  static async getUnreadNotificationsCount(): Promise<{ count: number }> {
    return extractData(await encryptedApiClient.get(
      API_ENDPOINTS.CHAT.NOTIFICATIONS.UNREAD_COUNT
    ));
  }

  static async markNotificationsAsRead(notificationIds: number[]): Promise<any> {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.NOTIFICATIONS.MARK_READ, { 
      notificationIds 
    });
  }

  static async getUserNotifications(limit = 50, page = 1): Promise<Notification[]> {
    return extractData(await encryptedApiClient.get(
      API_ENDPOINTS.CHAT.NOTIFICATIONS.LIST, 
      { params: { limit, page } }
    ));
  }

  static async getNotificationPreferences(): Promise<any[]> {
    return extractData(await encryptedApiClient.get(
      API_ENDPOINTS.CHAT.NOTIFICATIONS.PREFERENCES
    ));
  }

  static async updateNotificationPreferences(payload: NotificationPreferencePayload): Promise<any> {
    return encryptedApiClient.post(
      API_ENDPOINTS.CHAT.NOTIFICATIONS.PREFERENCES, 
      payload
    );
  }

  // ==================== COLLABORATION ====================
  
  static async getCollaborationTeamMembers(includeOffline?: boolean): Promise<Member[]> {
    return extractData(await encryptedApiClient.get(
      API_ENDPOINTS.CHAT.COLLABORATION.TEAM_MEMBERS, 
      { params: { includeOffline } }
    ));
  }

  static async startCollaborationChat(memberIds: number[], name?: string, isPrivate?: boolean): Promise<Channel> {
    return extractData(await encryptedApiClient.post(
      API_ENDPOINTS.CHAT.COLLABORATION.START_CHAT, 
      { memberIds, name, isPrivate }
    ));
  }

  static async searchCollaborationMembers(query: string): Promise<Member[]> {
    return extractData(await encryptedApiClient.get(
      API_ENDPOINTS.CHAT.COLLABORATION.SEARCH_MEMBERS, 
      { params: { q: query } }
    ));
  }

  // ==================== PRESENCE ====================
  
  static async setOnline(): Promise<any> {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.PRESENCE.ONLINE);
  }

  static async setOffline(): Promise<any> {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.PRESENCE.OFFLINE);
  }

  static async getOnlineUsers(): Promise<number[]> {
    return extractData(await encryptedApiClient.get(
      API_ENDPOINTS.CHAT.PRESENCE.ONLINE_USERS
    ));
  }

  // ==================== DELIVERY & READ STATUS ====================
  
  static async updateDeliveryStatus(messageId: number, status: 'delivered' | 'read'): Promise<any> {
    return encryptedApiClient.post(
      API_ENDPOINTS.CHAT.MESSAGES.DELIVERY_STATUS(messageId), 
      { status }
    );
  }

  static async markAsDelivered(messageId: number): Promise<any> {
    return encryptedApiClient.post(
      API_ENDPOINTS.CHAT.MESSAGES.MARK_DELIVERED(messageId)
    );
  }

  static async getMessageReadStatus(messageId: number): Promise<MessageReadStatus> {
    return extractData(await encryptedApiClient.get(
      API_ENDPOINTS.CHAT.MESSAGES.READ_STATUS(messageId)
    ));
  }

  static async getDetailedReadStatus(messageId: number): Promise<MessageReadStatus> {
    return extractData(await encryptedApiClient.get(
      API_ENDPOINTS.CHAT.MESSAGES.READ_STATUS_DETAILED(messageId)
    ));
  }
}