"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserMenu } from "@/components/layout/UserMenu";
import { GlobalSearchModal } from "@/components/layout/GlobalSearchModal";
import { NotificationPopover } from "@/components/layout/NotificationPopover";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { AIBusinessAssistantModal } from "@/components/ai/AIBusinessAssistantModal";
import { LayoutDashboard, Layers, MapPin, Sparkles, Mic } from "lucide-react";

export default function AreaManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const isComparison = pathname.includes("/comparison");

  const currentPageTitle = isComparison ? "Hotel Comparison" : "Area Manager Dashboard";

  return (
    <RoleGuard allowedRoles={["super_admin", "hotel_admin", "area_manager"]} moduleName="Area Manager Panel">
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
                  Area Manager Console
                </p>
              </div>
            </div>

            {/* Navigation Menu with Isolated Internal Scroll */}
            <nav className="p-3.5 space-y-1.5 overflow-y-auto flex-1 custom-scrollbar overscroll-contain">
              <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Cluster Menu
              </div>
              <Link
                href="/area-manager"
                className={`group flex items-center justify-between px-3.5 py-2.5 text-[13px] rounded-lg transition-all duration-150 ${
                  !isComparison
                    ? "bg-[#00A8FF] text-white font-bold shadow-md shadow-cyan-500/30"
                    : "text-slate-300 hover:text-white hover:bg-white/5 font-medium"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <LayoutDashboard
                    className={`w-[18px] h-[18px] shrink-0 ${
                      !isComparison ? "text-white" : "text-slate-400 group-hover:text-white"
                    }`}
                  />
                  <span className="truncate">Area Dashboard</span>
                </div>
              </Link>

              <Link
                href="/area-manager/comparison"
                className={`group flex items-center justify-between px-3.5 py-2.5 text-[13px] rounded-lg transition-all duration-150 ${
                  isComparison
                    ? "bg-[#00A8FF] text-white font-bold shadow-md shadow-cyan-500/30"
                    : "text-slate-300 hover:text-white hover:bg-white/5 font-medium"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Layers
                    className={`w-[18px] h-[18px] shrink-0 ${
                      isComparison ? "text-white" : "text-slate-400 group-hover:text-white"
                    }`}
                  />
                  <span className="truncate">Hotel Comparison</span>
                </div>
              </Link>
            </nav>
          </div>

          {/* Sidebar Footer AI Briefing Trigger Card */}
          <div className="p-3.5 border-t border-slate-800/80 bg-[#141824] shrink-0 space-y-2">
            <button
              onClick={() => setIsAssistantOpen(true)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-cyan-950/60 to-blue-950/60 hover:from-cyan-900/80 hover:to-blue-900/80 border border-cyan-500/30 text-slate-200 hover:text-white transition-all shadow-md group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="text-left min-w-0">
                  <div className="text-[11px] font-bold text-cyan-300 truncate">AI Cluster Briefing</div>
                  <div className="text-[9px] text-slate-400">Voice Summary Report</div>
                </div>
              </div>
              <Mic className="w-4 h-4 text-cyan-400 animate-pulse" />
            </button>
          </div>
        </aside>

        {/* Main Content Area (Offset by ml-64 for fixed sidebar) */}
        <div className="flex-1 flex flex-col min-w-0 ml-64 min-h-screen">
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

        {/* Executive AI Business Assistant Modal */}
        <AIBusinessAssistantModal
          isOpen={isAssistantOpen}
          onClose={() => setIsAssistantOpen(false)}
        />
      </div>
    </RoleGuard>
  );
}
