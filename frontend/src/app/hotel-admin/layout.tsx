"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserMenu } from "@/components/layout/UserMenu";
import { GlobalSearchModal } from "@/components/layout/GlobalSearchModal";
import { NotificationPopover } from "@/components/layout/NotificationPopover";
import { RoleGuard } from "@/components/layout/RoleGuard";
import {
  LayoutDashboard,
  Building2,
  BedDouble,
  Receipt,
  MapPin,
  Users,
  TrendingUp,
} from "lucide-react";

export default function HotelAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuth();

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
        {/* Modern Sleek Dark Sidebar */}
        <aside className="w-64 bg-[#0B132B] text-slate-300 flex flex-col justify-between shrink-0 min-h-screen border-r border-slate-800/80 shadow-2xl z-30 select-none">
          <div className="flex flex-col flex-1 min-h-0">
            {/* Sidebar Brand Header */}
            <div className="px-5 py-5 border-b border-slate-800/60 flex items-center gap-3.5 bg-[#080E1E]/50">
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

            {/* Navigation Menu */}
            <nav className="p-3.5 space-y-1.5 overflow-y-auto flex-1 custom-scrollbar">
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

          {/* Sidebar Footer Card */}
          <div className="p-3.5 border-t border-slate-800/80 bg-[#080E1E]/60">
            <div className="bg-[#111C33]/80 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-bold text-white truncate">
                  {user?.orgName || "LuckNexa Hotel Group"}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                  <span className="text-[10px] text-slate-400 font-medium">Headquarters</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
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
              <GlobalSearchModal />
              <NotificationPopover />
              <div className="h-4 w-[1px] bg-[#E5E7EB]" />
              <UserMenu />
            </div>
          </header>

          {/* Page Content Body */}
          <main className="flex-1 p-6 sm:p-8">{children}</main>
        </div>
      </div>
    </RoleGuard>
  );
}
