"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";

export default function HotelComparisonPage() {
  const { user } = useAuth();
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [hotelsRes, roomsRes, resRes] = await Promise.all([
        api.get<any>("/hotels").catch(() => ({ data: [] })),
        api.get<any>("/rooms").catch(() => ({ data: [] })),
        api.get<any>("/reservations").catch(() => ({ data: [] })),
      ]);

      const hotelsList = hotelsRes?.data || (Array.isArray(hotelsRes) ? hotelsRes : []);
      const roomsList = roomsRes?.data || (Array.isArray(roomsRes) ? roomsRes : []);
      const reservationsList = resRes?.data || (Array.isArray(resRes) ? resRes : []);

      const userAssignedNames = (user as any)?.assignedHotelNames;
      const assignedHotels = (Array.isArray(userAssignedNames) && userAssignedNames.length > 0)
        ? hotelsList.filter((h: any) => userAssignedNames.includes(h.name))
        : user?.hotelName
        ? hotelsList.filter(
            (h: any) =>
              h.name.toLowerCase() === (user.hotelName || "").toLowerCase() ||
              h.id === user.hotelId
          )
        : user?.role === "area_manager"
        ? [] // No assigned hotel
        : hotelsList;

      if (assignedHotels.length === 0) {
        setComparisonData([]);
      } else {
        const rows = assignedHotels.map((h: any) => {
          // Strict per-hotel room and reservation filtering
          const hotelRooms = roomsList.filter(
            (r: any) =>
              (r.hotelName && r.hotelName.toLowerCase() === h.name.toLowerCase()) ||
              (r.hotelId && (r.hotelId === h.id || r.hotelId === h._id))
          );
          const hotelReservations = reservationsList.filter(
            (r: any) =>
              (r.hotelName && r.hotelName.toLowerCase() === h.name.toLowerCase()) ||
              (r.hotelId && (r.hotelId === h.id || r.hotelId === h._id))
          );

          const totalRooms = hotelRooms.length;
          const occupiedRooms = hotelRooms.filter((r: any) => r.status === "occupied").length;
          const occupancyRate = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) + "%" : "0.0%";

          const activeReservations = hotelReservations.filter((r: any) => r.status !== "cancelled");
          const roomRevenue = activeReservations.reduce(
            (sum: number, r: any) => sum + (Number(r.paidAmount) || Number(r.totalAmount) || 0),
            0
          );

          const adr = occupiedRooms > 0
            ? Math.round(roomRevenue / occupiedRooms)
            : activeReservations.length > 0
            ? Math.round(roomRevenue / activeReservations.length)
            : 0;

          const revpar = totalRooms > 0 ? Math.round(roomRevenue / totalRooms) : 0;
          const totalResCount = hotelReservations.length;
          const cancelledCount = hotelReservations.filter((r: any) => r.status === "cancelled").length;

          return {
            hotel: `${h.name}${h.region ? ` (${h.region})` : ""}`,
            occupancy: occupancyRate,
            adr: `₹${adr.toLocaleString()}`,
            revpar: `₹${revpar.toLocaleString()}`,
            reservations: totalResCount,
            cancellations: cancelledCount,
          };
        });
        setComparisonData(rows);
      }
    } catch (e) {
      console.error("Failed to load comparison data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/area-manager"
              className="text-[12px] font-bold text-[#EC3013] hover:underline flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Area Manager
            </Link>
          </div>
          <h1 className="text-[28px] font-bold text-[#111827] tracking-tight">
            Hotel Comparison
          </h1>
          <p className="text-[14px] text-[#6B7280] mt-1">
            Real-time performance across assigned properties (Database Persisted)
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2 border border-[#D1D5DB] rounded text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors cursor-pointer w-fit"
          title="Refresh comparison"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#EC3013]" : ""}`} />
        </button>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto bg-white border border-[#E5E7EB] rounded-lg shadow-xs p-5">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#E5E7EB] text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
              <th className="pb-3 pr-6 font-bold">HOTEL</th>
              <th className="pb-3 pr-6 font-bold">OCCUPANCY</th>
              <th className="pb-3 pr-6 font-bold">ADR</th>
              <th className="pb-3 pr-6 font-bold">REVPAR</th>
              <th className="pb-3 pr-6 font-bold">RESERVATIONS</th>
              <th className="pb-3 text-right font-bold">CANCELLATIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3F4F6] text-[14px]">
            {comparisonData.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#9CA3AF]">
                  No assigned properties found
                </td>
              </tr>
            ) : (
              comparisonData.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#F9FAFB]/80 transition-colors">
                  <td className="py-4 pr-6 font-bold text-[#111827]">
                    {row.hotel}
                  </td>
                  <td className="py-4 pr-6 text-[#4B5563] font-semibold">{row.occupancy}</td>
                  <td className="py-4 pr-6 text-[#4B5563] font-semibold">{row.adr}</td>
                  <td className="py-4 pr-6 text-[#4B5563] font-semibold">{row.revpar}</td>
                  <td className="py-4 pr-6 text-[#4B5563] font-semibold">{row.reservations}</td>
                  <td className="py-4 text-right text-[#4B5563] font-semibold">
                    {row.cancellations}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
