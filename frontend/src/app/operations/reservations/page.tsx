"use client";

import { useState, useEffect } from "react";
import { reservationsApi } from "@/lib/api";
import { Reservation } from "@/types";
import { Search, Plus, X, RefreshCw, CheckCircle2, Calendar, Filter } from "lucide-react";
import { RoleGuard } from "@/components/layout/RoleGuard";

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    roomType: string;
    roomNumber: string;
    checkIn: string;
    checkOut: string;
    totalAmount: string | number;
    paidAmount: string | number;
  }>({
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    roomType: "Deluxe King",
    roomNumber: "",
    checkIn: new Date().toISOString().split("T")[0],
    checkOut: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
    totalAmount: "",
    paidAmount: "",
  });

  const loadReservations = async () => {
    setIsLoading(true);
    try {
      const data = await reservationsApi.getAll();
      setReservations(data);
    } catch (e) {
      console.error("Error loading reservations", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReservations();
  }, []);

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.guestName || !formData.guestPhone) return;

    try {
      const newRes = await reservationsApi.create({
        guestName: formData.guestName,
        guestEmail: formData.guestEmail,
        guestPhone: formData.guestPhone,
        roomType: formData.roomType,
        roomNumber: formData.roomNumber,
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        totalAmount: Number(formData.totalAmount),
        paidAmount: Number(formData.paidAmount),
        status: "confirmed",
        hotelName: "Meridian Downtown",
      });

      setReservations([newRes, ...reservations]);
      setIsModalOpen(false);
      setToastMsg(`✅ Booking ${newRes.id} for ${newRes.guestName} created successfully!`);
      setTimeout(() => setToastMsg(null), 4000);

      // Reset form
      setFormData({
        guestName: "",
        guestEmail: "",
        guestPhone: "",
        roomType: "Deluxe King",
        roomNumber: "204",
        checkIn: new Date().toISOString().split("T")[0],
        checkOut: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
        totalAmount: 18000,
        paidAmount: 18000,
      });
    } catch (err) {
      console.error("Failed to create reservation", err);
    }
  };

  const filteredReservations = reservations.filter((r) => {
    const matchesSearch =
      r.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.roomNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || r.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">Confirmed</span>;
      case "checked_in":
        return <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">Checked In</span>;
      case "checked_out":
        return <span className="text-[11px] font-bold text-[#6B7280] bg-[#F3F4F6] px-2.5 py-1 rounded border border-[#E5E7EB]">Checked Out</span>;
      case "cancelled":
        return <span className="text-[11px] font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded border border-red-200">Cancelled</span>;
      default:
        return <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">{status}</span>;
    }
  };

  return (
    <RoleGuard
      allowedRoles={["super_admin", "hotel_admin", "hotel_manager", "receptionist", "finance"]}
      moduleName="Reservations Management"
    >
      <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#111827] tracking-tight">
            Reservations
          </h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            Search, create and manage property bookings ({reservations.length} total)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadReservations}
            title="Refresh"
            className="p-2 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] rounded text-[#4B5563] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#EC3013]" : ""}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white text-[13px] font-bold rounded shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Reservation</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-[13px] px-4 py-2.5 rounded flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-3.5 rounded-lg border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto">
          {["all", "confirmed", "checked_in", "checked_out", "cancelled"].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded text-[12px] font-semibold capitalize transition-colors ${
                statusFilter === tab
                  ? "bg-[#111827] text-white"
                  : "text-[#4B5563] hover:bg-[#F3F4F6]"
              }`}
            >
              {tab.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search booking or guest..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-1.5 bg-[#F9FAFB] border border-[#D1D5DB] rounded text-[13px] text-[#111827] focus:outline-none focus:border-[#EC3013] w-full sm:w-64"
          />
        </div>
      </div>

      {/* Reservations Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider bg-[#F9FAFB]">
                <th className="py-3 px-4 font-bold">BOOKING ID</th>
                <th className="py-3 px-4 font-bold">GUEST</th>
                <th className="py-3 px-4 font-bold">ROOM</th>
                <th className="py-3 px-4 font-bold">CHECK-IN</th>
                <th className="py-3 px-4 font-bold">CHECK-OUT</th>
                <th className="py-3 px-4 font-bold">STATUS</th>
                <th className="py-3 px-4 text-right font-bold">AMOUNT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#9CA3AF]">
                    No reservations found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredReservations.map((res) => (
                  <tr key={res.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#111827]">
                      {res.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#111827]">{res.guestName}</div>
                      <div className="text-[11px] text-[#9CA3AF]">{res.guestPhone}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#374151]">Room {res.roomNumber}</div>
                      <div className="text-[11px] text-[#9CA3AF]">{res.roomType}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[#4B5563]">{res.checkIn}</td>
                    <td className="py-3.5 px-4 text-[#4B5563]">{res.checkOut}</td>
                    <td className="py-3.5 px-4">{getStatusBadge(res.status)}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#111827]">
                      ₹{res.totalAmount?.toLocaleString?.() || res.totalAmount}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Reservation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <h3 className="text-[16px] font-bold text-[#111827]">Create New Reservation</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#9CA3AF] hover:text-[#111827] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReservation} className="space-y-4 text-[13px]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Guest Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Connor"
                    value={formData.guestName}
                    onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded focus:outline-none focus:border-[#EC3013]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Phone *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+1 555 0192"
                    value={formData.guestPhone}
                    onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded focus:outline-none focus:border-[#EC3013]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="guest@example.com"
                  value={formData.guestEmail}
                  onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded focus:outline-none focus:border-[#EC3013]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Room Type
                  </label>
                  <select
                    value={formData.roomType}
                    onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded bg-white focus:outline-none focus:border-[#EC3013]"
                  >
                    <option value="Standard Room">Standard Room</option>
                    <option value="Deluxe King">Deluxe King</option>
                    <option value="Executive Suite">Executive Suite</option>
                    <option value="Presidential Suite">Presidential Suite</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Room Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 305"
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded focus:outline-none focus:border-[#EC3013]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Check-In Date
                  </label>
                  <input
                    type="date"
                    value={formData.checkIn}
                    onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded focus:outline-none focus:border-[#EC3013]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Check-Out Date
                  </label>
                  <input
                    type="date"
                    value={formData.checkOut}
                    onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded focus:outline-none focus:border-[#EC3013]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                  Total Amount (₹)
                </label>
                <input
                  type="number"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded focus:outline-none focus:border-[#EC3013]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#D1D5DB] rounded text-[#374151] font-semibold hover:bg-[#F3F4F6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white font-bold rounded shadow-xs"
                >
                  Save Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </RoleGuard>
  );
}
