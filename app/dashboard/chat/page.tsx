"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Hash,
  Lock,
  Users,
  Search,
  Plus,
  ChevronDown,
  X,
  Menu,
  Settings,
  Phone,
  Video,
  Info,
  Star,
  Image,
  FileText,
  Mic,
  Send,
} from "lucide-react";
import { Channel, Message, Thread, User } from "@/types/chat";
import renderChannelIcon from "./components/channel-icon";
import renderStatusBadge from "./components/status-badge";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import ChannelSection from "./components/channel-section";
import MessageItem from "./components/message-item";
import RichTextEditor from "./components/text-editor";
import CallModal from "./components/call-modal";
import ActivitySection from "./components/activity-section";
import ChannelDetailsSidebar from "./components/detail-sidebar";
import ThreadSidebar from "./components/thread-sidebar";
import CreateChannelModal from "./components/create-channel-modal";
import InvitePeopleModal from "./components/invite-people-modal";
import StatusModal from "./components/status-modal";
import ProfileModal from "./components/profile-modal";

type ChannelType = "public" | "private" | "direct";

// ==================== MOCK DATA ====================
const MOCK_USER: User = {
  id: "1",
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@company.com",
  status: "online",
  statusMessage: "Working on the new feature",
};

const MOCK_CHANNELS: Channel[] = [
  {
    id: "1",
    name: "general",
    type: "public",
    memberCount: 42,
    unreadCount: 0,
    isMuted: false,
    isStarred: true,
  },
  {
    id: "2",
    name: "random",
    type: "public",
    memberCount: 38,
    unreadCount: 3,
    isMuted: false,
    isStarred: false,
  },
  {
    id: "3",
    name: "engineering",
    type: "private",
    memberCount: 12,
    unreadCount: 0,
    isMuted: false,
    isStarred: true,
  },
  {
    id: "4",
    name: "design-team",
    type: "private",
    memberCount: 8,
    unreadCount: 5,
    isMuted: false,
    isStarred: false,
  },
  {
    id: "5",
    name: "marketing",
    type: "public",
    memberCount: 15,
    unreadCount: 0,
    isMuted: true,
    isStarred: false,
  },
];

const MOCK_DMS: Channel[] = [
  {
    id: "d1",
    name: "Sarah Wilson",
    type: "direct",
    memberCount: 2,
    unreadCount: 2,
    isMuted: false,
    isStarred: false,
  },
  {
    id: "d2",
    name: "Mike Johnson",
    type: "direct",
    memberCount: 2,
    unreadCount: 0,
    isMuted: false,
    isStarred: true,
  },
  {
    id: "d3",
    name: "Emma Davis",
    type: "direct",
    memberCount: 2,
    unreadCount: 0,
    isMuted: false,
    isStarred: false,
  },
];

const MOCK_USERS: User[] = [
  {
    id: "2",
    firstName: "Sarah",
    lastName: "Wilson",
    email: "sarah@company.com",
    status: "online",
  },
  {
    id: "3",
    firstName: "Mike",
    lastName: "Johnson",
    email: "mike@company.com",
    status: "away",
  },
  {
    id: "4",
    firstName: "Emma",
    lastName: "Davis",
    email: "emma@company.com",
    status: "offline",
  },
  {
    id: "5",
    firstName: "James",
    lastName: "Brown",
    email: "james@company.com",
    status: "online",
  },
];

// ====================
// Zod schemas for different forms (separate forms per section)
// ====================
const SearchSchema = z.object({
  query: z.string().max(200).optional(),
});
type SearchFormValues = z.infer<typeof SearchSchema>;

const MessageSchema = z.object({
  content: z.string().min(1, "Message required").max(5000),
});
type MessageFormValues = z.infer<typeof MessageSchema>;

const CreateChannelSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  type: z.enum(["public", "private"]).default("public"),
});
type CreateChannelFormValues = z.infer<typeof CreateChannelSchema>;

const InviteSchema = z.object({
  emails: z.string().min(1, "Add at least one email").max(2000), // simple CSV or newline separated
});
type InviteFormValues = z.infer<typeof InviteSchema>;

const StatusSchema = z.object({
  statusMessage: z.string().max(200).optional(),
});
type StatusFormValues = z.infer<typeof StatusSchema>;

const ProfileSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email().optional(),
});
type ProfileFormValues = z.infer<typeof ProfileSchema>;

