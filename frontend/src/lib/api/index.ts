/**
 * HOS Unified API Service Layer
 * Clean, type-safe API methods for frontend panels.
 * Integrates directly with backend endpoints while falling back to mock data if backend is offline.
 */

import { api } from "./client";
import {
  Organization,
  Hotel,
  Reservation,
  HousekeepingTask,
  RestaurantOrder,
  AIConversation,
} from "@/types";
import {
  mockOrganizations,
  mockHotels,
  mockReservations,
  mockHousekeepingTasks,
  mockRestaurantOrders,
  mockAIConversations,
} from "../mock-data";

export * from "./client";
export * from "./auth.api";

// -------------------------------------------------------------
// 1. ORGANIZATIONS API (Super Admin)
// -------------------------------------------------------------
export const organizationsApi = {
  getAll: async (): Promise<Organization[]> => {
    try {
      const res = await api.get<{ data: Organization[] } | Organization[]>(
        "/organizations",
        { timeout: 3000 }
      );
      return (res as any).data || res;
    } catch {
      return mockOrganizations;
    }
  },

  getById: async (id: string): Promise<Organization | null> => {
    try {
      const res = await api.get(`/organizations/${id}`, { timeout: 3000 });
      return res.data || res;
    } catch {
      return mockOrganizations.find((o) => o.id === id) || null;
    }
  },

  create: async (payload: Partial<Organization>): Promise<Organization> => {
    try {
      const res = await api.post("/organizations", payload);
      return res.data || res;
    } catch {
      const newOrg: Organization = {
        id: `org-${Date.now()}`,
        name: payload.name || "New Hotel Group",
        code: payload.code || "NEW_ORG",
        ownerName: payload.ownerName || "Administrator",
        ownerEmail: payload.ownerEmail || "admin@example.com",
        hotelsCount: payload.hotelsCount || 1,
        activeRooms: payload.activeRooms || 50,
        monthlyRevenue: payload.monthlyRevenue || 0,
        status: payload.status || "active",
        createdAt: new Date().toISOString().split("T")[0],
      };
      return newOrg;
    }
  },
};

// -------------------------------------------------------------
// 2. HOTELS API (Hotel Admin, Area Manager, Customer)
// -------------------------------------------------------------
export const hotelsApi = {
  getAll: async (params?: { orgId?: string; region?: string }): Promise<Hotel[]> => {
    try {
      const res = await api.get<{ data: Hotel[] } | Hotel[]>("/hotels", {
        params,
        timeout: 3000,
      });
      return (res as any).data || res;
    } catch {
      return mockHotels;
    }
  },

  getById: async (id: string): Promise<Hotel | null> => {
    try {
      const res = await api.get(`/hotels/${id}`, { timeout: 3000 });
      return res.data || res;
    } catch {
      return mockHotels.find((h) => h.id === id) || null;
    }
  },

  create: async (payload: Partial<Hotel>): Promise<Hotel> => {
    try {
      const res = await api.post("/hotels", payload);
      return res.data || res;
    } catch {
      const newHotel: Hotel = {
        id: `hotel-${Date.now()}`,
        orgId: payload.orgId || "org-1",
        name: payload.name || "New Property",
        city: payload.city || "Mumbai",
        region: payload.region || "West Zone",
        totalRooms: payload.totalRooms || 100,
        occupiedRooms: 0,
        occupancyRate: 0,
        rating: 5.0,
        managerName: payload.managerName || "General Manager",
        phone: payload.phone || "+91 99999 00000",
        status: "open",
      };
      return newHotel;
    }
  },
};

// -------------------------------------------------------------
// 3. RESERVATIONS API (Operations, Customer)
// -------------------------------------------------------------
export const reservationsApi = {
  getAll: async (params?: { hotelId?: string; status?: string }): Promise<Reservation[]> => {
    try {
      const res = await api.get<{ data: Reservation[] } | Reservation[]>("/reservations", {
        params,
        timeout: 3000,
      });
      return (res as any).data || res;
    } catch {
      return mockReservations;
    }
  },

  create: async (payload: Partial<Reservation>): Promise<Reservation> => {
    try {
      const res = await api.post("/reservations", payload);
      return res.data || res;
    } catch {
      const newRes: Reservation = {
        id: `RES-${Math.floor(1000 + Math.random() * 9000)}`,
        guestName: payload.guestName || "Guest",
        guestEmail: payload.guestEmail || "guest@example.com",
        guestPhone: payload.guestPhone || "+91 90000 00000",
        hotelName: payload.hotelName || "Meridian Grand Palace",
        roomNumber: payload.roomNumber || "TBD",
        roomType: payload.roomType || "Deluxe King",
        checkIn: payload.checkIn || new Date().toISOString().split("T")[0],
        checkOut: payload.checkOut || new Date().toISOString().split("T")[0],
        status: "confirmed",
        totalAmount: payload.totalAmount || 15000,
        paidAmount: payload.paidAmount || 0,
        source: payload.source || "Web Direct",
      };
      return newRes;
    }
  },

  updateStatus: async (
    id: string,
    status: "confirmed" | "checked_in" | "checked_out" | "cancelled"
  ): Promise<Reservation | null> => {
    try {
      const res = await api.patch(`/reservations/${id}/status`, { status });
      return res.data || res;
    } catch {
      const target = mockReservations.find((r) => r.id === id);
      if (target) {
        target.status = status;
        return { ...target };
      }
      return null;
    }
  },
};

