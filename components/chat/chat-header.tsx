"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Info, Settings, Hash, Lock, Users, Search, Bell, BellOff, Pin } from 'lucide-react'
import { useState } from "react"
import { ChannelSettingsDialog } from "./dialogs/channel-settings-dialog"
import { PinDialog } from "./dialogs/pin-dialog"

interface ChatHeaderProps {
  title: string
  description?: string
  isPrivate?: boolean
  memberCount?: number
  channelId?: number
  isPinned?: boolean
  isMuted?: boolean
  onInfoClick?: () => void
  onUpdateChannel?: (name: string, description: string) => void
  onArchiveChannel?: () => void
  onLeaveChannel?: () => void
  onInviteUsers?: () => void
  onMembersClick?: () => void
  onSearchClick?: () => void
  onPinChange?: (pinned: boolean) => void
  onMuteChannel?: () => void
}

export function ChatHeader({
  title,
  description,
  channelId,
  isPrivate,
  memberCount,
  isPinned = false,
  isMuted = false,
  onInfoClick,
  onUpdateChannel,
  onArchiveChannel,
  onLeaveChannel,
  onInviteUsers,
  onMembersClick,
  onSearchClick,
  onPinChange,
  onMuteChannel,
}: ChatHeaderProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [pinOpen, setPinOpen] = useState(false)

  return (
    <>
      <div className="bg-background px-4 py-3 h-14 flex items-center w-full border-b border-border">
        <div className="flex items-center justify-between gap-3 w-full">
          {/* Left side */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {isPrivate ? (
              <Lock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            ) : (
              <Hash className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-sm font-bold truncate">{title}</h2>
              {description && <p className="text-xs text-muted-foreground truncate hidden sm:block">{description}</p>}
            </div>
            {memberCount !== undefined && memberCount > 0 && (
              <Badge variant="secondary" className="gap-1 flex-shrink-0 cursor-pointer hover:bg-secondary/80" onClick={onMembersClick}>
                <Users className="h-3 w-3" />
                <span className="text-xs">{memberCount}</span>
              </Badge>
            )}
          </div>

          {/* Right side - Action buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button size="icon" variant="ghost" onClick={onSearchClick} title="Search" className="h-8 w-8 hover:bg-muted">
              <Search className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={onInviteUsers} title="Invite people" className="h-8 w-8 hover:bg-muted">
              <Users className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setPinOpen(true)} title={isPinned ? "Unpin channel" : "Pin channel"} className="h-8 w-8 hover:bg-muted">
              <Pin className={`h-4 w-4 ${isPinned ? "text-primary fill-primary" : ""}`} />
            </Button>
            <Button size="icon" variant="ghost" onClick={onMuteChannel} title={isMuted ? "Unmute" : "Mute"} className="h-8 w-8 hover:bg-muted">
              {isMuted ? <BellOff className="h-4 w-4 text-muted-foreground" /> : <Bell className="h-4 w-4" />}
            </Button>
            <Button size="icon" variant="ghost" onClick={onMembersClick} title="Channel info" className="h-8 w-8 hover:bg-muted">
              <Info className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setSettingsOpen(true)} title="Settings" className="h-8 w-8 hover:bg-muted">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ChannelSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        channelName={title}
        description={description}
        isPrivate={isPrivate}
        onUpdateChannel={onUpdateChannel}
        onArchiveChannel={onArchiveChannel}
        onLeaveChannel={onLeaveChannel}
      />
      <PinDialog
        open={pinOpen}
        onOpenChange={setPinOpen}
        channelName={title}
        isPinned={isPinned}
        onPinChange={onPinChange || (() => {})}
      />
    </>
  )
}