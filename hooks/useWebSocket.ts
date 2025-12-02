// hooks/useWebSocket.ts - FIXED: Properly send HTML content

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

  // Setup WebSocket connection
  useEffect(() => {
    if (!token || !userId) {
      console.log('⚠️ No token/userId, skipping WebSocket');
      return;
    }

    console.log('🔌 Initializing WebSocket connection...');

    const socket = io(`${WS_URL}/chat`, {
      auth: { token },
      query: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    // CONNECTION EVENTS
    socket.on('connect', () => {
      console.log('✅ WebSocket Connected - ID:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket Disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Connection Error:', error.message);
      setIsConnected(false);
    });

    // MAIN MESSAGE HANDLER
    socket.on('message', (data: any) => {
      console.log('📨 [WebSocket Event]', data.event, data);

      switch (data.event) {
        case 'new_message':
          if (data.message) {
            console.log('💬 NEW MESSAGE:', data.message);
            dispatch(addMessageToChannel(data.message));
            if (data.message.sender_user_id !== userId) {
              dispatch(incrementUnreadCount(data.message.channel_id));
            }
          }
          break;

        case 'message_edited':
          console.log('✏️ MESSAGE EDITED:', data);
          dispatch(updateMessageInChannel({
            channelId: data.channelId,
            messageId: data.messageId,
            content: data.content,
            mentions: data.mentions,
            editedAt: data.editedAt,
          }));
          break;

        case 'message_deleted':
          console.log('🗑️ MESSAGE DELETED:', data);
          dispatch(removeMessageFromChannel({
            channelId: data.channelId,
            messageId: data.messageId,
          }));
          break;

        case 'reaction_added':
          console.log('👍 REACTION ADDED - RAW:', data);
          dispatch(addReactionToMessage({
            messageId: data.messageId,
            channelId: data.channelId,
            reaction: {
              emoji: data.emoji,
              userId: parseInt(data.userId) || data.userId,
              userName: data.userName,
              avatarUrl: data.avatarUrl,
              timestamp: data.timestamp,
            },
          }));
          break;

        case 'reaction_removed':
          console.log('👎 REACTION REMOVED - RAW:', data);
          dispatch(removeReactionFromMessage({
            messageId: data.messageId,
            channelId: data.channelId,
            emoji: data.emoji,
            userId: parseInt(data.userId) || data.userId,
          }));
          break;

        case 'message_pinned':
        case 'message_unpinned':
          console.log('📌 PIN STATUS:', data.event);
          dispatch(pinMessageInChannel({
            channelId: data.channelId,
            messageId: data.messageId,
            isPinned: data.event === 'message_pinned',
            pinnedBy: data.pinnedBy,
            pinnedAt: data.timestamp,
          }));
          break;

        case 'message_delivered':
          console.log('✅ MESSAGE DELIVERED - RAW:', data);
          dispatch(updateMessageDeliveryStatus({
            messageId: data.messageId,
            deliveredBy: parseInt(data.deliveredBy) || data.deliveredBy,
            deliveredCount: parseInt(data.deliveredCount) || data.deliveredCount,
            timestamp: data.timestamp,
          }));
          break;

        case 'message_read':
          console.log('📖 MESSAGE READ - RAW:', data);
          dispatch(updateMessageReadStatus({
            messageId: data.messageId,
            readBy: parseInt(data.readBy) || data.readBy,
            readByName: data.readByName,
            readCount: parseInt(data.readCount) || data.readCount,
            timestamp: data.timestamp,
          }));
          break;

        case 'thread_reply':
          console.log('🧵 THREAD REPLY:', data);
          if (data.message && data.parentMessageId) {
            dispatch(addMessageToChannel(data.message));
            dispatch(addMessageToThread({
              parentMessageId: data.parentMessageId,
              message: data.message,
            }));
            dispatch(updateThreadReplyCount({
              messageId: data.parentMessageId,
              increment: 1,
            }));
          }
          break;

        case 'members_added':
          console.log('👥 MEMBERS ADDED:', data);
          if (data.channelId && data.userIds) {
            dispatch(addMembersToChannel({
              channelId: data.channelId,
              userIds: data.userIds,
            }));
          }
          break;

        case 'member_invited':
          console.log('👥 MEMBER INVITED:', data);
          dispatch(fetchUserChannels(50));
          break;

        case 'user_typing':
          console.log('⌨️ USER TYPING EVENT:', data);

          // Skip own typing
          if (Number(data.userId) === Number(userId)) {
            console.log('⌨️ Skipping own typing');
            break;
          }

          const typingPayload = {
            channelId: Number(data.channelId),
            userId: Number(data.userId),
            userName: data.userName || `User ${data.userId}`,
          };

          if (data.isTyping) {
            console.log('⌨️ ✅ ADD typing user:', typingPayload);
            dispatch(addTypingUser(typingPayload));

            // Auto-remove after 5 seconds
            setTimeout(() => {
              dispatch(removeTypingUser({
                channelId: typingPayload.channelId,
                userId: typingPayload.userId,
              }));
            }, 5000);
          } else {
            console.log('⌨️ ❌ REMOVE typing user:', typingPayload);
            dispatch(removeTypingUser({
              channelId: typingPayload.channelId,
              userId: typingPayload.userId,
            }));
          }
          break;

        default:
          console.log('📨 Unhandled event:', data.event);
      }
    });


    return () => {
      console.log('🧹 Cleaning up WebSocket...');
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [token, userId, dispatch]);

  // ✅ FIXED: Send HTML content properly
  const sendMessage = useCallback(async (data: SendMessagePayload): Promise<boolean> => {
    if (!socketRef.current?.connected) {
      console.warn('⚠️ Socket not connected');
      return false;
    }

    return new Promise((resolve) => {
      // ✅ Log the exact payload being sent
      const payload = {
        channelId: data.channelId,
        content: data.content,  // ✅ This should be HTML from rich text editor
        messageType: data.messageType || 'text',
        mentions: data.mentions,
        replyToMessageId: data.replyToMessageId,
        threadId: data.threadId,
        attachments: data.attachments,
      };

      console.log('📤 Sending message:', payload);
      
      socketRef.current!.emit('send_message', payload, (response: any) => {
        console.log('✅ Send response:', response);
        resolve(response?.success || false);
      });
    });
  }, []);

  const startTyping = useCallback((channelId: number) => {
    if (!socketRef.current?.connected) return;
    console.log('⌨️ Start typing:', channelId);
    socketRef.current.emit('typing_start', { channelId });
  }, []);

  const stopTyping = useCallback((channelId: number) => {
    if (!socketRef.current?.connected) return;
    console.log('⌨️ Stop typing:', channelId);
    socketRef.current.emit('typing_stop', { channelId });
  }, []);

  const markAsDelivered = useCallback((messageId: number, channelId: number) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('mark_as_delivered', { messageId, channelId });
  }, []);

  const markAsRead = useCallback((messageId: number, channelId: number) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('mark_as_read', { messageId, channelId });
  }, []);

  const addReaction = useCallback((messageId: number, emoji: string, channelId: number) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('add_reaction', { messageId, emoji, channelId });
  }, []);

  const removeReaction = useCallback((messageId: number, emoji: string, channelId: number) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('remove_reaction', { messageId, emoji, channelId });
  }, []);

  const editMessage = useCallback((messageId: number, content: string, channelId: number, mentions?: number[]) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('edit_message', { messageId, content, channelId, mentions });
  }, []);

  const deleteMessage = useCallback((messageId: number, channelId: number) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('delete_message', { messageId, channelId });
  }, []);

  const pinMessage = useCallback((messageId: number, channelId: number, isPinned: boolean) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('pin_message', { messageId, channelId, isPinned });
  }, []);

  const replyInThread = useCallback((parentMessageId: number, content: string, channelId: number, mentions?: number[]) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('thread_reply', { parentMessageId, content, channelId, mentions });
  }, []);

  const inviteMembers = useCallback((channelId: number, userIds: number[]) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('invite_members', { channelId, userIds });
  }, []);

  const reconnect = useCallback(() => {
    socketRef.current?.connect();
  }, []);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
  }, []);

  return {
    socket: socketRef.current,
    sendMessage,
    startTyping,
    stopTyping,
    markAsDelivered,
    markAsRead,
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