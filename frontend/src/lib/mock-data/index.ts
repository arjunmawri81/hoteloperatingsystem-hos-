import {
  User,
  Organization,
  Hotel,
  Reservation,
  HousekeepingTask,
  RestaurantOrder,
  AIConversation,
} from "@/types";

export const mockUsers: User[] = [
  {
    id: "usr-sa-01",
    name: "Alexander Whitfield",
    email: "admin@meridianhotels.com",
    role: "super_admin",
    orgId: "org-1",
    orgName: "Meridian Hotel Group",
  },
  {
    id: "usr-ha-01",
    name: "Vikram Singhania",
    email: "owner@meridianhotels.com",
    role: "hotel_admin",
    orgId: "org-1",
    orgName: "Meridian Hotel Group",
  },
  {
    id: "usr-am-01",
    name: "Sunil Rathore",
    email: "regional@meridianhotels.com",
    role: "area_manager",
    orgId: "org-1",
    orgName: "Meridian Hotel Group",
  },
  {
    id: "usr-hm-01",
    name: "Rajesh Sharma",
    email: "frontdesk@meridianhotels.com",
    role: "hotel_manager",
    orgId: "org-1",
    orgName: "Meridian Hotel Group",
    hotelId: "hotel-101",
    hotelName: "Meridian Grand Palace",
  },
  {
    id: "usr-cust-01",
    name: "Arjun Verma",
    email: "guest@meridianhotels.com",
    role: "customer",
  },
  {
    id: "usr-ai-01",
    name: "Aura AI Concierge",
    email: "ai-concierge@meridianhotels.com",
    role: "ai_receptionist",
    hotelId: "hotel-101",
    hotelName: "Meridian Grand Palace",
  },
];

export const mockOrganizations: Organization[] = [
  {
    id: "org-1",
    name: "Meridian Hotel Group",
    code: "MERIDIAN",
    ownerName: "A. Whitfield",
    ownerEmail: "a.whitfield@meridianhotels.com",
    hotelsCount: 6,
    activeRooms: 480,
    monthlyRevenue: 3420000,
    status: "active",
    createdAt: "2024-01-15",
  },
  {
    id: "org-2",
    name: "Royal Heritage Resorts & Spas",
    code: "ROYAL_RESORTS",
    ownerName: "Rajiv Singhania",
    ownerEmail: "rajiv@royalheritageresorts.com",
    hotelsCount: 4,
    activeRooms: 320,
    monthlyRevenue: 2750000,
    status: "active",
    createdAt: "2024-03-10",
  },
  {
    id: "org-3",
    name: "Urban Boutique Stays",
    code: "URBAN_STAY",
    ownerName: "Elena Rostova",
    ownerEmail: "elena@urbanstays.io",
    hotelsCount: 3,
    activeRooms: 150,
    monthlyRevenue: 980000,
    status: "trial",
    createdAt: "2024-06-01",
  },
];

export const mockHotels: Hotel[] = [];

// Clean operational arrays (Users, Hotels, and Rooms retained)
export const mockReservations: Reservation[] = [];
export const mockHousekeepingTasks: HousekeepingTask[] = [];
export const mockRestaurantOrders: RestaurantOrder[] = [];
export const mockAIConversations: AIConversation[] = [];
