// lib/api/services/chat-service.ts - UPDATED v4.0
import { encryptedApiClient } from '../encrypted-client';
import { API_ENDPOINTS } from '../endpoints';

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
  POLL = 'poll',
  CODE = 'code',
}

// ==================== CHANNEL INTERFACES ====================

export interface CreateChannelPayload {
  name: string;
  description?: string;
  channelType: ChannelType;
  relatedType?: string;
  relatedId?: number;
  isPrivate?: boolean;
  memberIds?: number[];
}

export interface UpdateChannelPayload {
  channelId: number;
  name?: string;
  description?: string;
  isPrivate?: boolean;
  settings?: any;
}

export interface ArchiveChannelPayload {
  channelId: number;
  isArchived: boolean;
}

export interface GetChannelsPayload {
  channelType?: ChannelType;
  isArchived?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface Channel {
  id: number;
  name: string;
  description?: string;
  channel_type: string;
  isMuted: number;
  unreadCount: number;
  memberCount: number;
  type: string;
  is_private: boolean;
  member_count: number;
  message_count: number;
  unread_count: number;
  last_message_preview?: string;
  last_message_at?: string;
  last_activity_at: string;
  user_role: string;
  is_muted: boolean;
  last_read_message_id?: number;
  last_read_at?: string;
  encrypted_channel_key?: string;
  encryptionEnabled?: boolean;
  encryptionVersion?: string;
  algorithm?: string;
}

// ==================== MEMBER INTERFACES ====================

export interface AddChannelMembersPayload {
  channelId: number;
  userIds: number[];
  role?: MemberRole;
}

export interface RemoveChannelMemberPayload {
  channelId: number;
  userId: number;
}

export interface UpdateMemberRolePayload {
  channelId: number;
  userId: number;
  role: MemberRole;
}

export interface UpdateMemberNotificationPayload {
  channelId: number;
  isMuted?: boolean;
  notificationSettings?: any;
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
  status?: string;
  last_active_at?: string;
  is_muted: boolean;
}

// ==================== MESSAGE INTERFACES ====================

export interface SendMessagePayload {
  channelId: number;
  messageType?: MessageType;
  encryptedContent: string;
  encryptionIv: string;
  encryptionAuthTag: string;
  replyToMessageId?: number;
  threadId?: number;
  attachments?: AttachmentPayload[];
  mentions?: number[];
}

export interface AttachmentPayload {
  filename: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  thumbnailUrl?: string;
  encryptedFileKey?: string;
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

export interface Message {
  id: number;
  channel_id: number;
  sender_user_id: number;
  sender_first_name: string;
  sender_last_name: string;
  sender_avatar_url?: string;
  message_type: string;
  encrypted_content: string;
  encryption_iv: string;
  encryption_auth_tag: string;
  content_hash?: string;
  is_edited: boolean;
  edited_at?: string;
  is_deleted: boolean;
  deleted_at?: string;
  is_pinned: boolean;
  pinned_at?: string;
  pinned_by?: number;
  reply_to_message_id?: number;
  thread_id?: number;
  sent_at: string;
  created_at: string;
  reaction_count: number;
  reply_count: number;
  encryptionMetadata?: {
    algorithm: string;
    hasIntegrityTag: boolean;
    requiresChannelKey: boolean;
  };
}

export interface GetMessagesPayload {
  channelId: number;
  limit?: number;
  offset?: number;
  beforeMessageId?: number;
  afterMessageId?: number;
  includeDeleted?: boolean;
}

export interface ReactToMessagePayload {
  messageId: number;
  emoji: string;
}

export interface PinMessagePayload {
  messageId: number;
  isPinned: boolean;
}

export interface ForwardMessagePayload {
  messageId: number;
  targetChannelIds: number[];
}

export interface RotateChannelKeyPayload {
  channelId: number;
  reason: string;
}

// ==================== SEARCH & READ RECEIPT INTERFACES ====================

export interface SearchMessagesPayload {
  channelId?: number;
  userId?: number;
  messageType?: MessageType;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface MarkAsReadPayload {
  channelId: number;
  messageId?: number;
}

export interface BulkMarkAsReadPayload {
  channelId: number;
  messageIds: number[];
}

export interface GetThreadMessagesPayload {
  threadId: number;
  limit?: number;
  offset?: number;
}

// ==================== DIRECT MESSAGE INTERFACES ====================

export interface CreateDirectMessagePayload {
  recipientUserId: number;
  encryptedContent: string;
  encryptionIv: string;
  encryptionAuthTag: string;
  attachments?: AttachmentPayload[];
}

// ==================== CHAT SERVICE ====================

export class ChatService {
  // ==================== CHANNELS ====================

  /**
   * Get all channels for current user
   */
  static async getUserChannels(payload: GetChannelsPayload) {
    return encryptedApiClient.post<Channel[]>(
      API_ENDPOINTS.CHAT.CHANNELS.LIST,
      payload
    );
  }

