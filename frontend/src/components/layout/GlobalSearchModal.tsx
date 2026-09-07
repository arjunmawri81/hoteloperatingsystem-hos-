"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  BedDouble,
  Users,
  Building,
  Utensils,
  Receipt,
  Bot,
  ArrowRight,
  Sparkles,
  MapPin,
  Package,
  PhoneCall,
  UserCheck,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types";

interface SearchResult {
  id: string;
  category: "Navigation" | "Operations" | "Customer" | "Admin";
  title: string;
  subtitle: string;
  href: string;
  icon: React.ElementType;
  allowedRoles?: UserRole[];
}

const SEARCH_ITEMS: SearchResult[] = [
  // Super Admin
  { id: "sa-1", category: "Admin", title: "Super Admin Dashboard", subtitle: "Multi-tenant overview & platform statistics", href: "/super-admin", icon: Building, allowedRoles: ["super_admin"] },
  { id: "sa-2", category: "Admin", title: "Organizations", subtitle: "Manage hotel chains and SaaS tenant organizations", href: "/super-admin/organizations", icon: Building, allowedRoles: ["super_admin"] },

  // Hotel Admin
  { id: "ha-1", category: "Admin", title: "Hotel Admin Dashboard", subtitle: "Chain portfolio metrics & revenue overview", href: "/hotel-admin", icon: Building, allowedRoles: ["super_admin", "hotel_admin"] },
  { id: "ha-2", category: "Admin", title: "Hotel Properties Portfolio", subtitle: "Manage hotels, locations and property managers", href: "/hotel-admin/hotels", icon: Building, allowedRoles: ["super_admin", "hotel_admin", "area_manager"] },
  { id: "ha-3", category: "Admin", title: "Room Setup & Inventory", subtitle: "Configure room units, floor plans and base rates", href: "/hotel-admin/rooms", icon: BedDouble, allowedRoles: ["super_admin", "hotel_admin"] },
  { id: "ha-4", category: "Admin", title: "Billing & Revenue Ledger", subtitle: "Organization revenue transactions, settlement & overdue tracking", href: "/hotel-admin/billing", icon: Receipt, allowedRoles: ["super_admin", "hotel_admin"] },
  { id: "ha-5", category: "Admin", title: "Area Management", subtitle: "Regional clusters, area managers & territory oversight", href: "/hotel-admin/areas", icon: MapPin, allowedRoles: ["super_admin", "hotel_admin", "area_manager"] },
  { id: "ha-6", category: "Admin", title: "Staff & Role Assignment", subtitle: "Personnel accounts, roles & department permissions", href: "/hotel-admin/staff", icon: UserCheck, allowedRoles: ["super_admin", "hotel_admin"] },

  // Area Manager
  { id: "am-1", category: "Admin", title: "Area Manager Dashboard", subtitle: "Regional cluster performance and property oversight", href: "/area-manager", icon: MapPin, allowedRoles: ["super_admin", "hotel_admin", "area_manager"] },
  { id: "am-2", category: "Admin", title: "Hotel Comparison", subtitle: "Compare revenue, occupancy and ADR across regional properties", href: "/area-manager/comparison", icon: MapPin, allowedRoles: ["super_admin", "hotel_admin", "area_manager"] },

  // Hotel Operations (PMS)
  { id: "ops-1", category: "Operations", title: "Operations Dashboard", subtitle: "Property occupancy, arrivals today & turnover summary", href: "/operations", icon: BedDouble, allowedRoles: ["super_admin", "hotel_admin", "hotel_manager", "receptionist", "finance"] },
  { id: "ops-2", category: "Operations", title: "Front Desk Check-In & Departures", subtitle: "Guest check-in, checkout & arrivals pipeline", href: "/operations/front-desk", icon: BedDouble, allowedRoles: ["super_admin", "hotel_admin", "hotel_manager", "receptionist"] },
  { id: "ops-3", category: "Operations", title: "Reservations Registry", subtitle: "Search, create and manage property bookings", href: "/operations/reservations", icon: BedDouble, allowedRoles: ["super_admin", "hotel_admin", "hotel_manager", "receptionist", "finance"] },
  { id: "ops-4", category: "Operations", title: "Interactive Room Map", subtitle: "Visual room floorplan and real-time room status", href: "/operations/room-map", icon: BedDouble, allowedRoles: ["super_admin", "hotel_admin", "hotel_manager", "receptionist", "housekeeping"] },
  { id: "ops-5", category: "Operations", title: "Housekeeping Board", subtitle: "Cleaning queues, turnover kanban & room inspection", href: "/operations/housekeeping", icon: Sparkles, allowedRoles: ["super_admin", "hotel_admin", "hotel_manager", "housekeeping", "receptionist"] },
  { id: "ops-6", category: "Operations", title: "Restaurant POS & Dining", subtitle: "Dining floor tables, kitchen order queue & room charges", href: "/operations/restaurant-pos", icon: Utensils, allowedRoles: ["super_admin", "hotel_admin", "hotel_manager", "restaurant_staff"] },
  { id: "ops-7", category: "Operations", title: "Guest CRM & History", subtitle: "Guest profiles, stay history, and VIP preferences", href: "/operations/guests", icon: Users, allowedRoles: ["super_admin", "hotel_admin", "hotel_manager", "receptionist"] },
  { id: "ops-8", category: "Operations", title: "Inventory & Stock Management", subtitle: "Consumables, linen par levels, stock audits & supplier tracking", href: "/operations/inventory", icon: Package, allowedRoles: ["super_admin", "hotel_admin", "hotel_manager", "housekeeping", "restaurant_staff"] },
  { id: "ops-9", category: "Operations", title: "Front Desk Invoicing & Billing", subtitle: "Issue guest folios, record receipts and settle payments", href: "/operations/billing", icon: Receipt, allowedRoles: ["super_admin", "hotel_admin", "hotel_manager", "finance", "receptionist"] },

  // AI Receptionist
  { id: "ai-1", category: "Navigation", title: "AI Receptionist Console", subtitle: "Autonomous 24/7 guest chat and inquiry handling", href: "/ai-receptionist", icon: Bot, allowedRoles: ["super_admin", "hotel_admin", "ai_receptionist", "hotel_manager", "receptionist"] },
  { id: "ai-2", category: "Navigation", title: "AI Knowledge Base", subtitle: "Property policies, amenities data & training questions", href: "/ai-receptionist/knowledge-base", icon: Bot, allowedRoles: ["super_admin", "hotel_admin", "ai_receptionist", "hotel_manager", "receptionist"] },
  { id: "ai-3", category: "Navigation", title: "AI Lead Pipeline", subtitle: "Inbound guest inquiries, call summaries & sales stages", href: "/ai-receptionist/leads", icon: PhoneCall, allowedRoles: ["super_admin", "hotel_admin", "ai_receptionist", "hotel_manager", "receptionist"] },

  // Customer Portal
  { id: "cust-1", category: "Customer", title: "Hotel Discovery", subtitle: "Explore available hotel properties and destinations", href: "/customer", icon: Building },
  { id: "cust-2", category: "Customer", title: "Direct Room Booking", subtitle: "Direct booking engine with instant room confirmation", href: "/customer/booking", icon: ArrowRight },
  { id: "cust-3", category: "Customer", title: "My Bookings", subtitle: "View active reservations and guest stay receipts", href: "/customer/my-bookings", icon: Users },
];

