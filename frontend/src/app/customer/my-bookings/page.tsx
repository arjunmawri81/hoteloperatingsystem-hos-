"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { reservationsApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Reservation } from "@/types";
import { CheckCircle2, UserCheck, XCircle, ArrowRight, RefreshCw, BedDouble, Search, Mail } from "lucide-react";

function MyBookingsContent() {
  const searchParams = useSearchParams();
  const newlyBookedId = searchParams.get("booked");
  const { user } = useAuth();

  const [bookings, setBookings] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [emailFilter, setEmailFilter] = useState("");

  const loadBookings = async (overrideEmail?: string) => {
    setIsLoading(true);
    try {
      const emailToUse = overrideEmail !== undefined ? overrideEmail : (emailFilter || user?.email || "");
      const params: any = {};
      if (emailToUse) {
        params.guestEmail = emailToUse;
      }
      const data = await reservationsApi.getAll(params);
      setBookings(data);
    } catch (e) {
      console.error(e);
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initialEmail = user?.email || "";
    if (initialEmail && !emailFilter) {
      setEmailFilter(initialEmail);
    }
    loadBookings(initialEmail);
  }, [user?.email]);

  const handleSearchByEmail = (e: React.FormEvent) => {
    e.preventDefault();
    loadBookings(emailFilter);
  };

  const handleDigitalCheckIn = async (id: string, guestName: string) => {
    try {
      await reservationsApi.updateStatus(id, "checked_in");
      setBookings(bookings.map((b) => (b.id === id ? { ...b, status: "checked_in" } : b)));
      setToastMsg(`✅ Digital Check-In completed for ${guestName}! Key assigned.`);
      setTimeout(() => setToastMsg(null), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelBooking = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this reservation?")) return;
    try {
      await reservationsApi.updateStatus(id, "cancelled");
      setBookings(bookings.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)));
      setToastMsg(`Reservation ${id} cancelled`);
      setTimeout(() => setToastMsg(null), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#111827] tracking-tight">
            My Hotel Bookings
          </h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            Manage upcoming stays, digital check-in, and view booking history
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadBookings()}
            title="Refresh"
            className="p-2 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] rounded text-[#4B5563]"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#EC3013]" : ""}`} />
          </button>
          <Link
            href="/customer"
            className="px-4 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white text-[13px] font-bold rounded shadow-xs"
          >
            Book Another Stay
          </Link>
        </div>
      </div>

      {/* Newly Booked Success Banner */}
      {newlyBookedId && (
        <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-lg flex items-center justify-between text-emerald-900 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <div className="font-bold text-[14px]">Reservation Confirmed!</div>
              <div className="text-[12px] opacity-90">
                Your booking <span className="font-mono font-bold">{newlyBookedId}</span> is confirmed and ready for your stay.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notice */}
      {toastMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-[13px] px-4 py-2.5 rounded flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Email / Phone Lookup Filter */}
      <form onSubmit={handleSearchByEmail} className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by your Email or Guest Name (e.g. guest@lucknexa.com)..."
            value={emailFilter}
            onChange={(e) => setEmailFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#EC3013]"
          />
        </div>
        <button
          type="submit"
          className="w-full sm:w-auto px-5 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Find My Bookings</span>
        </button>
      </form>

      {/* Bookings List */}
      <div className="space-y-4">
        {bookings.length === 0 ? (
          <div className="bg-white p-12 rounded-lg border border-[#E5E7EB] text-center space-y-3">
            <BedDouble className="w-8 h-8 text-[#9CA3AF] mx-auto" />
            <div className="font-bold text-[15px] text-[#111827]">No active bookings found</div>
            <p className="text-[13px] text-[#6B7280]">Explore our properties to book your next stay.</p>
            <Link
              href="/customer"
              className="inline-block px-5 py-2 bg-[#EC3013] text-white font-bold text-[13px] rounded shadow-xs mt-2"
            >
              Explore Hotels
            </Link>
          </div>
        ) : (
          bookings.map((b) => {
            const isConfirmed = b.status === "confirmed";
            const isCheckedIn = b.status === "checked_in";
            const isCancelled = b.status === "cancelled";

            return (
              <div
                key={b.id}
                className="bg-white p-6 rounded-lg border border-[#E5E7EB] hover:border-[#D1D5DB] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden shrink-0 border border-slate-200 bg-slate-100 hidden sm:block">
                    <img
                      src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80"
                      alt={b.hotelName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-[17px] font-bold text-[#111827]">
                        {b.hotelName || "Meridian Downtown"}
                      </h2>
                      <span className="font-mono text-[11px] font-bold text-[#9CA3AF] bg-[#F3F4F6] px-2 py-0.5 rounded">
                        {b.id}
                      </span>
                    </div>

                    <div className="text-[13px] text-[#4B5563] mt-1">
                      <span>{b.roomType} · Room {b.roomNumber}</span>
                    </div>

                    <div className="text-[12px] text-[#6B7280] mt-1">
                      📅 {b.checkIn} → {b.checkOut} · Total: <span className="font-bold text-[#111827]">₹{b.totalAmount?.toLocaleString?.("en-IN") || b.totalAmount}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isCheckedIn ? (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" /> Checked In
                    </span>
                  ) : isConfirmed ? (
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded">
                      Confirmed
                    </span>
                  ) : isCancelled ? (
                    <span className="text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-3 py-1 rounded">
                      Cancelled
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-[#6B7280] bg-[#F3F4F6] px-3 py-1 rounded capitalize">
                      {b.status.replace("_", " ")}
                    </span>
                  )}

                  {isConfirmed && (
                    <button
                      onClick={() => handleDigitalCheckIn(b.id, b.guestName)}
                      className="px-4 py-1.5 bg-[#EC3013] hover:bg-[#D62839] text-white text-[12px] font-bold rounded shadow-xs transition-colors cursor-pointer"
                    >
                      Digital Check-In
                    </button>
                  )}

                  {!isCancelled && (
                    <button
                      onClick={() => handleCancelBooking(b.id)}
                      className="px-3 py-1.5 border border-[#D1D5DB] hover:bg-red-50 hover:text-red-700 text-[#6B7280] text-[12px] font-medium rounded transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function MyBookingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[#9CA3AF]">Loading your bookings...</div>}>
      <MyBookingsContent />
    </Suspense>
  );
}
