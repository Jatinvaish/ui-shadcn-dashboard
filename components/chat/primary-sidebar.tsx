// components/chat/primary-sidebar.tsx
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
      {/* Desktop Sidebar */}
      <div className="bg-sidebar hidden md:flex h-full w-16 flex-col items-center py-2 gap-1 border border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative flex h-12 w-12 flex-col items-center justify-center rounded-lg transition-colors",
              activeTab === tab.id
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
            )}
            title={tab.label}>
            <tab.icon className="h-5 w-5" />
            <span className="mt-0.5 text-[10px] font-medium">{tab.label}</span>
            {tab.badge > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                {tab.badge > 9 ? "9+" : tab.badge}
              </span>
            )}
          </button>
        ))}

      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 md:hidden transition-opacity duration-300"
            onClick={onClose}
          />

          <div className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar shadow-2xl md:hidden border-r border-border",
            "transform transition-transform duration-300 ease-in-out",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}>
            <div className="flex items-center justify-between px-4 py-4 border-b border-border">
              <span className="text-sidebar-foreground font-semibold text-base">Navigate</span>
              <button
                onClick={onClose}
                className="text-sidebar-foreground hover:text-sidebar-accent-foreground p-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={cn(
                    "relative flex w-full items-center gap-4 rounded-xl px-4 py-4 mb-2 transition-colors",
                    activeTab === tab.id
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}>
                  <tab.icon className="h-6 w-6" />
                  <div className="flex-1 text-left">
                    <p className="font-medium text-base">{tab.label}</p>
                  </div>
                  {tab.badge > 0 && (
                    <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-destructive px-2 text-xs font-bold text-destructive-foreground">
                      {tab.badge > 9 ? "9+" : tab.badge}
                    </span>
                  )}
                </button>
              ))}

              <div className="my-3 border-t border-border" />

              <button
                className="flex w-full items-center gap-4 rounded-xl px-4 py-4 text-sidebar-foreground transition-colors hover:bg-sidebar-accent/50">
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