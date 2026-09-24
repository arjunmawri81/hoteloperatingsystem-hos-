"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserMenu } from "@/components/layout/UserMenu";
import { GlobalSearchModal } from "@/components/layout/GlobalSearchModal";
import { NotificationPopover } from "@/components/layout/NotificationPopover";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { LayoutDashboard, Building2, ShieldCheck, PhoneCall } from "lucide-react";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isDashboard = pathname === "/super-admin";
  const isOrganizations = pathname.startsWith("/super-admin/organizations");
  const isLeads = pathname.startsWith("/super-admin/leads");

  const currentPageTitle = isLeads
    ? "Inquiries & Leads"
    : isOrganizations
    ? "Organizations"
    : "Platform Dashboard";

  return (
    <RoleGuard allowedRoles={["super_admin"]} moduleName="Super Admin SaaS Platform">
      <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex font-sans antialiased">
        {/* Modern Sleek Dark Sidebar (Matching Reference Theme - Deep Charcoal with Solid Cyan Active Item) */}
        <aside className="fixed left-0 top-0 bottom-0 w-64 h-screen bg-[#1A1F2C] text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800/80 shadow-2xl z-30 select-none overflow-hidden">
          <div className="flex flex-col flex-1 min-h-0">
            {/* Sidebar Brand Header (Static Display - Not a Link) */}
            <div className="px-5 py-5 border-b border-slate-800/80 flex items-center gap-3 bg-[#141824] shrink-0">
              <div
                className="w-10 h-10 rounded-xl overflow-hidden shrink-0 shadow-md bg-gradient-to-tr from-[#EA580C] to-[#F97316] flex items-center justify-center p-1.5 border border-white/10"
              >
                <img
                  src="/lucknexa-icon.png"
                  alt="LuckNexa"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-[16px] font-black text-white tracking-tight">
                    LuckNexa
                  </h2>
                </div>
                <p className="text-[11px] text-slate-400 font-medium truncate">
                  Super Admin Console
                </p>
              </div>
            </div>

            {/* Navigation Menu with Isolated Internal Scroll */}
            <nav className="p-3.5 space-y-1.5 overflow-y-auto flex-1 custom-scrollbar overscroll-contain">
              <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Main Menu
              </div>

              {/* Dashboard Item */}
              <Link
                href="/super-admin"
                className={`group flex items-center justify-between px-3.5 py-2.5 text-[13px] rounded-lg transition-all duration-150 ${
                  isDashboard
                    ? "bg-[#00A8FF] text-white font-bold shadow-md shadow-cyan-500/30"
                    : "text-slate-300 hover:text-white hover:bg-white/5 font-medium"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <LayoutDashboard
                    className={`w-[18px] h-[18px] shrink-0 ${
                      isDashboard ? "text-white" : "text-slate-400 group-hover:text-white"
                    }`}
                  />
                  <span className="truncate">Dashboard</span>
                </div>
              </Link>

              {/* Organizations & Tenants */}
              <Link
                href="/super-admin/organizations"
                className={`group flex items-center justify-between px-3.5 py-2.5 text-[13px] rounded-lg transition-all duration-150 ${
                  isOrganizations
                    ? "bg-[#00A8FF] text-white font-bold shadow-md shadow-cyan-500/30"
                    : "text-slate-300 hover:text-white hover:bg-white/5 font-medium"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Building2
                    className={`w-[18px] h-[18px] shrink-0 ${
                      isOrganizations ? "text-white" : "text-slate-400 group-hover:text-white"
                    }`}
                  />
                  <span className="truncate">Organizations</span>
                </div>
              </Link>

              {/* Inquiries & Leads */}
              <Link
                href="/super-admin/leads"
                className={`group flex items-center justify-between px-3.5 py-2.5 text-[13px] rounded-lg transition-all duration-150 ${
                  isLeads
                    ? "bg-[#00A8FF] text-white font-bold shadow-md shadow-cyan-500/30"
                    : "text-slate-300 hover:text-white hover:bg-white/5 font-medium"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <PhoneCall
                    className={`w-[18px] h-[18px] shrink-0 ${
                      isLeads ? "text-white" : "text-slate-400 group-hover:text-white"
                    }`}
                  />
                  <span className="truncate">Leads &amp; Inquiries</span>
                </div>
              </Link>
            </nav>
          </div>

          {/* Sidebar Footer Card */}
          <div className="p-3.5 border-t border-slate-800/80 bg-[#141824] shrink-0">
            <div className="bg-[#1E2433] border border-slate-700/60 rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#00A8FF]/15 border border-[#00A8FF]/30 flex items-center justify-center text-[#00A8FF] shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-bold text-white truncate">
                  LuckNexa Core
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                  <span className="text-[10px] text-slate-400 font-medium">Super Admin Live</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area (Offset by ml-64 for fixed sidebar) */}
        <div className="flex-1 flex flex-col min-w-0 ml-64 min-h-screen">
          {/* Top Header Bar */}
          <header className="h-14 bg-white border-b border-[#E5E7EB] px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-[13px] text-[#4B5563]">
              <span>Super Admin</span>
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
