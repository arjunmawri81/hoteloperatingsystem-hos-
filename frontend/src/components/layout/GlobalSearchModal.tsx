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

interface SearchResult {
  id: string;
  category: "Navigation" | "Guests" | "Rooms" | "Operations" | "Actions";
  title: string;
  subtitle: string;
  href: string;
  icon: React.ElementType;
}

const SEARCH_ITEMS: SearchResult[] = [
  // Navigation & Core Modules
  { id: "nav-1", category: "Navigation", title: "Front Desk (Arrivals & Departures)", subtitle: "Hotel Operations · Guest Check-in & Checkout", href: "/operations/front-desk", icon: BedDouble },
  { id: "nav-2", category: "Navigation", title: "Reservations Registry", subtitle: "Hotel Operations · Live Bookings Registry", href: "/operations/reservations", icon: BedDouble },
  { id: "nav-3", category: "Navigation", title: "Interactive Room Map", subtitle: "Hotel Operations · 24-Room Floorplan & Status", href: "/operations/room-map", icon: BedDouble },
  { id: "nav-4", category: "Navigation", title: "Housekeeping Board", subtitle: "Hotel Operations · Turnover Kanban", href: "/operations/housekeeping", icon: Sparkles },
  { id: "nav-5", category: "Navigation", title: "Restaurant POS & Dining", subtitle: "Hotel Operations · Table Orders & Kitchen", href: "/operations/restaurant-pos", icon: Utensils },
  { id: "nav-6", category: "Navigation", title: "Guest CRM & History", subtitle: "Hotel Operations · VIP Preferences & Profiles (Sec 15)", href: "/operations/guests", icon: Users },
  { id: "nav-7", category: "Navigation", title: "Inventory & Stock Management", subtitle: "Hotel Operations · Stock Ledger & SKU Alerts (Sec 19)", href: "/operations/inventory", icon: Package },
  { id: "nav-8", category: "Navigation", title: "Billing & Invoices", subtitle: "Hotel Operations · Guest Folios & Reconciliation", href: "/operations/billing", icon: Receipt },
  { id: "nav-9", category: "Navigation", title: "Area Management", subtitle: "Hotel Admin · Regional Clusters & Managers (Sec 3)", href: "/hotel-admin/areas", icon: MapPin },
  { id: "nav-10", category: "Navigation", title: "Staff & Role Assignment", subtitle: "Hotel Admin · Personnel & Department RBAC (Sec 6)", href: "/hotel-admin/staff", icon: UserCheck },
  { id: "nav-11", category: "Navigation", title: "Hotel Properties Portfolio", subtitle: "Hotel Admin · Property Capacities & Managers", href: "/hotel-admin/hotels", icon: Building },
  { id: "nav-12", category: "Navigation", title: "Super Admin Organizations", subtitle: "Super Admin · Multi-tenant SaaS Management", href: "/super-admin/organizations", icon: Building },
  { id: "nav-13", category: "Navigation", title: "AI Lead Pipeline & Calling", subtitle: "AI Receptionist · Lead Capture & Voice Summaries (Sec 24)", href: "/ai-receptionist/leads", icon: PhoneCall },
  { id: "nav-14", category: "Navigation", title: "AI Receptionist Console", subtitle: "AI Receptionist · 24/7 Live Guest Chat", href: "/ai-receptionist", icon: Bot },
  { id: "nav-15", category: "Navigation", title: "Customer Portal & Booking", subtitle: "Customer · Direct Hotel Discovery & Booking", href: "/customer", icon: Users },

  // Rooms
  { id: "rm-1", category: "Rooms", title: "Room 101", subtitle: "Floor 1 · Standard Room", href: "/operations/room-map", icon: BedDouble },
  { id: "rm-2", category: "Rooms", title: "Room 204", subtitle: "Floor 2 · Deluxe King", href: "/operations/room-map", icon: BedDouble },
  { id: "rm-3", category: "Rooms", title: "Room 305", subtitle: "Floor 3 · Deluxe King", href: "/operations/room-map", icon: BedDouble },
  { id: "rm-4", category: "Rooms", title: "Room 401", subtitle: "Floor 4 · Presidential Suite", href: "/operations/room-map", icon: BedDouble },

  // Actions
  { id: "act-1", category: "Actions", title: "Direct Room Booking Engine", subtitle: "Customer direct booking with instant confirmation", href: "/customer/booking", icon: ArrowRight },
  { id: "act-2", category: "Actions", title: "Capture New Sales Lead", subtitle: "Record inbound customer enquiry into sales pipeline", href: "/ai-receptionist/leads", icon: PhoneCall },
  { id: "act-3", category: "Actions", title: "Create New Reservation", subtitle: "Front desk manual booking entry", href: "/operations/reservations", icon: BedDouble },
  { id: "act-4", category: "Actions", title: "Generate Guest Invoice", subtitle: "Create folio and bill guest", href: "/operations/billing", icon: Receipt },
];

export function GlobalSearchModal() {
  const router = useRouter();
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

  const filtered = SEARCH_ITEMS.filter(
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
              <span>HOS Master Architecture Index</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
