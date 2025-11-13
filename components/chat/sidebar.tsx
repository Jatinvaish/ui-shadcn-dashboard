"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown, Hash, Lock, Plus, Search, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { CreateChannelDialog } from "./dialogs/create-channel-dialog"
import { DirectMessageDialog } from "./dialogs/direct-message-dialog"
import { UserStatusDialog } from "./dialogs/user-status-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Channel {
  id: string
  name: string
  isPrivate: boolean
  isPinned?: boolean
  unread?: number
}

interface User {
  id: string
  name: string
  email: string
  status?: "active" | "away" | "offline"
}

interface SidebarProps {
  channels: Channel[]
  directMessages: Array<{ id: string; name: string; unread?: number }>
  activeId?: string
  onChannelClick?: (id: string) => void
  onDirectMessageClick?: (id: string) => void
  currentUser?: User & { statusMessage?: string }
  availableUsers?: User[]
  onCreateChannel?: (name: string, isPrivate: boolean, description: string) => void
  onStartDirectMessage?: (userId: string) => void
  onStatusChange?: (status: "active" | "away" | "offline", message: string) => void
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
  onStatusChange,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [createChannelOpen, setCreateChannelOpen] = React.useState(false)
  const [directMessageOpen, setDirectMessageOpen] = React.useState(false)
  const [userStatusOpen, setUserStatusOpen] = React.useState(false)

  const filteredChannels = channels.filter(
    (channel) => channel.name.toLowerCase().includes(searchQuery.toLowerCase()) || searchQuery === "",
  )

  const filteredDMs = directMessages.filter(
    (dm) => dm.name.toLowerCase().includes(searchQuery.toLowerCase()) || searchQuery === "",
  )

  const handleCreateChannel = (name: string, isPrivate: boolean, description: string) => {
    onCreateChannel?.(name, isPrivate, description)
  }

  const handleStartDM = (userId: string) => {
    onStartDirectMessage?.(userId)
  }

  const handleStatusChange = (status: "active" | "away" | "offline", message: string) => {
    onStatusChange?.(status, message)
  }

  return (
    <div className="flex h-screen w-64 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
      {/* Header */}
      <div className="border-b border-sidebar-border px-4 py-4">
        <h2 className="font-display text-lg font-bold">Chat</h2>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Channels Section */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground">Channels</h3>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => setCreateChannelOpen(true)}
              title="Create channel"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-1">
            {filteredChannels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => {
                  console.log("[v0] Selected channel:", channel.id)
                  onChannelClick?.(channel.id)
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded px-2 py-2 text-sm transition-colors hover:bg-sidebar-accent",
                  activeId === channel.id && "bg-sidebar-accent",
                )}
              >
                {channel.isPrivate ? <Lock className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
                <span className="truncate flex-1 text-left">{channel.name}</span>
                {channel.isPinned && <span className="text-xs">📌</span>}
                {channel.unread && channel.unread > 0 && (
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {channel.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Direct Messages Section */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground">Direct Messages</h3>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => setDirectMessageOpen(true)}
              title="New direct message"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-1">
            {filteredDMs.map((dm) => (
              <button
                key={dm.id}
                onClick={() => {
                  console.log("[v0] Selected DM:", dm.id)
                  onDirectMessageClick?.(dm.id)
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded px-2 py-2 text-sm transition-colors hover:bg-sidebar-accent",
                  activeId === dm.id && "bg-sidebar-accent",
                )}
              >
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="truncate flex-1 text-left">{dm.name}</span>
                {dm.unread && dm.unread > 0 && (
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {dm.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* User Profile Footer */}
      <div className="border-t border-sidebar-border px-4 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded px-2 py-2 transition-colors hover:bg-sidebar-accent">
              <div className="relative h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-xs">
                {currentUser?.name?.charAt(0).toUpperCase() || "U"}
                <span
                  className={`absolute bottom-0 right-0 h-2 w-2 rounded-full border border-sidebar ${
                    currentUser?.status === "active"
                      ? "bg-green-500"
                      : currentUser?.status === "away"
                        ? "bg-yellow-500"
                        : "bg-gray-400"
                  }`}
                />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">{currentUser?.name || "You"}</p>
                <p className="text-xs text-muted-foreground capitalize">{currentUser?.status || "Active"}</p>
              </div>
              <ChevronDown className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setUserStatusOpen(true)}>Set status</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
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
  )
}
