"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  Building2,
  Map,
  LayoutDashboard,
  Globe,
  MessageSquare,
} from "lucide-react";

interface AppRailItem {
  name: string;
  shortLabel: string;
  href: string;
  icon: React.ElementType;
  match: (path: string) => boolean;
}

const RAIL_ITEMS: AppRailItem[] = [
  {
    name: "Super Admin",
    shortLabel: "Super",
    href: "/super-admin",
    icon: Shield,
    match: (path) => path.startsWith("/super-admin"),
  },
  {
    name: "Hotel Admin",
    shortLabel: "Hotel",
    href: "/hotel-admin",
    icon: Building2,
    match: (path) => path.startsWith("/hotel-admin"),
  },
  {
    name: "Area Manager",
    shortLabel: "Area",
    href: "/area-manager",
    icon: Map,
    match: (path) => path.startsWith("/area-manager"),
  },
  {
    name: "Hotel Operations",
    shortLabel: "Operations",
    href: "/operations",
    icon: LayoutDashboard,
    match: (path) => path.startsWith("/operations"),
  },
  {
    name: "Customer Portal",
    shortLabel: "Guest",
    href: "/customer",
    icon: Globe,
    match: (path) => path.startsWith("/customer"),
  },
  {
    name: "AI Receptionist",
    shortLabel: "AI Agent",
    href: "/ai-receptionist",
    icon: MessageSquare,
    match: (path) => path.startsWith("/ai-receptionist"),
  },
];

export function AppRail() {
  const pathname = usePathname();

  return (
    <div className="w-[84px] shrink-0 bg-[#201E1D] flex flex-col items-center py-5 z-30 select-none border-r border-[#33302E]">
      {/* HOS Brand Logo */}
      <Link
        href="/"
        title="HOS Home"
        className="w-10 h-10 bg-[#EC3013] text-white flex items-center justify-center font-black text-sm tracking-tighter mb-5 shadow-md hover:bg-[#D62839] transition-transform active:scale-95"
      >
        HOS
      </Link>

      {/* Portal Switcher Navigation Items */}
      <div className="flex flex-col items-center gap-2 w-full px-1.5">
        {RAIL_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.match(pathname);

          return (
            <Link
              key={item.name}
              href={item.href}
              title={item.name}
              className={`w-[72px] h-[60px] flex flex-col items-center justify-center gap-1.5 rounded-md transition-all group relative px-1 ${
                isActive
                  ? "text-white bg-[#363330] shadow-sm font-semibold"
                  : "text-[#9CA3AF] hover:text-white hover:bg-[#2B2826] font-medium"
              }`}
            >
              <Icon
                className={`w-[22px] h-[22px] transition-transform group-hover:scale-110 ${
                  isActive ? "text-[#EC3013]" : "text-[#D1D5DB]"
                }`}
              />
              <span
                className={`text-[10px] tracking-tight text-center leading-none truncate max-w-[68px] ${
                  isActive ? "text-white font-bold" : "text-[#9CA3AF] group-hover:text-white"
                }`}
              >
                {item.shortLabel}
              </span>

              {/* Active Indicator Underline */}
              {isActive && (
                <div className="w-5 h-[2px] bg-[#EC3013] rounded-full mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
