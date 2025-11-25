// hooks/useWebSocket.ts - COMPLETE WITH READ STATUS TRACKING
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
} from '@/store/slices/chatSlice';
import type { SendMessagePayload } from '@/lib/api/services/chat-service';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3060';

interface UseWebSocketReturn {
  socket: Socket | null;
  sendMessage: (data: SendMessagePayload) => boolean;
  startTyping: (channelId: number) => void;
  stopTyping: (channelId: number) => void;
  updateDeliveryStatus: (messageId: number, status: 'delivered' | 'read') => void;
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
    // Don't connect without auth
    if (!token || !userId) {
      console.log('⚠️ WebSocket: Missing token or userId');
      return;
    }

    // Prevent multiple connections
    if (socketRef.current?.connected) {
      console.log('✅ WebSocket: Already connected');
      return;
    }

    // Disconnect existing socket if any
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
    socket.on('connect', () => {
      console.log('✅ WebSocket: Connected - ID:', socket.id);
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
    });

    socket.on('connected', (data: { userId: number; tenantId: number; timestamp: string }) => {
      console.log('✅ WebSocket: Server acknowledged -', data);
    });

    socket.on('disconnect', (reason: string) => {
      console.log('❌ WebSocket: Disconnected -', reason);
      setIsConnected(false);

      // Auto-reconnect on server disconnect
      if (reason === 'io server disconnect') {
        console.log('🔄 WebSocket: Server disconnected, reconnecting...');
        setTimeout(() => socket.connect(), 1000);
      }
    });

    socket.on('connect_error', (error: Error) => {
      console.error('❌ WebSocket: Connection error -', error.message);
      setIsConnected(false);
      reconnectAttemptsRef.current++;

      if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
        console.log('⚠️ WebSocket: Max reconnect attempts reached');
      }
    });

    socket.on('error', (error: { message: string }) => {
      console.error('❌ WebSocket: Error -', error.message);
      
      // Handle auth errors
      if (error.message?.includes('Authentication') || error.message?.includes('token')) {
        console.log('🔒 WebSocket: Auth error, disconnecting');
        socket.disconnect();
      }
    });

    // ==================== MESSAGE EVENTS ====================
    socket.on('message', (data: { event: string; message: any }) => {
      console.log('📨 WebSocket: Message received -', data.event);

      try {
        switch (data.event) {
          case 'new_message':
            if (data.message) {
              dispatch(addMessageToChannel(data.message));
              
              // Increment unread if not from current user
              if (data.message.sender_user_id !== userId) {
                dispatch(incrementUnreadCount(data.message.channel_id));
                
                // ✅ AUTO-SEND DELIVERY CONFIRMATION
                if (visibilityStateRef.current === 'visible') {
                  socket.emit('update_delivery_status', {
                    messageId: data.message.id,
                    status: 'delivered',
                  });
                }
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
              dispatch(removeMessageFromChannel({
                channelId: data.message.channel_id,
                messageId: data.message.id,
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

    // New message event (alternative format)
    socket.on('new_message', (message: any) => {
      console.log('📨 WebSocket: new_message event');
      if (message) {
        dispatch(addMessageToChannel(message));
        
        if (message.sender_user_id !== userId) {
          dispatch(incrementUnreadCount(message.channel_id));
          
          // ✅ AUTO-SEND DELIVERY CONFIRMATION
          if (visibilityStateRef.current === 'visible') {
            socket.emit('update_delivery_status', {
              messageId: message.id,
              status: 'delivered',
            });
          }
        }
      }
    });

    // ==================== READ STATUS EVENTS ====================
    // ✅ NEW: Listen for delivery/read status updates
    socket.on('message_status_updated', (data: {
      messageId: number;
      userId: number;
      status: 'delivered' | 'read';
      timestamp: string;
    }) => {
      console.log('✅ WebSocket: Message status updated -', data);
      
      dispatch(updateMessageStatus({
        messageId: data.messageId,
        status: data.status,
        timestamp: data.timestamp,
      }));
    });

    // ==================== TYPING INDICATORS ====================
    socket.on('user_typing', (data: { channelId: number; userId: number; isTyping: boolean }) => {
      if (data.userId === userId) return; // Ignore own typing

      if (data.isTyping) {
        dispatch(addTypingUser({ channelId: data.channelId, userId: data.userId }));

        // Auto-clear typing after 5 seconds
        const existingTimeout = typingTimeoutsRef.current.get(data.userId);
        if (existingTimeout) clearTimeout(existingTimeout);

        const timeout = setTimeout(() => {
          dispatch(removeTypingUser({ channelId: data.channelId, userId: data.userId }));
          typingTimeoutsRef.current.delete(data.userId);
        }, 5000);
        typingTimeoutsRef.current.set(data.userId, timeout);
      } else {
        dispatch(removeTypingUser({ channelId: data.channelId, userId: data.userId }));
        const existingTimeout = typingTimeoutsRef.current.get(data.userId);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
          typingTimeoutsRef.current.delete(data.userId);
        }
      }
    });

    // ==================== PRESENCE ====================
    socket.on('online_users', (data: { userIds: number[] }) => {
      console.log('👥 WebSocket: Online users -', data.userIds?.length || 0);
      dispatch(setOnlineUsers(data.userIds || []));
    });

    socket.on('user_status', (data: { userId: number; status: 'online' | 'offline' }) => {
      console.log('🟢 WebSocket: User status -', data);
    });

    socketRef.current = socket;
  }, [token, userId, dispatch]);

  // ==================== PAGE VISIBILITY TRACKING ====================
  // ✅ Track when user switches tabs to delay delivery confirmations
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
      
      // Clear typing timeouts
      typingTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      typingTimeoutsRef.current.clear();
      
      // Disconnect socket
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
    };
  }, [connect]);

  // ==================== SEND MESSAGE ====================
  const sendMessage = useCallback((data: SendMessagePayload): boolean => {
    if (!socketRef.current?.connected) {
      console.warn('⚠️ WebSocket: Not connected, cannot send message');
      return false;
    }

    try {
      console.log('📤 WebSocket: Sending message to channel', data.channelId);
      socketRef.current.emit('send_message', data, (response: { 
        success: boolean; 
        messageId?: number; 
        error?: string 
      }) => {
        if (response?.success) {
          console.log('✅ WebSocket: Message sent -', response.messageId);
        } else {
          console.error('❌ WebSocket: Send failed -', response?.error);
        }
      });
      return true;
    } catch (error) {
      console.error('WebSocket: Error sending message -', error);
      return false;
    }
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

  // ==================== UPDATE DELIVERY STATUS ====================
  // ✅ NEW: Send delivery/read status updates
  const updateDeliveryStatus = useCallback((
    messageId: number, 
    status: 'delivered' | 'read'
  ) => {
    if (!socketRef.current?.connected) {
      console.warn('⚠️ WebSocket: Not connected, cannot update status');
      return;
    }

    try {
      console.log(`📬 WebSocket: Updating message ${messageId} status to ${status}`);
      socketRef.current.emit('update_delivery_status', {
        messageId,
        status,
      });
    } catch (error) {
      console.error('WebSocket: Error updating delivery status -', error);
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
    updateDeliveryStatus, // ✅ NEW: Export delivery status method
    reconnect,
    disconnect,
    isConnected,
  };
};