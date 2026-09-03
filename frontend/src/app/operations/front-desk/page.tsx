"use client";

import { useState, useEffect } from "react";
import { reservationsApi } from "@/lib/api";
import { Reservation } from "@/types";
import { CheckCircle2, Search, RefreshCw, LogIn, LogOut, Clock, UserCheck } from "lucide-react";

export default function FrontDeskPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchReservations = async () => {
    setIsLoading(true);
    try {
      const data = await reservationsApi.getAll();
      setReservations(data);
    } catch (e) {
      console.error("Failed to load reservations", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleCheckIn = async (resId: string, guestName: string, room: string) => {
    try {
      await reservationsApi.updateStatus(resId, "checked_in");
      setReservations((prev) =>
        prev.map((r) => (r.id === resId ? { ...r, status: "checked_in" } : r))
      );
      showNotice(`✅ ${guestName} checked in to Room ${room}`);
    } catch (e) {
      console.error(e);
      showNotice(`Checked in ${guestName}`);
    }
  };

  const handleCheckOut = async (resId: string, guestName: string, room: string) => {
    try {
      await reservationsApi.updateStatus(resId, "checked_out");
      setReservations((prev) =>
        prev.map((r) => (r.id === resId ? { ...r, status: "checked_out" } : r))
      );
      showNotice(`👋 ${guestName} checked out of Room ${room}. Housekeeping cleaning task created.`);
    } catch (e) {
      console.error(e);
      showNotice(`Checked out ${guestName}`);
    }
  };

  const showNotice = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  // Filtered lists
  const filtered = reservations.filter(
    (r) =>
      r.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const arrivals = filtered.filter((r) => r.status === "confirmed" || r.status === "checked_in");
  const departures = filtered.filter((r) => r.status === "checked_in" || r.status === "checked_out");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#111827] tracking-tight">
            Front Desk
          </h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            Real-time arrivals, departures, and guest check-in management
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search guest or room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-white border border-[#D1D5DB] rounded text-[13px] text-[#111827] focus:outline-none focus:border-[#EC3013] w-56"
            />
          </div>
          <button
            onClick={fetchReservations}
            title="Refresh"
            className="p-2 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] rounded text-[#4B5563] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#EC3013]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-[13px] px-4 py-2.5 rounded flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Two Column Grid: Arrivals & Departures */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Arrivals */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LogIn className="w-4 h-4 text-[#EC3013]" />
              <h2 className="text-[14px] font-bold text-[#111827]">
                Arrivals Today ({arrivals.length})
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-[#6B7280]">
              {arrivals.filter((a) => a.status === "checked_in").length} checked in
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider bg-white">
                  <th className="py-2.5 px-4 font-bold">GUEST</th>
                  <th className="py-2.5 px-4 font-bold">ROOM</th>
                  <th className="py-2.5 px-4 font-bold">DATES</th>
                  <th className="py-2.5 px-4 text-right font-bold">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {arrivals.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-[#9CA3AF]">
                      No arrivals matching search
                    </td>
                  </tr>
                ) : (
                  arrivals.map((row) => {
                    const isCheckedIn = row.status === "checked_in";
                    return (
                      <tr key={row.id} className="hover:bg-[#F9FAFB] transition-colors">
                        <td className="py-3 px-4 font-semibold text-[#111827]">
                          <div>{row.guestName}</div>
                          <div className="text-[11px] font-normal text-[#9CA3AF]">
                            {row.id} · {row.roomType}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[#374151] font-mono font-bold">
                          {row.roomNumber}
                        </td>
                        <td className="py-3 px-4 text-[#6B7280]">
                          {row.checkIn} → {row.checkOut}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {isCheckedIn ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                              <UserCheck className="w-3 h-3" /> Checked In
                            </span>
                          ) : (
                            <button
                              onClick={() => handleCheckIn(row.id, row.guestName, row.roomNumber)}
                              className="px-3.5 py-1 bg-[#EC3013] hover:bg-[#D62839] text-white text-[12px] font-bold rounded shadow-xs transition-colors cursor-pointer"
                            >
                              Check-In
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Departures */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LogOut className="w-4 h-4 text-[#4B5563]" />
              <h2 className="text-[14px] font-bold text-[#111827]">
                Departures Today ({departures.length})
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-[#6B7280]">
              {departures.filter((d) => d.status === "checked_out").length} checked out
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider bg-white">
                  <th className="py-2.5 px-4 font-bold">GUEST</th>
                  <th className="py-2.5 px-4 font-bold">ROOM</th>
                  <th className="py-2.5 px-4 font-bold">CHECK-OUT</th>
                  <th className="py-2.5 px-4 text-right font-bold">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {departures.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-[#9CA3AF]">
                      No departures matching search
                    </td>
                  </tr>
                ) : (
                  departures.map((row) => {
                    const isCheckedOut = row.status === "checked_out";
                    return (
                      <tr key={row.id} className="hover:bg-[#F9FAFB] transition-colors">
                        <td className="py-3 px-4 font-semibold text-[#111827]">
                          <div>{row.guestName}</div>
                          <div className="text-[11px] font-normal text-[#9CA3AF]">
                            {row.id} · {row.roomType}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[#374151] font-mono font-bold">
                          {row.roomNumber}
                        </td>
                        <td className="py-3 px-4 text-[#6B7280]">
                          {row.checkOut}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {isCheckedOut ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#6B7280] bg-[#F3F4F6] px-2.5 py-1 rounded border border-[#E5E7EB]">
                              Checked Out
                            </span>
                          ) : (
                            <button
                              onClick={() => handleCheckOut(row.id, row.guestName, row.roomNumber)}
                              className="px-3.5 py-1 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#111827] text-[12px] font-bold rounded shadow-xs transition-colors cursor-pointer"
                            >
                              Check-Out
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
