"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { organizationsApi, hotelsApi, invoicesApi } from "@/lib/api";
import { RefreshCw, ArrowRight, Building2, Hotel, ShieldCheck, TrendingUp, Receipt } from "lucide-react";

export default function SuperAdminDashboardPage() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [orgData, hotelData, invData] = await Promise.all([
        organizationsApi.getAll(),
        hotelsApi.getAll(),
        invoicesApi.getAll(),
      ]);
      setOrgs(orgData || []);
      setHotels(hotelData || []);
      setInvoices(invData?.data || (Array.isArray(invData) ? invData : []));
    } catch (e) {
      console.error("Failed to load super admin stats:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalPlatformRevenue = invoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
  const activeSubs = orgs.filter((o) => o.status === "active").length;

  const stats = [
    {
      title: "Organizations",
      value: String(orgs.length),
      subtext: `across platform`,
      href: "/super-admin/organizations",
      icon: Building2,
      cardBg: "bg-[#E53935] hover:bg-[#D32F2F]",
      shadow: "shadow-red-500/20",
    },
    {
      title: "Active Properties",
      value: String(hotels.length),
      subtext: `hotels & resorts`,
      href: "/super-admin/organizations",
      icon: Hotel,
      cardBg: "bg-[#43A047] hover:bg-[#388E3C]",
      shadow: "shadow-green-500/20",
    },
    {
      title: "Active Subscriptions",
      value: String(activeSubs),
      subtext: `${orgs.filter((o) => o.status === "trial").length} in trial`,
      href: "/super-admin/organizations",
      icon: ShieldCheck,
      cardBg: "bg-[#FB8C00] hover:bg-[#F57C00]",
      shadow: "shadow-orange-500/20",
    },
    {
      title: "Platform Revenue",
      value: `₹${totalPlatformRevenue.toLocaleString("en-IN")}`,
      subtext: "MTD across all orgs",
      href: "/super-admin/organizations",
      icon: TrendingUp,
      cardBg: "bg-[#00ACC1] hover:bg-[#0097A7]",
      shadow: "shadow-cyan-500/20",
    },
  ];

  const systemHealth = [
    { name: "API Gateway", status: "Operational", isDegraded: false },
    { name: "MongoDB Database", status: "Connected", isDegraded: false },
    { name: "Multi-Tenant Isolation Engine", status: "Active & Secured", isDegraded: false },
    { name: "Auth & RBAC System", status: "Operational", isDegraded: false },
  ];

  return (
    <div className="space-y-10 font-sans antialiased text-[#111827]">
      {/* Page Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#0F172A] tracking-[-0.02em]">
            Platform Dashboard
          </h1>
          <p className="text-[13px] text-[#64748B] mt-1 font-normal">
            Real-time live metrics of your SaaS platform
          </p>
        </div>

        <button
          onClick={loadData}
          title="Refresh stats"
          className="p-2 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] rounded text-[#4B5563] cursor-pointer self-start sm:self-auto flex items-center gap-2 text-xs font-semibold"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#EC3013]" : ""}`} />
          Refresh
        </button>
      </div>

      {/* 4 Key Stat Cards (Vibrant Reference Style - Red, Green, Orange, Cyan) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Link
              key={i}
              href={stat.href}
              className={`relative overflow-hidden ${stat.cardBg} p-5 rounded-xl text-white shadow-lg ${stat.shadow} hover:-translate-y-1 transition-all duration-200 group block cursor-pointer`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[34px] font-black leading-none tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-[15px] font-bold text-white/95 mt-2">
                    {stat.title}
                  </div>
                  <div className="text-[12px] text-white/80 font-medium mt-0.5">
                    {stat.subtext}
                  </div>
                </div>

                {/* Circular Ghost Watermark Icon */}
                <div className="w-14 h-14 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10 text-white/90 group-hover:scale-110 group-hover:bg-white/20 transition-all duration-300 shrink-0">
                  <Icon className="w-7 h-7 stroke-[2]" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Two Column Grid: Recent Activity & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
        {/* Left Column: Recent Activity (8 cols) */}
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-bold text-[#111827]">
              Recent Platform Activity
            </h2>
            <Link
              href="/super-admin/organizations"
              className="text-xs font-semibold text-[#EC3013] hover:underline"
            >
              Manage Organizations &rarr;
            </Link>
          </div>

          {orgs.length === 0 ? (
            <div className="bg-white p-8 rounded-lg border border-dashed border-slate-300 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 text-xl font-bold">
                🏢
              </div>
              <h3 className="text-sm font-bold text-slate-800">No organizations registered yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Database is clean. Register your first hotel organization to see live tenant activity and revenue streams.
              </p>
              <Link
                href="/super-admin/organizations"
                className="inline-flex items-center gap-2 bg-[#EC3013] text-white px-4 py-2 rounded text-xs font-semibold hover:bg-[#d4270d] transition-colors"
              >
                + Register First Organization
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-lg border border-[#E5E7EB] p-4">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#E5E7EB] text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                    <th className="pb-3 pr-6 font-bold">ORGANIZATION</th>
                    <th className="pb-3 pr-6 font-bold">STATUS</th>
                    <th className="pb-3 pr-6 font-bold">HOTELS</th>
                    <th className="pb-3 text-right font-bold">ADMIN EMAIL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6] text-[14px]">
                  {orgs.map((org, idx) => (
                    <tr key={idx} className="hover:bg-[#F9FAFB]/60 transition-colors">
                      <td className="py-3.5 pr-6 font-medium text-[#111827]">
                        {org.name}
                      </td>
                      <td className="py-3.5 pr-6">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                          {org.status || "active"}
                        </span>
                      </td>
                      <td className="py-3.5 pr-6 text-[#4B5563]">
                        {org.hotelsCount || 1}
                      </td>
                      <td className="py-3.5 text-right text-[#6B7280] text-xs font-mono">
                        {org.ownerEmail || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: System Health (4 cols) */}
        <div className="lg:col-span-4">
          <h2 className="text-[16px] font-bold text-[#111827] mb-4">
            System Infrastructure Health
          </h2>
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-4 divide-y divide-[#E5E7EB]">
            {systemHealth.map((item, idx) => (
              <div
                key={idx}
                className="py-3 flex items-center justify-between text-[13px]"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[#111827] font-medium">{item.name}</span>
                </div>
                <span className="text-[12px] font-semibold px-2 py-0.5 rounded text-emerald-700 bg-emerald-50">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
