// components/chat/dialogs/forward-message-dialog.tsx - COMPLETE
"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Search, Hash, Lock, Forward, Loader2, X } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { forwardMessage } from "@/store/slices/chatSlice"
import toast from "react-hot-toast"

interface ForwardMessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  messageId: number
  messageContent: string
}

export function ForwardMessageDialog({ open, onOpenChange, messageId, messageContent }: ForwardMessageDialogProps) {
  const dispatch = useAppDispatch()
  const { channels } = useAppSelector((state) => state.chat)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedChannelIds, setSelectedChannelIds] = useState<number[]>([])
  const [isForwarding, setIsForwarding] = useState(false)

  const filteredChannels = channels.filter((ch) => {
    if (!searchQuery) return true
    return ch.name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const toggleChannel = (channelId: number) => {
    setSelectedChannelIds(prev => 
      prev.includes(channelId) 
        ? prev.filter(id => id !== channelId) 
        : [...prev, channelId]
    )
  }

  const handleForward = async () => {
    if (selectedChannelIds.length === 0) return
    
    setIsForwarding(true)
    try {
      await dispatch(forwardMessage({ messageId, targetChannelIds: selectedChannelIds })).unwrap()
      toast.success(`Message forwarded to ${selectedChannelIds.length} channel(s)`)
      onOpenChange(false)
      setSelectedChannelIds([])
      setSearchQuery("")
    } catch (error: any) {
      toast.error(error || "Failed to forward message")
    } finally {
      setIsForwarding(false)
    }
  }

  const selectedChannels = channels.filter(ch => selectedChannelIds.includes(ch.id))

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      setSelectedChannelIds([])
      setSearchQuery("")
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Forward className="h-5 w-5" />
            Forward message
          </DialogTitle>
          <DialogDescription>
            Select channels to forward this message to
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Message Preview */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Message:</p>
            <p className="text-sm line-clamp-3">{messageContent}</p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Selected Channels */}
          {selectedChannelIds.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Selected ({selectedChannelIds.length})</p>
              <div className="flex flex-wrap gap-2">
                {selectedChannels.map((ch) => (
                  <Badge key={ch.id} variant="secondary" className="flex items-center gap-1 pr-1">
                    <Hash className="h-3 w-3" />
                    {ch.name}
                    <button 
                      onClick={() => toggleChannel(ch.id)} 
                      className="ml-1 hover:bg-muted rounded-full p-0.5"
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Channel List */}
          <ScrollArea className="h-[250px] rounded-md border">
            <div className="p-2 space-y-1">
              {filteredChannels.length > 0 ? (
                filteredChannels.map((channel) => {
                  const isSelected = selectedChannelIds.includes(channel.id)
                  return (
                    <div
                      key={channel.id}
                      onClick={() => toggleChannel(channel.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? "bg-primary/10 border border-primary/30" : "hover:bg-muted"
                      }`}
                    >
                      <Checkbox 
                        checked={isSelected} 
                        onCheckedChange={() => toggleChannel(channel.id)}
                        className="pointer-events-none" 
                      />
                      <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                        {channel.is_private ? (
                          <Lock className="h-4 w-4 text-primary" />
                        ) : (
                          <Hash className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{channel.name}</p>
                        <p className="text-xs text-muted-foreground">{channel.member_count} members</p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="flex items-center justify-center h-full py-8 text-sm text-muted-foreground">
                  No channels found
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isForwarding}>
            Cancel
          </Button>
          <Button onClick={handleForward} disabled={selectedChannelIds.length === 0 || isForwarding}>
            {isForwarding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Forward className="h-4 w-4 mr-2" />}
            Forward {selectedChannelIds.length > 0 ? `(${selectedChannelIds.length})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}