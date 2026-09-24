export type UserRole =
  | "super_admin"
  | "hotel_admin"
  | "area_manager"
  | "hotel_manager"
  | "receptionist"
  | "housekeeping"
  | "restaurant_staff"
  | "kitchen_staff"
  | "finance"
  | "inventory_staff"
  | "banquet_staff"
  | "channel_manager"
  | "customer"
  | "ai_receptionist"
  | string;

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  orgId?: string;
  orgName?: string;
  hotelId?: string;
  hotelName?: string;
  assignedHotelIds?: string[];
  assignedHotelNames?: string[];
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

export interface UserSignupData {
  name: string;
  email: string;
  phone?: string;
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
  ownerPhone?: string;
  ownerPassword?: string;
  hotelsCount: number;
  activeRooms: number;
  monthlyRevenue: number;
  status: "pending_approval" | "active" | "rejected" | "trial" | "suspended" | string;
  kycDocuments?: {
    gstin?: string;
    panNumber?: string;
    fssaiNumber?: string;
    tradeLicenseNumber?: string;
    gstCertificateUrl?: string;
    panCardUrl?: string;
    businessProofUrl?: string;
    ownerIdUrl?: string;
    approvalRemarks?: string;
    approvedBy?: string;
    approvedAt?: string | Date;
    rejectionReason?: string;
  };
  createdAt?: string;
}

export interface Hotel {
  id: string;
  orgId?: string;
  name: string;
  city?: string;
  region?: string;
  totalRooms: number;
  occupiedRooms?: number;
  occupancyRate?: number;
  rating?: number;
  managerName?: string;
  phone?: string;
  images?: {
    front?: string;
    lobby?: string;
    room?: string;
    washroom?: string;
  };
  legalKyc?: {
    gstin?: string;
    tradeLicense?: string;
    fireSafetyNoc?: string;
  };
  locationDetails?: {
    address?: string;
    landmark?: string;
    pincode?: string;
    mapUrl?: string;
  };
  policies?: {
    checkInTime?: string;
    checkOutTime?: string;
    category?: string;
    amenities?: string[];
  };
  verificationStatus?: "verified" | "pending_review" | "rejected";
  status?: "open" | "maintenance" | "closed" | string;
}

export interface Reservation {
  id: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  hotelId?: string;
  hotelName?: string;
  orgId?: string;
  roomNumber: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  actualCheckIn?: string | Date;
  actualCheckOut?: string | Date;
  status: "confirmed" | "checked_in" | "checked_out" | "cancelled" | string;
  totalAmount: number;
  paidAmount?: number;
  source?: string;
  idType?: string;
  idNumber?: string;
  idDocUrl?: string;
  isPreCheckedIn?: boolean;
  estimatedArrivalTime?: string;
  folioCharges?: Array<{
    id?: string;
    description: string;
    department?: string;
    amount: number;
    tax?: number;
    date?: string | Date;
  }>;
  payments?: Array<{
    id?: string;
    amount: number;
    method?: string;
    transactionId?: string;
    date?: string | Date;
    status?: string;
    note?: string;
  }>;
  roomChanges?: Array<{
    fromRoom: string;
    toRoom: string;
    reason: string;
    date?: string | Date;
    changedBy?: string;
  }>;
}

export interface HousekeepingTask {
  id: string;
  roomNumber: string;
  roomType?: string;
  floor?: number;
  status: "dirty" | "cleaning" | "inspected" | "clean" | "out_of_order" | string;
  assignedTo?: string;
  priority?: "high" | "medium" | "low" | "urgent" | string;
  lastCleaned?: string;
  notes?: string;
}

export interface RestaurantOrder {
  id: string;
  tableNumber: string;
  roomNumber?: string;
  items: string[] | string;
  total: number;
  status: "cooking" | "preparing" | "ready" | "served" | "paid" | "charged_to_room" | string;
  time?: string;
}

export interface AIConversation {
  id: string;
  guestName: string;
  guestPhone?: string;
  channel?: "WhatsApp" | "Web Widget" | "Voice Bot" | string;
  lastMessage?: string;
  intent?: string;
  status?: "ai_handling" | "escalated_to_staff" | "escalated" | "resolved" | string;
  sentiment?: "positive" | "neutral" | "negative" | string;
  timestamp?: string;
}

export interface MenuItem {
  _id?: string;
  id?: string;
  name: string;
  category: "Starters" | "Main Course" | "Breads & Rice" | "Desserts" | "Beverages" | string;
  price: number;
  halfPrice?: number;
  hasHalfPortion?: boolean;
  description?: string;
  image?: string;
  isVeg: boolean;
  isAvailable: boolean;
  prepTimeMinutes?: number;
}

export interface KOTItem {
  name: string;
  portion?: "Full" | "Half" | "Quarter" | string;
  quantity: number;
  instructions?: string;
}

export interface KOT {
  _id?: string;
  id?: string;
  kotNumber: string;
  orderId: string;
  tableNumber: string;
  roomNumber?: string;
  serverName?: string;
  items: KOTItem[];
  status: "new" | "preparing" | "ready" | "served" | "cancelled" | "completed" | string;
  createdAt: string;
  updatedAt?: string;
}

export interface RestaurantTable {
  _id?: string;
  id?: string;
  tableNumber: string;
  section: string;
  capacity: number;
  status: "available" | "occupied" | "reserved" | "cleaning" | string;
  currentOrderId?: string;
  currentGuestName?: string;
  roomNumber?: string;
}