  /**
   * Get specific channel by ID
   */
  static async getChannelById(channelId: number) {
    return encryptedApiClient.post<Channel>(
      API_ENDPOINTS.CHAT.CHANNELS.GET_BY_ID,
      { channelId }
    );
  }

  /**
   * Create new channel with E2E encryption
   */
  static async createChannel(payload: CreateChannelPayload) {
    return encryptedApiClient.post<Channel>(
      API_ENDPOINTS.CHAT.CHANNELS.CREATE,
      payload
    );
  }

  /**
   * Update channel details
   */
  static async updateChannel(payload: UpdateChannelPayload) {
    return encryptedApiClient.post<Channel>(
      API_ENDPOINTS.CHAT.CHANNELS.UPDATE,
      payload
    );
  }

  /**
   * Archive or unarchive channel
   */
  static async archiveChannel(payload: ArchiveChannelPayload) {
    return encryptedApiClient.post(
      API_ENDPOINTS.CHAT.CHANNELS.ARCHIVE,
      payload
    );
  }

  /**
   * Delete channel (owner only)
   */
  static async deleteChannel(channelId: number) {
    return encryptedApiClient.post(
      API_ENDPOINTS.CHAT.CHANNELS.DELETE,
      { channelId }
    );
  }

  /**
   * Leave channel
   */
  static async leaveChannel(channelId: number) {
    return encryptedApiClient.post(
      API_ENDPOINTS.CHAT.CHANNELS.LEAVE,
      { channelId }
    );
  }

  /**
   * Get channel settings (admin only)
   */
  static async getChannelSettings(channelId: number) {
    return encryptedApiClient.post(
      API_ENDPOINTS.CHAT.CHANNELS.SETTINGS_GET,
      { channelId }
    );
  }

  /**
   * Update channel settings (admin only)
   */
  static async updateChannelSettings(
    channelId: number,
    settings: any
  ) {
    return encryptedApiClient.post(
      API_ENDPOINTS.CHAT.CHANNELS.SETTINGS_UPDATE,
      { channelId, settings }
    );
  }

  /**
   * Rotate channel encryption key (owner only)
   */
  static async rotateChannelKey(payload: RotateChannelKeyPayload) {
    return encryptedApiClient.post(
      API_ENDPOINTS.CHAT.CHANNELS.ROTATE_KEY,
      payload
    );
  }

  // ==================== CHANNEL MEMBERS ====================

  /**
   * Get all members in channel
   */
  static async getChannelMembers(channelId: number) {
    return encryptedApiClient.post<Member[]>(
      API_ENDPOINTS.CHAT.MEMBERS.LIST,
      { channelId }
    );
  }

  /**
   * Add members to channel
   */
  static async addChannelMembers(payload: AddChannelMembersPayload) {
    return encryptedApiClient.post(
      API_ENDPOINTS.CHAT.MEMBERS.ADD,
      payload
    );
  }

  /**
   * Remove member from channel
   */
  static async removeChannelMember(payload: RemoveChannelMemberPayload) {
    return encryptedApiClient.post(
      API_ENDPOINTS.CHAT.MEMBERS.REMOVE,
      payload
    );
  }

  /**
   * Update member role (owner only)
   */
  static async updateMemberRole(payload: UpdateMemberRolePayload) {
    return encryptedApiClient.post(
      API_ENDPOINTS.CHAT.MEMBERS.UPDATE_ROLE,
      payload
    );
  }

  /**
   * Update member notification settings
   */
  static async updateMemberNotification(payload: UpdateMemberNotificationPayload) {
    return encryptedApiClient.post(
      API_ENDPOINTS.CHAT.NOTIFICATIONS.UPDATE,
      payload
    );
  }

  // ==================== MESSAGES ====================

  /**
   * Get messages from channel (returns encrypted content)
   */
  static async getMessages(payload: GetMessagesPayload) {
    return encryptedApiClient.post<Message[]>(
      API_ENDPOINTS.CHAT.MESSAGES.LIST,
      payload
    );
  }

  /**
   * Send encrypted message
   */
  static async sendMessage(payload: SendMessagePayload) {
    return encryptedApiClient.post<Message>(
      API_ENDPOINTS.CHAT.MESSAGES.SEND,
      payload
    );
  }

  /**
   * Edit encrypted message
   */
  static async editMessage(payload: EditMessagePayload) {
    return encryptedApiClient.post<Message>(
      API_ENDPOINTS.CHAT.MESSAGES.EDIT,
      payload
    );
  }

  /**
   * Delete message
   */
  static async deleteMessage(payload: DeleteMessagePayload) {
    return encryptedApiClient.post(
      API_ENDPOINTS.CHAT.MESSAGES.DELETE,
      payload
    );
  }

  /**
   * Bulk delete messages
   */
  static async bulkDeleteMessages(messageIds: number[]) {
    return encryptedApiClient.post(
      API_ENDPOINTS.CHAT.MESSAGES.BULK_DELETE,
      { messageIds }
    );
  }

