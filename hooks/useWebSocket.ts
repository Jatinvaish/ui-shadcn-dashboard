// hooks/useWebSocket.ts - COMPLETE FIX
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

    console.log('🔌 Connecting to WebSocket...', WS_URL);
    console.log('🔑 Using token:', token.substring(0, 20) + '...');

    const socket = io(`${WS_URL}/chat`, {
      auth: { token },
      query: { token }, // Also send as query param for compatibility
      transports: ['websocket', 'polling'], // Allow both transports
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      timeout: 20000,
      forceNew: false,
      autoConnect: true,
    });

    // CONNECTION EVENTS
    socket.on('connect', () => {
      console.log('✅ WebSocket connected - ID:', socket.id);
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
    });

    socket.on('connected', (data: any) => {
      console.log('✅ Server acknowledged connection:', data);
    });

    socket.on('disconnect', (reason: string) => {
      console.log('❌ WebSocket disconnected:', reason);
      setIsConnected(false);

      if (reason === 'io server disconnect') {
        console.log('🔄 Server disconnected us, reconnecting...');
        setTimeout(() => socket.connect(), 1000);
      }
    });

    socket.on('connect_error', (error: Error) => {
      console.error('❌ Connection error:', error.message);
      setIsConnected(false);
      reconnectAttemptsRef.current++;
      
      const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
      console.log(`Retrying in ${delay}ms... (attempt ${reconnectAttemptsRef.current})`);
    });

    socket.on('error', (error: any) => {
      console.error('❌ Socket error:', error);
    });

    // MESSAGE EVENTS
    socket.on('message', (data: any) => {
      console.log('📨 Message received:', data);
      
      try {
        if (data.event === 'new_message' && data.message) {
          dispatch(addMessageToChannel(data.message));
          
          if (data.message.sender_user_id !== userId) {
            dispatch(incrementUnreadCount(data.message.channel_id));
          }
        } else if (data.event === 'message_updated' && data.message) {
          dispatch(updateMessageInChannel(data.message));
        } else if (data.event === 'message_deleted' && data.message) {
          dispatch(removeMessageFromChannel({
            channelId: data.message.channel_id,
            messageId: data.message.id,
          }));
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });

    // TYPING INDICATORS
    socket.on('user_typing', (data: { channelId: number; userId: number; isTyping: boolean }) => {
      console.log('⌨️ Typing:', data);
      
      try {
        if (data.userId !== userId) {
          if (data.isTyping) {
            dispatch(addTypingUser({ channelId: data.channelId, userId: data.userId }));
            
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

    // PRESENCE
    socket.on('online_users', (data: { userIds: number[] }) => {
      console.log('👥 Online users:', data.userIds.length);
      dispatch(setOnlineUsers(data.userIds));
    });

    socket.on('user_status', (data: { userId: number; status: 'online' | 'offline' }) => {
      console.log('🟢 User status:', data);
    });

    socketRef.current = socket;

    return () => {
      console.log('🔌 Cleaning up WebSocket...');
      socket.off();
      socket.disconnect();
    };
  }, [token, userId, dispatch]);

  useEffect(() => {
    const cleanup = connect();
    return cleanup;
  }, [connect]);

  // SEND MESSAGE
  const sendMessage = useCallback((data: SendMessagePayload) => {
    if (!socketRef.current?.connected) {
      console.warn('⚠️ WebSocket not connected');
      return false;
    }

    try {
      console.log('📤 Sending message:', data);
      socketRef.current.emit('send_message', data);
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }, []);

  // TYPING INDICATORS
  const startTyping = useCallback((channelId: number) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('typing_start', { channelId });
  }, []);

  const stopTyping = useCallback((channelId: number) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('typing_stop', { channelId });
  }, []);

  // MANUAL RECONNECT
  const reconnect = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('Already connected');
      return;
    }
    console.log('Manual reconnect triggered');
    socketRef.current?.connect();
  }, []);

  // DISCONNECT
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