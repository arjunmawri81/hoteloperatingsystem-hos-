"use client";

import React from "react";
import Link from "next/link";
import { useAuth, ROLE_ROUTE_MAP } from "@/context/AuthContext";
import { UserRole } from "@/types";
import { ShieldAlert, ArrowRight, RefreshCw, Lock } from "lucide-react";

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  moduleName?: string;
}

export function RoleGuard({
  allowedRoles,
  children,
  moduleName = "this module",
}: RoleGuardProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 p-8 text-[#6B7280]">
        <RefreshCw className="w-6 h-6 animate-spin text-[#EC3013]" />
        <span className="text-[13px] font-medium">Verifying role permissions &amp; tenant security...</span>
      </div>
    );
  }

  const currentRole = user?.role || "customer";
  const hasAccess =
    currentRole === "super_admin" || allowedRoles.includes(currentRole as UserRole);

  if (!hasAccess) {
    const userHomePath = ROLE_ROUTE_MAP[currentRole as UserRole] || "/";

    const getRoleName = (r: string) => {
      switch (r) {
        case "super_admin":
          return "Super Admin";
        case "hotel_admin":
          return "Hotel Admin";
        case "area_manager":
          return "Area Manager";
        case "hotel_manager":
          return "Hotel Manager";
        case "receptionist":
          return "Receptionist";
        case "housekeeping":
          return "Housekeeping";
        case "restaurant_staff":
          return "Restaurant POS";
        case "finance":
          return "Finance & Accounting";
        case "customer":
          return "Guest / Customer";
        case "ai_receptionist":
          return "AI Receptionist";
        default:
          return r.replace("_", " ");
      }
    };

    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6 font-sans">
        <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-lg max-w-md w-full p-6 sm:p-8 text-center space-y-5">
          <div className="w-14 h-14 bg-rose-50 border border-rose-200 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-[18px] font-bold text-[#111827]">
              Access Restricted
            </h2>
            <p className="text-[13px] text-[#6B7280]">
              Your account role does not have permission to view or manage{" "}
              <strong className="text-[#111827] font-semibold">{moduleName}</strong>.
            </p>
          </div>

          <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-3.5 text-left text-[12px] space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Your Active Role:</span>
              <span className="font-bold text-[#111827] bg-white border border-[#D1D5DB] px-2 py-0.5 rounded">
                {getRoleName(currentRole)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Authorized Roles:</span>
              <span className="font-semibold text-rose-700">
                {allowedRoles.map(getRoleName).join(", ")}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href={userHomePath}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#EC3013] hover:bg-[#D62839] text-white text-[13px] font-bold rounded shadow-xs transition-colors"
            >
              <span>Go to Your Assigned Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
