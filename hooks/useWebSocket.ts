// hooks/useWebSocket.ts - ULTRA-FAST WEBSOCKET
import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppDispatch } from '@/store/hooks';
import {
  addMessageToChannel,
  updateMessageInChannel,
  removeMessageFromChannel,
  addTypingUser,
  removeTypingUser,
  setOnlineUsers,
} from '@/store/slices/chatSlice';
import type { Message } from '@/lib/api/services/chat-service';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3060';

export const useWebSocket = (token: string | null, userId: number | null) => {
  const dispatch = useAppDispatch();
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!token || !userId) return;

    console.log('🔌 Connecting to WebSocket...');

    const socket = io(`${WS_URL}/chat`, {
      auth: { token },
      transports: ['websocket'], // WebSocket only - no polling
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    });

    socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    });

    socket.on('connected', (data: any) => {
      console.log('✅ Server acknowledged connection:', data);
    });

    socket.on('disconnect', (reason: string) => {
      console.log('❌ WebSocket disconnected:', reason);
    });

    socket.on('error', (error: any) => {
      console.error('❌ WebSocket error:', error);
    });

    // Message events
    socket.on('message', (data: { event: string; message: Message }) => {
      console.log('📨 New message:', data);
      
      switch (data.event) {
        case 'new_message':
          dispatch(addMessageToChannel(data.message));
          break;
        case 'message_updated':
          dispatch(updateMessageInChannel(data.message));
          break;
        case 'message_deleted':
          dispatch(
            removeMessageFromChannel({
              channelId: data.message.channel_id,
              messageId: data.message.id,
            })
          );
          break;
      }
    });

    // Typing indicators
    socket.on('user_typing', (data: { channelId: number; userId: number; isTyping: boolean }) => {
      if (data.isTyping) {
        dispatch(addTypingUser({ channelId: data.channelId, userId: data.userId }));
      } else {
        dispatch(removeTypingUser({ channelId: data.channelId, userId: data.userId }));
      }
    });

    // Online users
    socket.on('online_users', (data: { userIds: number[] }) => {
      dispatch(setOnlineUsers(data.userIds));
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [token, userId, dispatch]);

  useEffect(() => {
    const cleanup = connect();
    return cleanup;
  }, [connect]);

  // Send message via WebSocket (ultra-fast)
  const sendMessage = useCallback((data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('send_message', data);
    }
  }, []);

  // Start typing indicator
  const startTyping = useCallback((channelId: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing_start', { channelId });
    }
  }, []);

  // Stop typing indicator
  const stopTyping = useCallback((channelId: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing_stop', { channelId });
    }
  }, []);

  return {
    socket: socketRef.current,
    sendMessage,
    startTyping,
    stopTyping,
    isConnected: socketRef.current?.connected ?? false,
  };
};