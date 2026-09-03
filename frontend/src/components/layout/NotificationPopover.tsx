"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useNotifications, SystemNotification } from "@/context/NotificationContext";
import {
  Bell,
  CheckCheck,
  BedDouble,
  Utensils,
  Sparkles,
  Receipt,
  Bot,
  Trash2,
  Radio,
} from "lucide-react";

export function NotificationPopover() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    isLiveStreaming,
    toggleLiveStream,
  } = useNotifications();

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = (item: SystemNotification) => {
    markAsRead(item.id);
    setIsOpen(false);
    if (item.href) {
      router.push(item.href);
    }
  };

  const getCategoryIcon = (cat: SystemNotification["category"]) => {
    switch (cat) {
      case "booking":
        return <BedDouble className="w-4 h-4 text-blue-600" />;
      case "housekeeping":
        return <Sparkles className="w-4 h-4 text-amber-600" />;
      case "pos":
        return <Utensils className="w-4 h-4 text-purple-600" />;
      case "billing":
        return <Receipt className="w-4 h-4 text-emerald-600" />;
      case "ai":
        return <Bot className="w-4 h-4 text-[#EC3013]" />;
      default:
        return <Bell className="w-4 h-4 text-[#111827]" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Real-time Notifications"
        className="p-1.5 text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-md transition-colors relative cursor-pointer focus:outline-none"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#EC3013] rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {/* Popover Dropdown Tray */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-84 sm:w-96 bg-white border border-[#E5E7EB] rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100 font-sans">
          {/* Header */}
          <div className="px-4 py-2.5 border-b border-[#F3F4F6] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-[#111827]">
                Live Hotel Activity
              </span>
              {unreadCount > 0 ? (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 text-[#EC3013] rounded-full">
                  {unreadCount} new
                </span>
              ) : (
                <span className="text-[10px] font-semibold px-2 py-0.5 bg-[#F3F4F6] text-[#6B7280] rounded-full">
                  All caught up
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-[11px] font-bold text-[#EC3013] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  title="Clear history"
                  className="text-[#9CA3AF] hover:text-red-600 p-1 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-[#F3F4F6]">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-[#9CA3AF] text-[13px]">
                No notification alerts right now
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 hover:bg-[#F9FAFB] cursor-pointer transition-colors flex items-start gap-3 ${
                    !item.read ? "bg-[#FFFDFD]" : "opacity-75"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-[#F3F4F6] flex items-center justify-center shrink-0 mt-0.5">
                    {getCategoryIcon(item.category)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-[12px] font-bold ${!item.read ? "text-[#111827]" : "text-[#4B5563]"}`}>
                        {item.title}
                      </span>
                      {!item.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#EC3013]" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#4B5563] leading-snug mt-0.5 line-clamp-2">
                      {item.description}
                    </p>
                    <span className="text-[10px] text-[#9CA3AF] mt-1 block font-medium">
                      {item.time}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Live Activity Pulse Footer */}
          <div className="px-4 py-2 border-t border-[#F3F4F6] bg-[#FAFAFA] flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
              <span>Real-Time Event Stream Active</span>
            </div>
            <button
              type="button"
              onClick={toggleLiveStream}
              className="text-[10px] font-bold text-[#6B7280] hover:text-[#111827] uppercase"
            >
              {isLiveStreaming ? "Pause" : "Resume"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