export function GlobalSearchModal() {
  const router = useRouter();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Toggle on Ctrl+K / Cmd+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  const userRole = user?.role || "customer";

  const visibleItems = SEARCH_ITEMS.filter((item) => {
    if (userRole === "super_admin") return true;
    if (!item.allowedRoles) return true;
    return item.allowedRoles.includes(userRole);
  });

  const filtered = visibleItems.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  return (
    <>
      {/* Trigger in Header */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[13px] text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors border border-transparent hover:border-[#E5E7EB] cursor-pointer group"
      >
        <Search className="w-4 h-4 text-[#6B7280] group-hover:text-[#111827]" />
        <span className="hidden sm:inline font-medium">Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono text-[#9CA3AF] bg-[#F3F4F6] border border-[#E5E7EB] px-1.5 py-0.5 rounded">
          ⌘K
        </kbd>
      </button>

      {/* Search Modal Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-16 p-4 backdrop-blur-xs animate-in fade-in duration-150 font-sans">
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[80vh]">
            {/* Search Input Box */}
            <div className="p-4 border-b border-[#E5E7EB] flex items-center gap-3 bg-white">
              <Search className="w-5 h-5 text-[#9CA3AF] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search rooms, guests, leads, inventory, reservations, dining, or pages..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full text-[14px] text-[#111827] placeholder-[#9CA3AF] focus:outline-none bg-transparent"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-[#9CA3AF] hover:text-[#111827]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-[11px] font-bold text-[#6B7280] bg-[#F3F4F6] hover:bg-[#E5E7EB] px-2 py-1 rounded"
              >
                ESC
              </button>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto p-2 divide-y divide-[#F3F4F6]">
              {filtered.length === 0 ? (
                <div className="py-12 text-center text-[#9CA3AF] text-[13px]">
                  No results found for &ldquo;<span className="font-semibold text-[#111827]">{query}</span>&rdquo;
                </div>
              ) : (
                filtered.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item.href)}
                      className="p-3 rounded-lg hover:bg-[#F9FAFB] cursor-pointer transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-[#F3F4F6] group-hover:bg-red-50 text-[#6B7280] group-hover:text-[#EC3013] flex items-center justify-center transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-[13px] font-bold text-[#111827] group-hover:text-[#EC3013] transition-colors">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-[#6B7280]">
                            {item.subtitle}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] bg-[#F3F4F6] px-2 py-0.5 rounded">
                          {item.category}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#EC3013] transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between text-[11px] text-[#6B7280]">
              <span>Navigate with click or arrow keys</span>
              <span>LuckNexa Master Architecture Index</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
