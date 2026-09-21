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
  ConciergeBell,
  CalendarDays,
  BedDouble,
  Sparkles,
  UtensilsCrossed,
  ChefHat,
  Wine,
  Globe,
  Users,
  TrendingUp,
  BarChart3,
  Package,
  Receipt,
  Banknote,
  Building2,
} from "lucide-react";

export default function OperationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuth();

  const userRole = user?.role || "receptionist";

  const allNavItems: {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    allowedRoles?: string[];
  }[] = [
    { name: "Dashboard", href: "/operations", icon: LayoutDashboard, allowedRoles: ["super_admin", "hotel_admin", "hotel_manager"] },
    { name: "Front Desk", href: "/operations/front-desk", icon: ConciergeBell, allowedRoles: ["super_admin", "hotel_admin", "hotel_manager", "receptionist"] },
    { name: "Reservations", href: "/operations/reservations", icon: CalendarDays, allowedRoles: ["super_admin", "hotel_admin", "hotel_manager", "receptionist", "banquet_staff", "channel_manager"] },
    { name: "Room Map", href: "/operations/room-map", icon: BedDouble, allowedRoles: ["super_admin", "hotel_admin", "hotel_manager", "receptionist", "housekeeping"] },
    { name: "Housekeeping", href: "/operations/housekeeping", icon: Sparkles, allowedRoles: ["super_admin", "hotel_admin", "hotel_manager", "housekeeping"] },
    { name: "Restaurant POS", href: "/operations/restaurant-pos", icon: UtensilsCrossed, allowedRoles: ["super_admin", "hotel_admin", "hotel_manager", "restaurant_staff"] },
    { name: "Kitchen KDS", href: "/operations/kitchen-kds", icon: ChefHat, allowedRoles: ["super_admin", "hotel_admin", "hotel_manager", "restaurant_staff", "kitchen_staff"] },
    { name: "Banquet & Events", href: "/operations/banquet", icon: Wine, allowedRoles: ["super_admin", "hotel_admin", "hotel_manager", "banquet_staff"] },
    { name: "Channel Manager", href: "/operations/channel-manager", icon: Globe, allowedRoles: ["super_admin", "hotel_admin", "hotel_manager", "channel_manager"] },
    { name: "Guest CRM", href: "/operations/guests", icon: Users, allowedRoles: ["super_admin", "hotel_admin", "hotel_manager", "receptionist", "banquet_staff"] },
    { name: "Sales & Leads", href: "/operations/leads", icon: TrendingUp, allowedRoles: ["super_admin", "hotel_admin", "hotel_manager", "receptionist"] },
    { name: "Reports & KPIs", href: "/operations/reports", icon: BarChart3, allowedRoles: ["super_admin", "hotel_admin", "hotel_manager", "finance"] },
    { name: "Inventory", href: "/operations/inventory", icon: Package, allowedRoles: ["super_admin", "hotel_admin", "hotel_manager", "inventory_staff"] },
    { name: "Billing & Folios", href: "/operations/billing", icon: Receipt, allowedRoles: ["super_admin", "hotel_admin", "hotel_manager", "finance", "receptionist"] },
    { name: "Cash Counter", href: "/operations/cash-counter", icon: Banknote, allowedRoles: ["super_admin", "hotel_admin", "hotel_manager", "finance", "receptionist"] },
  ];

  const visibleNavItems = allNavItems.filter((item) => {
    if (userRole === "super_admin" || userRole === "hotel_admin" || userRole === "hotel_manager") return true;
    if (!item.allowedRoles) return true;
    return item.allowedRoles.includes(userRole);
  });

  const isAuthorizedPage =
    userRole === "super_admin" || userRole === "hotel_admin" || userRole === "hotel_manager"
      ? true
      : visibleNavItems.some(
        (item) => pathname === item.href || (item.href !== "/operations" && pathname.startsWith(item.href))
      );

  const getCurrentTitle = () => {
    if (pathname.includes("/front-desk")) return "Front Desk";
    if (pathname.includes("/reservations")) return "Reservations";
    if (pathname.includes("/room-map")) return "Room Map";
    if (pathname.includes("/housekeeping")) return "Housekeeping & Facilities";
    if (pathname.includes("/restaurant-pos")) return "Restaurant POS & KOT";
    if (pathname.includes("/kitchen-kds")) return "Kitchen Display System (KDS)";
    if (pathname.includes("/banquet")) return "Banquet & Event Management";
    if (pathname.includes("/channel-manager")) return "Channel Manager & Inventory";
    if (pathname.includes("/reports")) return "Executive Reports & Analytics";
    if (pathname.includes("/guests")) return "Guest CRM & Complaints";
    if (pathname.includes("/leads")) return "Sales & Leads (CRM)";
    if (pathname.includes("/inventory")) return "Inventory & Procurement";
    if (pathname.includes("/billing")) return "Billing & Folios";
    if (pathname.includes("/cash-counter")) return "Cash Counter & Shift Closing";
    return "Property Dashboard";
  };

  const getDepartmentDeskLabel = () => {
    switch (userRole) {
      case "banquet_staff":
        return "Banquet & Events Desk";
      case "inventory_staff":
        return "Inventory & Stores Desk";
      case "channel_manager":
        return "Channel & OTA Desk";
      case "finance":
        return "Finance & Cash Desk";
      case "kitchen_staff":
        return "Kitchen Display (KDS)";
      case "restaurant_staff":
        return "Restaurant POS Desk";
      case "housekeeping":
        return "Housekeeping Desk";
      case "receptionist":
        return "Front Desk Operations";
      default:
        return "Hotel Operations PMS";
    }
  };

  return (
    <RoleGuard
      allowedRoles={[
        "super_admin",
        "hotel_admin",
        "hotel_manager",
        "receptionist",
        "housekeeping",
        "restaurant_staff",
        "kitchen_staff",
        "finance",
        "inventory_staff",
        "banquet_staff",
        "channel_manager",
      ]}
      moduleName="Hotel Operations PMS"
    >
      <div className="h-screen bg-[#F8FAFC] text-[#0F172A] flex font-sans antialiased overflow-hidden">
        {/* Modern Sleek Dark Sidebar (Fixed, Non-scrolling with page) */}
        <aside className="w-64 bg-[#0B132B] text-slate-300 flex flex-col justify-between shrink-0 h-screen sticky top-0 border-r border-slate-800/80 shadow-2xl z-30 select-none overflow-hidden">
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
                  {getDepartmentDeskLabel()}
                </p>
              </div>
            </div>

            {/* Navigation Menu with Scrollbar */}
            <nav className="p-3.5 space-y-1 overflow-y-auto flex-1 custom-scrollbar">
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Menu
              </div>
              {visibleNavItems.map((item) => {
                const isActive =
                  item.href === "/operations"
                    ? pathname === "/operations"
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
          <div className="p-3.5 border-t border-slate-800/80 bg-[#080E1E]/60 shrink-0">
            <div className="bg-[#111C33]/80 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-bold text-white truncate">
                  {user?.orgName || user?.hotelName || "LuckNexa Hotel"}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                  <span className="text-[10px] text-slate-400 font-medium">Live Connected</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area (Scrolls independently) */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
          {/* Top Header Bar */}
          <header className="h-14 bg-white border-b border-[#E5E7EB] px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-[13px] text-[#4B5563]">
              <span>Hotel Operations</span>
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

          {/* Page Body */}
          <main className="flex-1 p-6 sm:p-8">
            {!isAuthorizedPage ? (
              <div className="bg-white p-8 rounded-lg border border-[#E5E7EB] text-center max-w-lg mx-auto mt-12 space-y-4 shadow-xs">
                <div className="w-12 h-12 bg-red-50 text-[#EC3013] rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                  🔒
                </div>
                <h3 className="text-[18px] font-bold text-[#111827]">Access Restricted</h3>
                <p className="text-[13px] text-[#6B7280]">
                  Your role ({userRole}) does not have permission to access this module. Please contact your Hotel Administrator if you require access.
                </p>
                <div className="pt-2">
                  <Link
                    href={visibleNavItems[0]?.href || "/operations/front-desk"}
                    className="inline-block px-4 py-2 bg-[#EC3013] text-white text-[13px] font-bold rounded hover:bg-[#D62839] transition-colors"
                  >
                    Go to Your Workspace
                  </Link>
                </div>
              </div>
            ) : (
              children
            )}
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
