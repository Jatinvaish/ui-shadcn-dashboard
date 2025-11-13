"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Paperclip, FileIcon, ImageIcon, Video } from "lucide-react"

interface AttachmentPopoverProps {
  onFileSelect?: (type: string) => void
  disabled?: boolean
}

export function AttachmentPopover({ onFileSelect, disabled }: AttachmentPopoverProps) {
  const [open, setOpen] = React.useState(false)

  const attachmentOptions = [
    { icon: FileIcon, label: "File", type: "file" },
    { icon: ImageIcon, label: "Image", type: "image" },
    { icon: Video, label: "Video", type: "video" },
    { icon: Paperclip, label: "Upload from PC", type: "upload" },
  ]

  const handleSelect = (type: string) => {
    onFileSelect?.(type)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          title="Attach file"
          disabled={disabled}
          className="h-8 w-8 p-0 hover:bg-muted"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="space-y-1">
          {attachmentOptions.map((option) => (
            <Button
              key={option.type}
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 px-3 py-2 h-auto text-xs sm:text-sm"
              onClick={() => handleSelect(option.type)}
            >
              <option.icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <span className="truncate">{option.label}</span>
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
