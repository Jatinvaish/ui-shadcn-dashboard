// hooks/useWebSocket.ts - FULLY ALIGNED WITH BACKEND GATEWAY
import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppDispatch } from '@/store/hooks';
import {
  addMessageToChannel,
  updateMessageInChannel,
  removeMessageFromChannel,
  addTypingUser,
  removeTypingUser,
  setOnlineUsers,
  incrementUnreadCount,
  updateMessageStatus,
  updateMessageDeliveryStatus,
  updateMessageReadStatus,
  addReactionToMessage,
  removeReactionFromMessage,
  pinMessageInChannel,
  updateThreadReplyCount,
  fetchUserChannels,
  addMembersToChannel,
} from '@/store/slices/chatSlice';
import type { SendMessagePayload } from '@/lib/api/services/chat-service';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3060';


interface UseWebSocketReturn {
  socket: Socket | null;
  sendMessage: (data: SendMessagePayload) => Promise<boolean>;
  startTyping: (channelId: number) => void;
  stopTyping: (channelId: number) => void;
  markAsDelivered: (messageId: number, channelId: number) => void;
  markAsRead: (messageId: number, channelId: number) => void;
  bulkMarkAsRead: (channelId: number, upToMessageId: number) => void;
  addReaction: (messageId: number, emoji: string, channelId: number) => void;
  removeReaction: (messageId: number, emoji: string, channelId: number) => void;
  editMessage: (messageId: number, content: string, channelId: number, mentions?: number[]) => void;
  deleteMessage: (messageId: number, channelId: number) => void;
  pinMessage: (messageId: number, channelId: number, isPinned: boolean) => void;
  replyInThread: (parentMessageId: number, content: string, channelId: number, mentions?: number[]) => void;
  inviteMembers: (channelId: number, userIds: number[]) => void; // ✅ ADD THIS
  reconnect: () => void;
  disconnect: () => void;
  isConnected: boolean;
}
export const useWebSocket = (
  token: string | null,
  userId: number | null
): UseWebSocketReturn => {
  const dispatch = useAppDispatch();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 10;
  const typingTimeoutsRef = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const visibilityStateRef = useRef<'visible' | 'hidden'>('visible');

  const connect = useCallback(() => {
    if (!token || !userId) {
      console.log('⚠️ WebSocket: Missing token or userId');
      return;
    }

    if (socketRef.current?.connected) {
      console.log('✅ WebSocket: Already connected');
      return;
    }

    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
    }

    console.log('🔌 WebSocket: Connecting to', WS_URL);

    const socket = io(`${WS_URL}/chat`, {
      auth: { token },
      query: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: maxReconnectAttempts,
      timeout: 20000,
      forceNew: true,
    });

    // ==================== CONNECTION EVENTS ====================
    socket.on('message', (data: any) => {
      console.log('📨 WebSocket: Message received -', data.event, data);

      try {
        switch (data.event) {
          case 'new_message':
            if (data.message) {
              // ✅ FIX: Dispatch complete message to Redux
              dispatch(addMessageToChannel(data.message));

              if (data.message.sender_user_id !== userId) {
                dispatch(incrementUnreadCount(data.message.channel_id));

                if (visibilityStateRef.current === 'visible') {
                  socket.emit('mark_as_delivered', {
                    messageId: data.message.id,
                    channelId: data.message.channel_id,
                  });
                }
              }
            }
            break;

          case 'message_edited':
            if (data.messageId && data.channelId) {
              dispatch(updateMessageInChannel({
                channelId: data.channelId,
                messageId: data.messageId,
                content: data.content,
                mentions: data.mentions,
                editedAt: data.editedAt,
              }));
            }
            break;

          case 'message_deleted':
            if (data.messageId && data.channelId) {
              dispatch(removeMessageFromChannel({
                channelId: data.channelId,
                messageId: data.messageId,
              }));
            }
            break;

          case 'message_pinned':
          case 'message_unpinned':
            if (data.messageId && data.channelId) {
              dispatch(pinMessageInChannel({
                channelId: data.channelId,
                messageId: data.messageId,
                isPinned: data.event === 'message_pinned',
                pinnedBy: data.pinnedBy,
                pinnedAt: data.timestamp,
              }));
            }
            break;

          // ==================== REACTIONS ====================
          case 'reaction_added':
            if (data.messageId && data.emoji && data.channelId) {
              dispatch(addReactionToMessage({
                messageId: data.messageId,
                channelId: data.channelId,
                reaction: {
                  emoji: data.emoji,
                  userId: data.userId,
                  userName: data.userName,
                  avatarUrl: data.avatarUrl,
                  timestamp: data.timestamp,
                },
              }));
            }
            break;

          case 'reaction_removed':
            if (data.messageId && data.emoji && data.channelId) {
              dispatch(removeReactionFromMessage({
                messageId: data.messageId,
                channelId: data.channelId,
                emoji: data.emoji,
                userId: data.userId,
              }));
            }
            break;

          // ==================== READ STATUS ====================
          case 'message_delivered':
            if (data.messageId) {
              dispatch(updateMessageDeliveryStatus({
                messageId: data.messageId,
                deliveredBy: data.deliveredBy,
                deliveredCount: data.deliveredCount,
                timestamp: data.timestamp,
              }));
            }
            break;

          case 'message_read':
            if (data.messageId) {
              dispatch(updateMessageReadStatus({
                messageId: data.messageId,
                readBy: data.readBy,
                readByName: data.readByName,
                readCount: data.readCount,
                timestamp: data.timestamp,
              }));
            }
            break;

          case 'bulk_read_update':
            if (data.channelId && data.upToMessageId) {
              console.log('📖 Bulk read update:', data);
            }
            break;

          // ==================== THREADS ====================
          case 'thread_reply':
            if (data.message && data.parentMessageId) {
              // ✅ Add thread reply to messages
              dispatch(addMessageToChannel(data.message));

              // ✅ Update parent message reply count
              dispatch(updateThreadReplyCount({
                messageId: data.parentMessageId,
                increment: 1,
              }));
            }
            break;

          // ==================== MENTIONS ====================
          case 'user_mentioned':
            if (data.messageId) {
              dispatch(incrementUnreadCount(data.channelId));
              console.log('📢 You were mentioned:', data);
            }
            break;

          case 'mentioned_in_thread':
            if (data.messageId) {
              console.log('📢 Mentioned in thread:', data);
              dispatch(incrementUnreadCount(data.channelId));
            }
            break;

          // ==================== MEMBER INVITATIONS ====================
          case 'member_invited':
            console.log('👥 Invited to channel:', data);
            dispatch(fetchUserChannels(50));
            break;

          case 'members_added':
            if (data.channelId && data.userIds) {
              console.log('👥 Members added to channel:', data);
              dispatch(addMembersToChannel({
                channelId: data.channelId,
                userIds: data.userIds,
              }));
            }
            break;

          default:
            console.log('📨 WebSocket: Unknown event -', data.event);
        }
      } catch (error) {
        console.error('WebSocket: Error processing message -', error);
      }
    });
    socket.on('user_typing', (data: {
      channelId: number;
      userId: number;
      userName?: string;
      isTyping: boolean
    }) => {
      if (data.userId === userId) return;

      if (data.isTyping) {
        dispatch(addTypingUser({
          channelId: data.channelId,
          userId: data.userId,
          userName: data.userName,
        }));

        const existingTimeout = typingTimeoutsRef.current.get(data.userId);
        if (existingTimeout) clearTimeout(existingTimeout);

        const timeout = setTimeout(() => {
          dispatch(removeTypingUser({
            channelId: data.channelId,
            userId: data.userId
          }));
          typingTimeoutsRef.current.delete(data.userId);
        }, 5000);
        typingTimeoutsRef.current.set(data.userId, timeout);
      } else {
        dispatch(removeTypingUser({
          channelId: data.channelId,
          userId: data.userId
        }));
        const existingTimeout = typingTimeoutsRef.current.get(data.userId);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
          typingTimeoutsRef.current.delete(data.userId);
        }
      }
    });

    socketRef.current = socket;
  }, [token, userId, dispatch]);

  // ==================== PAGE VISIBILITY TRACKING ====================
  useEffect(() => {
    const handleVisibilityChange = () => {
      visibilityStateRef.current = document.hidden ? 'hidden' : 'visible';
      console.log('👁️ Page visibility:', visibilityStateRef.current);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Initialize connection
  useEffect(() => {
    connect();

    return () => {
      console.log('🔌 WebSocket: Cleaning up...');

      typingTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      typingTimeoutsRef.current.clear();

      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
    };
  }, [connect]);

  // ==================== SEND MESSAGE ====================
  const sendMessage = useCallback(async (data: SendMessagePayload): Promise<boolean> => {
    if (!socketRef.current?.connected) {
      console.warn('⚠️ WebSocket: Not connected, cannot send message');
      return false;
    }

    return new Promise((resolve) => {
      try {
        console.log('📤 WebSocket: Sending message to channel', data.channelId);
        socketRef.current!.emit('send_message', data, (response: {
          success: boolean;
          messageId?: number;
          latency?: number;
          error?: string;
        }) => {
          if (response?.success) {
            console.log('✅ WebSocket: Message sent -', response.messageId, `(${response.latency}ms)`);
            resolve(true);
          } else {
            console.error('❌ WebSocket: Send failed -', response?.error);
            resolve(false);
          }
        });
      } catch (error) {
        console.error('WebSocket: Error sending message -', error);
        resolve(false);
      }
    });
  }, []);

  // ==================== TYPING INDICATORS ====================
  const startTyping = useCallback((channelId: number) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('typing_start', { channelId });
  }, []);

  const stopTyping = useCallback((channelId: number) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('typing_stop', { channelId });
  }, []);

  // ==================== DELIVERY & READ STATUS ====================
  const markAsDelivered = useCallback((messageId: number, channelId: number) => {
    if (!socketRef.current?.connected) {
      console.warn('⚠️ WebSocket: Not connected');
      return;
    }

    try {
      socketRef.current.emit('mark_as_delivered', { messageId, channelId });
    } catch (error) {
      console.error('WebSocket: Error marking as delivered -', error);
    }
  }, []);

  const markAsRead = useCallback((messageId: number, channelId: number) => {
    if (!socketRef.current?.connected) {
      console.warn('⚠️ WebSocket: Not connected');
      return;
    }

    try {
      socketRef.current.emit('mark_as_read', { messageId, channelId });
    } catch (error) {
      console.error('WebSocket: Error marking as read -', error);
    }
  }, []);

  const bulkMarkAsRead = useCallback((channelId: number, upToMessageId: number) => {
    if (!socketRef.current?.connected) {
      console.warn('⚠️ WebSocket: Not connected');
      return;
    }

    try {
      socketRef.current.emit('bulk_mark_as_read', { channelId, upToMessageId });
    } catch (error) {
      console.error('WebSocket: Error bulk marking as read -', error);
    }
  }, []);

  // ==================== REACTIONS ====================
  const addReaction = useCallback((messageId: number, emoji: string, channelId: number) => {
    if (!socketRef.current?.connected) return;

    try {
      socketRef.current.emit('add_reaction', { messageId, emoji, channelId }, (response: any) => {
        if (response?.success) {
          console.log('✅ WebSocket: Reaction added');
        } else {
          console.error('❌ WebSocket: Add reaction failed -', response?.error);
        }
      });
    } catch (error) {
      console.error('WebSocket: Error adding reaction -', error);
    }
  }, []);

  const removeReaction = useCallback((messageId: number, emoji: string, channelId: number) => {
    if (!socketRef.current?.connected) return;

    try {
      socketRef.current.emit('remove_reaction', { messageId, emoji, channelId }, (response: any) => {
        if (response?.success) {
          console.log('✅ WebSocket: Reaction removed');
        }
      });
    } catch (error) {
      console.error('WebSocket: Error removing reaction -', error);
    }
  }, []);

  // ==================== MESSAGE EDITING ====================
  const editMessage = useCallback((
    messageId: number,
    content: string,
    channelId: number,
    mentions?: number[]
  ) => {
    if (!socketRef.current?.connected) return;

    try {
      socketRef.current.emit('edit_message', {
        messageId,
        content,
        channelId,
        mentions
      }, (response: any) => {
        if (response?.success) {
          console.log('✅ WebSocket: Message edited');
        }
      });
    } catch (error) {
      console.error('WebSocket: Error editing message -', error);
    }
  }, []);

  const deleteMessage = useCallback((messageId: number, channelId: number) => {
    if (!socketRef.current?.connected) return;

    try {
      socketRef.current.emit('delete_message', { messageId, channelId }, (response: any) => {
        if (response?.success) {
          console.log('✅ WebSocket: Message deleted');
        }
      });
    } catch (error) {
      console.error('WebSocket: Error deleting message -', error);
    }
  }, []);

  const pinMessage = useCallback((messageId: number, channelId: number, isPinned: boolean) => {
    if (!socketRef.current?.connected) return;

    try {
      socketRef.current.emit('pin_message', { messageId, channelId, isPinned }, (response: any) => {
        if (response?.success) {
          console.log('✅ WebSocket: Message pin status updated');
        }
      });
    } catch (error) {
      console.error('WebSocket: Error pinning message -', error);
    }
  }, []);

  // ==================== THREAD REPLIES ====================
  const replyInThread = useCallback((
    parentMessageId: number,
    content: string,
    channelId: number,
    mentions?: number[]
  ) => {
    if (!socketRef.current?.connected) return;

    try {
      socketRef.current.emit('thread_reply', {
        parentMessageId,
        content,
        channelId,
        mentions
      }, (response: any) => {
        if (response?.success) {
          console.log('✅ WebSocket: Thread reply sent -', response.messageId);
        }
      });
    } catch (error) {
      console.error('WebSocket: Error replying in thread -', error);
    }
  }, []);
  const inviteMembers = useCallback((channelId: number, userIds: number[]) => {
    if (!socketRef.current?.connected) {
      console.warn('⚠️ WebSocket: Not connected');
      return;
    }

    try {
      socketRef.current.emit('invite_members', { channelId, userIds }, (response: any) => {
        if (response?.success) {
          console.log('✅ WebSocket: Members invited');
        } else {
          console.error('❌ WebSocket: Invite failed -', response?.error);
        }
      });
    } catch (error) {
      console.error('WebSocket: Error inviting members -', error);
    }
  }, []);

  // ==================== MANUAL RECONNECT ====================
  const reconnect = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('WebSocket: Already connected');
      return;
    }

    console.log('🔄 WebSocket: Manual reconnect');
    reconnectAttemptsRef.current = 0;

    if (socketRef.current) {
      socketRef.current.connect();
    } else {
      connect();
    }
  }, [connect]);

  // ==================== DISCONNECT ====================
  const disconnect = useCallback(() => {
    console.log('🔌 WebSocket: Manual disconnect');
    if (socketRef.current) {
      socketRef.current.disconnect();
      setIsConnected(false);
    }
  }, []);

  return {
    socket: socketRef.current,
    sendMessage,
    startTyping,
    stopTyping,
    markAsDelivered,
    markAsRead,
    bulkMarkAsRead,
    addReaction,
    removeReaction,
    editMessage,
    deleteMessage,
    pinMessage,
    replyInThread,
    inviteMembers, // ✅ ADD THIS LINE
    reconnect,
    disconnect,
    isConnected,
  };
};