// -------------------------------------------------------------
// 4. HOUSEKEEPING API (Operations)
// -------------------------------------------------------------
export const housekeepingApi = {
  getAll: async (params?: { hotelId?: string; floor?: number }): Promise<HousekeepingTask[]> => {
    try {
      const res = await api.get<{ data: HousekeepingTask[] } | HousekeepingTask[]>(
        "/housekeeping",
        { params, timeout: 3000 }
      );
      return (res as any).data || res;
    } catch {
      return mockHousekeepingTasks;
    }
  },

  updateStatus: async (
    id: string,
    status: HousekeepingTask["status"]
  ): Promise<HousekeepingTask | null> => {
    try {
      const res = await api.patch(`/housekeeping/${id}/status`, { status });
      return res.data || res;
    } catch {
      const task = mockHousekeepingTasks.find((t) => t.id === id);
      if (task) {
        task.status = status;
        return { ...task };
      }
      return null;
    }
  },
};

// -------------------------------------------------------------
// 5. RESTAURANT POS API (Operations)
// -------------------------------------------------------------
export const posApi = {
  getOrders: async (params?: { hotelId?: string }): Promise<RestaurantOrder[]> => {
    try {
      const res = await api.get<{ data: RestaurantOrder[] } | RestaurantOrder[]>("/pos/orders", {
        params,
        timeout: 3000,
      });
      return (res as any).data || res;
    } catch {
      return mockRestaurantOrders;
    }
  },

  createOrder: async (payload: Partial<RestaurantOrder>): Promise<RestaurantOrder> => {
    try {
      const res = await api.post("/pos/orders", payload);
      return res.data || res;
    } catch {
      const newOrder: RestaurantOrder = {
        id: `POS-${Math.floor(400 + Math.random() * 600)}`,
        tableNumber: payload.tableNumber || "T-01",
        roomNumber: payload.roomNumber,
        items: payload.items || ["Room Dining Item"],
        total: payload.total || 1200,
        status: payload.status || "cooking",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      return newOrder;
    }
  },
};

// -------------------------------------------------------------
// 6. AI RECEPTIONIST API
// -------------------------------------------------------------
export const aiApi = {
  getConversations: async (params?: { status?: string }): Promise<AIConversation[]> => {
    try {
      const res = await api.get<{ data: AIConversation[] } | AIConversation[]>(
        "/ai/conversations",
        { params, timeout: 3000 }
      );
      return (res as any).data || res;
    } catch {
      return mockAIConversations;
    }
  },

  sendMessage: async (conversationId: string, message: string): Promise<any> => {
    try {
      const res = await api.post(`/ai/conversations/${conversationId}/messages`, { message });
      return res.data || res;
    } catch {
      return {
        reply: "Simulated AI Concierge response: Your request has been acknowledged and logged.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
    }
  },
};

// -------------------------------------------------------------
// 7. INVOICES & REVENUE TRANSACTIONS API (Operations, Billing)
// -------------------------------------------------------------
export interface InvoiceRecord {
  id: string;
  guest: string;
  room: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  date: string;
  hotelId?: string;
  hotelName?: string;
  paymentMethod?: string;
  transactionRef?: string;
  paidAt?: string;
}

export const invoicesApi = {
  getAll: async (params?: { status?: string; search?: string }): Promise<{ data: InvoiceRecord[]; metrics: any }> => {
    try {
      const res = await api.get<{ data: InvoiceRecord[]; metrics: any }>("/invoices", { params, timeout: 3000 });
      return res.data ? res : { data: (res as any), metrics: null };
    } catch {
      return { data: [], metrics: null };
    }
  },

  create: async (payload: Partial<InvoiceRecord>): Promise<InvoiceRecord> => {
    try {
      const res = await api.post("/invoices", payload);
      return res.data || res;
    } catch {
      return {
        id: `INV-${Math.floor(8820 + Math.random() * 500)}`,
        guest: payload.guest || "Guest",
        room: payload.room || "101",
        amount: payload.amount || 0,
        status: payload.status || "pending",
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      };
    }
  },

  markPaid: async (id: string, paymentMethod?: string): Promise<InvoiceRecord> => {
    try {
      const res = await api.patch(`/invoices/${id}/pay`, { paymentMethod: paymentMethod || "Credit Card" });
      return res.data || res;
    } catch {
      return {
        id,
        guest: "Guest",
        room: "101",
        amount: 0,
        status: "paid",
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        transactionRef: `TXN-${Date.now()}`,
      };
    }
  },
};

// -------------------------------------------------------------
// 8. AREAS API (Hotel Admin)
// -------------------------------------------------------------
export const areasApi = {
  getAll: async (params?: { search?: string }): Promise<any[]> => {
    try {
      const res = await api.get<{ data: any[] }>("/areas", { params, timeout: 3000 });
      return res.data || (res as any) || [];
    } catch {
      return [];
    }
  },
  create: async (payload: any): Promise<any> => {
    const res = await api.post("/areas", payload);
    return res.data || res;
  },
};

// -------------------------------------------------------------
// 9. STAFF & ROLES API (Hotel Admin)
// -------------------------------------------------------------
export const staffApi = {
  getAll: async (params?: { department?: string; search?: string }): Promise<any[]> => {
    try {
      const res = await api.get<{ data: any[] }>("/staff", { params, timeout: 3000 });
      return res.data || (res as any) || [];
    } catch {
      return [];
    }
  },
  create: async (payload: any): Promise<any> => {
    const res = await api.post("/staff", payload);
    return res.data || res;
  },
};

// -------------------------------------------------------------
// 10. GUEST CRM API (Operations)
// -------------------------------------------------------------
export const guestsApi = {
  getAll: async (params?: { segment?: string; search?: string }): Promise<any[]> => {
    try {
      const res = await api.get<{ data: any[] }>("/guests", { params, timeout: 3000 });
      return res.data || (res as any) || [];
    } catch {
      return [];
    }
  },
  create: async (payload: any): Promise<any> => {
    const res = await api.post("/guests", payload);
    return res.data || res;
  },
};

// -------------------------------------------------------------
// 11. INVENTORY & STOCK API (Operations)
// -------------------------------------------------------------
export const inventoryApi = {
  getAll: async (params?: { category?: string; search?: string }): Promise<{ data: any[]; metrics: any }> => {
    try {
      const res = await api.get<{ data: any[]; metrics: any }>("/inventory", { params, timeout: 3000 });
      return res.data ? res : { data: (res as any), metrics: null };
    } catch {
      return { data: [], metrics: null };
    }
  },
  create: async (payload: any): Promise<any> => {
    const res = await api.post("/inventory", payload);
    return res.data || res;
  },
  adjust: async (sku: string, delta: number): Promise<any> => {
    const res = await api.patch(`/inventory/${sku}/adjust`, { delta });
    return res.data || res;
  },
};

// -------------------------------------------------------------
// 12. AI LEAD PIPELINE API (AI Receptionist)
// -------------------------------------------------------------
export const leadsApi = {
  getAll: async (params?: { stage?: string; search?: string }): Promise<{ data: any[]; metrics: any }> => {
    try {
      const res = await api.get<{ data: any[]; metrics: any }>("/leads", { params, timeout: 3000 });
      return res.data ? res : { data: (res as any), metrics: null };
    } catch {
      return { data: [], metrics: null };
    }
  },
  create: async (payload: any): Promise<any> => {
    const res = await api.post("/leads", payload);
    return res.data || res;
  },
  advanceStage: async (id: string, stage: string): Promise<any> => {
    const res = await api.patch(`/leads/${id}/stage`, { stage });
    return res.data || res;
  },
};

// -------------------------------------------------------------
// 13. ROOMS & INVENTORY API (Operations, Room Map)
// -------------------------------------------------------------
export const roomsApi = {
  getAll: async (params?: { floor?: number; status?: string }): Promise<any[]> => {
    try {
      const res = await api.get<{ data: any[] }>("/rooms", { params, timeout: 3000 });
      return res.data || (res as any) || [];
    } catch {
      return [];
    }
  },
  updateStatus: async (number: string, payload: { status: string; guest?: string; cleaner?: string }): Promise<any> => {
    const res = await api.patch(`/rooms/${number}/status`, payload);
    return res.data || res;
  },
};
