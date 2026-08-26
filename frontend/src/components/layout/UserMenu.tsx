"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types";
import {
  LogOut,
  ChevronDown,
  Shield,
  Building,
  MapPin,
  ConciergeBell,
  UserCheck,
  Bot,
  Activity,
  Server,
  Database,
  Check,
} from "lucide-react";

interface RoleOption {
  role: UserRole;
  label: string;
  badge: string;
  icon: React.ElementType;
}

const ROLE_OPTIONS: RoleOption[] = [
  { role: "super_admin", label: "Super Admin", badge: "Platform Owner", icon: Shield },
  { role: "hotel_admin", label: "Hotel Admin", badge: "Chain Owner", icon: Building },
  { role: "area_manager", label: "Area Manager", badge: "Regional", icon: MapPin },
  { role: "hotel_manager", label: "Operations (PMS)", badge: "Front Desk & Ops", icon: ConciergeBell },
  { role: "customer", label: "Customer Portal", badge: "Guest Booking", icon: UserCheck },
  { role: "ai_receptionist", label: "AI Receptionist", badge: "AI Console", icon: Bot },
];

export function UserMenu() {
  const { user, logout, switchRole, apiMode, toggleApiMode } = useAuth();
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
        <div className="absolute right-0 mt-2 w-72 bg-white border border-[#E5E7EB] rounded-lg shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100 font-sans">
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

          {/* Backend API Mode Switcher */}
          <div className="px-4 py-2.5 border-b border-[#F3F4F6] bg-[#FAFAFA]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {apiMode === "live" ? (
                  <Server className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Database className="w-4 h-4 text-amber-500" />
                )}
                <div>
                  <div className="text-[11px] font-bold text-[#374151]">
                    {apiMode === "live" ? "Backend API (Live)" : "Mock Data Mode"}
                  </div>
                  <div className="text-[10px] text-[#9CA3AF]">
                    {apiMode === "live" ? "http://localhost:5000/api" : "Client-side fallback"}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleApiMode}
                className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors ${
                  apiMode === "live"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                    : "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100"
                }`}
              >
                {apiMode === "live" ? "LIVE" : "MOCK"}
              </button>
            </div>
          </div>

          {/* Quick Role Switcher for Developer Testing */}
          <div className="py-2 border-b border-[#F3F4F6]">
            <div className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
              Switch Panel / Role
            </div>
            <div className="space-y-0.5 px-1.5 mt-1">
              {ROLE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isCurrent = user?.role === opt.role;
                return (
                  <button
                    key={opt.role}
                    type="button"
                    onClick={() => {
                      switchRole(opt.role);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-[12px] font-medium transition-colors text-left ${
                      isCurrent
                        ? "bg-[#FFF5F5] text-[#E63946] font-semibold"
                        : "text-[#374151] hover:bg-[#F3F4F6] hover:text-[#111827]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`w-3.5 h-3.5 ${isCurrent ? "text-[#E63946]" : "text-[#9CA3AF]"}`} />
                      <span>{opt.label}</span>
                    </div>
                    {isCurrent && <Check className="w-3.5 h-3.5 text-[#E63946]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Logout Action */}
          <div className="pt-1.5 px-1.5">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded text-[12px] font-medium text-red-600 hover:bg-red-50 transition-colors"
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
