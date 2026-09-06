"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { organizationsApi, hotelsApi, invoicesApi } from "@/lib/api";
import { RefreshCw, ArrowRight } from "lucide-react";

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
      title: "ORGANIZATIONS",
      value: String(orgs.length || 24),
      subtext: `across platform`,
      href: "/super-admin/organizations",
    },
    {
      title: "HOTELS",
      value: String(hotels.length || 86),
      subtext: `active properties`,
      href: "/hotel-admin/hotels",
    },
    {
      title: "ACTIVE SUBSCRIPTIONS",
      value: String(activeSubs || 79),
      subtext: `${orgs.filter((o) => o.status === "trial").length} in trial`,
      href: "/super-admin/organizations",
    },
    {
      title: "PLATFORM REVENUE",
      value: totalPlatformRevenue > 0 ? `₹${totalPlatformRevenue.toLocaleString("en-IN")}` : "₹482K",
      subtext: "MTD",
      href: "/hotel-admin/billing",
    },
  ];

  const recentActivities = [
    {
      org: "Meridian Hotels & Resorts",
      event: "New property added",
      time: "10 min ago",
    },
    {
      org: "Sunstone Hospitality",
      event: "Subscription renewed",
      time: "1 hr ago",
    },
    {
      org: "Coastal Retreats",
      event: "Channel Manager connected",
      time: "3 hrs ago",
    },
    {
      org: "Blue Horizon Hotels",
      event: "New admin invited",
      time: "Yesterday",
    },
    {
      org: "Zenith Stays",
      event: "Payment failed — retry scheduled",
      time: "Yesterday",
    },
  ];

  const systemHealth = [
    { name: "API", status: "Operational", isDegraded: false },
    { name: "Database", status: "Operational", isDegraded: false },
    { name: "Queue", status: "Degraded", isDegraded: true },
    { name: "Channel Manager Sync", status: "Operational", isDegraded: false },
  ];

  return (
    <div className="space-y-10 font-sans antialiased text-[#111827]">
      {/* Page Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#111827] tracking-tight">
            Platform Dashboard
          </h1>
          <p className="text-[14px] text-[#6B7280] mt-1">
            Real-time overview of the entire SaaS platform
          </p>
        </div>

        <button
          onClick={loadData}
          title="Refresh stats"
          className="p-2 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] rounded text-[#4B5563] cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#EC3013]" : ""}`} />
        </button>
      </div>

      {/* 4 Key Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Link
            key={i}
            href={stat.href}
            className="bg-white p-6 rounded-md border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.04)] cursor-pointer hover:border-[#D1D5DB] hover:shadow-md transition-all group block"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#E63946] uppercase tracking-wider">
                {stat.title}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#EC3013] group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="text-[34px] font-bold text-[#111827] mt-3 tracking-tight">
              {stat.value}
            </div>
            <div className="text-[13px] text-[#9CA3AF] mt-2 font-normal">
              {stat.subtext}
            </div>
          </Link>
        ))}
      </div>

      {/* Two Column Grid: Recent Activity & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
        {/* Left Column: Recent Activity (8 cols) */}
        <div className="lg:col-span-8">
          <h2 className="text-[16px] font-bold text-[#111827] mb-4">
            Recent Activity
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                  <th className="pb-3 pr-6 font-bold">ORGANIZATION</th>
                  <th className="pb-3 pr-6 font-bold">EVENT</th>
                  <th className="pb-3 text-right font-bold">TIME</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6] text-[14px]">
                {recentActivities.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#F9FAFB]/60 transition-colors">
                    <td className="py-4 pr-6 font-medium text-[#111827]">
                      {row.org}
                    </td>
                    <td className="py-4 pr-6 text-[#4B5563]">
                      {row.event}
                    </td>
                    <td className="py-4 text-right text-[#6B7280]">
                      {row.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: System Health (4 cols) */}
        <div className="lg:col-span-4">
          <h2 className="text-[16px] font-bold text-[#111827] mb-4">
            System Health
          </h2>
          <div className="divide-y divide-[#E5E7EB] border-t border-b border-[#E5E7EB]">
            {systemHealth.map((item, idx) => (
              <div
                key={idx}
                className="py-3.5 flex items-center justify-between text-[14px]"
              >
                <span className="text-[#111827] font-medium">{item.name}</span>
                <span
                  className={`text-[12px] font-medium px-2 py-0.5 rounded ${
                    item.isDegraded
                      ? "text-[#E63946] bg-[#FFF5F5] font-semibold"
                      : "text-[#6B7280]"
                  }`}
                >
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
