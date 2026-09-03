"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserMenu } from "@/components/layout/UserMenu";
import { AppRail } from "@/components/layout/AppRail";
import { GlobalSearchModal } from "@/components/layout/GlobalSearchModal";
import { NotificationPopover } from "@/components/layout/NotificationPopover";

export default function OperationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/operations" },
    { name: "Front Desk", href: "/operations/front-desk" },
    { name: "Reservations", href: "/operations/reservations" },
    { name: "Room Map", href: "/operations/room-map" },
    { name: "Housekeeping", href: "/operations/housekeeping" },
    { name: "Restaurant POS", href: "/operations/restaurant-pos" },
    { name: "Guest CRM", href: "/operations/guests" },
    { name: "Inventory", href: "/operations/inventory" },
    { name: "Billing", href: "/operations/billing" },
  ];

  const getCurrentTitle = () => {
    if (pathname.includes("/front-desk")) return "Front Desk";
    if (pathname.includes("/reservations")) return "Reservations";
    if (pathname.includes("/room-map")) return "Room Map";
    if (pathname.includes("/housekeeping")) return "Housekeeping";
    if (pathname.includes("/restaurant-pos")) return "Restaurant POS";
    if (pathname.includes("/guests")) return "Guest CRM";
    if (pathname.includes("/inventory")) return "Inventory Management";
    if (pathname.includes("/billing")) return "Billing";
    return "Property Dashboard";
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111827] flex font-sans antialiased selection:bg-red-500 selection:text-white">
      {/* 1. Global App Rail */}
      <AppRail />

      {/* 2. Operations Left Sidebar */}
      <aside className="w-60 bg-white border-r border-[#E5E7EB] flex flex-col justify-between shrink-0 min-h-screen">
        <div>
          {/* Sidebar Top Title */}
          <div className="px-6 pt-6 pb-4">
            <h2 className="text-[11px] font-bold tracking-wider text-[#6B7280] uppercase">
              Hotel Operations
            </h2>
          </div>

          {/* Navigation Menu */}
          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/operations"
                  ? pathname === "/operations"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-3 py-2 text-[13px] font-semibold rounded transition-colors ${
                    isActive
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
          <div className="text-[12px] font-bold text-[#111827]">
            Meridian Hotels & Resorts
          </div>
          <div className="text-[11px] text-[#9CA3AF] mt-0.5">
            Hotel Operating System
          </div>
        </div>
      </aside>

      {/* 3. Main Content Area */}
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
          {children}
        </main>
      </div>
    </div>
  );
}
