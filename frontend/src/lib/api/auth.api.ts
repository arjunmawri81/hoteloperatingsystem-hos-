import { api, setStoredToken } from "./client";
import {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  UserSignupData,
  User,
  UserRole,
} from "@/types";

/**
 * Pre-defined mock users for development and rapid testing of all roles
 */
export const MOCK_USERS: Record<string, User> = {
  super_admin: {
    id: "usr-sa-01",
    name: "Alexander Whitfield",
    email: "admin@meridianhotels.com",
    role: "super_admin",
    orgId: "org-1",
    orgName: "Meridian Hotel Group",
  },
  hotel_admin: {
    id: "usr-ha-01",
    name: "Vikram Singhania",
    email: "owner@meridianhotels.com",
    role: "hotel_admin",
    orgId: "org-1",
    orgName: "Meridian Hotel Group",
  },
  area_manager: {
    id: "usr-am-01",
    name: "Sunil Rathore",
    email: "regional@meridianhotels.com",
    role: "area_manager",
    orgId: "org-1",
    orgName: "Meridian Hotel Group",
  },
  hotel_manager: {
    id: "usr-hm-01",
    name: "Rajesh Sharma",
    email: "frontdesk@meridianhotels.com",
    role: "hotel_manager",
    orgId: "org-1",
    orgName: "Meridian Hotel Group",
    hotelId: "hotel-101",
    hotelName: "Meridian Grand Palace",
  },
  customer: {
    id: "usr-cust-01",
    name: "Arjun Verma",
    email: "guest@meridianhotels.com",
    role: "customer",
  },
  ai_receptionist: {
    id: "usr-ai-01",
    name: "Aura AI Concierge",
    email: "ai-concierge@meridianhotels.com",
    role: "ai_receptionist",
    hotelId: "hotel-101",
    hotelName: "Meridian Grand Palace",
  },
};

/**
 * Login API: Sends credentials to live backend and saves auth token
 */
export async function loginApi(
  credentials: LoginCredentials,
  forceMock = false
): Promise<AuthResponse> {
  if (forceMock) {
    const roleKey = (credentials.role || "super_admin") as string;
    const mockUser: User = MOCK_USERS[roleKey] || {
      id: `usr-mock-${Date.now()}`,
      name: credentials.email.split("@")[0] || "Staff Member",
      email: credentials.email,
      role: (credentials.role as UserRole) || "super_admin",
      orgId: "org-1",
      orgName: "Meridian Hotel Group",
    };
    const mockToken = `mock_jwt_token_${mockUser.role}_${Date.now()}`;
    setStoredToken(mockToken);
    return { user: mockUser, token: mockToken, expiresIn: 86400 };
  }

  const response = await api.post<{ data: AuthResponse } | AuthResponse>(
    "/auth/login",
    credentials,
    { skipAuth: true, timeout: 8000 }
  );

  const authData = (response as any).data || response;
  if (authData?.token) {
    setStoredToken(authData.token);
  }
  return authData;
}

/**
 * Register API: Registers a new Organization and Hotel Admin
 */
export async function registerApi(
  data: RegisterData,
  forceMock = false
): Promise<AuthResponse> {
  if (forceMock) {
    const mockUser: User = {
      id: `usr-org-${Date.now()}`,
      name: data.adminName,
      email: data.email,
      role: "hotel_admin",
      orgId: `org-${data.orgCode.toLowerCase()}`,
      orgName: data.orgName,
      phone: data.phone,
    };
    const mockToken = `mock_jwt_token_hotel_admin_${Date.now()}`;
    setStoredToken(mockToken);
    return { user: mockUser, token: mockToken, expiresIn: 86400 };
  }

  const response = await api.post<{ data: AuthResponse } | AuthResponse>(
    "/auth/register",
    data,
    { skipAuth: true, timeout: 8000 }
  );

  const authData = (response as any).data || response;
  if (authData?.token) {
    setStoredToken(authData.token);
  }
  return authData;
}

/**
 * Signup API: Registers an individual guest / customer account
 */
export async function signupUserApi(
  data: UserSignupData,
  forceMock = false
): Promise<AuthResponse> {
  if (forceMock) {
    const mockUser: User = {
      id: `usr-cust-${Date.now()}`,
      name: data.name,
      email: data.email,
      role: "customer",
      phone: data.phone,
    };
    const mockToken = `mock_jwt_token_customer_${Date.now()}`;
    setStoredToken(mockToken);
    return { user: mockUser, token: mockToken, expiresIn: 86400 };
  }

  const response = await api.post<{ data: AuthResponse } | AuthResponse>(
    "/auth/signup",
    data,
    { skipAuth: true, timeout: 8000 }
  );

  const authData = (response as any).data || response;
  if (authData?.token) {
    setStoredToken(authData.token);
  }
  return authData;
}

/**
 * Get current authenticated user profile
 */
export async function getMeApi(): Promise<User | null> {
  try {
    const response = await api.get<{ data: User } | User>("/auth/me", {
      timeout: 3000,
    });
    return (response as any).data || response;
  } catch (err) {
    return null;
  }
}

/**
 * Logout
 */
export async function logoutApi(): Promise<void> {
  try {
    await api.post("/auth/logout", {}, { timeout: 2000 });
  } catch (err) {
    // Ignore network error on logout
  } finally {
    setStoredToken(null);
  }
}
