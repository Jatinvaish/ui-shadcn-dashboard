"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Smile } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const EMOJI_CATEGORIES = {
  recent: {
    label: "Recent",
    emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "👍", "❤️"],
  },
  smileys: {
    label: "Smileys",
    emojis: [
      "😀",
      "😃",
      "😄",
      "😁",
      "😆",
      "😅",
      "🤣",
      "😂",
      "😉",
      "😊",
      "😇",
      "🙂",
      "🙃",
      "😌",
      "😍",
      "😘",
      "😗",
      "😚",
      "😙",
      "🥰",
      "😋",
      "😛",
      "😜",
      "🤪",
      "😝",
      "😑",
      "😐",
      "😶",
      "😏",
      "😒",
      "🙄",
      "😬",
      "🤥",
      "😌",
      "😔",
      "😪",
      "🤤",
      "😴",
      "😷",
      "🤒",
      "🤕",
      "🤢",
    ],
  },
  gestures: {
    label: "Gestures",
    emojis: [
      "👋",
      "🤚",
      "🖐️",
      "✋",
      "🖖",
      "👌",
      "🤌",
      "🤏",
      "✌️",
      "🤞",
      "🫰",
      "🤟",
      "🤘",
      "🤙",
      "👍",
      "👎",
      "✊",
      "👊",
      "🤛",
      "🤜",
      "👏",
      "🙌",
      "👐",
      "🤲",
      "🤝",
      "🤜",
      "🤛",
    ],
  },
  objects: {
    label: "Objects",
    emojis: [
      "⌚",
      "📱",
      "📲",
      "💻",
      "⌨️",
      "🖥️",
      "🖨️",
      "🖱️",
      "🖲️",
      "🕹️",
      "🗜️",
      "💽",
      "💾",
      "💿",
      "📀",
      "🧮",
      "🎥",
      "🎬",
      "📺",
      "📷",
      "📸",
      "📹",
      "🎞️",
      "📽️",
      "🎦",
      "📞",
      "☎️",
      "📟",
      "📠",
      "📺",
    ],
  },
  symbols: {
    label: "Symbols",
    emojis: [
      "❤️",
      "🧡",
      "💛",
      "💚",
      "💙",
      "💜",
      "🖤",
      "🤍",
      "🤎",
      "💔",
      "💕",
      "💞",
      "💓",
      "💗",
      "💖",
      "💘",
      "💝",
      "💟",
      "👋",
      "💬",
      "👁️",
      "‍🗨️",
      "🗨️",
      "💭",
      "💤",
    ],
  },
  nature: {
    label: "Nature",
    emojis: [
      "🌹",
      "🥀",
      "🌻",
      "🌼",
      "🌷",
      "🌱",
      "🌲",
      "🌳",
      "🌴",
      "🌵",
      "🌾",
      "🌿",
      "☘️",
      "🍀",
      "🎍",
      "🎎",
      "🎏",
      "🎐",
      "🐶",
      "🐱",
      "🐭",
      "🐹",
      "🐰",
      "🦊",
      "🐻",
      "🐼",
      "🐨",
      "🐯",
    ],
  },
  food: {
    label: "Food",
    emojis: [
      "🍏",
      "🍎",
      "🍐",
      "🍊",
      "🍋",
      "🍌",
      "🍉",
      "🍇",
      "🍓",
      "🍈",
      "🍒",
      "🍑",
      "🥭",
      "🍍",
      "🥥",
      "🥝",
      "🍅",
      "🍆",
      "🥑",
      "🥦",
      "🥬",
      "🥒",
      "🌶️",
      "🌽",
      "🥕",
      "🥔",
      "🍞",
      "🥐",
      "🥯",
      "🍠",
    ],
  },
  travel: {
    label: "Travel",
    emojis: [
      "🚗",
      "🚕",
      "🚙",
      "🚌",
      "🚎",
      "🏎️",
      "🚓",
      "🚑",
      "🚒",
      "🚐",
      "🛻",
      "🚚",
      "🚛",
      "🚜",
      "🏍️",
      "🏎️",
      "🛵",
      "🦯",
      "🦽",
      "🦼",
      "🛺",
      "🚲",
      "🛴",
      "🛹",
      "🛼",
      "🚏",
      "⛽",
      "🚨",
      "🚥",
      "🚦",
      "🛑",
    ],
  },
  activities: {
    label: "Activities",
    emojis: [
      "⚽",
      "⚾",
      "🥎",
      "🎾",
      "🏐",
      "🏈",
      "🏉",
      "🥏",
      "🎳",
      "🏓",
      "🏸",
      "🏒",
      "🏑",
      "🥍",
      "🏏",
      "🥅",
      "⛳",
      "⛸️",
      "🎣",
      "🎽",
      "🎿",
      "⛷️",
      "🏂",
      "🪂",
      "🛷",
      "🥌",
      "🎯",
      "🪀",
      "🪃",
      "🎮",
      "🎲",
    ],
  },
}

interface EmojiPopoverProps {
  onEmojiSelect?: (emoji: string) => void
  disabled?: boolean
}

export function EmojiPopover({ onEmojiSelect, disabled }: EmojiPopoverProps) {
  const [open, setOpen] = React.useState(false)

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect?.(emoji)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="ghost" title="Add emoji" disabled={disabled} className="h-8 w-8 p-0 hover:bg-muted">
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="start">
        <Tabs defaultValue="recent" className="w-full flex flex-col">
          <div className="overflow-x-auto">
            <TabsList className="inline-flex w-max justify-start rounded-none border-b bg-background p-0 h-auto">
              {Object.entries(EMOJI_CATEGORIES).map(([key, category]) => (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="rounded-none border-b-2 border-transparent px-3 py-2 text-xs font-medium whitespace-nowrap data-[state=active]:border-primary"
                >
                  {category.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {Object.entries(EMOJI_CATEGORIES).map(([key, category]) => (
            <TabsContent key={key} value={key} className="grid grid-cols-7 gap-1 p-3 m-0 max-h-56 overflow-y-auto">
              {category.emojis.map((emoji, idx) => (
                <button
                  key={`${key}-${idx}`}
                  onClick={() => handleEmojiClick(emoji)}
                  className="h-8 w-8 flex items-center justify-center rounded hover:bg-muted cursor-pointer text-lg transition-colors"
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}
