export type UserRole =
  | "super_admin"
  | "hotel_admin"
  | "area_manager"
  | "hotel_manager"
  | "receptionist"
  | "housekeeping"
  | "restaurant_staff"
  | "finance"
  | "customer"
  | "ai_receptionist";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  orgId?: string;
  orgName?: string;
  hotelId?: string;
  hotelName?: string;
  avatarUrl?: string;
  phone?: string;
  token?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface LoginCredentials {
  email: string;
  password?: string;
  role?: UserRole | string;
}

export interface RegisterData {
  orgName: string;
  orgCode: string;
  adminName: string;
  email: string;
  phone: string;
  password?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface Organization {
  id: string;
  name: string;
  code: string;
  ownerName: string;
  ownerEmail: string;
  hotelsCount: number;
  activeRooms: number;
  monthlyRevenue: number;
  status: "active" | "trial" | "suspended";
  createdAt: string;
}

export interface Hotel {
  id: string;
  orgId: string;
  name: string;
  city: string;
  region: string;
  totalRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
  rating: number;
  managerName: string;
  phone: string;
  status: "open" | "maintenance" | "closed";
}

export interface Reservation {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  hotelName: string;
  roomNumber: string;
  roomType: "Deluxe King" | "Executive Suite" | "Standard Twin" | "Presidential Suite";
  checkIn: string;
  checkOut: string;
  status: "confirmed" | "checked_in" | "checked_out" | "cancelled";
  totalAmount: number;
  paidAmount: number;
  source: "Web Direct" | "OTA (Booking.com)" | "OTA (Expedia)" | "Walk-in" | "AI Assistant";
}

export interface HousekeepingTask {
  id: string;
  roomNumber: string;
  roomType: string;
  floor: number;
  status: "dirty" | "cleaning" | "inspected" | "clean" | "out_of_order";
  assignedTo: string;
  priority: "high" | "medium" | "low";
  lastCleaned: string;
}

export interface RestaurantOrder {
  id: string;
  tableNumber: string;
  roomNumber?: string;
  items: string[];
  total: number;
  status: "cooking" | "served" | "paid" | "charged_to_room";
  time: string;
}

export interface AIConversation {
  id: string;
  guestName: string;
  guestPhone: string;
  channel: "WhatsApp" | "Web Widget" | "Voice Bot";
  lastMessage: string;
  intent: "Booking Inquiry" | "Room Service" | "Late Checkout" | "Complaint" | "FAQ";
  status: "ai_handling" | "escalated_to_staff" | "resolved";
  sentiment: "positive" | "neutral" | "negative";
  timestamp: string;
}
