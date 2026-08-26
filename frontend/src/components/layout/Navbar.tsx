"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Hotel,
  ShieldAlert,
  Building2,
  MapPin,
  ConciergeBell,
  Sparkles,
  UserCheck,
  Home,
  Layers,
  ChevronRight,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { name: "HOS Hub", href: "/", icon: Home },
    { name: "Super Admin", href: "/super-admin", icon: ShieldAlert, badge: "SaaS" },
    { name: "Hotel Admin", href: "/hotel-admin", icon: Building2, badge: "Owner" },
    { name: "Area Manager", href: "/area-manager", icon: MapPin, badge: "Regional" },
    { name: "Operations", href: "/operations", icon: ConciergeBell, badge: "Staff PMS" },
    { name: "Guest Booking", href: "/customer", icon: UserCheck, badge: "Web" },
    { name: "AI Receptionist", href: "/ai-receptionist", icon: Sparkles, badge: "Live AI" },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/85 border-b border-slate-800/80 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-indigo-600 to-violet-500 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Hotel className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-amber-200 via-white to-slate-200 bg-clip-text text-transparent">
                  HOS
                </span>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Multi-Tenant
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide">
                Hotel Operating System
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-indigo-400" : "text-slate-400"}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Quick Info / Live Status */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>System Online</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-300">
              AG
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
