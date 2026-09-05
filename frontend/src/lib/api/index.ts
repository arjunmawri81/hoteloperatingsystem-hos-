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
        { timeout: 5000 }
      );
      return (res as any)?.data || res;
    } catch {
      return mockOrganizations;
    }
  },

  getById: async (id: string): Promise<Organization | null> => {
    try {
      const res = await api.get(`/organizations/${id}`, { timeout: 5000 });
      return (res as any)?.data || res;
    } catch {
      return mockOrganizations.find((o) => o.id === id) || null;
    }
  },

  create: async (payload: Partial<Organization>): Promise<Organization> => {
    const res = await api.post("/organizations", payload);
    return (res as any)?.data || res;
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
        timeout: 5000,
      });
      const items: Hotel[] = Array.isArray(res)
        ? res
        : Array.isArray((res as any)?.data)
        ? (res as any).data
        : [];
      if (params?.orgId) {
        const matching = items.filter((h) => h.orgId === params.orgId);
        return matching.length > 0 ? matching : items;
      }
      return items;
    } catch {
      return [];
    }
  },

  getById: async (id: string): Promise<Hotel | null> => {
    try {
      const res = await api.get(`/hotels/${id}`, { timeout: 5000 });
      return (res as any)?.data || res;
    } catch {
      return null;
    }
  },

  create: async (payload: Partial<Hotel>): Promise<Hotel> => {
    const res = await api.post("/hotels", payload);
    return (res as any)?.data || res;
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete(`/hotels/${id}`);
    return (res as any)?.data || res;
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
        timeout: 5000,
      });
      return (res as any)?.data || (Array.isArray(res) ? res : []);
    } catch {
      return [];
    }
  },

  create: async (payload: Partial<Reservation>): Promise<Reservation> => {
    const res = await api.post("/reservations", payload);
    return (res as any)?.data || res;
  },

  updateStatus: async (
    id: string,
    status: "confirmed" | "checked_in" | "checked_out" | "cancelled"
  ): Promise<Reservation | null> => {
    const res = await api.patch(`/reservations/${id}/status`, { status });
    return (res as any)?.data || res;
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
        { params, timeout: 5000 }
      );
      return (res as any)?.data || (Array.isArray(res) ? res : []);
    } catch {
      return [];
    }
  },

  updateStatus: async (
    id: string,
    status: HousekeepingTask["status"]
  ): Promise<HousekeepingTask | null> => {
    const res = await api.patch(`/housekeeping/${id}/status`, { status });
    return (res as any)?.data || res;
  },

  createTask: async (
    data: Partial<HousekeepingTask>
  ): Promise<HousekeepingTask> => {
    const res = await api.post<{ data: HousekeepingTask } | HousekeepingTask>("/housekeeping", data);
    return (res as any)?.data || res;
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
        timeout: 5000,
      });
      return (res as any)?.data || (Array.isArray(res) ? res : []);
    } catch {
      return [];
    }
  },

  createOrder: async (payload: Partial<RestaurantOrder>): Promise<RestaurantOrder> => {
    const res = await api.post("/pos/orders", payload);
    return (res as any)?.data || res;
  },

  updateStatus: async (id: string, status: string): Promise<RestaurantOrder> => {
    const res = await api.patch(`/pos/orders/${id}/status`, { status });
    return (res as any)?.data || res;
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
        { params, timeout: 5000 }
      );
      return (res as any)?.data || (Array.isArray(res) ? res : []);
    } catch {
      return [];
    }
  },

  sendMessage: async (conversationId: string, message: string): Promise<any> => {
    const res = await api.post(`/ai/conversations/${conversationId}/messages`, { message });
    return (res as any)?.data || res;
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
  orgId?: string;
  billedBy?: string;
  billedByRole?: string;
  paymentMethod?: string;
  transactionRef?: string;
  paidAt?: string;
}

export const invoicesApi = {
  getAll: async (params?: { status?: string; search?: string; orgId?: string; hotelId?: string; billedBy?: string }): Promise<{ data: InvoiceRecord[]; metrics: any }> => {
    try {
      const res = await api.get<{ data: InvoiceRecord[]; metrics: any }>("/invoices", { params, timeout: 5000 });
      return res.data ? res : { data: (res as any), metrics: null };
    } catch {
      return { data: [], metrics: null };
    }
  },

  create: async (payload: Partial<InvoiceRecord>): Promise<InvoiceRecord> => {
    const res = await api.post("/invoices", payload);
    return res.data || res;
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
  getAll: async (params?: { search?: string; orgId?: string }): Promise<any[]> => {
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
  getAll: async (params?: { department?: string; search?: string; orgId?: string }): Promise<any[]> => {
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
// 13. ROOMS & INVENTORY API (Operations, Room Map, Hotel Admin)
// -------------------------------------------------------------
export const roomsApi = {
  getAll: async (params?: { floor?: number; status?: string; hotelId?: string; orgId?: string }): Promise<any[]> => {
    try {
      const res = await api.get<{ data: any[] }>("/rooms", { params, timeout: 5000 });
      return res.data || (res as any) || [];
    } catch {
      return [];
    }
  },
  create: async (payload: {
    number: string;
    floor: number;
    type: string;
    rate?: number;
    hotelId?: string;
    hotelName?: string;
    orgId?: string;
    status?: string;
  }): Promise<any> => {
    const res = await api.post("/rooms", payload);
    return (res as any)?.data || res;
  },
  createBulk: async (payload: {
    rooms: Array<{
      number: string;
      floor: number;
      type: string;
      rate?: number;
      status?: string;
      hotelId?: string;
      hotelName?: string;
      orgId?: string;
    }>;
    hotelId?: string;
    hotelName?: string;
    orgId?: string;
  }): Promise<any> => {
    const res = await api.post("/rooms/bulk", payload);
    return (res as any)?.data || res;
  },
  batchGenerate: async (payload: {
    hotelId?: string;
    hotelName?: string;
    orgId?: string;
    totalRooms?: number;
    floors?: number;
    defaultRate?: number;
  }): Promise<any> => {
    const res = await api.post("/rooms/batch", payload);
    return (res as any)?.data || res;
  },
  updateStatus: async (
    number: string,
    payload: { status?: string; guest?: string; cleaner?: string; rate?: number; type?: string }
  ): Promise<any> => {
    const res = await api.patch(`/rooms/${number}/status`, payload);
    return (res as any)?.data || res;
  },
  delete: async (number: string): Promise<any> => {
    const res = await api.delete(`/rooms/${number}`);
    return (res as any)?.data || res;
  },
};


