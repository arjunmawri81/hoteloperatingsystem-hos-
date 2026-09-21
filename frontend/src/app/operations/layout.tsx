"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserMenu } from "@/components/layout/UserMenu";
import { GlobalSearchModal } from "@/components/layout/GlobalSearchModal";
import { NotificationPopover } from "@/components/layout/NotificationPopover";

import { RoleGuard } from "@/components/layout/RoleGuard";

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
    allowedRoles?: string[];
  }[] = [
      { name: "Dashboard", href: "/operations", allowedRoles: ["super_admin", "hotel_admin", "hotel_manager"] },
      { name: "Front Desk", href: "/operations/front-desk", allowedRoles: ["super_admin", "hotel_admin", "hotel_manager", "receptionist"] },
      { name: "Reservations", href: "/operations/reservations", allowedRoles: ["super_admin", "hotel_admin", "hotel_manager", "receptionist", "banquet_staff", "channel_manager"] },
      { name: "Room Map", href: "/operations/room-map", allowedRoles: ["super_admin", "hotel_admin", "hotel_manager", "receptionist", "housekeeping"] },
      { name: "Housekeeping", href: "/operations/housekeeping", allowedRoles: ["super_admin", "hotel_admin", "hotel_manager", "housekeeping"] },
      { name: "Restaurant POS", href: "/operations/restaurant-pos", allowedRoles: ["super_admin", "hotel_admin", "hotel_manager", "restaurant_staff"] },
      { name: "Kitchen KDS", href: "/operations/kitchen-kds", allowedRoles: ["super_admin", "hotel_admin", "hotel_manager", "restaurant_staff", "kitchen_staff"] },
      { name: "Banquet & Events", href: "/operations/banquet", allowedRoles: ["super_admin", "hotel_admin", "hotel_manager", "banquet_staff"] },
      { name: "Channel Manager", href: "/operations/channel-manager", allowedRoles: ["super_admin", "hotel_admin", "hotel_manager", "channel_manager"] },
      { name: "Guest CRM", href: "/operations/guests", allowedRoles: ["super_admin", "hotel_admin", "hotel_manager", "receptionist", "banquet_staff"] },
      { name: "Sales & Leads (CRM)", href: "/operations/leads", allowedRoles: ["super_admin", "hotel_admin", "hotel_manager", "receptionist"] },
      { name: "Reports & KPIs", href: "/operations/reports", allowedRoles: ["super_admin", "hotel_admin", "hotel_manager", "finance"] },
      { name: "Inventory", href: "/operations/inventory", allowedRoles: ["super_admin", "hotel_admin", "hotel_manager", "inventory_staff"] },
      { name: "Billing", href: "/operations/billing", allowedRoles: ["super_admin", "hotel_admin", "hotel_manager", "finance", "receptionist"] },
      { name: "Cash Counter", href: "/operations/cash-counter", allowedRoles: ["super_admin", "hotel_admin", "hotel_manager", "finance", "receptionist"] },
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
      <div className="min-h-screen bg-[#FAFAFA] text-[#111827] flex font-sans antialiased selection:bg-red-500 selection:text-white">
        {/* Left Sidebar */}
        <aside className="w-60 bg-white border-r border-[#E5E7EB] flex flex-col justify-between shrink-0 min-h-screen">
          <div>
            {/* Sidebar Top Title */}
            <div className="px-5 py-4 border-b border-[#F3F4F6] flex items-center gap-3">
              <Link
                href="/"
                title="LuckNexa Home"
                className="w-9 h-9 rounded-xl overflow-hidden shrink-0 shadow-sm border border-slate-700/30 bg-[#090D16] flex items-center justify-center p-0.5 hover:scale-105 transition-transform"
              >
                <img
                  src="/lucknexa-icon.png"
                  alt="LuckNexa"
                  className="w-full h-full object-contain"
                />
              </Link>
              <div>
                <h2 className="text-[12px] font-extrabold text-[#111827] uppercase tracking-wider">
                  LuckNexa
                </h2>
                <p className="text-[10px] text-[#6B7280] font-medium">{getDepartmentDeskLabel()}</p>
              </div>
            </div>

            {/* Navigation Menu (Role Filtered) */}
            <nav className="p-3 space-y-1">
              {visibleNavItems.map((item) => {
                const isActive =
                  item.href === "/operations"
                    ? pathname === "/operations"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block px-3 py-2 text-[13px] font-semibold rounded transition-colors ${isActive
                        ? "text-[#111827] bg-[#F3F4F6] border-l-2 border-[#EC3013]"
                        : "text-[#4B5563] hover:text-[#111827] hover:bg-[#F9FAFB]"
                      }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer */}
          <div className="px-6 py-5 border-t border-[#E5E7EB]">
            <div className="text-[12px] font-bold text-[#111827] truncate">
              {user?.orgName || user?.hotelName || "LuckNexa Hotel"}
            </div>
            <div className="text-[11px] text-[#9CA3AF] mt-0.5">
              LuckNexa Operating System
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
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
