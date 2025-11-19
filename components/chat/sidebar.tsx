"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, Hash, Lock, Plus, Search, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateChannelDialog } from "./dialogs/create-channel-dialog";
import { DirectMessageDialog } from "./dialogs/direct-message-dialog";
import { UserStatusDialog } from "./dialogs/user-status-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  activeTab: "chat" | "channels" | "activity";
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
  activeTab,
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
    <div className="bg-sidebar text-sidebar-foreground flex h-screen w-72 flex-col overflow-hidden border-r border-border">
      {/* Header */}
      <div className="border-border flex h-14 flex-shrink-0 items-center justify-between border-b px-4">
        <h2 className="font-display truncate text-base font-semibold">
          {activeTab === "chat" ? "Chat" : activeTab === "channels" ? "Teams" : "Activity"}
        </h2>
        <ChevronDown className="text-muted-foreground h-4 w-4 flex-shrink-0" />
      </div>

      {/* Search */}
      <div className="flex-shrink-0 px-3 py-3">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 rounded-md pl-9 text-sm"
          />
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 overflow-hidden">
        <div className="space-y-4 px-3 py-2">
          {activeTab === "chat" && (
            <div>
              <div className="mb-2 flex items-center justify-between px-2">
                <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  Recent
                </h3>
                <Button
                  size="icon"
                  variant="ghost"
                  className="hover:bg-sidebar-accent h-6 w-6"
                  onClick={() => setDirectMessageOpen(true)}
                  title="New chat">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1">
                {filteredDMs.length > 0 ? (
                  filteredDMs.map((dm) => (
                    <button
                      key={dm.id}
                      onClick={() => onDirectMessageClick?.(dm.id)}
                      className={cn(
                        "hover:bg-sidebar-accent flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        activeId === dm.id && "bg-sidebar-accent text-sidebar-primary"
                      )}>
                      <div className="relative h-8 w-8 flex-shrink-0 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">
                        {dm.name.charAt(0).toUpperCase()}
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-sidebar" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-medium truncate">{dm.name}</p>
                        <p className="text-xs text-muted-foreground truncate">Active now</p>
                      </div>
                      {dm.unread && dm.unread > 0 && (
                        <span className="bg-primary text-primary-foreground inline-flex h-5 min-w-[20px] flex-shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-bold">
                          {dm.unread}
                        </span>
                      )}
                    </button>
                  ))
                ) : (
                  <p className="text-muted-foreground px-2 py-4 text-center text-xs">No recent chats</p>
                )}
              </div>
            </div>
          )}

          {activeTab === "channels" && (
            <div>
              <div className="mb-2 flex items-center justify-between px-2">
                <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  Your teams
                </h3>
                <Button
                  size="icon"
                  variant="ghost"
                  className="hover:bg-sidebar-accent h-6 w-6"
                  onClick={() => setCreateChannelOpen(true)}
                  title="Create team">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1">
                {filteredChannels.length > 0 ? (
                  filteredChannels.map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => onChannelClick?.(channel.id)}
                      className={cn(
                        "hover:bg-sidebar-accent flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        activeId === channel.id && "bg-sidebar-accent text-sidebar-primary"
                      )}>
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-primary/10">
                        {channel.isPrivate ? (
                          <Lock className="h-4 w-4 text-primary" />
                        ) : (
                          <Hash className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <span className="flex-1 truncate text-left font-medium">{channel.name}</span>
                      {channel.isPinned && <span className="flex-shrink-0 text-sm">📌</span>}
                      {channel.unread && channel.unread > 0 && (
                        <span className="bg-primary text-primary-foreground inline-flex h-5 min-w-[20px] flex-shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-bold">
                          {channel.unread}
                        </span>
                      )}
                    </button>
                  ))
                ) : (
                  <p className="text-muted-foreground px-2 py-4 text-center text-xs">No teams yet</p>
                )}
              </div>
            </div>
          )}

          {activeTab === "activity" && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-3">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium mb-1">No activity yet</p>
              <p className="text-xs text-muted-foreground">Your activity feed will appear here</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-border flex h-16 flex-shrink-0 items-center border-t px-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="hover:bg-sidebar-accent flex w-full items-center gap-3 rounded-lg px-2 py-2 transition-colors">
              <div className="bg-primary text-primary-foreground relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                {currentUser?.name?.charAt(0).toUpperCase() || "U"}
                <span
                  className={`border-sidebar absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 ${
                    currentUser?.status === "active"
                      ? "bg-green-500"
                      : currentUser?.status === "away"
                        ? "bg-yellow-500"
                        : "bg-gray-400"
                  }`}
                />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-medium">{currentUser?.name || "You"}</p>
                <p className="text-muted-foreground truncate text-xs capitalize">
                  {currentUser?.status || "Active"}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 flex-shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
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