// lib/api/services/chat-service.ts - COMPLETE FIXED VERSION
import { encryptedApiClient } from '../encrypted-client';
import { API_ENDPOINTS } from '../endpoints';

const extractData = <T>(response: any): T => {
  if (response?.data?.channels) return response.data.channels as T;
  if (response?.data?.messages) return response.data.messages as T;
  if (response?.data?.members) return response.data.members as T;
  if ('data' in response) return response.data as T;
  return response as T;
};

// ==================== ENUMS ====================
export enum ChannelType { DIRECT = 'direct', GROUP = 'group', CAMPAIGN = 'campaign', PROJECT = 'project' }
export enum MessageType { TEXT = 'text', FILE = 'file', IMAGE = 'image', VIDEO = 'video', AUDIO = 'audio', SYSTEM = 'system' }

// ==================== INTERFACES ====================
export interface Channel {
  id: number; channel_id?: string; name: string; description?: string;
  channel_type: ChannelType; is_private?: boolean; is_archived?: boolean;
  member_count: number; message_count: number; unread_count: number;
  last_message_at?: string; last_activity_at?: string;
  is_muted?: boolean; is_pinned?: boolean; role?: string;
  last_read_message_id?: number; created_at?: string; updated_at?: string;
  isExisting?: boolean; // For existing DM detection
}

export interface Message {
  id: number; channel_id: number; sender_user_id: number; sender_tenant_id: number;
  sender_first_name?: string; sender_last_name?: string; sender_email?: string; sender_avatar_url?: string;
  message_type: MessageType; content: string;
  has_attachments?: boolean; has_mentions?: boolean;
  is_edited?: boolean; edited_at?: string; is_deleted?: boolean;
  is_pinned?: boolean; pinned_at?: string; pinned_by?: number;
  reply_to_message_id?: number; thread_id?: number;
  sent_at: string; created_at: string;
  reaction_count?: number; reply_count?: number;
  channel_name?: string; reactions?: Reaction[];
  reply_to_author_name?: string; reply_to_content?: string;
}

export interface Reaction { 
  id: number; message_id: number; user_id: number; emoji: string; 
  count?: number; userReacted?: boolean; created_at: string; 
}

export interface Member {
  id?: number; user_id: number; channel_id?: number; role: string;
  first_name: string; last_name: string; email: string;
  avatar_url?: string; status?: string; last_active_at?: string;
  is_muted?: boolean; mute_until?: string; joined_at?: string; is_active?: number;
}

export interface SearchResults {
  messages?: Message[]; channels?: Channel[]; members?: Member[];
}

export interface Activity {
  id: number; activity_type: string; subject_type: string; subject_id: number;
  action: string; description: string; metadata?: any;
  is_read: number; created_at: string;
  first_name?: string; last_name?: string; avatar_url?: string;
}

export interface Notification {
  id: number; event_type: string; channel: string; subject: string; message: string;
  data?: any; priority: string; read_at?: string; created_at: string;
}

// ==================== PAYLOADS ====================
export interface SendMessagePayload {
  channelId: number; content: string; messageType?: string;
  attachments?: number[]; mentions?: number[];
  replyToMessageId?: number; threadId?: number;
}

export interface CreateChannelPayload {
  name?: string; description?: string; channelType?: string;
  participantIds: number[]; isPrivate?: boolean;
  relatedType?: string; relatedId?: number;
}

export interface UpdateChannelPayload { 
  name?: string; description?: string; isPrivate?: boolean; 
}

export interface MuteChannelPayload { 
  isMuted: boolean; muteUntil?: string; 
}

export interface UpdateMemberRolePayload { 
  role: 'admin' | 'member' | 'owner'; 
}

export interface NotificationPreferencePayload {
  eventType: string; emailEnabled?: boolean; smsEnabled?: boolean;
  pushEnabled?: boolean; inAppEnabled?: boolean;
}

