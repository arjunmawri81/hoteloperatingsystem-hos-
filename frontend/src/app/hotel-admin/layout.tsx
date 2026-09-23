"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserMenu } from "@/components/layout/UserMenu";
import { GlobalSearchModal } from "@/components/layout/GlobalSearchModal";
import { NotificationPopover } from "@/components/layout/NotificationPopover";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { AIBusinessAssistantModal } from "@/components/ai/AIBusinessAssistantModal";
import {
  LayoutDashboard,
  Building2,
  BedDouble,
  Receipt,
  MapPin,
  Users,
  TrendingUp,
  Sparkles,
  Mic,
} from "lucide-react";

export default function HotelAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);

  const navItems = [
    { name: "Dashboard", href: "/hotel-admin", icon: LayoutDashboard },
    { name: "Hotels & Properties", href: "/hotel-admin/hotels", icon: Building2 },
    { name: "Room Map & Units", href: "/hotel-admin/rooms", icon: BedDouble },
    { name: "Billing & Transactions", href: "/hotel-admin/billing", icon: Receipt },
    { name: "Area Management", href: "/hotel-admin/areas", icon: MapPin },
    { name: "Staff & Roles", href: "/hotel-admin/staff", icon: Users },
    { name: "Chain Leads & Pipeline", href: "/hotel-admin/leads", icon: TrendingUp },
  ];

  const getCurrentTitle = () => {
    if (pathname.includes("/hotels")) return "Hotel Properties";
    if (pathname.includes("/rooms")) return "Room Map & Unit Management";
    if (pathname.includes("/billing")) return "Billing & Transactions";
    if (pathname.includes("/areas")) return "Area Management";
    if (pathname.includes("/staff")) return "Staff & Roles";
    if (pathname.includes("/leads")) return "Chain Leads & Sales Performance";
    return "Hotel Admin Dashboard";
  };

  return (
    <RoleGuard allowedRoles={["super_admin", "hotel_admin"]} moduleName="Hotel Admin Panel">
      <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex font-sans antialiased">
        {/* Modern Sleek Dark Sidebar (Fixed to Viewport - Never scrolls with page) */}
        <aside className="fixed left-0 top-0 bottom-0 w-64 h-screen bg-[#0B132B] text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800/80 shadow-2xl z-30 select-none overflow-hidden">
          <div className="flex flex-col flex-1 min-h-0">
            {/* Sidebar Brand Header */}
            <div className="px-5 py-5 border-b border-slate-800/60 flex items-center gap-3.5 bg-[#080E1E]/50 shrink-0">
              <Link
                href="/"
                title="LuckNexa Home"
                className="w-10 h-10 rounded-xl overflow-hidden shrink-0 shadow-md border border-cyan-500/20 bg-gradient-to-br from-[#0e1e38] to-[#0a1020] flex items-center justify-center p-1 hover:scale-105 transition-all group"
              >
                <img
                  src="/lucknexa-icon.png"
                  alt="LuckNexa"
                  className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-[15px] font-black text-white tracking-tight uppercase">
                    LuckNexa
                  </h2>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                </div>
                <p className="text-[11px] text-slate-400 font-medium truncate">
                  Hotel Admin &amp; Chain
                </p>
              </div>
            </div>

            {/* Navigation Menu with Isolated Internal Scroll */}
            <nav className="p-3.5 space-y-1.5 overflow-y-auto flex-1 custom-scrollbar overscroll-contain">
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Menu
              </div>
              {navItems.map((item) => {
                const isActive =
                  item.href === "/hotel-admin"
                    ? pathname === "/hotel-admin"
                    : pathname.startsWith(item.href);

                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center justify-between px-3.5 py-2.5 text-[13px] font-medium rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-[#16233B] text-white font-semibold shadow-inner border border-cyan-500/20 relative"
                        : "text-slate-400 hover:text-slate-100 hover:bg-[#111C33]/70"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                          isActive
                            ? "text-cyan-400 drop-shadow-[0_0_6px_rgba(56,189,248,0.5)]"
                            : "text-slate-400 group-hover:text-slate-200"
                        }`}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>

                    {isActive && (
                      <span className="w-1.5 h-4 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer AI Briefing Trigger Card */}
          <div className="p-3.5 border-t border-slate-800/80 bg-[#080E1E]/60 shrink-0 space-y-2">
            <button
              onClick={() => setIsAssistantOpen(true)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-cyan-950/60 to-blue-950/60 hover:from-cyan-900/80 hover:to-blue-900/80 border border-cyan-500/30 text-slate-200 hover:text-white transition-all shadow-md group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="text-left min-w-0">
                  <div className="text-[11px] font-bold text-cyan-300 truncate">AI Business Briefing</div>
                  <div className="text-[9px] text-slate-400">10-15 Min Voice Report</div>
                </div>
              </div>
              <span className="text-[10px] font-black text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">LIVE</span>
            </button>

            <div className="bg-[#111C33]/80 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold text-white truncate">
                  {user?.orgName || "LuckNexa Hotel Group"}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                  <span className="text-[9px] text-slate-400 font-medium">Headquarters</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 ml-64 min-h-screen">
          {/* Top Header Bar */}
          <header className="h-14 bg-white border-b border-[#E5E7EB] px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-[13px] text-[#4B5563]">
              <span>Hotel Admin</span>
              <span className="text-[#9CA3AF]">&gt;</span>
              <span className="font-semibold text-[#111827]">{getCurrentTitle()}</span>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-3">
              {/* Prominent Glowing AI Assistant Button */}
              <button
                onClick={() => setIsAssistantOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#0F172A] to-[#1E293B] hover:from-[#0B132B] hover:to-[#16233B] text-cyan-300 font-bold text-xs border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)] hover:shadow-[0_0_18px_rgba(6,182,212,0.35)] transition-all hover:scale-105 active:scale-95"
              >
                <div className="w-5 h-5 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <Mic className="w-3 h-3 text-cyan-400 animate-pulse" />
                </div>
                <span>AI Voice Assistant</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-cyan-400 text-slate-950">
                  BRIEFING
                </span>
              </button>

              <GlobalSearchModal />
              <NotificationPopover />
              <div className="h-4 w-[1px] bg-[#E5E7EB]" />
              <UserMenu />
            </div>
          </header>

          {/* Page Content Body */}
          <main className="flex-1 p-6 sm:p-8">{children}</main>
        </div>

        {/* Floating AI Business Assistant Action Button */}
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setIsAssistantOpen(true)}
            className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black shadow-[0_4px_25px_rgba(6,182,212,0.4)] transition-all hover:scale-105 active:scale-95 border border-cyan-300/40 group"
          >
            <div className="w-6 h-6 rounded-xl bg-slate-950/20 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-slate-950 group-hover:rotate-12 transition-transform" />
            </div>
            <span className="text-xs tracking-tight">AI Executive Briefing</span>
          </button>
        </div>

        {/* Executive AI Business Assistant Modal */}
        <AIBusinessAssistantModal
          isOpen={isAssistantOpen}
          onClose={() => setIsAssistantOpen(false)}
        />
      </div>
    </RoleGuard>
  );
}
