"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { User, UserRole, LoginCredentials, RegisterData, UserSignupData } from "@/types";
import {
  loginApi,
  registerApi,
  signupUserApi,
  logoutApi,
  getStoredToken,
  setStoredToken,
  MOCK_USERS,
} from "@/lib/api";

export type ApiMode = "live" | "mock";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  apiMode: ApiMode;
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  signup: (data: UserSignupData) => Promise<User>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
  setApiMode: (mode: ApiMode) => void;
  toggleApiMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = "hos_current_user";
const API_MODE_KEY = "hos_api_mode";

export const ROLE_ROUTE_MAP: Record<UserRole, string> = {
  super_admin: "/super-admin",
  hotel_admin: "/hotel-admin",
  area_manager: "/area-manager",
  hotel_manager: "/operations",
  receptionist: "/operations/front-desk",
  housekeeping: "/operations/housekeeping",
  restaurant_staff: "/operations/restaurant-pos",
  finance: "/operations/billing",
  customer: "/customer",
  ai_receptionist: "/ai-receptionist",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiMode, setApiModeState] = useState<ApiMode>("live");

  // Load initial session on mount (prioritize tab-isolated sessionStorage)
  useEffect(() => {
    try {
      const storedToken = getStoredToken();
      const storedUserJson =
        sessionStorage.getItem(USER_STORAGE_KEY) ||
        localStorage.getItem(USER_STORAGE_KEY);
      const storedMode =
        (sessionStorage.getItem(API_MODE_KEY) as ApiMode) ||
        (localStorage.getItem(API_MODE_KEY) as ApiMode);

      if (storedMode) {
        setApiModeState(storedMode);
      }

      if (storedUserJson) {
        const parsedUser = JSON.parse(storedUserJson);
        setUser(parsedUser);
        const activeToken =
          storedToken ||
          `mock_jwt_token_${parsedUser.role || "hotel_admin"}_${Date.now()}`;
        setToken(activeToken);
        setStoredToken(activeToken);
        sessionStorage.setItem(USER_STORAGE_KEY, storedUserJson);
      } else {
        const defaultUser = MOCK_USERS.hotel_admin;
        const defaultToken = `mock_jwt_token_hotel_admin_${Date.now()}`;
        setUser(defaultUser);
        setToken(defaultToken);
        setStoredToken(defaultToken);
        sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(defaultUser));
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(defaultUser));
      }
    } catch (e) {
      console.error("Failed to restore session from storage", e);
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setApiMode = useCallback((mode: ApiMode) => {
    setApiModeState(mode);
    sessionStorage.setItem(API_MODE_KEY, mode);
    localStorage.setItem(API_MODE_KEY, mode);
  }, []);

  const toggleApiMode = useCallback(() => {
    setApiModeState((prev) => {
      const next = prev === "live" ? "mock" : "live";
      sessionStorage.setItem(API_MODE_KEY, next);
      localStorage.setItem(API_MODE_KEY, next);
      return next;
    });
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<User> => {
      setIsLoading(true);
      try {
        const isForceMock = apiMode === "mock";
        const authResponse = await loginApi(credentials, isForceMock);
        const loggedInUser = authResponse.user;

        setUser(loggedInUser);
        setToken(authResponse.token);
        sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(loggedInUser));
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(loggedInUser));

        return loggedInUser;
      } finally {
        setIsLoading(false);
      }
    },
    [apiMode]
  );

  const register = useCallback(
    async (data: RegisterData): Promise<User> => {
      setIsLoading(true);
      try {
        const isForceMock = apiMode === "mock";
        const authResponse = await registerApi(data, isForceMock);
        const registeredUser = authResponse.user;

        setUser(registeredUser);
        setToken(authResponse.token);
        sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(registeredUser));
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(registeredUser));

        return registeredUser;
      } finally {
        setIsLoading(false);
      }
    },
    [apiMode]
  );

  const signup = useCallback(
    async (data: UserSignupData): Promise<User> => {
      setIsLoading(true);
      try {
        const isForceMock = apiMode === "mock";
        const authResponse = await signupUserApi(data, isForceMock);
        const registeredUser = authResponse.user;

        setUser(registeredUser);
        setToken(authResponse.token);
        sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(registeredUser));
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(registeredUser));

        return registeredUser;
      } finally {
        setIsLoading(false);
      }
    },
    [apiMode]
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await logoutApi();
      setUser(null);
      setToken(null);
      sessionStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      router.push("/login");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const switchRole = useCallback(
    (role: UserRole) => {
      const mockUser = MOCK_USERS[role] || {
        id: `usr-${role}-${Date.now()}`,
        name: `${role.replace("_", " ").toUpperCase()} User`,
        email: `${role}@meridianhotels.com`,
        role: role,
        orgId: "org-1",
        orgName: "Meridian Hospitality Group",
      };
      const mockToken = `mock_jwt_token_${role}_${Date.now()}`;

      setUser(mockUser);
      setToken(mockToken);
      setStoredToken(mockToken);
      sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mockUser));
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mockUser));

      const targetPath = ROLE_ROUTE_MAP[role] || "/";
      router.push(targetPath);
    },
    [router]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        apiMode,
        login,
        register,
        signup,
        logout,
        switchRole,
        setApiMode,
        toggleApiMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
