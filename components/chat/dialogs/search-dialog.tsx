// components/chat/dialogs/search-dialog.tsx - SEARCH MESSAGES, CHANNELS, MEMBERS
"use client"

import React, { useState, useCallback, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, MessageSquare, Hash, Users, Loader2 } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { searchChat, clearSearchResults, setSelectedChannel } from "@/store/slices/chatSlice"
import useDebounce from "@/hooks/useDebounce"

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onChannelSelect?: (channelId: number) => void
  onMessageSelect?: (channelId: number, messageId: number) => void
}

export function SearchDialog({ open, onOpenChange, onChannelSelect, onMessageSelect }: SearchDialogProps) {
  const dispatch = useAppDispatch()
  const { searchResults, isSearching, channels } = useAppSelector((state) => state.chat)
  
  const [query, setQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "messages" | "channels" | "members">("all")
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      dispatch(searchChat({ query: debouncedQuery, opts: { type: activeTab, limit: 20 } }))
    } else {
      dispatch(clearSearchResults())
    }
  }, [debouncedQuery, activeTab, dispatch])

  useEffect(() => {
    if (!open) {
      setQuery("")
      dispatch(clearSearchResults())
    }
  }, [open, dispatch])

  const handleChannelClick = (channelId: number) => {
    const channel = channels.find(c => c.id === channelId)
    if (channel) {
      dispatch(setSelectedChannel(channel))
      onChannelSelect?.(channelId)
      onOpenChange(false)
    }
  }

  const handleMessageClick = (channelId: number, messageId: number) => {
    handleChannelClick(channelId)
    onMessageSelect?.(channelId, messageId)
    onOpenChange(false)
  }

  const formatDate = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (days === 1) return 'Yesterday'
    if (days < 7) return d.toLocaleDateString([], { weekday: 'short' })
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">{part}</mark> 
        : part
    )
  }

  const hasResults = searchResults && (
    (searchResults.messages?.length || 0) > 0 ||
    (searchResults.channels?.length || 0) > 0 ||
    (searchResults.members?.length || 0) > 0
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="sr-only">Search</DialogTitle>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search messages, channels, or people..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 h-11 text-base"
              autoFocus
            />
            {isSearching && <Loader2 className="absolute right-3 top-3 h-5 w-5 animate-spin text-muted-foreground" />}
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4 h-auto py-0">
            <TabsTrigger value="all" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3">All</TabsTrigger>
            <TabsTrigger value="messages" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3 gap-1.5">
              <MessageSquare className="h-4 w-4" /> Messages
            </TabsTrigger>
            <TabsTrigger value="channels" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3 gap-1.5">
              <Hash className="h-4 w-4" /> Channels
            </TabsTrigger>
            <TabsTrigger value="members" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3 gap-1.5">
              <Users className="h-4 w-4" /> People
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px]">
            {!query ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Search className="h-12 w-12 mb-3 opacity-20" />
                <p className="text-sm">Start typing to search</p>
              </div>
            ) : query.length < 2 ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                Type at least 2 characters to search
              </div>
            ) : isSearching ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !hasResults ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <p className="text-sm">No results found for "{query}"</p>
              </div>
            ) : (
              <div className="p-4 space-y-6">
                {/* Messages */}
                {(activeTab === "all" || activeTab === "messages") && searchResults?.messages && searchResults.messages.length > 0 && (
                  <div>
                    {activeTab === "all" && <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Messages</h3>}
                    <div className="space-y-1">
                      {searchResults.messages.map((msg) => (
                        <button
                          key={msg.id}
                          onClick={() => handleMessageClick(msg.channel_id, msg.id)}
                          className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                            <Hash className="h-3 w-3" />
                            <span>{msg.channel_name}</span>
                            <span>•</span>
                            <span>{msg.sender_first_name} {msg.sender_last_name}</span>
                            <span className="ml-auto">{formatDate(msg.sent_at)}</span>
                          </div>
                          <p className="text-sm line-clamp-2">{highlightMatch(msg.content, query)}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Channels */}
                {(activeTab === "all" || activeTab === "channels") && searchResults?.channels && searchResults.channels.length > 0 && (
                  <div>
                    {activeTab === "all" && <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Channels</h3>}
                    <div className="space-y-1">
                      {searchResults.channels.map((ch) => (
                        <button
                          key={ch.id}
                          onClick={() => handleChannelClick(ch.id)}
                          className="w-full text-left flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                        >
                          <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                            <Hash className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{highlightMatch(ch.name, query)}</p>
                            {ch.description && <p className="text-xs text-muted-foreground line-clamp-1">{ch.description}</p>}
                          </div>
                          <span className="text-xs text-muted-foreground">{ch.member_count} members</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Members */}
                {(activeTab === "all" || activeTab === "members") && searchResults?.members && searchResults.members.length > 0 && (
                  <div>
                    {activeTab === "all" && <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">People</h3>}
                    <div className="space-y-1">
                      {searchResults.members.map((member) => (
                        <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                            {member.avatar_url ? (
                              <img src={member.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                            ) : (
                              member.first_name?.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{highlightMatch(`${member.first_name} ${member.last_name}`, query)}</p>
                            <p className="text-xs text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