  /**
   * Forward message to multiple channels
   */
  static async forwardMessage(payload: ForwardMessagePayload) {
    return encryptedApiClient.post(
      API_ENDPOINTS.CHAT.MESSAGES.FORWARD,
      payload
    );
  }

  /**
   * Get message delivery status
   */
  static async getMessageStatus(messageId: number) {
    return encryptedApiClient.post(
      API_ENDPOINTS.CHAT.MESSAGES.STATUS,
      { messageId }
    );
  }

  /**
   * Get bulk message delivery status
   */
  static async getBulkMessageStatus(messageIds: number[]) {
    return encryptedApiClient.post(
      API_ENDPOINTS.CHAT.MESSAGES.STATUS_BULK,
      { messageIds }
    );
  }

  /**
   * Pin/unpin message
   */
  static async pinMessage(payload: PinMessagePayload) {
    return encryptedApiClient.post(
      API_ENDPOINTS.CHAT.MESSAGES.PIN,
      payload
    );
  }

  /**
   * Get pinned messages in channel
   */
  static async getPinnedMessages(channelId: number) {
    return encryptedApiClient.post<Message[]>(
      API_ENDPOINTS.CHAT.CHANNELS.PINNED_MESSAGES,
      { channelId }
    );
  }

  // ==================== MESSAGE REACTIONS ====================

  /**
   * React to message with emoji
   */
  static async reactToMessage(payload: ReactToMessagePayload) {
    return encryptedApiClient.post(
      API_ENDPOINTS.CHAT.REACTIONS.ADD,
      payload
    );
  }

  /**
   * Get reactions on message
   */
  static async getMessageReactions(messageId: number) {
    return encryptedApiClient.post(
      API_ENDPOINTS.CHAT.REACTIONS.LIST,
      { messageId }
    );
  }

  // ==================== THREADS ====================

  /**
   * Get messages in thread
   */
  static async getThreadMessages(payload: GetThreadMessagesPayload) {
    return encryptedApiClient.post<Message[]>(
      API_ENDPOINTS.CHAT.THREADS.MESSAGES,
      payload
    );
  }

  /**
   * Reply to thread
   */
  static async replyToThread(payload: SendMessagePayload) {
    return encryptedApiClient.post<Message>(
      API_ENDPOINTS.CHAT.THREADS.REPLY,
      payload
    );
  }

  // ==================== SEARCH ====================

  /**
   * Search messages by metadata
   * Note: Content search must be done client-side due to E2E encryption
   */
  static async searchMessages(payload: SearchMessagesPayload) {
    return encryptedApiClient.post<Message[]>(
      API_ENDPOINTS.CHAT.SEARCH,
      payload
    );
  }

  // ==================== DIRECT MESSAGES ====================

  /**
   * Send direct message to user
   */
  static async createDirectMessage(payload: CreateDirectMessagePayload) {
    return encryptedApiClient.post<Message>(
      API_ENDPOINTS.CHAT.DIRECT.SEND,
      payload
    );
  }

  // ==================== READ RECEIPTS ====================

  /**
   * Mark message as read
   */
  static async markAsRead(payload: MarkAsReadPayload) {
    return encryptedApiClient.post(
      API_ENDPOINTS.CHAT.MARK_READ,
      payload
    );
  }

  /**
   * Bulk mark messages as read
   */
  static async bulkMarkAsRead(payload: BulkMarkAsReadPayload) {
    return encryptedApiClient.post(
      API_ENDPOINTS.CHAT.MARK_READ_BULK,
      payload
    );
  }

  /**
   * Get unread count
   */
  static async getUnreadCount() {
    return encryptedApiClient.post(
      API_ENDPOINTS.CHAT.UNREAD.COUNT,
      {}
    );
  }

  // ==================== FILES ====================

  /**
   * Get files in channel
   */
  static async getChannelFiles(
    channelId: number,
    limit: number = 50,
    offset: number = 0
  ) {
    return encryptedApiClient.post(
      API_ENDPOINTS.CHAT.FILES.LIST,
      { channelId, limit, offset }
    );
  }

  /**
   * Upload file to channel
   */
  static async uploadFile(channelId: number, file: File, caption?: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('channelId', channelId.toString());
    if (caption) formData.append('caption', caption);

    return encryptedApiClient.post(
      API_ENDPOINTS.CHAT.FILES.UPLOAD,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
  }

  // ==================== PRESENCE ====================

  /**
   * Update user presence status
   */
  static async updatePresence(status: 'online' | 'away' | 'offline') {
    return encryptedApiClient.post(
      API_ENDPOINTS.CHAT.PRESENCE.UPDATE,
      { status }
    );
  }

  /**
   * Get online users
   */
  static async getOnlineUsers() {
    return encryptedApiClient.post(
      API_ENDPOINTS.CHAT.PRESENCE.ONLINE,
      {}
    );
  }
}