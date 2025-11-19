"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { MessageCircle, Hash, Activity, Settings } from "lucide-react";

interface PrimarySidebarProps {
  activeTab: "chat" | "channels" | "activity";
  onTabChange: (tab: "chat" | "channels" | "activity") => void;
  unreadCount?: number;
}

export function PrimarySidebar({ activeTab, onTabChange, unreadCount = 0 }: PrimarySidebarProps) {
  const tabs = [
    { id: "chat" as const, icon: MessageCircle, label: "Chat", badge: unreadCount },
    { id: "channels" as const, icon: Hash, label: "Teams", badge: 0 },
    { id: "activity" as const, icon: Activity, label: "Activity", badge: 0 },
  ];

  return (
    <div className="bg-[#464775] flex h-screen w-16 flex-col items-center py-2 gap-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "relative flex h-12 w-12 flex-col items-center justify-center rounded-lg transition-colors",
            activeTab === tab.id
              ? "bg-white/20 text-white"
              : "text-white/70 hover:bg-white/10 hover:text-white"
          )}
          title={tab.label}>
          <tab.icon className="h-5 w-5" />
          <span className="mt-0.5 text-[10px] font-medium">{tab.label}</span>
          {tab.badge > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {tab.badge > 9 ? "9+" : tab.badge}
            </span>
          )}
        </button>
      ))}

      <div className="mt-auto">
        <button
          className="flex h-12 w-12 flex-col items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          title="Settings">
          <Settings className="h-5 w-5" />
          <span className="mt-0.5 text-[10px] font-medium">More</span>
        </button>
      </div>
    </div>
  );
}