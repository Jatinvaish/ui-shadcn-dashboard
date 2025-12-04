// lib/api/services/chat-service.ts - COMPLETE & ALIGNED WITH BACKEND
import { encryptedApiClient } from "../encrypted-client";
import { API_ENDPOINTS } from "../endpoints";
import axios from "axios";
import Cookies from "js-cookie";

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
  DIRECT = "direct",
  GROUP = "group",
  CAMPAIGN = "campaign",
  PROJECT = "project"
}

export enum MessageType {
  TEXT = "text",
  FILE = "file",
  IMAGE = "image",
  VIDEO = "video",
  AUDIO = "audio",
  SYSTEM = "system"
}

// ==================== FILE UPLOAD INTERFACES ====================
export interface UploadedFile {
  attachmentId: number;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  thumbnailUrl?: string;
}

export interface FileUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface FileDownloadInfo {
  url: string;
  expiresIn?: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  directAccess?: boolean;
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
// Update Reaction interface
export interface Reaction {
  id?: number;
  message_id?: number;
  user_id: number;
  user_name?: string;
  emoji: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  reacted_at?: string;
  created_at?: string;
  timestamp?: string;
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
  is_delivered?: boolean;
  is_read?: boolean;
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
  role: "admin" | "member" | "owner";
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
  // ==================== FILE UPLOAD METHODS ====================

