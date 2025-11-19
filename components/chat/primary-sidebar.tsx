"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { MessageCircle, Hash, Activity, Settings, X } from "lucide-react";

interface PrimarySidebarProps {
  activeTab: "chat" | "channels" | "activity";
  onTabChange: (tab: "chat" | "channels" | "activity") => void;
  unreadCount?: number;
  isOpen?: boolean;
  onClose?: () => void;
}

export function PrimarySidebar({ 
  activeTab, 
  onTabChange, 
  unreadCount = 0,
  isOpen = false,
  onClose
}: PrimarySidebarProps) {
  const tabs = [
    { id: "chat" as const, icon: MessageCircle, label: "Chat", badge: unreadCount },
    { id: "channels" as const, icon: Hash, label: "Teams", badge: 0 },
    { id: "activity" as const, icon: Activity, label: "Activity", badge: 0 },
  ];

  const handleTabClick = (tabId: "chat" | "channels" | "activity") => {
    onTabChange(tabId);
    onClose?.();
  };

  return (
    <>
      {/* Desktop/Tablet - Vertical Sidebar (from md breakpoint - 768px) */}
      <div className="bg-[#464775] hidden md:flex h-screen w-16 flex-col items-center py-2 gap-1">
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

      {/* Mobile - Slide-in Overlay from Left (below md breakpoint - <768px) */}
      {isOpen && (
        <>
          {/* Dark Overlay */}
          <div
            className="fixed inset-0 z-50 bg-black/50 md:hidden transition-opacity duration-300"
            onClick={onClose}
          />

          {/* Sidebar Overlay */}
          <div className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 bg-[#464775] shadow-2xl md:hidden",
            "transform transition-transform duration-300 ease-in-out",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
              <span className="text-white font-semibold text-base">Navigate</span>
              <button
                onClick={onClose}
                className="text-white/70 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="p-3">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={cn(
                    "relative flex w-full items-center gap-4 rounded-xl px-4 py-4 mb-2 transition-colors",
                    activeTab === tab.id
                      ? "bg-white/20 text-white"
                      : "text-white/90 hover:bg-white/10"
                  )}>
                  <tab.icon className="h-6 w-6" />
                  <div className="flex-1 text-left">
                    <p className="font-medium text-base">{tab.label}</p>
                  </div>
                  {tab.badge > 0 && (
                    <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-red-500 px-2 text-xs font-bold text-white">
                      {tab.badge > 9 ? "9+" : tab.badge}
                    </span>
                  )}
                </button>
              ))}

              {/* Divider */}
              <div className="my-3 border-t border-white/10" />

              {/* More Options */}
              <button
                className="flex w-full items-center gap-4 rounded-xl px-4 py-4 text-white/90 transition-colors hover:bg-white/10">
                <Settings className="h-6 w-6" />
                <div className="flex-1 text-left">
                  <p className="font-medium text-base">Settings</p>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}