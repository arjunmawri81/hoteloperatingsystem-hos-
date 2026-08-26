"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, AlertCircle, Server, Database, CheckCircle2 } from "lucide-react";
import { useAuth, ROLE_ROUTE_MAP } from "@/context/AuthContext";
import { UserRole } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const { login, apiMode, toggleApiMode } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>("super_admin");
  const [email, setEmail] = useState("admin@meridianhotels.com");
  const [password, setPassword] = useState("admin123");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const roles = [
    {
      value: "super_admin",
      label: "Super Admin (Platform Owner)",
      path: "/super-admin",
      email: "admin@meridianhotels.com",
      badge: "Full Access",
    },
    {
      value: "hotel_admin",
      label: "Hotel Admin (Chain Owner)",
      path: "/hotel-admin",
      email: "owner@meridianhotels.com",
      badge: "Portfolio & KPI",
    },
    {
      value: "area_manager",
      label: "Area Manager (Regional)",
      path: "/area-manager",
      email: "regional@meridianhotels.com",
      badge: "Multi-Hotel",
    },
    {
      value: "hotel_manager",
      label: "Hotel Operations (Property PMS)",
      path: "/operations",
      email: "frontdesk@meridianhotels.com",
      badge: "Front Desk & Rooms",
    },
    {
      value: "customer",
      label: "Customer Portal (Guest)",
      path: "/customer",
      email: "guest@meridianhotels.com",
      badge: "Direct Booking",
    },
    {
      value: "ai_receptionist",
      label: "AI Receptionist Console",
      path: "/ai-receptionist",
      email: "ai-concierge@meridianhotels.com",
      badge: "Live AI Agent",
    },
  ];

  const handleRoleChange = (newRole: string) => {
    setRole(newRole as UserRole);
    const selected = roles.find((r) => r.value === newRole);
    if (selected) {
      setEmail(selected.email);
    }
  };

  const executeLogin = async (targetRole?: UserRole) => {
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    const roleToUse = targetRole || role;
    const selected = roles.find((r) => r.value === roleToUse);
    const emailToUse = targetRole && selected ? selected.email : email;

    try {
      const user = await login({
        email: emailToUse,
        password: password || "demo123",
        role: roleToUse,
      });

      setSuccessMsg(`Authenticated as ${user.name} (${user.role})`);
      const targetPath = ROLE_ROUTE_MAP[user.role] || selected?.path || "/";

      setTimeout(() => {
        router.push(targetPath);
      }, 400);
    } catch (err: any) {
      setError(err?.message || "Login failed. Please check your credentials or API connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeLogin();
  };

  const currentRoleObj = roles.find((r) => r.value === role) || roles[0];

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased text-[#111827]">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-block mb-3">
          <div className="text-[20px] font-bold tracking-tight text-[#111827]">
            HOS
          </div>
          <p className="text-[12px] text-[#9CA3AF] tracking-wide">
            Hotel Operating System
          </p>
        </Link>
        <h1 className="text-[24px] font-bold text-[#111827] tracking-tight">
          Sign in to your account
        </h1>
        <p className="text-[13px] text-[#6B7280] mt-1">
          Select your role to access your assigned management panel
        </p>

        {/* API Mode Indicator / Toggle for Backend Dev */}
        <div className="mt-3 inline-flex items-center gap-2 bg-white border border-[#E5E7EB] px-3 py-1.5 rounded-full shadow-2xs">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#4B5563]">
            {apiMode === "live" ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            )}
            <span>Backend: <strong>{apiMode === "live" ? "Live REST API (port 5000)" : "Mock Sandbox"}</strong></span>
          </div>
          <button
            type="button"
            onClick={toggleApiMode}
            className="text-[10px] uppercase font-bold text-[#E63946] hover:underline cursor-pointer ml-1 pl-1.5 border-l border-[#E5E7EB]"
          >
            Switch to {apiMode === "live" ? "Mock" : "Live"}
          </button>
        </div>
      </div>

      {/* Login Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white p-8 border border-[#E5E7EB] rounded-md shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3 rounded bg-red-50 border border-red-200 flex items-start gap-2.5 text-[12px] text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Authentication Error</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="mb-5 p-3 rounded bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-[12px] text-emerald-800">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg} — Redirecting...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Select */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold text-[#4B5563] uppercase tracking-wider">
                  Panel / Role
                </label>
                <span className="text-[11px] text-[#059669] font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Auto-Routing Enabled
                </span>
              </div>
              <select
                value={role}
                onChange={(e) => handleRoleChange(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2.5 bg-white border border-[#D1D5DB] rounded-sm text-[13px] text-[#111827] font-medium focus:outline-none focus:border-[#E63946] transition-colors cursor-pointer disabled:opacity-60"
              >
                {roles.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-[11px] font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">
                Work Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                placeholder="name@company.com"
                className="w-full px-3 py-2.5 bg-white border border-[#D1D5DB] rounded-sm text-[13px] text-[#111827] focus:outline-none focus:border-[#E63946] transition-colors disabled:opacity-60"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold text-[#4B5563] uppercase tracking-wider">
                  Password
                </label>
                <span className="text-[11px] text-[#6B7280]">
                  JWT / Bcrypt Ready
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  placeholder="••••••••"
                  className="w-full pl-3 pr-10 py-2.5 bg-white border border-[#D1D5DB] rounded-sm text-[13px] text-[#111827] focus:outline-none focus:border-[#E63946] transition-colors disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#9CA3AF] hover:text-[#4B5563]"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-[#E63946] hover:bg-[#D62839] disabled:bg-[#F87171] text-white text-[13px] font-bold rounded-sm shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In as {currentRoleObj.label.split(" ")[0]} {currentRoleObj.label.split(" ")[1]}</span>
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          {/* Quick 1-Click Role Direct Launchers */}
          <div className="mt-6 pt-5 border-t border-[#E5E7EB]">
            <div className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-2.5 text-center">
              Or 1-Click Launch Panel (Developer Testing)
            </div>
            <div className="grid grid-cols-2 gap-2">
              {roles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  disabled={isLoading}
                  onClick={() => executeLogin(r.value as UserRole)}
                  className="text-left px-2.5 py-2 border border-[#E5E7EB] hover:border-[#E63946] hover:bg-[#FFF5F5] rounded text-[11px] font-medium text-[#374151] hover:text-[#E63946] transition-colors cursor-pointer disabled:opacity-50"
                >
                  <div className="font-semibold truncate">{r.label.split(" (")[0]}</div>
                  <div className="text-[10px] text-[#9CA3AF] truncate">{r.badge}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-[#E5E7EB] text-center">
            <p className="text-[13px] text-[#6B7280]">
              New organization?{" "}
              <Link
                href="/register"
                className="font-semibold text-[#E63946] hover:underline"
              >
                Register organization
              </Link>
            </p>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-5">
          <Link
            href="/"
            className="text-[12px] text-[#6B7280] hover:text-[#111827] transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