  /**
   * ✅ Send file directly as message (dedicated endpoint)
   */
  static async sendFileMessage(
    file: File,
    channelId: number,
    options?: {
      caption?: string;
      replyToMessageId?: number;
      threadId?: number;
    },
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<Message> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("channelId", channelId.toString());

    if (options?.caption) {
      formData.append("caption", options.caption);
    }
    if (options?.replyToMessageId) {
      formData.append("replyToMessageId", options.replyToMessageId.toString());
    }
    if (options?.threadId) {
      formData.append("threadId", options.threadId.toString());
    }

    const token = Cookies.get("accessToken");
    const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3060/api/v1";

    const response = await axios.post(
      `${baseURL}${API_ENDPOINTS.CHAT.MESSAGES.SEND_FILE}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress({
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percentage
            });
          }
        }
      }
    );

    return extractData(response.data);
  }

  /**
   * ✅ Send multiple files as messages
   */
  static async sendMultipleFileMessages(
    files: File[],
    channelId: number,
    caption?: string,
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<Message[]> {
    const results: Message[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Only first file gets caption
      const fileCaption = i === 0 ? caption : undefined;

      try {
        const message = await this.sendFileMessage(
          file,
          channelId,
          { caption: fileCaption },
          onProgress
        );
        results.push(message);
      } catch (error) {
        console.error(`Failed to send file ${file.name}:`, error);
      }
    }

    return results;
  }

  /**
   * ✅ Send existing attachment as message
   */
  static async sendAttachmentAsMessage(
    channelId: number,
    attachmentId: number,
    options?: {
      caption?: string;
      replyToMessageId?: number;
      threadId?: number;
    }
  ): Promise<Message> {
    return extractData(
      await encryptedApiClient.post(API_ENDPOINTS.CHAT.MESSAGES.SEND_ATTACHMENT, {
        channelId,
        attachmentId,
        caption: options?.caption,
        replyToMessageId: options?.replyToMessageId,
        threadId: options?.threadId
      })
    );
  }

  /**
   * ✅ Get pending (orphan) attachments
   */
  static async getPendingAttachments(): Promise<UploadedFile[]> {
    return extractData(await encryptedApiClient.get("/chat/attachments/pending"));
  }
  /**
   * ✅ Upload single file for chat message
   */
  /**
   * ✅ Upload file and optionally send as message
   * If sendAsMessage=true and channelId provided, creates message immediately
   */
  static async uploadMessageFile(
    file: File,
    options?: {
      messageId?: number;
      channelId?: number;
      caption?: string;
      sendAsMessage?: boolean;
      replyToMessageId?: number;
      threadId?: number;
    },
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<UploadedFile & { message?: Message }> {
    const formData = new FormData();
    formData.append("file", file);

    if (options?.messageId) {
      formData.append("messageId", options.messageId.toString());
    }
    if (options?.channelId) {
      formData.append("channelId", options.channelId.toString());
    }
    if (options?.caption) {
      formData.append("caption", options.caption);
    }
    if (options?.sendAsMessage) {
      formData.append("sendAsMessage", "true");
    }
    if (options?.replyToMessageId) {
      formData.append("replyToMessageId", options.replyToMessageId.toString());
    }
    if (options?.threadId) {
      formData.append("threadId", options.threadId.toString());
    }

    const token = Cookies.get("accessToken");
    const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3060/api/v1";

    const response = await axios.post(`${baseURL}${API_ENDPOINTS.CHAT.MESSAGES.UPLOAD}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress({
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percentage
          });
        }
      }
    });

    return extractData(response.data);
  }

  /**
   * ✅ Upload multiple files for chat message
   */
  static async uploadMultipleMessageFiles(
    files: File[],
    messageId?: number,
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<UploadedFile[]> {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", file);
    });

    if (messageId) {
      formData.append("messageId", messageId.toString());
    }

    const token = Cookies.get("accessToken");
    const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3060/api/v1";

    const response = await axios.post(
      `${baseURL}${API_ENDPOINTS.CHAT.MESSAGES.UPLOAD_MULTIPLE}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress({
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percentage
            });
          }
        }
      }
    );

    return extractData(response.data);
  }

  /**
   * ✅ Get file download URL
   */
  static async getFileDownloadUrl(attachmentId: number): Promise<FileDownloadInfo> {
    return extractData(
      await encryptedApiClient.get(API_ENDPOINTS.CHAT.MESSAGES.FILE_DOWNLOAD(attachmentId))
    );
  }

  /**
   * ✅ Delete attachment
   */
  static async deleteAttachment(attachmentId: number): Promise<void> {
    await encryptedApiClient.delete(API_ENDPOINTS.CHAT.MESSAGES.FILE_DELETE(attachmentId));
  }

  /**
   * ✅ Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  }

  /**
   * ✅ Get file icon based on mime type
   */
  static getFileIcon(mimeType: string): string {
    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType.startsWith("video/")) return "🎥";
    if (mimeType.startsWith("audio/")) return "🎵";
    if (mimeType.includes("pdf")) return "📄";
    if (mimeType.includes("word") || mimeType.includes("document")) return "📝";
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "📊";
    if (mimeType.includes("zip") || mimeType.includes("rar")) return "📦";
    return "📎";
  }

  /**
   * ✅ Check if file is an image
   */
  static isImage(mimeType: string): boolean {
    return mimeType.startsWith("image/");
  }

  /**
   * ✅ Check if file is previewable
   */
  static isPreviewable(mimeType: string): boolean {
    return mimeType.startsWith("image/") || mimeType === "application/pdf";
  }

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
    return extractData(
      await encryptedApiClient.post(API_ENDPOINTS.CHAT.MESSAGES.FORWARD, {
        messageId,
        targetChannelIds
      })
    );
  }

  static async getUnreadCount(): Promise<{ unread: number }> {
    return extractData(await encryptedApiClient.get(API_ENDPOINTS.CHAT.UNREAD));
  }

  // ==================== MESSAGE DETAILS ====================

  static async getMessageDetails(messageId: number): Promise<Message> {
    return extractData(
      await encryptedApiClient.get(API_ENDPOINTS.CHAT.MESSAGES.DETAILS(messageId))
    );
  }

  static async getMessageAttachments(messageId: number): Promise<Attachment[]> {
    return extractData(
      await encryptedApiClient.get(API_ENDPOINTS.CHAT.MESSAGES.ATTACHMENTS(messageId))
    );
  }

  static async getMessageReactions(messageId: number): Promise<Reaction[]> {
    return extractData(
      await encryptedApiClient.get(API_ENDPOINTS.CHAT.MESSAGES.REACTIONS_LIST(messageId))
    );
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
    return extractData(
      await encryptedApiClient.get(API_ENDPOINTS.CHAT.THREADS.GET(messageId), { params: { limit } })
    );
  }

  static async replyInThread(parentMessageId: number, content: string): Promise<Message> {
    return extractData(
      await encryptedApiClient.post(API_ENDPOINTS.CHAT.THREADS.REPLY(parentMessageId), { content })
    );
  }

  static async getEnhancedThread(messageId: number, limit = 50): Promise<any> {
    return extractData(
      await encryptedApiClient.get(API_ENDPOINTS.CHAT.THREADS.ENHANCED(messageId), {
        params: { limit }
      })
    );
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
    return extractData(await encryptedApiClient.get(API_ENDPOINTS.CHAT.CHANNELS.GET(channelId)));
  }

  static async createChannel(payload: CreateChannelPayload): Promise<Channel> {
    return extractData(await encryptedApiClient.post(API_ENDPOINTS.CHAT.CHANNELS.CREATE, payload));
  }

  static async updateChannel(channelId: number, payload: UpdateChannelPayload): Promise<Channel> {
    return extractData(
      await encryptedApiClient.put(API_ENDPOINTS.CHAT.CHANNELS.UPDATE(channelId), payload)
    );
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
    return extractData(
      await encryptedApiClient.get(API_ENDPOINTS.CHAT.CHANNELS.FILES(channelId), {
        params: { limit }
      })
    );
  }

  // ==================== CHANNEL MEMBERS ====================

  static async getChannelMembers(channelId: number): Promise<Member[]> {
    return extractData(await encryptedApiClient.get(API_ENDPOINTS.CHAT.MEMBERS.LIST(channelId)));
  }

  static async addMembers(channelId: number, userIds: number[]): Promise<any> {
    return extractData(
      await encryptedApiClient.post(API_ENDPOINTS.CHAT.MEMBERS.ADD(channelId), { userIds })
    );
  }

  static async removeMember(channelId: number, userId: number): Promise<any> {
    return encryptedApiClient.delete(API_ENDPOINTS.CHAT.MEMBERS.REMOVE(channelId, userId));
  }

  static async updateMemberRole(channelId: number, userId: number, role: string): Promise<any> {
    return encryptedApiClient.put(API_ENDPOINTS.CHAT.MEMBERS.UPDATE_ROLE(channelId, userId), {
      role
    });
  }

  // ==================== SEARCH ====================

  static async search(
    query: string,
    opts?: { channelId?: number; type?: string; limit?: number }
  ): Promise<SearchResults> {
    const data: any = await encryptedApiClient.get(API_ENDPOINTS.CHAT.SEARCH, {
      params: { q: query, ...opts }
    });
    return data;
  }

  // ==================== TEAM ====================

  static async getTeamMembers(search?: string): Promise<Member[]> {
    return extractData(
      await encryptedApiClient.get(API_ENDPOINTS.CHAT.TEAM.MEMBERS, {
        params: { search }
      })
    );
  }

  static async getAvailableMembersForChannel(channelId: number): Promise<Member[]> {
    return extractData(
      await encryptedApiClient.get(API_ENDPOINTS.CHAT.TEAM.AVAILABLE_MEMBERS, {
        params: { channelId }
      })
    );
  }

  static async startTeamChat(memberIds: number[], name?: string): Promise<Channel> {
    return extractData(
      await encryptedApiClient.post(API_ENDPOINTS.CHAT.TEAM.START_CHAT, { memberIds, name })
    );
  }

  // ==================== MENTIONS ====================

  static async getUserMentions(limit = 50): Promise<any[]> {
    return extractData(
      await encryptedApiClient.get(API_ENDPOINTS.CHAT.MENTIONS.LIST, { params: { limit } })
    );
  }

  static async getUnreadMentionsCount(): Promise<{ count: number }> {
    return extractData(await encryptedApiClient.get(API_ENDPOINTS.CHAT.MENTIONS.UNREAD_COUNT));
  }

  // ==================== ACTIVITIES ====================

  static async getChannelActivities(channelId: number, limit = 50): Promise<Activity[]> {
    return extractData(
      await encryptedApiClient.get(API_ENDPOINTS.CHAT.ACTIVITIES.CHANNEL, {
        params: { channelId, limit }
      })
    );
  }

  static async getUnreadActivities(limit = 50): Promise<Activity[]> {
    return extractData(
      await encryptedApiClient.get(API_ENDPOINTS.CHAT.ACTIVITIES.UNREAD, { params: { limit } })
    );
  }

  static async markActivitiesAsRead(activityIds: number[]): Promise<any> {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.ACTIVITIES.MARK_READ, {
      activityIds
    });
  }

  // ==================== NOTIFICATIONS ====================

  static async getUnreadNotificationsCount(): Promise<{ count: number }> {
    return extractData(await encryptedApiClient.get(API_ENDPOINTS.CHAT.NOTIFICATIONS.UNREAD_COUNT));
  }

  static async markNotificationsAsRead(notificationIds: number[]): Promise<any> {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.NOTIFICATIONS.MARK_READ, {
      notificationIds
    });
  }

  static async getUserNotifications(limit = 50, page = 1): Promise<Notification[]> {
    return extractData(
      await encryptedApiClient.get(API_ENDPOINTS.CHAT.NOTIFICATIONS.LIST, {
        params: { limit, page }
      })
    );
  }

  static async getNotificationPreferences(): Promise<any[]> {
    return extractData(await encryptedApiClient.get(API_ENDPOINTS.CHAT.NOTIFICATIONS.PREFERENCES));
  }

  static async updateNotificationPreferences(payload: NotificationPreferencePayload): Promise<any> {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.NOTIFICATIONS.PREFERENCES, payload);
  }

  static async searchCollaborationMembers(query: string): Promise<Member[]> {
    return extractData(
      await encryptedApiClient.get(API_ENDPOINTS.CHAT.COLLABORATION.SEARCH_MEMBERS, {
        params: { q: query }
      })
    );
  }

  // ==================== PRESENCE ====================

  static async setOnline(): Promise<any> {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.PRESENCE.ONLINE);
  }

  static async setOffline(): Promise<any> {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.PRESENCE.OFFLINE);
  }

  static async getOnlineUsers(): Promise<number[]> {
    return extractData(await encryptedApiClient.get(API_ENDPOINTS.CHAT.PRESENCE.ONLINE_USERS));
  }

  // ==================== DELIVERY & READ STATUS ====================

  static async updateDeliveryStatus(messageId: number, status: "delivered" | "read"): Promise<any> {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.MESSAGES.DELIVERY_STATUS(messageId), {
      status
    });
  }

  static async markAsDelivered(messageId: number): Promise<any> {
    return encryptedApiClient.post(API_ENDPOINTS.CHAT.MESSAGES.MARK_DELIVERED(messageId));
  }

  static async getMessageReadStatus(messageId: number): Promise<MessageReadStatus> {
    return extractData(
      await encryptedApiClient.get(API_ENDPOINTS.CHAT.MESSAGES.READ_STATUS(messageId))
    );
  }

  static async getDetailedReadStatus(messageId: number): Promise<MessageReadStatus> {
    return extractData(
      await encryptedApiClient.get(API_ENDPOINTS.CHAT.MESSAGES.READ_STATUS_DETAILED(messageId))
    );
  }
}
