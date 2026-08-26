"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bell } from "lucide-react";
import { UserMenu } from "@/components/layout/UserMenu";

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
    { name: "Billing", href: "/operations/billing" },
  ];

  const getCurrentTitle = () => {
    if (pathname.includes("/front-desk")) return "Front Desk";
    if (pathname.includes("/reservations")) return "Reservations";
    if (pathname.includes("/room-map")) return "Room Map";
    if (pathname.includes("/housekeeping")) return "Housekeeping";
    if (pathname.includes("/restaurant-pos")) return "Restaurant POS";
    if (pathname.includes("/billing")) return "Billing";
    return "Property Dashboard";
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111827] flex font-sans antialiased selection:bg-red-500 selection:text-white">
      {/* Left Sidebar */}
      <aside className="w-64 bg-white border-r border-[#E5E7EB] flex flex-col justify-between shrink-0 min-h-screen">
        <div>
          {/* Sidebar Top Title */}
          <div className="px-7 pt-7 pb-6">
            <h2 className="text-[13px] font-bold tracking-wider text-[#111827] uppercase">
              Hotel Operations
            </h2>
          </div>

          {/* Navigation Menu */}
          <nav className="px-4 space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/operations"
                  ? pathname === "/operations"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-3 py-2 text-[14px] font-medium rounded-md transition-colors ${
                    isActive
                      ? "text-[#111827] font-semibold"
                      : "text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6]"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="px-7 py-6 border-t border-[#E5E7EB]">
          <div className="text-[13px] font-medium text-[#111827]">
            Meridian Hotels & Resorts
          </div>
          <div className="text-[12px] text-[#9CA3AF] mt-0.5">
            Hotel Operating System
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-[#E5E7EB] px-8 flex items-center justify-between shrink-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[13px] text-[#4B5563]">
            <span>Hotel Operations</span>
            <span className="text-[#9CA3AF]">&gt;</span>
            <span className="font-semibold text-[#111827]">{getCurrentTitle()}</span>
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center gap-6">
            <button className="flex items-center gap-1.5 text-[13px] text-[#6B7280] hover:text-[#111827] transition-colors">
              <Search className="w-4 h-4 text-[#6B7280]" />
              <span>Search</span>
            </button>

            <button className="text-[#6B7280] hover:text-[#111827] transition-colors relative">
              <Bell className="w-4 h-4" />
            </button>

            <UserMenu />
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-8 lg:p-10 max-w-7xl w-full">{children}</main>
      </div>
    </div>
  );
}
