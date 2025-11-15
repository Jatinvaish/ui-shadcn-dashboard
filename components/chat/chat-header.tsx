"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Info, Settings, Hash, Lock, Users } from "lucide-react"
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
      <div className="border-b border-border bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side */}
          <div className="flex items-center gap-3">
            {isPrivate ? (
              <Lock className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Hash className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <h2 className="font-display text-lg font-bold">{title}</h2>
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            {memberCount && (
              <Badge variant="secondary" className="ml-auto mr-0 flex gap-1">
                <Users className="h-3 w-3" />
                {memberCount}
              </Badge>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" onClick={() => setInviteOpen(true)} title="Invite people">
              <Users className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setPinOpen(true)} title={isPinned ? "Unpin" : "Pin"}>
              <div className={`h-4 w-4 ${isPinned ? "text-primary" : ""}`}>📌</div>
            </Button>
            <Button size="icon" variant="ghost" onClick={onInfoClick} title="Channel info">
              <Info className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={handleSettingsClick} title="Settings">
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
