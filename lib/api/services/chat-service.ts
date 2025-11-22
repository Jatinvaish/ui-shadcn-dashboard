// lib/api/services/chat-service.ts - COMPLETE SLACK-LIKE FRONTEND SERVICE
import { encryptedApiClient } from '../encrypted-client';

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
}

export interface Message {
  id: number; channel_id: number; sender_user_id: number; sender_tenant_id: number;
  sender_first_name?: string; sender_last_name?: string; sender_avatar_url?: string;
  message_type: MessageType; content: string;
  has_attachments?: boolean; has_mentions?: boolean;
  is_edited?: boolean; edited_at?: string; is_deleted?: boolean;
  is_pinned?: boolean; pinned_at?: string;
  reply_to_message_id?: number; thread_id?: number;
  sent_at: string; created_at: string;
  reaction_count?: number; reply_count?: number;
  channel_name?: string;
  reactions?: Reaction[];
}

export interface Reaction { id: number; message_id: number; user_id: number; emoji: string; created_at: string; }

export interface Member {
  id?: number; user_id: number; channel_id?: number; role: string;
  first_name: string; last_name: string; email: string;
  avatar_url?: string; status?: string; last_active_at?: string;
  is_muted?: boolean; joined_at?: string;
}

export interface SearchResults {
  messages?: Message[]; channels?: Channel[]; members?: Member[];
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

export interface UpdateChannelPayload { name?: string; description?: string; isPrivate?: boolean; }

// ==================== CHAT SERVICE ====================
export class ChatService {
  // ==================== MESSAGES ====================
  static async sendMessage(payload: SendMessagePayload): Promise<Message> {
    return extractData<Message>(await encryptedApiClient.post('/chat/messages/send', payload));
  }

  static async getMessages(channelId: number, limit = 50, beforeId?: number): Promise<Message[]> {
    return extractData<Message[]>(await encryptedApiClient.get('/chat/messages', { params: { channelId, limit, beforeId } }));
  }

  static async editMessage(messageId: number, content: string): Promise<void> {
    await encryptedApiClient.put(`/chat/messages/${messageId}`, { content });
  }

  static async deleteMessage(messageId: number): Promise<void> {
    await encryptedApiClient.delete(`/chat/messages/${messageId}`);
  }

  static async markAsRead(channelId: number, messageId: number): Promise<void> {
    await encryptedApiClient.post('/chat/messages/mark-read', { channelId, messageId });
  }

  static async pinMessage(messageId: number, isPinned: boolean): Promise<void> {
    await encryptedApiClient.post('/chat/messages/pin', { messageId, isPinned });
  }

  static async getPinnedMessages(channelId: number): Promise<Message[]> {
    return extractData<Message[]>(await encryptedApiClient.get('/chat/messages/pinned', { params: { channelId } }));
  }

  static async forwardMessage(messageId: number, targetChannelIds: number[]): Promise<any> {
    return extractData(await encryptedApiClient.post('/chat/messages/forward', { messageId, targetChannelIds }));
  }

  static async getUnreadCount(): Promise<{ unread: number }> {
    return extractData(await encryptedApiClient.get('/chat/unread'));
  }

  // ==================== REACTIONS ====================
  static async addReaction(messageId: number, emoji: string): Promise<void> {
    await encryptedApiClient.post('/chat/messages/reaction', { messageId, emoji });
  }

  static async removeReaction(messageId: number, emoji: string): Promise<void> {
    await encryptedApiClient.post('/chat/messages/reaction/remove', { messageId, emoji });
  }

  // ==================== THREADS ====================
  static async getThreadMessages(messageId: number, limit = 50): Promise<Message[]> {
    return extractData<Message[]>(await encryptedApiClient.get(`/chat/threads/${messageId}`, { params: { limit } }));
  }

  static async replyInThread(parentMessageId: number, content: string): Promise<Message> {
    return extractData<Message>(await encryptedApiClient.post(`/chat/threads/${parentMessageId}/reply`, { content }));
  }

