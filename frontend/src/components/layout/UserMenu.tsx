"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types";
import { LogOut, ChevronDown } from "lucide-react";

export function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return "US";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getRoleBadge = (role?: UserRole) => {
    switch (role) {
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
      case "customer":
        return "Customer";
      case "ai_receptionist":
        return "AI Agent";
      default:
        return "Staff";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 rounded-md hover:bg-[#F3F4F6] transition-colors text-left group focus:outline-none"
      >
        <div className="w-8 h-8 rounded-md bg-[#1F2937] text-white flex items-center justify-center text-[12px] font-bold tracking-tight shadow-xs">
          {getInitials(user?.name)}
        </div>
        <div className="hidden sm:flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-semibold text-[#111827] leading-tight">
              {user?.name || "Logged In User"}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-[#9CA3AF] transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </div>
          <span className="text-[11px] text-[#6B7280] leading-none mt-0.5">
            {getRoleBadge(user?.role)}
          </span>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E5E7EB] rounded-lg shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100 font-sans">
          {/* User Profile Card */}
          <div className="px-4 py-3 border-b border-[#F3F4F6]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-[#1F2937] text-white flex items-center justify-center text-[14px] font-bold">
                {getInitials(user?.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-[#111827] truncate">
                  {user?.name || "Administrator"}
                </p>
                <p className="text-[11px] text-[#6B7280] truncate">
                  {user?.email || "admin@meridianhotels.com"}
                </p>
                <div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#F3F4F6] text-[#374151]">
                  <span>{getRoleBadge(user?.role)}</span>
                  {user?.orgName && <span>· {user.orgName}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Workspace Switcher (Strictly for Hotel Admin) */}
          {user?.role === "hotel_admin" && (
            <div className="px-2 py-2 border-b border-[#F3F4F6]">
              <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                Switch Workspace
              </p>
              <div className="space-y-0.5">
                <a
                  href="/hotel-admin"
                  className="flex items-center justify-between px-2.5 py-1.5 rounded text-[12px] font-medium text-[#374151] hover:bg-[#F3F4F6] hover:text-[#111827] transition-colors"
                >
                  <span>🏢 Hotel Admin (Portfolio)</span>
                </a>
                <a
                  href="/operations"
                  className="flex items-center justify-between px-2.5 py-1.5 rounded text-[12px] font-medium text-[#374151] hover:bg-[#F3F4F6] hover:text-[#111827] transition-colors"
                >
                  <span>🛎️ Hotel Operations (PMS)</span>
                </a>
                <a
                  href="/customer"
                  className="flex items-center justify-between px-2.5 py-1.5 rounded text-[12px] font-medium text-[#374151] hover:bg-[#F3F4F6] hover:text-[#111827] transition-colors"
                >
                  <span>✨ Guest Booking Portal</span>
                </a>
              </div>
            </div>
          )}

          {/* Logout Action */}
          <div className="pt-1.5 px-1.5">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded text-[12px] font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
