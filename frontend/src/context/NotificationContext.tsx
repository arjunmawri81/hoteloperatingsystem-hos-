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

const INITIAL_NOTIFICATIONS: SystemNotification[] = [
  {
    id: "notif-init-1",
    title: "System Online & Connected",
    description: "Hotel Operating System connected to database and ready for real-time operations.",
    time: "Just now",
    timestamp: Date.now(),
    category: "system",
    href: "/operations",
    read: false,
    type: "info",
  },
];

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<SystemNotification[]>(INITIAL_NOTIFICATIONS);
  const [toasts, setToasts] = useState<ToastAlert[]>([]);
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);

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

  // Listen to custom window notifications
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

  // Simulated Real-Time Property Activity Generator (every 60s)
  useEffect(() => {
    if (!isLiveStreaming) return;

    const streamEvents = [
      {
        title: "Guest Checked In",
        description: "Front Desk completed check-in for Room 302",
        category: "booking" as const,
        href: "/operations/front-desk",
      },
      {
        title: "Room Turnover Completed",
        description: "Room 103 inspected & marked Clean by Supervisor",
        category: "housekeeping" as const,
        href: "/operations/room-map",
      },
      {
        title: "New Dining Order Received",
        description: "Table T2 placed order for 2× Club Sandwiches ($42.00)",
        category: "pos" as const,
        href: "/operations/restaurant-pos",
      },
      {
        title: "Invoice Settled Online",
        description: "Guest paid Invoice #INV-8824 ($205.00) via portal",
        category: "billing" as const,
        href: "/operations/billing",
      },
      {
        title: "AI Receptionist Handled Query",
        description: "Aura AI answered breakfast timings for guest in Room 204",
        category: "ai" as const,
        href: "/ai-receptionist",
      },
    ];

    let index = 0;
    const interval = setInterval(() => {
      const event = streamEvents[index % streamEvents.length];
      index++;
      addNotification(event);
    }, 60000);

    return () => clearInterval(interval);
  }, [isLiveStreaming, addNotification]);

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
