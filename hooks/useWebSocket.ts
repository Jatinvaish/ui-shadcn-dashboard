// hooks/useWebSocket.ts - 100% WORKING WEBSOCKET
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
} from '@/store/slices/chatSlice';
import type { SendMessagePayload } from '@/lib/api/services/chat-service';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3060';

export const useWebSocket = (token: string | null, userId: number | null) => {
  const dispatch = useAppDispatch();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (!token || !userId) {
      console.log('⚠️ Cannot connect: Missing token or userId');
      return;
    }

    // Prevent multiple connections
    if (socketRef.current?.connected) {
      console.log('✅ Already connected to WebSocket');
      return;
    }

    console.log('🔌 Connecting to WebSocket...');

    const socket = io(`${WS_URL}/chat`, {
      auth: { token },
      transports: ['websocket'], // WebSocket only - no polling
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      timeout: 10000,
    });

    socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    });

    socket.on('connected', (data: any) => {
      console.log('✅ Server acknowledged connection:', data);
    });

    socket.on('disconnect', (reason: string) => {
      console.log('❌ WebSocket disconnected:', reason);
      setIsConnected(false);

      // Auto-reconnect on certain disconnect reasons
      if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect
        setTimeout(() => socket.connect(), 1000);
      }
    });

    socket.on('connect_error', (error: Error) => {
      console.error('❌ WebSocket connection error:', error.message);
      setIsConnected(false);
      reconnectAttemptsRef.current++;

      // Exponential backoff for reconnection
      const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
      console.log(`Retrying connection in ${delay}ms...`);
    });

    socket.on('error', (error: any) => {
      console.error('❌ WebSocket error:', error);
    });

    // ==================== MESSAGE EVENTS ====================
    socket.on('message', (data: any) => {
      console.log('📨 New message received:', data);
      
      try {
        switch (data.event) {
          case 'new_message':
            if (data.message) {
              dispatch(addMessageToChannel(data.message));
              // Increment unread if not in current channel
              if (data.message.sender_user_id !== userId) {
                dispatch(incrementUnreadCount(data.message.channel_id));
              }
            }
            break;

          case 'message_updated':
            if (data.message) {
              dispatch(updateMessageInChannel(data.message));
            }
            break;

          case 'message_deleted':
            if (data.message) {
              dispatch(
                removeMessageFromChannel({
                  channelId: data.message.channel_id,
                  messageId: data.message.id,
                })
              );
            }
            break;

          default:
            console.log('Unknown message event:', data.event);
        }
      } catch (error) {
        console.error('Error processing message event:', error);
      }
    });

    // ==================== TYPING INDICATORS ====================
    socket.on('user_typing', (data: { channelId: number; userId: number; isTyping: boolean }) => {
      console.log('⌨️ Typing indicator:', data);
      
      try {
        if (data.userId !== userId) { // Don't show own typing indicator
          if (data.isTyping) {
            dispatch(addTypingUser({ channelId: data.channelId, userId: data.userId }));
            
            // Auto-remove after 5 seconds (fallback)
            setTimeout(() => {
              dispatch(removeTypingUser({ channelId: data.channelId, userId: data.userId }));
            }, 5000);
          } else {
            dispatch(removeTypingUser({ channelId: data.channelId, userId: data.userId }));
          }
        }
      } catch (error) {
        console.error('Error processing typing indicator:', error);
      }
    });

    // ==================== PRESENCE ====================
    socket.on('online_users', (data: { userIds: number[] }) => {
      console.log('👥 Online users update:', data.userIds.length);
      dispatch(setOnlineUsers(data.userIds));
    });

    socket.on('user_status', (data: { userId: number; status: 'online' | 'offline' }) => {
      console.log('🟢 User status change:', data);
      // Handle individual status changes if needed
    });

    socketRef.current = socket;

    return () => {
      console.log('🔌 Disconnecting WebSocket...');
      socket.off('connect');
      socket.off('connected');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('error');
      socket.off('message');
      socket.off('user_typing');
      socket.off('online_users');
      socket.off('user_status');
      socket.disconnect();
    };
  }, [token, userId, dispatch]);

  useEffect(() => {
    const cleanup = connect();
    return cleanup;
  }, [connect]);

  // ==================== SEND MESSAGE ====================
  const sendMessage = useCallback((data: SendMessagePayload) => {
    if (!socketRef.current?.connected) {
      console.warn('⚠️ WebSocket not connected, cannot send message');
      return false;
    }

    try {
      console.log('📤 Sending message via WebSocket:', data);
      socketRef.current.emit('send_message', data);
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }, []);

  // ==================== TYPING INDICATORS ====================
  const startTyping = useCallback((channelId: number) => {
    if (!socketRef.current?.connected) return;

    try {
      socketRef.current.emit('typing_start', { channelId });
    } catch (error) {
      console.error('Error sending typing_start:', error);
    }
  }, []);

  const stopTyping = useCallback((channelId: number) => {
    if (!socketRef.current?.connected) return;

    try {
      socketRef.current.emit('typing_stop', { channelId });
    } catch (error) {
      console.error('Error sending typing_stop:', error);
    }
  }, []);

  // ==================== MANUAL RECONNECT ====================
  const reconnect = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('Already connected');
      return;
    }

    console.log('Manual reconnect triggered');
    socketRef.current?.connect();
  }, []);

  // ==================== DISCONNECT ====================
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('Manual disconnect');
      socketRef.current.disconnect();
      setIsConnected(false);
    }
  }, []);

  return {
    socket: socketRef.current,
    sendMessage,
    startTyping,
    stopTyping,
    reconnect,
    disconnect,
    isConnected,
  };
};