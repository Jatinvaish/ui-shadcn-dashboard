"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface ComboboxProps {
  value: string
  onValueChange: (value: string) => void
  items: Array<{
    id: string | number
    label: string
    description?: string
  }>
  placeholder?: string
  emptyMessage?: string
  disabled?: boolean
  isLoading?: boolean
}

export function Combobox({
  value,
  onValueChange,
  items,
  placeholder = "Select item...",
  emptyMessage = "No items found.",
  disabled = false,
  isLoading = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const selectedItem = items.find((item) => item.id.toString() === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-transparent"
          disabled={disabled || isLoading}
        >
          {selectedItem ? selectedItem.label : placeholder}
          <ChevronsUpDown className="opacity-50 ml-2 h-4 w-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search items..." disabled={isLoading} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.id.toString()}
                  onSelect={() => {
                    onValueChange(item.id.toString())
                    setOpen(false)
                  }}
                  disabled={isLoading}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === item.id.toString() ? "opacity-100" : "opacity-0")} />
                  <div className="flex-1">
                    <div className="font-medium">{item.label}</div>
                    {item.description && <div className="text-xs text-muted-foreground">{item.description}</div>}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
