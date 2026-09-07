"use client";

import Link from "next/link";
import { ArrowLeft, Layers, ShieldCheck, Sparkles, Building, ChevronRight } from "lucide-react";

interface PanelLayoutProps {
  panelName: string;
  badge: string;
  badgeColor?: "indigo" | "amber" | "emerald" | "violet" | "sky";
  description: string;
  children: React.ReactNode;
}

export function PanelLayout({
  panelName,
  badge,
  badgeColor = "indigo",
  description,
  children,
}: PanelLayoutProps) {
  const colorMap = {
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    violet: "bg-violet-500/10 text-violet-400 border-violet-500/30",
    sky: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white pb-16">
      {/* Top Banner / Breadcrumb */}
      <div className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-sm px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
              <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>LuckNexa Hub</span>
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-slate-300 font-medium">{panelName}</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {panelName}
              </h1>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${colorMap[badgeColor]}`}
              >
                {badge}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">{description}</p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center gap-2 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">RBAC Verified</div>
                <div className="font-semibold text-slate-200">Tenant Isolated (org_id)</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">{children}</main>
    </div>
  );
}