// ==================== CHAT SERVICE ====================
export class ChatService {
  // ==================== MESSAGES ====================
  static async sendMessage(payload: SendMessagePayload) {
    return extractData(await encryptedApiClient.post(API_ENDPOINTS.CHAT.MESSAGES.SEND, payload));
  }

  static async getMessages(channelId: number, limit = 50, beforeId?: number) {
    return extractData(await encryptedApiClient.get(API_ENDPOINTS.CHAT.MESSAGES.LIST, { params: { channelId, limit, beforeId } }));
  }

  static async editMessage(messageId: number, content: string) {
    return encryptedApiClient.put(API_ENDPOINTS.CHAT.MESSAGES.EDIT(messageId), { content });
  }

  static async deleteMessage(messageId: number) {
    return encryptedApiClient.delete(API_ENDPOINTS.CHAT.MESSAGES.DELETE(messageId));
  }

  static async markAsRead(channelId: number, messageId: number) {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.MESSAGES.MARK_READ, { channelId, messageId });
  }

  static async pinMessage(messageId: number, isPinned: boolean) {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.MESSAGES.PIN, { messageId, isPinned });
  }

  static async getPinnedMessages(channelId: number) {
    return extractData(await encryptedApiClient.get(API_ENDPOINTS.CHAT.MESSAGES.PINNED, { params: { channelId } }));
  }

  static async forwardMessage(messageId: number, targetChannelIds: number[]) {
    return extractData(await encryptedApiClient.post(API_ENDPOINTS.CHAT.MESSAGES.FORWARD, { messageId, targetChannelIds }));
  }

  static async getUnreadCount() {
    return extractData(await encryptedApiClient.get(API_ENDPOINTS.CHAT.UNREAD));
  }

  // ==================== REACTIONS ====================
  static async addReaction(messageId: number, emoji: string) {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.REACTIONS.ADD, { messageId, emoji });
  }

  static async removeReaction(messageId: number, emoji: string) {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.REACTIONS.REMOVE, { messageId, emoji });
  }

  // ==================== THREADS ====================
  static async getThreadMessages(messageId: number, limit = 50) {
    return extractData(await encryptedApiClient.get(API_ENDPOINTS.CHAT.THREADS.GET(messageId), { params: { limit } }));
  }

  static async replyInThread(parentMessageId: number, content: string) {
    return extractData(await encryptedApiClient.post(API_ENDPOINTS.CHAT.THREADS.REPLY(parentMessageId), { content }));
  }

  // ==================== CHANNELS ====================
  static async getUserChannels(limit = 50) {
    return extractData(await encryptedApiClient.get(API_ENDPOINTS.CHAT.CHANNELS.LIST, { params: { limit } }));
  }

  static async getChannelById(channelId: number) {
    return extractData(await encryptedApiClient.get(API_ENDPOINTS.CHAT.CHANNELS.GET(channelId)));
  }

  static async createChannel(payload: CreateChannelPayload) {
    return extractData(await encryptedApiClient.post(API_ENDPOINTS.CHAT.CHANNELS.CREATE, payload));
  }

  static async updateChannel(channelId: number, payload: UpdateChannelPayload) {
    return extractData(await encryptedApiClient.put(API_ENDPOINTS.CHAT.CHANNELS.UPDATE(channelId), payload));
  }

  static async archiveChannel(channelId: number) {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.CHANNELS.ARCHIVE(channelId));
  }

  static async unarchiveChannel(channelId: number) {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.CHANNELS.UNARCHIVE(channelId));
  }

  static async leaveChannel(channelId: number) {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.CHANNELS.LEAVE(channelId));
  }

  static async deleteChannel(channelId: number) {
    return encryptedApiClient.delete(API_ENDPOINTS.CHAT.CHANNELS.DELETE(channelId));
  }

  static async pinChannel(channelId: number, isPinned: boolean) {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.CHANNELS.PIN(channelId), { isPinned });
  }

  static async muteChannel(channelId: number, isMuted: boolean, muteUntil?: string) {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.CHANNELS.MUTE(channelId), { isMuted, muteUntil });
  }

  static async getChannelFiles(channelId: number, limit = 50) {
    return extractData(await encryptedApiClient.get(API_ENDPOINTS.CHAT.CHANNELS.FILES(channelId), { params: { limit } }));
  }

  // ==================== CHANNEL MEMBERS ====================
  static async getChannelMembers(channelId: number) {
    return extractData(await encryptedApiClient.get(API_ENDPOINTS.CHAT.MEMBERS.LIST(channelId)));
  }

  static async addMembers(channelId: number, userIds: number[]) {
    // Clean payload - only send userIds array
    const payload = { userIds };
    console.log("🚀 ChatService.addMembers:", { channelId, payload });
    return extractData(await encryptedApiClient.post(API_ENDPOINTS.CHAT.MEMBERS.ADD(channelId), payload));
  }

  static async removeMember(channelId: number, userId: number) {
    return encryptedApiClient.delete(API_ENDPOINTS.CHAT.MEMBERS.REMOVE(channelId, userId));
  }

  static async updateMemberRole(channelId: number, userId: number, role: string) {
    return encryptedApiClient.put(API_ENDPOINTS.CHAT.MEMBERS.UPDATE_ROLE(channelId, userId), { role });
  }

  static async getAvailableMembersForChannel(channelId: number) {
    return extractData(await encryptedApiClient.get(API_ENDPOINTS.CHAT.MEMBERS.AVAILABLE, { params: { channelId } }));
  }

  // ==================== SEARCH ====================
  static async search(query: string, opts?: { channelId?: number; type?: string; limit?: number }) {
    return extractData(await encryptedApiClient.get(API_ENDPOINTS.CHAT.SEARCH, { params: { q: query, ...opts } }));
  }

  // ==================== TEAM ====================
  static async getTeamMembers(search?: string) {
    return extractData(await encryptedApiClient.get(API_ENDPOINTS.CHAT.TEAM.MEMBERS, { params: { search } }));
  }

  static async startTeamChat(memberIds: number[], name?: string) {
    const payload = { memberIds, name };
    return extractData(await encryptedApiClient.post(API_ENDPOINTS.CHAT.TEAM.START_CHAT, payload));
  }

  // ==================== ACTIVITIES ====================
  static async getChannelActivities(channelId: number, limit = 50) {
    return extractData(await encryptedApiClient.get(API_ENDPOINTS.CHAT.ACTIVITIES.CHANNEL(channelId), { params: { limit } }));
  }

  static async getUnreadActivities(limit = 50) {
    return extractData(await encryptedApiClient.get(API_ENDPOINTS.CHAT.ACTIVITIES.UNREAD, { params: { limit } }));
  }

  static async markActivitiesAsRead(activityIds: number[]) {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.ACTIVITIES.MARK_READ, { activityIds });
  }

  // ==================== NOTIFICATIONS ====================
  static async getUnreadNotificationsCount() {
    return extractData(await encryptedApiClient.get(API_ENDPOINTS.CHAT.NOTIFICATIONS.UNREAD_COUNT));
  }

  static async markNotificationsAsRead(notificationIds: number[]) {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.NOTIFICATIONS.MARK_READ, { notificationIds });
  }

  static async getUserNotifications(limit = 50, page = 1) {
    return extractData(await encryptedApiClient.get(API_ENDPOINTS.CHAT.NOTIFICATIONS.LIST, { params: { limit, page } }));
  }

  static async getNotificationPreferences() {
    return extractData(await encryptedApiClient.get(API_ENDPOINTS.CHAT.NOTIFICATIONS.PREFERENCES));
  }

  static async updateNotificationPreferences(payload: NotificationPreferencePayload) {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.NOTIFICATIONS.PREFERENCES, payload);
  }

  // ==================== PRESENCE ====================
  static async setOnline() {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.PRESENCE.ONLINE);
  }

  static async setOffline() {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.PRESENCE.OFFLINE);
  }

  static async getOnlineUsers() {
    return extractData(await encryptedApiClient.get(API_ENDPOINTS.CHAT.PRESENCE.ONLINE_USERS));
  }
}