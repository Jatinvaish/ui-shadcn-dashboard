// components/chat/dialogs/invite-members-dialog.tsx
"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, X, UserPlus, Loader2, Users } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { fetchTeamMembers, addMembers, fetchChannelMembers } from "@/store/slices/chatSlice"
import toast from "react-hot-toast"

// Update interface at the top
interface InviteMembersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  channelId: number
  channelName: string
  onMembersAdded?: (channelId: number, userIds: number[]) => void  
}
export function InviteMembersDialog({
  open,
  onOpenChange,
  channelId,
  channelName,
  onMembersAdded
}: InviteMembersDialogProps) {
  const dispatch = useAppDispatch()
  const { teamMembers = [], channelMembers = {} } = useAppSelector((state) => state.chat)

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open && channelId) {
      setIsLoading(true)
      setSelectedIds([])
      setSearchQuery("")

      Promise.all([
        dispatch(fetchTeamMembers()).unwrap(),
        dispatch(fetchChannelMembers(channelId)).unwrap()
      ])
        .catch((error) => {
          console.error('Failed to fetch members:', error)
          toast.error('Failed to load members')
        })
        .finally(() => setIsLoading(false))
    }
  }, [open, channelId, dispatch])

  const existingMemberIds = React.useMemo(() => {
    const members = channelMembers[channelId] || []
    const ids = new Set<number>()

    members.forEach((m: any) => {
      const userId = m.user_id || m.id
      if (userId) {
        ids.add(Number(userId))
      }
    })

    return ids
  }, [channelMembers, channelId])

  const availableMembers = React.useMemo(() => {
    return teamMembers.filter((m: any) => {
      const userId = m.user_id || m.id
      return !existingMemberIds.has(Number(userId))
    })
  }, [teamMembers, existingMemberIds])

  const filteredMembers = React.useMemo(() => {
    if (!searchQuery) return availableMembers
    const term = searchQuery.toLowerCase()
    return availableMembers.filter((m: any) => {
      const fullName = `${m.first_name || ''} ${m.last_name || ''}`.toLowerCase()
      return fullName.includes(term) || (m.email || '').toLowerCase().includes(term)
    })
  }, [availableMembers, searchQuery])

  const toggleSelect = (userId: number) => {
    setSelectedIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const selectAll = () => {
    if (selectedIds.length === filteredMembers.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredMembers.map((m: any) => m.user_id || m.id))
    }
  }

  const handleInvite = async () => {
    if (selectedIds.length === 0) return;

    setIsSubmitting(true);
    try {
      await dispatch(addMembers({
        channelId,
        userIds: selectedIds
      })).unwrap();

      await dispatch(fetchChannelMembers(channelId)).unwrap();

      // ✅ Call callback with channelId and userIds
      onMembersAdded?.(channelId, selectedIds);

      toast.success(`Added ${selectedIds.length} member(s)`);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Add members error:', error);
      toast.error(error || "Failed to add members");
    } finally {
      setIsSubmitting(false);
    }
  };


  const getStatusColor = (status?: string) => {
    switch (status) {
      case "active": case "online": return "bg-green-500"
      case "away": return "bg-yellow-500"
      default: return "bg-gray-400"
    }
  }

  const selectedMembers = availableMembers.filter((m: any) => {
    const userId = m.user_id || m.id
    return selectedIds.includes(userId)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add people to #{channelName}
          </DialogTitle>
          <DialogDescription>
            Select team members to add to this channel
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {selectedIds.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Selected ({selectedIds.length})</Label>
                <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])} className="h-6 text-xs">
                  Clear all
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedMembers.map((m: any) => {
                  const userId = m.user_id || m.id
                  return (
                    <Badge key={userId} variant="secondary" className="flex items-center gap-1 pr-1">
                      {m.first_name} {m.last_name}
                      <button
                        onClick={() => toggleSelect(userId)}
                        className="ml-1 rounded-full p-0.5 hover:bg-muted"
                        type="button"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}

          {filteredMembers.length > 0 && (
            <div className="flex items-center gap-2 px-1">
              <Checkbox
                checked={selectedIds.length === filteredMembers.length && filteredMembers.length > 0}
                onCheckedChange={selectAll}
                id="select-all"
              />
              <label htmlFor="select-all" className="text-sm cursor-pointer">
                Select all ({filteredMembers.length})
              </label>
            </div>
          )}

          <ScrollArea className="h-[300px] rounded-md border border-border">
            {isLoading ? (
              <div className="flex items-center justify-center h-full py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredMembers.length > 0 ? (
              <div className="p-2 space-y-1">
                {filteredMembers.map((member: any) => {
                  const userId = member.user_id || member.id
                  const isSelected = selectedIds.includes(userId)
                  return (
                    <div
                      key={userId}
                      onClick={() => toggleSelect(userId)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${isSelected ? "bg-primary/10 border border-primary/30" : "hover:bg-muted"
                        }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(userId)}
                        className="pointer-events-none"
                      />
                      <div className="relative h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold flex-shrink-0">
                        {member.avatar_url ? (
                          <img src={member.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                        ) : (
                          (member.first_name || 'U').charAt(0).toUpperCase()
                        )}
                        <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ${getStatusColor(member.status)} border-2 border-background`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{member.first_name} {member.last_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-4 py-12">
                <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? "No members found matching your search"
                    : "All team members are already in this channel"}
                </p>
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleInvite} disabled={selectedIds.length === 0 || isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
            Add {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}