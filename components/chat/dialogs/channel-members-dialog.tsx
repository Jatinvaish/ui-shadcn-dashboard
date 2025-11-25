// components/chat/dialogs/channel-members-dialog.tsx
"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Search, MoreVertical, Shield, ShieldCheck, Crown, UserMinus, Loader2, UserPlus } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { fetchChannelMembers, removeMember, updateMemberRole } from "@/store/slices/chatSlice"
import { selectUser } from "@/store/slices/authSlice"
import toast from "react-hot-toast"

interface ChannelMembersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  channelId: number
  channelName: string
  currentUserRole?: string
  onInviteClick?: () => void
}

export function ChannelMembersDialog({ 
  open, 
  onOpenChange, 
  channelId, 
  channelName, 
  currentUserRole,
  onInviteClick 
}: ChannelMembersDialogProps) {
  const dispatch = useAppDispatch()
  const { channelMembers, isLoadingMembers } = useAppSelector((state) => state.chat)
  const currentUser = useAppSelector(selectUser)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [removeDialog, setRemoveDialog] = useState<{ open: boolean; userId: number; name: string }>({ open: false, userId: 0, name: "" })
  const [roleDialog, setRoleDialog] = useState<{ open: boolean; userId: number; name: string; newRole: string }>({ open: false, userId: 0, name: "", newRole: "" })

  const members = channelMembers[channelId] || []
  const canManage = ['admin', 'owner'].includes(currentUserRole || '')
  const isOwner = currentUserRole === 'owner'

  useEffect(() => {
    if (open && channelId) {
      dispatch(fetchChannelMembers(channelId))
      setSearchQuery("")
    }
  }, [open, channelId, dispatch])

  const filteredMembers = members.filter((m) => {
    if (!searchQuery) return true
    const term = searchQuery.toLowerCase()
    const fullName = `${m.first_name || ''} ${m.last_name || ''}`.toLowerCase()
    return fullName.includes(term) || (m.email || '').toLowerCase().includes(term)
  })

  const handleRemoveMember = async () => {
    try {
      await dispatch(removeMember({ channelId, userId: removeDialog.userId })).unwrap()
      await dispatch(fetchChannelMembers(channelId)).unwrap()
      toast.success(`Removed ${removeDialog.name} from #${channelName}`)
    } catch (error: any) {
      toast.error(error || "Failed to remove member")
    } finally {
      setRemoveDialog({ open: false, userId: 0, name: "" })
    }
  }

  const handleRoleChange = async () => {
    try {
      await dispatch(updateMemberRole({ channelId, userId: roleDialog.userId, role: roleDialog.newRole })).unwrap()
      await dispatch(fetchChannelMembers(channelId)).unwrap()
      toast.success(`Changed ${roleDialog.name}'s role to ${roleDialog.newRole}`)
    } catch (error: any) {
      toast.error(error || "Failed to update role")
    } finally {
      setRoleDialog({ open: false, userId: 0, name: "", newRole: "" })
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-3.5 w-3.5 text-yellow-500" />
      case 'admin': return <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
      default: return null
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner': return <Badge variant="outline" className="text-yellow-600 border-yellow-300 bg-yellow-50 dark:bg-yellow-950">Owner</Badge>
      case 'admin': return <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-950">Admin</Badge>
      default: return null
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "active": case "online": return "bg-green-500"
      case "away": return "bg-yellow-500"
      default: return "bg-gray-400"
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Members of #{channelName}</DialogTitle>
            <DialogDescription>{members.length} member{members.length !== 1 ? 's' : ''}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search members..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="pl-9" 
                />
              </div>
              {canManage && (
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => { onOpenChange(false); onInviteClick?.(); }} 
                  title="Add members"
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              )}
            </div>

            <ScrollArea className="h-[350px] rounded-md border">
              {isLoadingMembers ? (
                <div className="flex items-center justify-center h-full py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredMembers.length > 0 ? (
                <div className="p-2 space-y-1">
                  {filteredMembers.map((member) => {
                    const isCurrentUser = member.user_id === currentUser?.id
                    const canModify = canManage && !isCurrentUser && member.role !== 'owner'
                    const memberName = `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Unknown'
                    
                    return (
                      <div key={member.user_id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 group">
                        <div className="relative h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold flex-shrink-0">
                          {member.avatar_url ? (
                            <img src={member.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                          ) : (
                            (member.first_name || 'U').charAt(0).toUpperCase()
                          )}
                          <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ${getStatusColor(member.status)} border-2 border-background`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">
                              {memberName}
                              {isCurrentUser && <span className="text-muted-foreground ml-1">(you)</span>}
                            </p>
                            {getRoleIcon(member.role)}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          {getRoleBadge(member.role)}
                          
                          {canModify && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {isOwner && member.role !== 'admin' && (
                                  <DropdownMenuItem onClick={() => setRoleDialog({ open: true, userId: member.user_id, name: memberName, newRole: 'admin' })}>
                                    <ShieldCheck className="h-4 w-4 mr-2" /> Make admin
                                  </DropdownMenuItem>
                                )}
                                {isOwner && member.role === 'admin' && (
                                  <DropdownMenuItem onClick={() => setRoleDialog({ open: true, userId: member.user_id, name: memberName, newRole: 'member' })}>
                                    <Shield className="h-4 w-4 mr-2" /> Remove admin
                                  </DropdownMenuItem>
                                )}
                                {isOwner && (
                                  <DropdownMenuItem onClick={() => setRoleDialog({ open: true, userId: member.user_id, name: memberName, newRole: 'owner' })}>
                                    <Crown className="h-4 w-4 mr-2" /> Transfer ownership
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive focus:text-destructive" 
                                  onClick={() => setRemoveDialog({ open: true, userId: member.user_id, name: memberName })}
                                >
                                  <UserMinus className="h-4 w-4 mr-2" /> Remove from channel
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground py-12">
                  {searchQuery ? "No members found" : "No members in this channel"}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={removeDialog.open} onOpenChange={(o) => setRemoveDialog(prev => ({ ...prev, open: o }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removeDialog.name}?</AlertDialogTitle>
            <AlertDialogDescription>They will no longer have access to #{channelName}. They can be added back later.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember} className="bg-destructive hover:bg-destructive/90">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={roleDialog.open} onOpenChange={(o) => setRoleDialog(prev => ({ ...prev, open: o }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {roleDialog.newRole === 'owner' ? 'Transfer ownership?' : roleDialog.newRole === 'admin' ? 'Make admin?' : 'Remove admin?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {roleDialog.newRole === 'owner' 
                ? `${roleDialog.name} will become the owner and you will become an admin.`
                : roleDialog.newRole === 'admin'
                ? `${roleDialog.name} will be able to manage members and channel settings.`
                : `${roleDialog.name} will no longer be able to manage this channel.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRoleChange}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}