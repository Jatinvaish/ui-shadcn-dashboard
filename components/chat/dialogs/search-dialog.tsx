// components/chat/dialogs/search-dialog.tsx - FIXED NAVIGATION
"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, MessageSquare, Hash, Users, Loader2, MessageCircle, ArrowUpRight } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { searchChat, clearSearchResults } from "@/store/slices/chatSlice"
import useDebounce from "@/hooks/useDebounce"

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onChannelSelect?: (channelId: number, channelType?: string) => void
  onMessageSelect?: (channelId: number, messageId: number, channelType?: string) => void
  onStartDM?: (userId: string) => void
}

const stripHtml = (html: string): string => {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

export function SearchDialog({ 
  open, 
  onOpenChange, 
  onChannelSelect, 
  onMessageSelect, 
  onStartDM 
}: SearchDialogProps) {
  const dispatch = useAppDispatch()
  const { searchResults, isSearching } = useAppSelector((state) => state.chat)
  const channels = useAppSelector((state) => state.chat.channels)
  
  const [query, setQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "messages" | "channels" | "members">("all")
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      dispatch(searchChat({ 
        query: debouncedQuery, 
        opts: { type: activeTab, limit: 20 } 
      }))
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
    console.log('🔍 Channel clicked:', channelId)
    const channel = channels.find(ch => ch.id === channelId)
    const channelType = channel?.channel_type || 'group'
    onChannelSelect?.(channelId, channelType)
    onOpenChange(false)
  }

  const handleMessageClick = (channelId: number, messageId: number) => {
    console.log('🔍 Message clicked:', { channelId, messageId })
    const channel = channels.find(ch => ch.id === channelId)
    const channelType = channel?.channel_type || 'group'
    onMessageSelect?.(channelId, messageId, channelType)
    onOpenChange(false)
  }

  const handleMemberClick = (memberId: number) => {
    console.log('🔍 Member clicked:', memberId)
    onStartDM?.(memberId.toString())
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

  const highlightMatch = (text: string, q: string) => {
    if (!q || !text) return text
    const parts = text.split(new RegExp(`(${q})`, 'gi'))
    return parts.map((part, i) => 
      part.toLowerCase() === q.toLowerCase() 
        ? <mark key={i} className="bg-yellow-200/70 dark:bg-yellow-900/50 text-yellow-900 dark:text-yellow-100 rounded px-0.5 font-medium">{part}</mark> 
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
      <DialogContent className="sm:max-w-[650px] p-0 gap-0 max-h-[85vh]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="sr-only">Search</DialogTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages, channels, or people..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-10 h-11 text-base border-border shadow-none focus-visible:ring-1 focus-visible:ring-primary bg-muted/50"
              autoFocus
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-6 h-auto py-0 gap-6">
            <TabsTrigger 
              value="all" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 data-[state=active]:shadow-none text-foreground data-[state=active]:text-primary"
            >
              All Results
            </TabsTrigger>
            <TabsTrigger 
              value="messages" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 gap-2 data-[state=active]:shadow-none text-foreground data-[state=active]:text-primary"
            >
              <MessageSquare className="h-4 w-4" /> 
              Messages
            </TabsTrigger>
            <TabsTrigger 
              value="channels" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 gap-2 data-[state=active]:shadow-none text-foreground data-[state=active]:text-primary"
            >
              <Hash className="h-4 w-4" /> 
              Channels
            </TabsTrigger>
            <TabsTrigger 
              value="members" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 gap-2 data-[state=active]:shadow-none text-foreground data-[state=active]:text-primary"
            >
              <Users className="h-4 w-4" /> 
              People
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1" style={{ maxHeight: 'calc(85vh - 180px)' }}>
            {!query ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="font-semibold text-base mb-1 text-foreground">Search Everything</h3>
                <p className="text-sm text-muted-foreground mb-2">Find messages, channels, and people instantly</p>
                <p className="text-xs text-muted-foreground">Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono border border-border">⌘K</kbd> anytime to search</p>
              </div>
            ) : query.length < 2 ? (
              <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
                Type at least 2 characters to search
              </div>
            ) : isSearching ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                <p className="text-sm text-muted-foreground">Searching...</p>
              </div>
            ) : !hasResults ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="font-semibold text-base mb-1 text-foreground">No results found</h3>
                <p className="text-sm text-muted-foreground">Try different keywords for "{query}"</p>
              </div>
            ) : (
              <div className="px-6 py-4 space-y-6">
                {/* Messages */}
                {(activeTab === "all" || activeTab === "messages") && 
                 searchResults?.messages && 
                 searchResults.messages.length > 0 && (
                  <div className="space-y-2">
                    {activeTab === "all" && (
                      <div className="flex items-center gap-2 mb-3">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Messages ({searchResults.messages.length})
                        </h3>
                      </div>
                    )}
                    <div className="space-y-1">
                      {searchResults.messages.map((msg) => {
                        const plainContent = stripHtml(msg.content)
                        return (
                          <button
                            key={msg.id}
                            onClick={() => handleMessageClick(msg.channel_id, msg.id)}
                            className="w-full text-left p-3 rounded-lg hover:bg-muted/70 transition-all cursor-pointer group border border-transparent hover:border-border"
                          >
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
                              <Hash className="h-3 w-3" />
                              <span className="font-medium text-foreground">{msg.channel_name}</span>
                              <span className="text-muted-foreground/50">•</span>
                              <span>{msg.sender_first_name} {msg.sender_last_name}</span>
                              <span className="ml-auto text-muted-foreground/70">{formatDate(msg.sent_at)}</span>
                              <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                            </div>
                            <p className="text-sm line-clamp-2 leading-relaxed text-foreground">
                              {highlightMatch(plainContent, query)}
                            </p>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Channels */}
                {(activeTab === "all" || activeTab === "channels") && 
                 searchResults?.channels && 
                 searchResults.channels.length > 0 && (
                  <div className="space-y-2">
                    {activeTab === "all" && (
                      <div className="flex items-center gap-2 mb-3">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Channels ({searchResults.channels.length})
                        </h3>
                      </div>
                    )}
                    <div className="space-y-1">
                      {searchResults.channels.map((ch) => (
                        <button
                          key={ch.id}
                          onClick={() => handleChannelClick(ch.id)}
                          className="w-full text-left flex items-center gap-3 p-3 rounded-lg hover:bg-muted/70 transition-all cursor-pointer group border border-transparent hover:border-border"
                        >
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Hash className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm mb-0.5 text-foreground">{highlightMatch(ch.name, query)}</p>
                            {ch.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {ch.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {ch.member_count} {ch.member_count === 1 ? 'member' : 'members'}
                            </span>
                            <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Members */}
                {(activeTab === "all" || activeTab === "members") && 
                 searchResults?.members && 
                 searchResults.members.length > 0 && (
                  <div className="space-y-2">
                    {activeTab === "all" && (
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          People ({searchResults.members.length})
                        </h3>
                      </div>
                    )}
                    <div className="space-y-1">
                      {searchResults.members.map((member) => (
                        <div 
                          key={member.id} 
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/70 transition-all cursor-pointer group border border-transparent hover:border-border"
                        >
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarImage src={member.avatar_url} alt={`${member.first_name} ${member.last_name}`} />
                            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                              {member.first_name?.charAt(0).toUpperCase()}{member.last_name?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm mb-0.5 text-foreground">
                              {highlightMatch(`${member.first_name} ${member.last_name}`, query)}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 h-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              //todo
                              //@ts-ignore
                              handleMemberClick(member.id)
                            }}
                          >
                            <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                            Message
                          </Button>
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