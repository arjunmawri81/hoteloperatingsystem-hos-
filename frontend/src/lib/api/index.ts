/**
 * LuckNexa Unified API Service Layer
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

  approve: async (id: string, remarks?: string): Promise<any> => {
    const res = await api.patch(`/organizations/${id}/approve`, { remarks });
    return (res as any)?.data || res;
  },

  reject: async (id: string, reason?: string): Promise<any> => {
    const res = await api.patch(`/organizations/${id}/reject`, { reason });
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
  getAll: async (params?: { hotelId?: string; status?: string; orgId?: string }): Promise<Reservation[]> => {
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

  getById: async (id: string): Promise<Reservation | null> => {
    try {
      const res = await api.get<{ data: Reservation } | Reservation>(`/reservations/${id}`);
      return (res as any)?.data || res;
    } catch {
      return null;
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

  checkIn: async (id: string, payload: { idType?: string; idNumber?: string; idDocUrl?: string; advanceDeposit?: number; paymentMethod?: string }): Promise<any> => {
    const res = await api.post(`/reservations/${id}/check-in`, payload);
    return (res as any)?.data || res;
  },

  checkOut: async (id: string, payload: { finalPaymentAmount?: number; paymentMethod?: string; lateCheckOutFee?: number }): Promise<any> => {
    const res = await api.post(`/reservations/${id}/check-out`, payload);
    return (res as any)?.data || res;
  },

  changeRoom: async (id: string, payload: { newRoomNumber: string; reason?: string; isPaidUpgrade?: boolean; priceDiffPerNight?: number; upgradeChargeTotal?: number; [key: string]: any }): Promise<any> => {
    const res = await api.post(`/reservations/${id}/change-room`, payload);
    return (res as any)?.data || res;
  },

  extendStay: async (id: string, payload: { newCheckOutDate: string; additionalAmount?: number }): Promise<any> => {
    const res = await api.post(`/reservations/${id}/extend`, payload);
    return (res as any)?.data || res;
  },

  chargeFolio: async (id: string, payload: { description: string; department?: string; amount: number; tax?: number; refId?: string }): Promise<any> => {
    const res = await api.post(`/reservations/${id}/charge-folio`, payload);
    return (res as any)?.data || res;
  },

  recordPayment: async (id: string, payload: { amount: number; method?: string; transactionId?: string; note?: string }): Promise<any> => {
    const res = await api.post(`/reservations/${id}/record-payment`, payload);
    return (res as any)?.data || res;
  },

  preCheckIn: async (id: string, payload: { idType?: string; idNumber?: string; estimatedArrivalTime?: string; specialRequests?: string }): Promise<any> => {
    const res = await api.post(`/reservations/${id}/pre-checkin`, payload);
    return (res as any)?.data || res;
  },

  generateWebCheckInLink: async (id: string, expiryHours: number = 24): Promise<any> => {
    const res = await api.post(`/reservations/${id}/web-checkin-link`, { expiryHours });
    return (res as any)?.data || res;
  },

  getWebCheckInDetails: async (token: string): Promise<any> => {
    const res = await api.get(`/reservations/web-checkin/${token}`);
    return (res as any)?.data || res;
  },

  verifyIdDocument: async (payload: { imageData?: string; fileName?: string; preferredType?: string }): Promise<any> => {
    const res = await api.post(`/reservations/verify-id`, payload);
    return res as any;
  },

  submitWebCheckIn: async (token: string, payload: any): Promise<any> => {
    const res = await api.post(`/reservations/web-checkin/${token}/submit`, payload);
    return (res as any)?.data || res;
  },

  delete: async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/reservations/${id}`);
      return true;
    } catch {
      return false;
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

  updateChecklist: async (id: string, payload: { itemIndex: number; completed: boolean }): Promise<any> => {
    const res = await api.patch(`/housekeeping/${id}/checklist`, payload);
    return (res as any)?.data || res;
  },

  inspect: async (id: string, payload: { status: "passed" | "failed"; remarks?: string }): Promise<any> => {
    const res = await api.post(`/housekeeping/${id}/inspect`, payload);
    return (res as any)?.data || res;
  },
};

// -------------------------------------------------------------
// 4B. MAINTENANCE API (Operations)
// -------------------------------------------------------------
export const maintenanceApi = {
  getRequests: async (): Promise<any[]> => {
    try {
      const res = await api.get("/maintenance/requests");
      return (res as any)?.data || (Array.isArray(res) ? res : []);
    } catch {
      return [];
    }
  },
  createRequest: async (data: {
    roomNumber: string;
    category: string;
    description: string;
    priority?: string;
  }): Promise<any> => {
    const res = await api.post("/maintenance/requests", data);
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

  chargeToRoom: async (payload: { roomNumber: string; amount: number; description?: string }): Promise<any> => {
    const res = await api.post("/pos/charge-to-room", payload);
    return (res as any)?.data || res;
  },

  createOrder: async (payload: any): Promise<any> => {
    const res = await api.post("/pos/orders", payload);
    return (res as any)?.data || res;
  },

  updateStatus: async (id: string, status: string): Promise<RestaurantOrder> => {
    const res = await api.patch(`/pos/orders/${id}/status`, { status });
    return (res as any)?.data || res;
  },

  // Tables
  getTables: async (): Promise<any[]> => {
    try {
      const res = await api.get("/pos/tables");
      return (res as any)?.data || [];
    } catch {
      return [];
    }
  },

  createTable: async (payload: any): Promise<any> => {
    const res = await api.post("/pos/tables", payload);
    return (res as any)?.data || res;
  },

  updateTableStatus: async (id: string, payload: any): Promise<any> => {
    const res = await api.patch(`/pos/tables/${id}/status`, payload);
    return (res as any)?.data || res;
  },

  transferTable: async (payload: { sourceTableNumber: string; targetTableNumber: string }): Promise<any> => {
    const res = await api.post("/pos/tables/transfer", payload);
    return (res as any)?.data || res;
  },

  // Kitchen Order Tickets (KOT)
  getKOTs: async (params?: { status?: string }): Promise<any[]> => {
    try {
      const res = await api.get("/pos/kots", { params });
      return (res as any)?.data || [];
    } catch {
      return [];
    }
  },

  updateKOTStatus: async (id: string, status: string): Promise<any> => {
    const res = await api.patch(`/pos/kots/${id}/status`, { status });
    return (res as any)?.data || res;
  },

  // Menu Management
  getMenu: async (): Promise<any[]> => {
    try {
      const res = await api.get<any>("/pos/menu");
      if (Array.isArray(res)) return res;
      if (Array.isArray((res as any)?.data)) return (res as any).data;
      return [];
    } catch {
      return [];
    }
  },

  createMenuItem: async (payload: any): Promise<any> => {
    const res = await api.post("/pos/menu", payload);
    return (res as any)?.data || res;
  },

  updateMenuItem: async (id: string, payload: any): Promise<any> => {
    const res = await api.patch(`/pos/menu/${id}`, payload);
    return (res as any)?.data || res;
  },

  deleteMenuItem: async (id: string): Promise<any> => {
    const res = await api.delete(`/pos/menu/${id}`);
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
  getAll: async (params?: { segment?: string; search?: string; orgId?: string }): Promise<any[]> => {
    try {
      const res = await api.get<{ data: any[] }>("/guests", { params, timeout: 3000 });
      return res.data || (res as any) || [];
    } catch {
      return [];
    }
  },
  lookupByPhone: async (phone: string): Promise<any> => {
    try {
      const res = await api.get("/guests/lookup", { params: { phone } });
      return res as any;
    } catch {
      return { success: false, exists: false, data: null };
    }
  },
  create: async (payload: any): Promise<any> => {
    const res = await api.post("/guests", payload);
    return res.data || res;
  },
  getComplaints: async (): Promise<any[]> => {
    try {
      const res = await api.get("/guests/complaints");
      return (res as any)?.data || [];
    } catch {
      return [];
    }
  },
  createComplaint: async (payload: any): Promise<any> => {
    const res = await api.post("/guests/complaints", payload);
    return (res as any)?.data || res;
  },
};

// -------------------------------------------------------------
// 11. INVENTORY & STOCK API (Operations - Video 4)
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
  // GRN / Purchase Inward (Video 4)
  createGRN: async (payload: any): Promise<any> => {
    const res = await api.post("/inventory/inwards", payload);
    return res as any;
  },
  getGRNs: async (): Promise<any[]> => {
    try {
      const res = await api.get("/inventory/inwards");
      return (res as any)?.data || [];
    } catch {
      return [];
    }
  },
  // Departmental Issue (Video 4)
  createIssue: async (payload: any): Promise<any> => {
    const res = await api.post("/inventory/issues", payload);
    return res as any;
  },
  getIssues: async (): Promise<any[]> => {
    try {
      const res = await api.get("/inventory/issues");
      return (res as any)?.data || [];
    } catch {
      return [];
    }
  },
};

// -------------------------------------------------------------
// 12. AI LEAD PIPELINE API (AI Receptionist)
// -------------------------------------------------------------
export const leadsApi = {
  getAll: async (params?: { stage?: string; search?: string; hotelId?: string; orgId?: string }): Promise<{ data: any[]; metrics: any }> => {
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
  getTapeChart: async (params?: { startDate?: string; days?: number }): Promise<any> => {
    try {
      const res = await api.get<{ data: any }>("/rooms/tape-chart", { params, timeout: 5000 });
      return (res as any)?.data || res;
    } catch {
      return { dates: [], tapeChart: [] };
    }
  },
};

// -------------------------------------------------------------
// 14. RATE PLANS & INVENTORY RESTRICTIONS API
// -------------------------------------------------------------
export const ratePlansApi = {
  getAll: async (): Promise<any[]> => {
    try {
      const res = await api.get<{ data: any[] }>("/rate-plans");
      return (res as any)?.data || (Array.isArray(res) ? res : []);
    } catch {
      return [];
    }
  },
  create: async (payload: any): Promise<any> => {
    const res = await api.post("/rate-plans", payload);
    return (res as any)?.data || res;
  },
};

export const inventoryRestrictionsApi = {
  getAll: async (params?: { startDate?: string; endDate?: string; roomType?: string }): Promise<any[]> => {
    try {
      const res = await api.get<{ data: any[] }>("/inventory-restrictions", { params });
      return (res as any)?.data || (Array.isArray(res) ? res : []);
    } catch {
      return [];
    }
  },
  set: async (payload: any): Promise<any> => {
    const res = await api.post("/inventory-restrictions", payload);
    return (res as any)?.data || res;
  },
};

// -------------------------------------------------------------
// 15. GLOBAL SEARCH API
// -------------------------------------------------------------
export const searchApi = {
  query: async (q: string): Promise<any> => {
    try {
      const res = await api.get<{ data: any }>("/search", { params: { q } });
      return (res as any)?.data || res;
    } catch {
      return { reservations: [], rooms: [], guests: [], invoices: [], leads: [] };
    }
  },
};



// -------------------------------------------------------------
// 16. CASH COUNTER & SHIFT API (Video 3)
// -------------------------------------------------------------
export const cashCounterApi = {
  getCurrentShift: async (hotelId?: string): Promise<any> => {
    try {
      const res = await api.get("/cash-counter/current", { params: { hotelId } });
      return res as any;
    } catch (e) {
      return { success: false, isOpen: false, activeShift: null, transactions: [] };
    }
  },
  openShift: async (payload: {
    cashierName: string;
    openingFloat: number;
    notes?: string;
    hotelId?: string;
    hotelName?: string;
    orgId?: string;
  }): Promise<any> => {
    const res = await api.post("/cash-counter/open", payload);
    return res as any;
  },
  recordTransaction: async (payload: {
    shiftId: string;
    type: "cash_in" | "cash_out";
    category?: string;
    amount: number;
    description: string;
    voucherNumber?: string;
    referenceId?: string;
    recordedBy?: string;
  }): Promise<any> => {
    const res = await api.post("/cash-counter/transaction", payload);
    return res as any;
  },
  closeShift: async (payload: {
    shiftId: string;
    denominations: { [key: string]: number };
    actualCashCounted?: number;
    discrepancyReason?: string;
    handoverNotes?: string;
    handoverTo?: string;
  }): Promise<any> => {
    const res = await api.post("/cash-counter/close", payload);
    return res as any;
  },
  getHistory: async (hotelId?: string): Promise<any[]> => {
    try {
      const res = await api.get("/cash-counter/history", { params: { hotelId } });
      return (res as any)?.data || [];
    } catch {
      return [];
    }
  },
};