  // ==================== CHANNELS ====================
  static async getUserChannels(limit = 50): Promise<Channel[]> {
    return extractData<Channel[]>(await encryptedApiClient.get('/chat/channels', { params: { limit } }));
  }

  static async getChannelById(channelId: number): Promise<Channel> {
    return extractData<Channel>(await encryptedApiClient.get(`/chat/channels/${channelId}`));
  }

  static async createChannel(payload: CreateChannelPayload): Promise<Channel> {
    return extractData<Channel>(await encryptedApiClient.post('/chat/channels/create', payload));
  }

  static async updateChannel(channelId: number, payload: UpdateChannelPayload): Promise<Channel> {
    return extractData<Channel>(await encryptedApiClient.put(`/chat/channels/${channelId}`, payload));
  }

  static async archiveChannel(channelId: number): Promise<void> {
    await encryptedApiClient.post(`/chat/channels/${channelId}/archive`);
  }

  static async unarchiveChannel(channelId: number): Promise<void> {
    await encryptedApiClient.post(`/chat/channels/${channelId}/unarchive`);
  }

  static async leaveChannel(channelId: number): Promise<void> {
    await encryptedApiClient.post(`/chat/channels/${channelId}/leave`);
  }

  static async deleteChannel(channelId: number): Promise<void> {
    await encryptedApiClient.delete(`/chat/channels/${channelId}`);
  }

  static async pinChannel(channelId: number, isPinned: boolean): Promise<void> {
    await encryptedApiClient.post(`/chat/channels/${channelId}/pin`, { isPinned });
  }

  static async muteChannel(channelId: number, isMuted: boolean, muteUntil?: string): Promise<void> {
    await encryptedApiClient.post(`/chat/channels/${channelId}/mute`, { isMuted, muteUntil });
  }

  // ==================== CHANNEL MEMBERS ====================
  static async getChannelMembers(channelId: number): Promise<Member[]> {
    return extractData<Member[]>(await encryptedApiClient.get(`/chat/channels/${channelId}/members`));
  }

  static async addMembers(channelId: number, userIds: number[]): Promise<any> {
    return extractData(await encryptedApiClient.post(`/chat/channels/${channelId}/members`, { userIds }));
  }

  static async removeMember(channelId: number, userId: number): Promise<void> {
    await encryptedApiClient.delete(`/chat/channels/${channelId}/members/${userId}`);
  }

  static async updateMemberRole(channelId: number, userId: number, role: string): Promise<void> {
    await encryptedApiClient.put(`/chat/channels/${channelId}/members/${userId}/role`, { role });
  }

  // ==================== SEARCH ====================
  static async search(query: string, opts?: { channelId?: number; type?: string; limit?: number }): Promise<SearchResults> {
    return extractData<SearchResults>(await encryptedApiClient.get('/chat/search', { params: { q: query, ...opts } }));
  }

  // ==================== TEAM ====================
  static async getTeamMembers(search?: string): Promise<Member[]> {
    return extractData<Member[]>(await encryptedApiClient.get('/chat/team/members', { params: { search } }));
  }

  static async getAvailableMembersForChannel(channelId: number): Promise<Member[]> {
    return extractData<Member[]>(await encryptedApiClient.get('/chat/team/available-members', { params: { channelId } }));
  }

  static async startTeamChat(memberIds: number[], name?: string): Promise<Channel> {
    return extractData<Channel>(await encryptedApiClient.post('/chat/team/start-chat', { memberIds, name }));
  }

  // ==================== PRESENCE ====================
  static async setOnline(): Promise<void> { await encryptedApiClient.post('/chat/presence/online'); }
  static async setOffline(): Promise<void> { await encryptedApiClient.post('/chat/presence/offline'); }
  static async getOnlineUsers(): Promise<number[]> { return extractData<number[]>(await encryptedApiClient.get('/chat/presence/online-users')); }

  // ==================== FILES ====================
  static async getChannelFiles(channelId: number, limit = 50): Promise<any[]> {
    return extractData<any[]>(await encryptedApiClient.get(`/chat/channels/${channelId}/files`, { params: { limit } }));
  }
}