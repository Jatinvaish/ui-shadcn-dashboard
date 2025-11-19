"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Info, Settings, Hash, Lock, Users } from 'lucide-react'
import { useState } from "react"
import { ChannelSettingsDialog } from "./dialogs/channel-settings-dialog"
import { InviteDialog } from "./dialogs/invite-dialog"
import { PinDialog } from "./dialogs/pin-dialog"

interface ChatHeaderProps {
  title: string
  description?: string
  isPrivate?: boolean
  memberCount?: number
  status?: "active" | "away" | "offline"
  onInfoClick?: () => void
  isPinned?: boolean
  onUpdateChannel?: (name: string, description: string) => void
  onArchiveChannel?: () => void
  onLeaveChannel?: () => void
  onInviteUsers?: (emails: string[]) => void
  onPinChange?: (pinned: boolean) => void
}

export function ChatHeader({
  title,
  description,
  isPrivate,
  memberCount,
  status,
  onInfoClick,
  isPinned = false,
  onUpdateChannel,
  onArchiveChannel,
  onLeaveChannel,
  onInviteUsers,
  onPinChange,
}: ChatHeaderProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [pinOpen, setPinOpen] = useState(false)

  const handleSettingsClick = () => {
    setSettingsOpen(true)
  }

  return (
    <>
      <div className="bg-background px-4 py-3 h-16 flex items-center">
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
            {memberCount && (
              <Badge variant="secondary" className="gap-1 flex-shrink-0">
                <Users className="h-3 w-3" />
                <span className="text-xs">{memberCount}</span>
              </Badge>
            )}
          </div>

          {/* Right side - Action buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button size="icon" variant="ghost" onClick={() => setInviteOpen(true)} title="Invite people" className="h-8 w-8 hover:bg-muted">
              <Users className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setPinOpen(true)} title={isPinned ? "Unpin" : "Pin"} className="h-8 w-8 hover:bg-muted">
              <span className={`text-lg ${isPinned ? "text-primary" : ""}`}>📌</span>
            </Button>
            <Button size="icon" variant="ghost" onClick={onInfoClick} title="Channel info" className="h-8 w-8 hover:bg-muted">
              <Info className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={handleSettingsClick} title="Settings" className="h-8 w-8 hover:bg-muted">
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
      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        channelName={title}
        onInviteUsers={onInviteUsers || (() => {})}
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
