// components/chat/chat-header.tsx - COMPLETE WITH ALL ACTIONS
"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Info, Settings, Hash, Lock, Users, Pin, PinOff, Search, Bell, BellOff, Archive, LogOut, UserPlus, MoreVertical } from 'lucide-react'
import { useState } from "react"
import { ChannelSettingsDialog } from "@/components/chat/dialogs/channel-settings-dialog"

interface ChatHeaderProps {
  title: string
  description?: string
  isPrivate?: boolean
  memberCount?: number
  status?: "active" | "away" | "offline"
  isPinned?: boolean
  isMuted?: boolean
  onPinChange?: (pinned: boolean) => void
  onUpdateChannel?: (name: string, description: string) => void
  onArchiveChannel?: () => void
  onLeaveChannel?: () => void
  onInviteUsers?: () => void
  onMembersClick?: () => void
  onSearchClick?: () => void
  onMuteChannel?: () => void
  onInfoClick?: () => void
}

export function ChatHeader({
  title, description, isPrivate, memberCount, isPinned = false, isMuted = false,
  onPinChange, onUpdateChannel, onArchiveChannel, onLeaveChannel, onInviteUsers,
  onMembersClick, onSearchClick, onMuteChannel, onInfoClick,
}: ChatHeaderProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <>
      <div className="bg-background px-4 py-3 h-16 flex items-center border-b border-border w-full">
        <div className="flex items-center justify-between gap-3 w-full">
          {/* Left side */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {isPrivate ? <Lock className="h-5 w-5 text-muted-foreground flex-shrink-0" /> : <Hash className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-sm font-bold truncate">{title}</h2>
                {isPinned && <Pin className="h-3.5 w-3.5 text-primary" />}
                {isMuted && <BellOff className="h-3.5 w-3.5 text-muted-foreground" />}
              </div>
              {description && <p className="text-xs text-muted-foreground truncate hidden sm:block">{description}</p>}
            </div>
          </div>

          {/* Right side - Action buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Members */}
            <Button size="sm" variant="ghost" onClick={onMembersClick} title="View members" className="h-8 gap-1.5 px-2">
              <Users className="h-4 w-4" />
              {memberCount && <span className="text-xs">{memberCount}</span>}
            </Button>

            {/* Search */}
            <Button size="icon" variant="ghost" onClick={onSearchClick} title="Search (⌘K)" className="h-8 w-8">
              <Search className="h-4 w-4" />
            </Button>

            {/* More Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={onInviteUsers}>
                  <UserPlus className="h-4 w-4 mr-2" /> Add people
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPinChange?.(!isPinned)}>
                  {isPinned ? <PinOff className="h-4 w-4 mr-2" /> : <Pin className="h-4 w-4 mr-2" />}
                  {isPinned ? "Unpin channel" : "Pin channel"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onMuteChannel}>
                  {isMuted ? <Bell className="h-4 w-4 mr-2" /> : <BellOff className="h-4 w-4 mr-2" />}
                  {isMuted ? "Unmute" : "Mute notifications"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                  <Settings className="h-4 w-4 mr-2" /> Channel settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onArchiveChannel} className="text-orange-600">
                  <Archive className="h-4 w-4 mr-2" /> Archive channel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onLeaveChannel} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" /> Leave channel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <ChannelSettingsDialog
        open={settingsOpen} onOpenChange={setSettingsOpen}
        channelName={title} description={description} isPrivate={isPrivate}
        onUpdateChannel={onUpdateChannel} onArchiveChannel={onArchiveChannel} onLeaveChannel={onLeaveChannel}
      />
    </>
  )
}