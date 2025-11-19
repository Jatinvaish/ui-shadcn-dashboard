"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  Hash,
  Lock,
  Plus,
  Search,
  MessageCircle,
  Users,
  Activity,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateChannelDialog } from "./dialogs/create-channel-dialog";
import { DirectMessageDialog } from "./dialogs/direct-message-dialog";
import { UserStatusDialog } from "./dialogs/user-status-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Channel {
  id: string;
  name: string;
  isPrivate: boolean;
  isPinned?: boolean;
  unread?: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  status?: "active" | "away" | "offline";
}

interface SidebarProps {
  channels: Channel[];
  directMessages: Array<{ id: string; name: string; unread?: number }>;
  activeId?: string;
  onChannelClick?: (id: string) => void;
  onDirectMessageClick?: (id: string) => void;
  currentUser?: User & { statusMessage?: string };
  availableUsers?: User[];
  onCreateChannel?: (name: string, isPrivate: boolean, description: string) => void;
  onStartDirectMessage?: (userId: string) => void;
  onStatusChange?: (status: "active" | "away" | "offline", message: string) => void;
}

export function Sidebar({
  channels,
  directMessages,
  activeId,
  onChannelClick,
  onDirectMessageClick,
  currentUser,
  availableUsers = [],
  onCreateChannel,
  onStartDirectMessage,
  onStatusChange
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [createChannelOpen, setCreateChannelOpen] = React.useState(false);
  const [directMessageOpen, setDirectMessageOpen] = React.useState(false);
  const [userStatusOpen, setUserStatusOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"chat" | "channels" | "activity">("chat");

  const filteredChannels = channels.filter(
    (channel) =>
      channel.name.toLowerCase().includes(searchQuery.toLowerCase()) || searchQuery === ""
  );

  const filteredDMs = directMessages.filter(
    (dm) => dm.name.toLowerCase().includes(searchQuery.toLowerCase()) || searchQuery === ""
  );

  const handleCreateChannel = (name: string, isPrivate: boolean, description: string) => {
    onCreateChannel?.(name, isPrivate, description);
  };

  const handleStartDM = (userId: string) => {
    onStartDirectMessage?.(userId);
  };

  const handleStatusChange = (status: "active" | "away" | "offline", message: string) => {
    onStatusChange?.(status, message);
  };

  return (
    <div className="bg-sidebar text-sidebar-foreground flex h-screen  flex-col overflow-hidden lg:w-72">
      {/* Header */}
      <div className="border-border flex h-16 flex-shrink-0 items-center justify-between border-b px-3 py-3 md:px-4 md:py-4">
        <h2 className="font-display truncate text-sm font-bold md:text-base">Workspace</h2>
        <ChevronDown className="text-muted-foreground h-4 w-4 flex-shrink-0" />
      </div>

      {/* Tabs */}
      <div className="border-border flex flex-shrink-0 gap-0.5 overflow-x-auto border-b px-2 md:gap-1">
        <button
          onClick={() => setActiveTab("chat")}
          className={cn(
            "flex items-center gap-1 border-b-2 px-2 py-2 text-xs font-medium whitespace-nowrap transition-colors md:gap-2 md:px-3 md:text-sm",
            activeTab === "chat"
              ? "text-sidebar-primary border-sidebar-primary"
              : "text-muted-foreground hover:text-sidebar-foreground border-transparent"
          )}>
          <MessageCircle className="h-3 w-3 md:h-4 md:w-4" />
          <span className="hidden sm:inline">Chat</span>
        </button>
        <button
          onClick={() => setActiveTab("channels")}
          className={cn(
            "flex items-center gap-1 border-b-2 px-2 py-2 text-xs font-medium whitespace-nowrap transition-colors md:gap-2 md:px-3 md:text-sm",
            activeTab === "channels"
              ? "text-sidebar-primary border-sidebar-primary"
              : "text-muted-foreground hover:text-sidebar-foreground border-transparent"
          )}>
          <Hash className="h-3 w-3 md:h-4 md:w-4" />
          <span className="hidden sm:inline">Channels</span>
        </button>
        <button
          onClick={() => setActiveTab("activity")}
          className={cn(
            "flex items-center gap-1 border-b-2 px-2 py-2 text-xs font-medium whitespace-nowrap transition-colors md:gap-2 md:px-3 md:text-sm",
            activeTab === "activity"
              ? "text-sidebar-primary border-sidebar-primary"
              : "text-muted-foreground hover:text-sidebar-foreground border-transparent"
          )}>
          <Activity className="h-3 w-3 md:h-4 md:w-4" />
          <span className="hidden sm:inline">Activity</span>
        </button>
      </div>

      {/* Search */}
      <div className="flex-shrink-0 px-2 py-2 md:px-3 md:py-3">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-3 w-3 md:h-4 md:w-4" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 rounded-md pl-7 text-xs md:pl-8 md:text-sm"
          />
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 overflow-hidden">
        <div className="space-y-3 px-2 py-2 md:space-y-4 md:px-3 md:py-3">
          {activeTab === "chat" && (
            <div>
              <div className="mb-2 flex items-center justify-between px-2">
                <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  Direct Messages
                </h3>
                <Button
                  size="icon"
                  variant="ghost"
                  className="hover:bg-sidebar-accent h-6 w-6"
                  onClick={() => setDirectMessageOpen(true)}
                  title="New direct message">
                  <Plus className="h-3 w-3 md:h-4 md:w-4" />
                </Button>
              </div>
              <div className="space-y-1">
                {filteredDMs.length > 0 ? (
                  filteredDMs.map((dm) => (
                    <button
                      key={dm.id}
                      onClick={() => onDirectMessageClick?.(dm.id)}
                      className={cn(
                        "hover:bg-sidebar-accent flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors duration-200 md:text-sm",
                        activeId === dm.id && "bg-sidebar-accent text-sidebar-primary"
                      )}>
                      <div className="h-2 w-2 flex-shrink-0 rounded-full bg-green-500" />
                      <span className="flex-1 truncate text-left font-medium">{dm.name}</span>
                      {dm.unread && dm.unread > 0 && (
                        <span className="bg-primary text-primary-foreground inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold">
                          {dm.unread}
                        </span>
                      )}
                    </button>
                  ))
                ) : (
                  <p className="text-muted-foreground px-2 py-2 text-xs">No direct messages</p>
                )}
              </div>
            </div>
          )}

          {activeTab === "channels" && (
            <div>
              <div className="mb-2 flex items-center justify-between px-2">
                <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  Channels
                </h3>
                <Button
                  size="icon"
                  variant="ghost"
                  className="hover:bg-sidebar-accent h-6 w-6"
                  onClick={() => setCreateChannelOpen(true)}
                  title="Create channel">
                  <Plus className="h-3 w-3 md:h-4 md:w-4" />
                </Button>
              </div>
              <div className="space-y-1">
                {filteredChannels.length > 0 ? (
                  filteredChannels.map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => onChannelClick?.(channel.id)}
                      className={cn(
                        "hover:bg-sidebar-accent flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors duration-200 md:text-sm",
                        activeId === channel.id && "bg-sidebar-accent text-sidebar-primary"
                      )}>
                      {channel.isPrivate ? (
                        <Lock className="h-3 w-3 flex-shrink-0 md:h-4 md:w-4" />
                      ) : (
                        <Hash className="h-3 w-3 flex-shrink-0 md:h-4 md:w-4" />
                      )}
                      <span className="flex-1 truncate text-left font-medium">{channel.name}</span>
                      {channel.isPinned && <span className="flex-shrink-0 text-xs">📌</span>}
                      {channel.unread && channel.unread > 0 && (
                        <span className="bg-primary text-primary-foreground inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold">
                          {channel.unread}
                        </span>
                      )}
                    </button>
                  ))
                ) : (
                  <p className="text-muted-foreground px-2 py-2 text-xs">No channels</p>
                )}
              </div>
            </div>
          )}

          {activeTab === "activity" && (
            <div className="py-8 text-center">
              <Activity className="text-muted-foreground mx-auto mb-2 h-6 w-6 md:h-8 md:w-8" />
              <p className="text-muted-foreground text-xs font-medium md:text-sm">
                Activity feed coming soon
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-border flex h-16 flex-shrink-0 items-center justify-center border-t px-2 py-2 md:px-3 md:py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="hover:bg-sidebar-accent flex w-full items-center gap-2 rounded px-2 py-1.5 transition-colors duration-200 md:gap-3">
              <div className="bg-primary text-primary-foreground relative flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold md:h-8 md:w-8">
                {currentUser?.name?.charAt(0).toUpperCase() || "U"}
                <span
                  className={`border-sidebar absolute right-0 bottom-0 h-2 w-2 rounded-full border ${
                    currentUser?.status === "active"
                      ? "bg-green-500"
                      : currentUser?.status === "away"
                        ? "bg-yellow-500"
                        : "bg-gray-400"
                  }`}
                />
              </div>
              <div className="hidden min-w-0 flex-1 text-left sm:block">
                <p className="truncate text-xs font-medium md:text-sm">
                  {currentUser?.name || "You"}
                </p>
                <p className="text-muted-foreground truncate text-xs capitalize">
                  {currentUser?.status || "Active"}
                </p>
              </div>
              <ChevronDown className="hidden h-3 w-3 flex-shrink-0 sm:block md:h-4 md:w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setUserStatusOpen(true)}>
              Update your status
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CreateChannelDialog
        open={createChannelOpen}
        onOpenChange={setCreateChannelOpen}
        onCreateChannel={handleCreateChannel}
      />
      <DirectMessageDialog
        open={directMessageOpen}
        onOpenChange={setDirectMessageOpen}
        users={availableUsers}
        onStartDirectMessage={handleStartDM}
      />
      <UserStatusDialog
        open={userStatusOpen}
        onOpenChange={setUserStatusOpen}
        currentStatus={currentUser?.status || "active"}
        currentStatusMessage={currentUser?.statusMessage}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
