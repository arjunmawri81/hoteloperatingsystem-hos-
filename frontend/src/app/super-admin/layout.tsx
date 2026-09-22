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
                  Super Admin Platform
                </p>
              </div>
            </div>

            {/* Navigation Menu with Isolated Internal Scroll */}
            <nav className="p-3.5 space-y-1.5 overflow-y-auto flex-1 custom-scrollbar overscroll-contain">
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Administration
              </div>
              <Link
                href="/super-admin"
                className={`group flex items-center justify-between px-3.5 py-2.5 text-[13px] font-medium rounded-xl transition-all duration-200 ${
                  isDashboard
                    ? "bg-[#16233B] text-white font-semibold shadow-inner border border-cyan-500/20 relative"
                    : "text-slate-400 hover:text-slate-100 hover:bg-[#111C33]/70"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <LayoutDashboard
                    className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                      isDashboard
                        ? "text-cyan-400 drop-shadow-[0_0_6px_rgba(56,189,248,0.5)]"
                        : "text-slate-400 group-hover:text-slate-200"
                    }`}
                  />
                  <span className="truncate">Platform Dashboard</span>
                </div>
                {isDashboard && (
                  <span className="w-1.5 h-4 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                )}
              </Link>

              <Link
                href="/super-admin/organizations"
                className={`group flex items-center justify-between px-3.5 py-2.5 text-[13px] font-medium rounded-xl transition-all duration-200 ${
                  isOrganizations
                    ? "bg-[#16233B] text-white font-semibold shadow-inner border border-cyan-500/20 relative"
                    : "text-slate-400 hover:text-slate-100 hover:bg-[#111C33]/70"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Building2
                    className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                      isOrganizations
                        ? "text-cyan-400 drop-shadow-[0_0_6px_rgba(56,189,248,0.5)]"
                        : "text-slate-400 group-hover:text-slate-200"
                    }`}
                  />
                  <span className="truncate">Organizations &amp; Tenants</span>
                </div>
                {isOrganizations && (
                  <span className="w-1.5 h-4 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                )}
              </Link>

              <Link
                href="/super-admin/leads"
                className={`group flex items-center justify-between px-3.5 py-2.5 text-[13px] font-medium rounded-xl transition-all duration-200 ${
                  isLeads
                    ? "bg-[#16233B] text-white font-semibold shadow-inner border border-cyan-500/20 relative"
                    : "text-slate-400 hover:text-slate-100 hover:bg-[#111C33]/70"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <PhoneCall
                    className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                      isLeads
                        ? "text-cyan-400 drop-shadow-[0_0_6px_rgba(56,189,248,0.5)]"
                        : "text-slate-400 group-hover:text-slate-200"
                    }`}
                  />
                  <span className="truncate">Inquiries &amp; Leads</span>
                </div>
                {isLeads && (
                  <span className="w-1.5 h-4 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                )}
              </Link>
            </nav>
          </div>

          {/* Sidebar Footer Card */}
          <div className="p-3.5 border-t border-slate-800/80 bg-[#080E1E]/60 shrink-0">
            <div className="bg-[#111C33]/80 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-bold text-white truncate">
                  LuckNexa SaaS Cloud
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                  <span className="text-[10px] text-slate-400 font-medium">Platform Master</span>
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
