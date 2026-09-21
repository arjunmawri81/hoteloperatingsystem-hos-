"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserMenu } from "@/components/layout/UserMenu";
import { GlobalSearchModal } from "@/components/layout/GlobalSearchModal";
import { NotificationPopover } from "@/components/layout/NotificationPopover";

import { RoleGuard } from "@/components/layout/RoleGuard";

export default function AreaManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isComparison = pathname.includes("/comparison");

  const currentPageTitle = isComparison ? "Hotel Comparison" : "Area Manager Dashboard";

  return (
    <RoleGuard allowedRoles={["super_admin", "hotel_admin", "area_manager"]} moduleName="Area Manager Panel">
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
                <p className="text-[10px] text-[#6B7280] font-medium">Area Manager Cluster</p>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="p-3 space-y-1">
              <Link
                href="/area-manager"
                className={`block px-3 py-2 text-[13px] font-semibold rounded transition-colors ${
                  !isComparison
                    ? "text-[#111827] bg-[#F3F4F6] border-l-2 border-[#EC3013]"
                    : "text-[#4B5563] hover:text-[#111827] hover:bg-[#F9FAFB]"
                }`}
              >
                Area Dashboard
              </Link>
              <Link
                href="/area-manager/comparison"
                className={`block px-3 py-2 text-[13px] font-semibold rounded transition-colors ${
                  isComparison
                    ? "text-[#111827] bg-[#F3F4F6] border-l-2 border-[#EC3013]"
                    : "text-[#4B5563] hover:text-[#111827] hover:bg-[#F9FAFB]"
                }`}
              >
                Hotel Comparison
              </Link>
            </nav>
          </div>

          {/* Sidebar Footer */}
          <div className="px-6 py-5 border-t border-[#E5E7EB]">
            <div className="text-[12px] font-bold text-[#111827]">
              LuckNexa Regional Group
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
              <span>Area Manager</span>
              <span className="text-[#9CA3AF]">&gt;</span>
              <span className="font-semibold text-[#111827]">{currentPageTitle}</span>
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