// ====================
// ChatSystem Component
// ====================
const ChatSystem: React.FC = () => {
  // Core state
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USER);
  const [channels, setChannels] = useState<Channel[]>(MOCK_CHANNELS);
  const [directMessages, setDirectMessages] = useState<Channel[]>(MOCK_DMS);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(
    MOCK_CHANNELS[0] || null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showChannelDetails, setShowChannelDetails] = useState(false);
  const [showThread, setShowThread] = useState(false);
  const [currentThread, setCurrentThread] = useState<Thread | null>(null);
  const [activeTab, setActiveTab] = useState<"channels" | "activity">(
    "channels"
  );

  // Call & UI states
  const [showCall, setShowCall] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);

  // Modal toggles
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showInvitePeople, setShowInvitePeople] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ====================
  // Forms (separate forms per section)
  // ====================
  const searchForm = useForm<SearchFormValues>({
    resolver: zodResolver(SearchSchema),
    defaultValues: { query: "" },
  });

  const messageForm = useForm<MessageFormValues>({
    resolver: zodResolver(MessageSchema),
    defaultValues: { content: "" },
  });

  const createChannelForm = useForm<CreateChannelFormValues>({
    resolver: zodResolver(CreateChannelSchema),
    defaultValues: { name: "", description: "", type: "public" },
  });

  const inviteForm = useForm<InviteFormValues>({
    resolver: zodResolver(InviteSchema),
    defaultValues: { emails: "" },
  });

  const statusForm = useForm<StatusFormValues>({
    resolver: zodResolver(StatusSchema),
    defaultValues: { statusMessage: currentUser.statusMessage ?? "" },
  });

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      email: currentUser.email,
    },
  });

  // Keep a derived local search query for filtering UI (updated by search form)
  const [searchQuery, setSearchQuery] = useState("");
  useEffect(() => {
    const sub = searchForm.watch((v) => setSearchQuery(v.query ?? ""));
    return () => sub.unsubscribe();
  }, [searchForm]);

  // Generate mock messages when switching channel
  useEffect(() => {
    if (currentChannel) {
      const mockMessages: Message[] = [
        {
          id: "1",
          content: "<p>Hey everyone! Welcome to the channel 👋</p>",
          senderId: "2",
          senderName: "Sarah Wilson",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          reactions: [{ emoji: "👋", count: 3, userIds: ["1", "3", "4"] }],
          threadCount: 2,
          isPinned: true,
          isHTML: true,
        },
        {
          id: "2",
          content:
            "<p>Thanks for having me here! <strong>Excited</strong> to collaborate with you all.</p>",
          senderId: "3",
          senderName: "Mike Johnson",
          timestamp: new Date(Date.now() - 3000000).toISOString(),
          reactions: [{ emoji: "🎉", count: 2, userIds: ["1", "2"] }],
          isHTML: true,
        },
        {
          id: "3",
          content:
            "<p>Quick question about the project timeline:</p><ul><li>Are we still on track?</li><li>Do we need more resources?</li></ul>",
          senderId: "4",
          senderName: "Emma Davis",
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          reactions: [],
          threadCount: 5,
          isHTML: true,
        },
      ];
      setMessages(mockMessages);
    }
  }, [currentChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ESC key to close calls
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showCall) setShowCall(false);
        if (showVideoCall) setShowVideoCall(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [showCall, showVideoCall]);

  // ====================
  // Handlers
  // ====================
  const onSubmitMessage = (data: MessageFormValues) => {
    if (!currentChannel) return;
    const newMessage: Message = {
      id: Date.now().toString(),
      content: data.content,
      senderId: currentUser.id,
      senderName: `${currentUser.firstName} ${currentUser.lastName}`,
      timestamp: new Date().toISOString(),
      reactions: [],
      isHTML: true,
    };
    setMessages((prev) => [...prev, newMessage]);
    messageForm.reset();
  };

  const handleReaction = (messageId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          const existingReaction = msg.reactions.find((r) => r.emoji === emoji);
          if (existingReaction) {
            if (existingReaction.userIds.includes(currentUser.id)) {
              return {
                ...msg,
                reactions: msg.reactions
                  .map((r) =>
                    r.emoji === emoji
                      ? {
                          ...r,
                          count: r.count - 1,
                          userIds: r.userIds.filter(
                            (id) => id !== currentUser.id
                          ),
                        }
                      : r
                  )
                  .filter((r) => r.count > 0),
              };
            } else {
              return {
                ...msg,
                reactions: msg.reactions.map((r) =>
                  r.emoji === emoji
                    ? {
                        ...r,
                        count: r.count + 1,
                        userIds: [...r.userIds, currentUser.id],
                      }
                    : r
                ),
              };
            }
          } else {
            return {
              ...msg,
              reactions: [
                ...msg.reactions,
                { emoji, count: 1, userIds: [currentUser.id] },
              ],
            };
          }
        }
        return msg;
      })
    );
  };

  const handleToggleStar = (channelId: string, isDM: boolean = false) => {
    if (isDM) {
      setDirectMessages((prev) =>
        prev.map((ch) =>
          ch.id === channelId ? { ...ch, isStarred: !ch.isStarred } : ch
        )
      );
    } else {
      setChannels((prev) =>
        prev.map((ch) =>
          ch.id === channelId ? { ...ch, isStarred: !ch.isStarred } : ch
        )
      );
    }
  };

  const handleToggleMute = (channelId: string) => {
    setChannels((prev) =>
      prev.map((ch) =>
        ch.id === channelId ? { ...ch, isMuted: !ch.isMuted } : ch
      )
    );
  };

  const handleOpenThread = (messageId: string) => {
    const parentMessage = messages.find((m) => m.id === messageId);
    if (parentMessage) {
      setCurrentThread({ parentMessageId: messageId, messages: [] });
      setShowThread(true);
    }
  };

  const handleFileUpload = (type: "image" | "file" | "video") => {
    fileInputRef.current?.click();
  };

  const handleVoiceRecord = () => {
    setIsRecordingVoice((s) => !s);
  };

  // Create channel submit
  const onCreateChannel = (data: CreateChannelFormValues) => {
    const newChannel: Channel = {
      id: Date.now().toString(),
      name: data.name,
      description: data.description,
      type: data.type === "private" ? "private" : "public",
      memberCount: 1,
      isStarred: false,
      unreadCount: 0,
      isMuted: false,
    };
    setChannels((prev) => [...prev, newChannel]);
    createChannelForm.reset();
    setShowCreateChannel(false);
  };

  // Invite submit
  const onInvite = (data: InviteFormValues) => {
    // parse csv/newline separated emails and pretend to invite
    const emails = data.emails
      .split(/[,\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    console.log("Inviting:", emails);
    inviteForm.reset();
    setShowInvitePeople(false);
  };

  // Status submit
  const onUpdateStatus = (data: StatusFormValues) => {
    setCurrentUser((prev) => ({ ...prev, statusMessage: data.statusMessage }));
    setShowStatusModal(false);
  };

  // Profile submit
  const onUpdateProfile = (data: ProfileFormValues) => {
    setCurrentUser((prev) => ({
      ...prev,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email ?? prev.email,
    }));
    setShowProfileModal(false);
  };

  // ====================
  // Render
  // ====================
  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* Sidebar - Always visible on large screens */}
      <div
        className={`$
          {sidebarCollapsed ? "-translate-x-full md:translate-x-0" : "translate-x-0"}
        fixed md:static w-64 bg-gray-800 border-r border-gray-700 flex flex-col transition-transform duration-300 z-30 h-full`}
      >
        {/* Sidebar Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-gray-700 bg-gray-850">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h1 className="font-bold text-base truncate">Workspace</h1>
            <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </div>
          <button
            onClick={() => setSidebarCollapsed(true)}
            className="md:hidden p-1 hover:bg-gray-700 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab("channels")}
            className={`flex-1 py-2 text-sm font-medium ${
              activeTab === "channels"
                ? "text-white border-b-2 border-blue-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Channels
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={`flex-1 py-2 text-sm font-medium ${
              activeTab === "activity"
                ? "text-white border-b-2 border-blue-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Activity
          </button>
        </div>

        {activeTab === "channels" ? (
          <>
            {/* Search */}
            <div className="p-3">
              <form onSubmit={searchForm.handleSubmit(() => {})}>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <Controller
                    control={searchForm.control}
                    name="query"
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        placeholder="Search channels..."
                        className="w-full pl-9 pr-3 py-2 bg-gray-700 rounded text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  />
                </div>
              </form>
            </div>

            {/* Channel Lists */}
            <div className="flex-1 overflow-y-auto">
              <ChannelSection
                title="Starred"
                channels={[...channels, ...directMessages].filter(
                  (ch) => ch.isStarred
                )}
                currentChannel={currentChannel}
                onChannelSelect={setCurrentChannel}
                onToggleStar={handleToggleStar}
                renderIcon={renderChannelIcon}
              />

              <ChannelSection
                title="Channels"
                channels={channels.filter(
                  (c) => c.name.includes(searchQuery) || !searchQuery
                )}
                currentChannel={currentChannel}
                onChannelSelect={setCurrentChannel}
                onToggleStar={handleToggleStar}
                onAddClick={() => setShowCreateChannel(true)}
                renderIcon={renderChannelIcon}
              />

              <ChannelSection
                title="Direct Messages"
                channels={directMessages.filter(
                  (c) => c.name.includes(searchQuery) || !searchQuery
                )}
                currentChannel={currentChannel}
                onChannelSelect={setCurrentChannel}
                onToggleStar={handleToggleStar}
                onAddClick={() => setShowInvitePeople(true)}
                renderIcon={renderChannelIcon}
                isDM
              />
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto p-4">
            <ActivitySection title="Mentions" count={3} />
            <ActivitySection title="Reactions" count={5} />
            <ActivitySection title="Threads" count={2} />
            <ActivitySection title="Invitations" count={1} />
          </div>
        )}

        {/* User Profile */}
        <div className="h-14 border-t border-gray-700 flex items-center px-3 bg-gray-850">
          <div
            className="flex items-center flex-1 min-w-0 cursor-pointer"
            onClick={() => setShowProfileModal(true)}
          >
            <div className="relative">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-sm font-semibold">
                {currentUser.firstName[0]}
                {currentUser.lastName[0]}
              </div>
              {renderStatusBadge(currentUser.status)}
            </div>
            <div className="flex-1 min-w-0 ml-2">
              <div className="text-sm font-medium truncate">
                {currentUser.firstName} {currentUser.lastName}
              </div>
              <div className="text-xs text-gray-400 truncate">
                {currentUser.statusMessage || "Active"}
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowStatusModal(true)}
            className="p-1 hover:bg-gray-700 rounded"
          >
            <Info className="w-4 h-4 text-gray-300" />
          </button>
        </div>
      </div>

      {/* Mobile sidebar backdrop */}
      {!sidebarCollapsed && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-20"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="md:hidden h-14 bg-gray-800 border-b border-gray-700 flex items-center px-4">
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="p-2 hover:bg-gray-700 rounded"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {currentChannel ? (
          <>
            {/* Chat Header */}
            <div className="h-14 border-b border-gray-700 flex items-center justify-between px-4 bg-gray-800">
              <div className="flex items-center min-w-0">
                {renderChannelIcon(currentChannel)}
                <div className="min-w-0">
                  <h2 className="font-bold text-sm truncate">
                    {currentChannel.name}
                  </h2>
                  {currentChannel.type !== "direct" && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Users className="w-3 h-3" />
                      <span>{currentChannel.memberCount}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowCall(true)}
                  className="p-2 hover:bg-gray-700 rounded"
                  title="Start voice call"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowVideoCall(true)}
                  className="p-2 hover:bg-gray-700 rounded"
                  title="Start video call"
                >
                  <Video className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    handleToggleStar(
                      currentChannel.id,
                      currentChannel.type === "direct"
                    )
                  }
                  className="p-2 hover:bg-gray-700 rounded"
                  title={currentChannel.isStarred ? "Unstar" : "Star"}
                >
                  <Star
                    className={`w-4 h-4 ${
                      currentChannel.isStarred
                        ? "fill-yellow-500 text-yellow-500"
                        : ""
                    }`}
                  />
                </button>
                <button
                  onClick={() => setShowChannelDetails(!showChannelDetails)}
                  className="p-2 hover:bg-gray-700 rounded"
                  title="Channel details"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map((message: Message) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  currentUserId={currentUser.id}
                  onReaction={handleReaction}
                  onOpenThread={handleOpenThread}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-700 p-4 bg-gray-800">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button
                      onClick={() => setShowAttachmentMenu((s) => !s)}
                      className="p-2 hover:bg-gray-700 rounded"
                      title="Attach file"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    {showAttachmentMenu && (
                      <div className="absolute bottom-full left-0 mb-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-2 min-w-[200px] z-10">
                        <button
                          onClick={() => {
                            handleFileUpload("image");
                            setShowAttachmentMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded text-sm"
                        >
                          <Image className="w-4 h-4" />
                          Upload Image
                        </button>
                        <button
                          onClick={() => {
                            handleFileUpload("file");
                            setShowAttachmentMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded text-sm"
                        >
                          <FileText className="w-4 h-4" />
                          Upload File
                        </button>
                        <button
                          onClick={() => {
                            handleFileUpload("video");
                            setShowAttachmentMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded text-sm"
                        >
                          <Video className="w-4 h-4" />
                          Upload Video
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleVoiceRecord}
                    className={`p-2 hover:bg-gray-700 rounded ${
                      isRecordingVoice ? "bg-red-600 animate-pulse" : ""
                    }`}
                    title={
                      isRecordingVoice
                        ? "Stop recording"
                        : "Record voice message"
                    }
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <form onSubmit={messageForm.handleSubmit(onSubmitMessage)}>
                      <Controller
                        control={messageForm.control}
                        name="content"
                        render={({ field }) => (
                          <RichTextEditor
                            value={field.value}
                            onChange={field.onChange}
                            onSend={() =>
                              messageForm.handleSubmit(onSubmitMessage)()
                            }
                            placeholder={`Message #${currentChannel.name}`}
                            isSending={false}
                          />
                        )}
                      />
                    </form>
                  </div>
                  <button
                    onClick={() => messageForm.handleSubmit(onSubmitMessage)()}
                    disabled={!messageForm.getValues("content")?.trim()}
                    className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
                    title="Send message"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Hash className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-xl font-bold mb-2">Select a channel</h3>
              <p className="text-gray-400">Choose a channel from the sidebar</p>
            </div>
          </div>
        )}
      </div>

      {/* Channel Details Sidebar */}
      {showChannelDetails && currentChannel && (
        <ChannelDetailsSidebar
          channel={currentChannel}
          onClose={() => setShowChannelDetails(false)}
          onToggleMute={handleToggleMute}
          onInvite={() => setShowInvitePeople(true)}
        />
      )}

      {/* Thread Sidebar */}
      {showThread && currentThread && (
        <ThreadSidebar
          thread={currentThread}
          onClose={() => setShowThread(false)}
          currentUserId={currentUser.id}
        />
      )}

      {/* Call Modals */}
      <CallModal
        isOpen={showCall}
        onClose={() => setShowCall(false)}
        channelName={currentChannel?.name || ""}
        isVideo={false}
      />
      <CallModal
        isOpen={showVideoCall}
        onClose={() => setShowVideoCall(false)}
        channelName={currentChannel?.name || ""}
        isVideo={true}
      />

      {/* Other Modals (we show forms inside custom modals handled externally) */}
      {showCreateChannel && (
        <div>
          {/* If your CreateChannelModal supports passing form props, you can pass createChannelForm and onSubmit. Otherwise it will simply be closed after creating. */}
          <CreateChannelModal
            onClose={() => setShowCreateChannel(false)}
            // @ts-ignore — provide handler so user modal can call it if it accepts
            onCreate={(values: CreateChannelFormValues) =>
              onCreateChannel(values)
            }
            // expose the form instance in case the modal wants to render the inputs
            // @ts-ignore
            form={createChannelForm}
          />
        </div>
      )}

      {showInvitePeople && (
        <div>
          <InvitePeopleModal
            onClose={() => setShowInvitePeople(false)}
            onInvite={(v: InviteFormValues) => onInvite(v)}
            form={inviteForm}
          />
        </div>
      )}

      {showStatusModal && (
        <div>
          <StatusModal
            user={currentUser}
            onClose={() => setShowStatusModal(false)}
            onUpdate={(u: User) => setCurrentUser(u)}
            form={statusForm}
            onSubmit={() => statusForm.handleSubmit(onUpdateStatus)()}
          />
        </div>
      )}

      {showProfileModal && (
        <div>
          <ProfileModal
            user={currentUser}
            onClose={() => setShowProfileModal(false)}
            onUpdate={(u: User) => setCurrentUser(u)}
            form={profileForm}
            onSubmit={() => profileForm.handleSubmit(onUpdateProfile)()}
          />
        </div>
      )}

      <input type="file" ref={fileInputRef} className="hidden" />
    </div>
  );
};

export default ChatSystem;
