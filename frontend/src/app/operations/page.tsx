"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { reservationsApi, housekeepingApi } from "@/lib/api";
import { Reservation, HousekeepingTask } from "@/types";
import { ArrowRight, RefreshCw, LogIn, Sparkles, BedDouble, Utensils } from "lucide-react";

export default function OperationsDashboardPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [resData, taskData] = await Promise.all([
        reservationsApi.getAll(),
        housekeepingApi.getAll(),
      ]);
      setReservations(resData);
      setTasks(taskData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const checkedInCount = reservations.filter((r) => r.status === "checked_in").length;
  const confirmedCount = reservations.filter((r) => r.status === "confirmed").length;
  const dirtyCount = tasks.filter((t) => t.status === "dirty" || t.status === "cleaning").length;
  const availableRooms = 96 - checkedInCount - dirtyCount;
  const occupancyPct = Math.round((checkedInCount / 96) * 100) || 75;

  const stats = [
    {
      title: "OCCUPANCY",
      value: `${occupancyPct}%`,
      subtext: `${checkedInCount} of 96 rooms occupied`,
      link: "/operations/room-map",
    },
    {
      title: "AVAILABLE ROOMS",
      value: String(Math.max(0, availableRooms)),
      subtext: "Clean & ready for check-in",
      link: "/operations/room-map",
    },
    {
      title: "ARRIVALS TODAY",
      value: String(confirmedCount + checkedInCount),
      subtext: `${checkedInCount} already checked in`,
      link: "/operations/front-desk",
    },
    {
      title: "DIRTY / TURNOVER",
      value: String(dirtyCount),
      subtext: "Rooms in cleaning queue",
      link: "/operations/housekeeping",
    },
  ];

  const todaysArrivals = reservations
    .filter((r) => r.status === "confirmed" || r.status === "checked_in")
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#111827] tracking-tight">
            Property Operations Dashboard
          </h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            Meridian Downtown — live property occupancy, arrivals, and housekeeping
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-1.5 p-2 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] rounded text-[#4B5563] text-[13px] font-semibold"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#EC3013]" : ""}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <Link
            key={i}
            href={stat.link}
            className="bg-white p-5 rounded-lg border border-[#E5E7EB] hover:border-[#D1D5DB] shadow-xs transition-all hover:shadow-md block group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#EC3013] uppercase tracking-wider">
                {stat.title}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#EC3013] transition-colors" />
            </div>
            <div className="text-[30px] font-black text-[#111827] mt-2 tracking-tight">
              {stat.value}
            </div>
            <div className="text-[12px] text-[#6B7280] mt-1">
              {stat.subtext}
            </div>
          </Link>
        ))}
      </div>

      {/* Two Column Grid: Today's Arrivals & Quick Navigation Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Today's Arrivals (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-lg border border-[#E5E7EB] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between">
            <h2 className="text-[14px] font-bold text-[#111827]">
              Today&apos;s Arrivals
            </h2>
            <Link
              href="/operations/front-desk"
              className="text-[12px] font-bold text-[#EC3013] hover:underline"
            >
              Open Front Desk →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider bg-white">
                  <th className="py-2.5 px-4 font-bold">GUEST</th>
                  <th className="py-2.5 px-4 font-bold">ROOM</th>
                  <th className="py-2.5 px-4 font-bold">STATUS</th>
                  <th className="py-2.5 px-4 text-right font-bold">CHECK-IN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {todaysArrivals.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-[#9CA3AF]">
                      No arrivals scheduled
                    </td>
                  </tr>
                ) : (
                  todaysArrivals.map((row) => (
                    <tr key={row.id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#111827]">
                        {row.guestName}
                      </td>
                      <td className="py-3 px-4 text-[#374151] font-mono font-bold">
                        Room {row.roomNumber}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                            row.status === "checked_in"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-blue-50 text-blue-800 border border-blue-200"
                          }`}
                        >
                          {row.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-[#6B7280]">
                        {row.checkIn}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Quick Action Hub (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-[14px] font-bold text-[#111827]">
            Operational Quick Actions
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/operations/front-desk"
              className="p-4 bg-white border border-[#E5E7EB] hover:border-[#D1D5DB] rounded-lg shadow-xs hover:shadow-sm transition-all block group"
            >
              <div className="flex items-center gap-2 font-bold text-[13px] text-[#111827]">
                <LogIn className="w-4 h-4 text-[#EC3013]" />
                <span>Front Desk Check-In</span>
              </div>
              <div className="text-[11px] text-[#6B7280] mt-1.5">
                Process guest check-in & checkout
              </div>
            </Link>

            <Link
              href="/operations/reservations"
              className="p-4 bg-white border border-[#E5E7EB] hover:border-[#D1D5DB] rounded-lg shadow-xs hover:shadow-sm transition-all block group"
            >
              <div className="flex items-center gap-2 font-bold text-[13px] text-[#111827]">
                <BedDouble className="w-4 h-4 text-blue-600" />
                <span>New Reservation</span>
              </div>
              <div className="text-[11px] text-[#6B7280] mt-1.5">
                Create & search bookings
              </div>
            </Link>

            <Link
              href="/operations/housekeeping"
              className="p-4 bg-white border border-[#E5E7EB] hover:border-[#D1D5DB] rounded-lg shadow-xs hover:shadow-sm transition-all block group"
            >
              <div className="flex items-center gap-2 font-bold text-[13px] text-[#111827]">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Housekeeping Board</span>
              </div>
              <div className="text-[11px] text-[#6B7280] mt-1.5">
                Turnover & room inspection
              </div>
            </Link>

            <Link
              href="/operations/restaurant-pos"
              className="p-4 bg-white border border-[#E5E7EB] hover:border-[#D1D5DB] rounded-lg shadow-xs hover:shadow-sm transition-all block group"
            >
              <div className="flex items-center gap-2 font-bold text-[13px] text-[#111827]">
                <Utensils className="w-4 h-4 text-purple-600" />
                <span>Restaurant POS</span>
              </div>
              <div className="text-[11px] text-[#6B7280] mt-1.5">
                Dining orders & room charges
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
