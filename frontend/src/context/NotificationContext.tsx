"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface SystemNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  timestamp: number;
  category: "booking" | "housekeeping" | "pos" | "billing" | "ai" | "system";
  href: string;
  read: boolean;
  type?: "info" | "success" | "warning" | "error";
}

export interface ToastAlert {
  id: string;
  title: string;
  description: string;
  category: SystemNotification["category"];
  href?: string;
  timestamp: number;
}

interface NotificationContextType {
  notifications: SystemNotification[];
  unreadCount: number;
  toasts: ToastAlert[];
  addNotification: (notif: Omit<SystemNotification, "id" | "time" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  dismissToast: (id: string) => void;
  isLiveStreaming: boolean;
  toggleLiveStream: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const STORAGE_KEY = "hos_live_notifications";

const INITIAL_NOTIFICATIONS: SystemNotification[] = [];

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<SystemNotification[]>(INITIAL_NOTIFICATIONS);
  const [toasts, setToasts] = useState<ToastAlert[]>([]);
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);

  // Restore notifications from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setNotifications(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const saveNotifications = (items: SystemNotification[]) => {
    setNotifications(items);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error(e);
    }
  };

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addNotification = useCallback(
    (notif: Omit<SystemNotification, "id" | "time" | "timestamp" | "read">) => {
      const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newNotif: SystemNotification = {
        ...notif,
        id,
        time: "Just now",
        timestamp: Date.now(),
        read: false,
      };

      setNotifications((prev) => {
        const updated = [newNotif, ...prev.slice(0, 49)];
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      // Spawn pop-up toast
      const newToast: ToastAlert = {
        id: `toast-${id}`,
        title: notif.title,
        description: notif.description,
        category: notif.category,
        href: notif.href,
        timestamp: Date.now(),
      };

      setToasts((prev) => [newToast, ...prev.slice(0, 4)]);

      // Auto dismiss toast after 5s
      setTimeout(() => {
        dismissToast(newToast.id);
      }, 5000);
    },
    [dismissToast]
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    saveNotifications([]);
  }, []);

  const toggleLiveStream = useCallback(() => {
    setIsLiveStreaming((prev) => !prev);
  }, []);

  // Listen to real custom window notifications
  useEffect(() => {
    function handleCustomEvent(e: Event) {
      const custom = e as CustomEvent;
      if (custom.detail) {
        addNotification(custom.detail);
      }
    }
    window.addEventListener("hos_notification", handleCustomEvent);
    return () => window.removeEventListener("hos_notification", handleCustomEvent);
  }, [addNotification]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        toasts,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
        dismissToast,
        isLiveStreaming,
        toggleLiveStream,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}

/**
 * Utility helper to trigger notifications from anywhere
 */
export function triggerNotification(detail: {
  title: string;
  description: string;
  category: SystemNotification["category"];
  href: string;
}) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("hos_notification", { detail }));
  }
}
