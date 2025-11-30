// components/chat/dialogs/forward-message-dialog.tsx - Update the component

"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Hash, Lock, Forward, Loader2, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { forwardMessage } from "@/store/slices/chatSlice";
import toast from "react-hot-toast";

interface ForwardMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageId: number;
  messageContent: string;
}

export function ForwardMessageDialog({
  open,
  onOpenChange,
  messageId,
  messageContent,
}: ForwardMessageDialogProps) {
  const dispatch = useAppDispatch();
  const channels = useAppSelector((state) => state.chat.channels);
  const currentUser = useAppSelector((state) => state.auth.user);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChannelIds, setSelectedChannelIds] = useState<number[]>([]);
  const [isForwarding, setIsForwarding] = useState(false);

  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setSelectedChannelIds([]);
    }
  }, [open]);

  const filteredChannels = channels.filter((channel) =>
    channel.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleChannel = (channelId: number) => {
    setSelectedChannelIds((prev) =>
      prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId]
    );
  };

  const handleForward = async () => {
    if (selectedChannelIds.length === 0) {
      toast.error("Please select at least one channel");
      return;
    }

    setIsForwarding(true);
    try {
      await dispatch(forwardMessage({ messageId, targetChannelIds: selectedChannelIds })).unwrap();
      toast.success(`Message forwarded to ${selectedChannelIds.length} channel${selectedChannelIds.length > 1 ? 's' : ''}`);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error || "Failed to forward message");
    } finally {
      setIsForwarding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Forward className="h-5 w-5" />
            Forward Message
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/50 p-3">
            <p className="text-sm text-muted-foreground line-clamp-3">
              {messageContent}
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[300px] rounded-md border border-border">
            <div className="space-y-1 p-2">
              {filteredChannels.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <Search className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No channels found</p>
                </div>
              ) : (
                filteredChannels.map((channel) => (
                  <div
                    key={channel.id}
                    className="flex items-center space-x-3 rounded-md px-3 py-2 hover:bg-muted cursor-pointer"
                    onClick={() => handleToggleChannel(channel.id)}
                  >
                    <Checkbox
                      checked={selectedChannelIds.includes(channel.id)}
                      onCheckedChange={() => handleToggleChannel(channel.id)}
                    />
                    <div className="flex items-center gap-2 flex-1">
                      {channel.is_private ? (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Hash className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm font-medium">{channel.name}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="flex items-center justify-between gap-2 pt-2">
            <p className="text-sm text-muted-foreground">
              {selectedChannelIds.length} channel{selectedChannelIds.length !== 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isForwarding}
              >
                Cancel
              </Button>
              <Button
                onClick={handleForward}
                disabled={selectedChannelIds.length === 0 || isForwarding}
              >
                {isForwarding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Forwarding...
                  </>
                ) : (
                  <>
                    <Forward className="h-4 w-4 mr-2" />
                    Forward
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}