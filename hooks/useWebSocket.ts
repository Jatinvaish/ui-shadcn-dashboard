// hooks/useWebSocket.ts - SOCKET.IO COMPATIBLE + FIXED EVENT LISTENING
import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppDispatch } from '@/store/hooks';
import {
  addMessageToChannel,
  updateMessageInChannel,
  removeMessageFromChannel,
  addTypingUser,
  removeTypingUser,
  incrementUnreadCount,
  updateMessageDeliveryStatus,
  updateMessageReadStatus,
  addReactionToMessage,
  removeReactionFromMessage,
  pinMessageInChannel,
  updateThreadReplyCount,
  fetchUserChannels,
  addMembersToChannel,
  addMessageToThread,
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
  inviteMembers: (channelId: number, userIds: number[]) => void;
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
  const messageQueueRef = useRef<Array<{ event: string; data: any; callback?: Function }>>([]);

  const connect = useCallback(() => {
    if (!token || !userId) {
      console.log('⚠️ WebSocket: Missing token or userId');
      return;
    }

    if (socketRef.current?.connected) {
      console.log('✅ WebSocket: Already connected');
      setIsConnected(true);
      return;
    }

    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
    }

    console.log('🔌 WebSocket: Connecting to', `${WS_URL}/chat`);

    // ✅ Socket.IO Client Connection
    const socket = io(`${WS_URL}/chat`, {
      auth: { token },
      query: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: maxReconnectAttempts,
      timeout: 20000,
      autoConnect: true,
    });

    // ==================== CONNECTION EVENTS ====================
    socket.on('connect', () => {
      console.log('✅ WebSocket: Connected - Socket ID:', socket.id);
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;

      // Process queued messages
      if (messageQueueRef.current.length > 0) {
        console.log(`📤 Processing ${messageQueueRef.current.length} queued messages`);
        messageQueueRef.current.forEach(({ event, data, callback }) => {
          socket.emit(event, data, callback);
        });
        messageQueueRef.current = [];
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket: Disconnected -', reason);
      setIsConnected(false);

      if (reason === 'io server disconnect') {
        console.log('🔄 Server disconnected, attempting reconnect...');
        socket.connect();
      }
    });

    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket: Connection error -', error.message);
      setIsConnected(false);
      reconnectAttemptsRef.current++;

      if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
        console.error('❌ WebSocket: Max reconnection attempts reached');
        socket.disconnect();
      }
    });

    socket.on('error', (error) => {
      console.error('❌ WebSocket: Error -', error);
    });

    socket.on('connected', (data) => {
      console.log('✅ WebSocket: Server acknowledged connection:', data);
    });

    // ==================== MESSAGE EVENT (ALL EVENTS COME THROUGH THIS) ====================
    socket.on('message', (data: any) => {
      console.log('📨 WebSocket: Event received -', data.event, data);

      try {
        switch (data.event) {
          case 'new_message':
            if (data.message) {
              console.log('💬 New message:', data.message.id);
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
              console.log('✏️ Message edited:', data.messageId);
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
              console.log('🗑️ Message deleted:', data.messageId);
              dispatch(removeMessageFromChannel({
                channelId: data.channelId,
                messageId: data.messageId,
              }));
            }
            break;

          case 'message_pinned':
          case 'message_unpinned':
            if (data.messageId && data.channelId) {
              console.log('📌 Message pin status:', data.event);
              dispatch(pinMessageInChannel({
                channelId: data.channelId,
                messageId: data.messageId,
                isPinned: data.event === 'message_pinned',
                pinnedBy: data.pinnedBy,
                pinnedAt: data.timestamp,
              }));
            }
            break;

          case 'reaction_added':
            if (data.messageId && data.emoji && data.channelId) {
              console.log('👍 Reaction added:', data.emoji, 'to message', data.messageId);
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
              console.log('👎 Reaction removed:', data.emoji, 'from message', data.messageId);
              dispatch(removeReactionFromMessage({
                messageId: data.messageId,
                channelId: data.channelId,
                emoji: data.emoji,
                userId: data.userId,
              }));
            }
            break;

          case 'message_delivered':
            if (data.messageId) {
              console.log('✅ Message delivered:', data.messageId);
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
              console.log('📖 Message read:', data.messageId);
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
              console.log('📖 Bulk read update:', data.channelId, 'up to', data.upToMessageId);
              // Handle bulk read - update UI if needed
            }
            break;

          case 'thread_reply':
            if (data.message && data.parentMessageId) {
              console.log('🧵 Thread reply:', data.message.id, 'to parent', data.parentMessageId);
              
              // Add to main channel messages
              dispatch(addMessageToChannel(data.message));
              
              // Add to thread messages
              dispatch(addMessageToThread({
                parentMessageId: data.parentMessageId,
                message: data.message,
              }));
              
              // Update parent message reply count
              dispatch(updateThreadReplyCount({
                messageId: data.parentMessageId,
                increment: 1,
              }));
            }
            break;

          case 'user_mentioned':
          case 'mentioned_in_thread':
            if (data.messageId) {
              console.log('📢 You were mentioned:', data);
              dispatch(incrementUnreadCount(data.channelId));
            }
            break;

          case 'member_invited':
            console.log('👥 Invited to channel:', data);
            dispatch(fetchUserChannels(50));
            break;

          case 'members_added':
            if (data.channelId && data.userIds) {
              console.log('👥 Members added to channel:', data.channelId);
              dispatch(addMembersToChannel({
                channelId: data.channelId,
                userIds: data.userIds,
              }));
            }
            break;

          default:
            console.log('📨 WebSocket: Unhandled event -', data.event);
        }
      } catch (error) {
        console.error('❌ WebSocket: Error processing message -', error);
      }
    });

    // ==================== TYPING INDICATOR EVENTS ====================
    socket.on('user_typing', (data: {
      channelId: number;
      userId: number;
      userName?: string;
      isTyping: boolean;
    }) => {
      if (data.userId === userId) return;

      console.log('⌨️ Typing event:', data);

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
            userId: data.userId,
          }));
          typingTimeoutsRef.current.delete(data.userId);
        }, 5000);

        typingTimeoutsRef.current.set(data.userId, timeout);
      } else {
        dispatch(removeTypingUser({
          channelId: data.channelId,
          userId: data.userId,
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

  useEffect(() => {
    const handleVisibilityChange = () => {
      visibilityStateRef.current = document.hidden ? 'hidden' : 'visible';
      console.log('👁️ Page visibility:', visibilityStateRef.current);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

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

  const emitWithQueue = useCallback((
    event: string,
    data: any,
    callback?: (response: any) => void
  ) => {
    if (!socketRef.current?.connected) {
      console.warn(`⚠️ WebSocket: Not connected, queuing ${event}`);
      messageQueueRef.current.push({ event, data, callback });
      return false;
    }

    console.log(`📤 Emitting event: ${event}`, data);
    socketRef.current.emit(event, data, callback);
    return true;
  }, []);

  const sendMessage = useCallback(async (data: SendMessagePayload): Promise<boolean> => {
    return new Promise((resolve) => {
      const success = emitWithQueue('send_message', data, (response: any) => {
        if (response?.success) {
          console.log('✅ Message sent -', response.messageId, `(${response.latency}ms)`);
          resolve(true);
        } else {
          console.error('❌ Send failed -', response?.error);
          resolve(false);
        }
      });

      if (!success) {
        setTimeout(() => resolve(false), 100);
      }
    });
  }, [emitWithQueue]);

  const startTyping = useCallback((channelId: number) => {
    emitWithQueue('typing_start', { channelId });
  }, [emitWithQueue]);

  const stopTyping = useCallback((channelId: number) => {
    emitWithQueue('typing_stop', { channelId });
  }, [emitWithQueue]);

  const markAsDelivered = useCallback((messageId: number, channelId: number) => {
    emitWithQueue('mark_as_delivered', { messageId, channelId });
  }, [emitWithQueue]);

  const markAsRead = useCallback((messageId: number, channelId: number) => {
    emitWithQueue('mark_as_read', { messageId, channelId });
  }, [emitWithQueue]);

  const bulkMarkAsRead = useCallback((channelId: number, upToMessageId: number) => {
    emitWithQueue('bulk_mark_as_read', { channelId, upToMessageId });
  }, [emitWithQueue]);

  const addReaction = useCallback((messageId: number, emoji: string, channelId: number) => {
    emitWithQueue('add_reaction', { messageId, emoji, channelId }, (response: any) => {
      if (response?.success) {
        console.log('✅ Reaction added');
      } else {
        console.error('❌ Add reaction failed -', response?.error);
      }
    });
  }, [emitWithQueue]);

  const removeReaction = useCallback((messageId: number, emoji: string, channelId: number) => {
    emitWithQueue('remove_reaction', { messageId, emoji, channelId }, (response: any) => {
      if (response?.success) {
        console.log('✅ Reaction removed');
      }
    });
  }, [emitWithQueue]);

  const editMessage = useCallback((
    messageId: number,
    content: string,
    channelId: number,
    mentions?: number[]
  ) => {
    emitWithQueue('edit_message', {
      messageId,
      content,
      channelId,
      mentions,
    }, (response: any) => {
      if (response?.success) {
        console.log('✅ Message edited');
      }
    });
  }, [emitWithQueue]);

  const deleteMessage = useCallback((messageId: number, channelId: number) => {
    emitWithQueue('delete_message', { messageId, channelId }, (response: any) => {
      if (response?.success) {
        console.log('✅ Message deleted');
      }
    });
  }, [emitWithQueue]);

  const pinMessage = useCallback((messageId: number, channelId: number, isPinned: boolean) => {
    emitWithQueue('pin_message', { messageId, channelId, isPinned }, (response: any) => {
      if (response?.success) {
        console.log('✅ Message pin status updated');
      }
    });
  }, [emitWithQueue]);

  const replyInThread = useCallback((
    parentMessageId: number,
    content: string,
    channelId: number,
    mentions?: number[]
  ) => {
    emitWithQueue('thread_reply', {
      parentMessageId,
      content,
      channelId,
      mentions,
    }, (response: any) => {
      if (response?.success) {
        console.log('✅ Thread reply sent -', response.messageId);
      }
    });
  }, [emitWithQueue]);

  const inviteMembers = useCallback((channelId: number, userIds: number[]) => {
    emitWithQueue('invite_members', { channelId, userIds }, (response: any) => {
      if (response?.success) {
        console.log('✅ Members invited');
      } else {
        console.error('❌ Invite failed -', response?.error);
      }
    });
  }, [emitWithQueue]);

  const reconnect = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('✅ WebSocket: Already connected');
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
    inviteMembers,
    reconnect,
    disconnect,
    isConnected,
  };
};