"use client";

import { useState } from "react";
import { X } from "lucide-react";

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([
    {
      id: "RES-10293",
      guest: "E. Thornton",
      roomType: "Deluxe",
      checkIn: "Aug 21",
      checkOut: "Aug 24",
      status: "Confirmed",
    },
    {
      id: "RES-10294",
      guest: "M. Al-Farsi",
      roomType: "Suite",
      checkIn: "Aug 21",
      checkOut: "Aug 23",
      status: "Confirmed",
    },
    {
      id: "RES-10295",
      guest: "S. Lindqvist",
      roomType: "Standard",
      checkIn: "Aug 21",
      checkOut: "Aug 22",
      status: "Pending Payment",
    },
    {
      id: "RES-10296",
      guest: "J. Okafor",
      roomType: "Deluxe",
      checkIn: "Aug 21",
      checkOut: "Aug 26",
      status: "Confirmed",
    },
    {
      id: "RES-10297",
      guest: "A. Delgado",
      roomType: "Suite",
      checkIn: "Aug 22",
      checkOut: "Aug 25",
      status: "Waitlisted",
    },
    {
      id: "RES-10298",
      guest: "N. Kowalski",
      roomType: "Standard",
      checkIn: "Aug 20",
      checkOut: "Aug 21",
      status: "Cancelled",
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBooking, setNewBooking] = useState({
    guest: "",
    roomType: "Deluxe",
    checkIn: "Aug 24",
    checkOut: "Aug 27",
    status: "Confirmed",
  });

  const handleAddBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBooking.guest) return;
    setReservations([
      ...reservations,
      {
        id: `RES-${Math.floor(10000 + Math.random() * 90000)}`,
        ...newBooking,
      },
    ]);
    setIsModalOpen(false);
    setNewBooking({
      guest: "",
      roomType: "Deluxe",
      checkIn: "Aug 24",
      checkOut: "Aug 27",
      status: "Confirmed",
    });
  };

  return (
    <div className="space-y-8">
      {/* Top Header with New Reservation Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#111827] tracking-tight">
            Reservations
          </h1>
          <p className="text-[14px] text-[#6B7280] mt-1">
            Search, create and manage bookings
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="self-start sm:self-auto px-5 py-2.5 bg-[#E63946] hover:bg-[#D62839] text-white text-[13px] font-bold rounded-sm shadow-sm transition-colors cursor-pointer"
        >
          New Reservation
        </button>
      </div>

      {/* Reservations Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#E5E7EB] text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
              <th className="pb-3 pr-6 font-bold">BOOKING ID</th>
              <th className="pb-3 pr-6 font-bold">GUEST</th>
              <th className="pb-3 pr-6 font-bold">ROOM TYPE</th>
              <th className="pb-3 pr-6 font-bold">CHECK-IN</th>
              <th className="pb-3 pr-6 font-bold">CHECK-OUT</th>
              <th className="pb-3 text-right font-bold">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3F4F6] text-[14px]">
            {reservations.map((res) => (
              <tr
                key={res.id}
                className="hover:bg-[#F9FAFB]/80 transition-colors"
              >
                <td className="py-4 pr-6 font-medium text-[#111827]">
                  {res.id}
                </td>
                <td className="py-4 pr-6 text-[#111827] font-medium">{res.guest}</td>
                <td className="py-4 pr-6 text-[#4B5563]">{res.roomType}</td>
                <td className="py-4 pr-6 text-[#4B5563]">{res.checkIn}</td>
                <td className="py-4 pr-6 text-[#4B5563]">{res.checkOut}</td>
                <td className="py-4 text-right">
                  {res.status === "Confirmed" && (
                    <span className="text-[12px] text-[#4B5563]">
                      Confirmed
                    </span>
                  )}
                  {res.status === "Pending Payment" && (
                    <span className="text-[12px] text-[#E63946] bg-[#FDE8E8] px-2.5 py-1 rounded-sm font-medium">
                      Pending Payment
                    </span>
                  )}
                  {res.status === "Waitlisted" && (
                    <span className="text-[12px] text-[#E63946] border border-[#E63946]/50 bg-[#FFF5F5] px-2.5 py-0.5 rounded-sm font-medium">
                      Waitlisted
                    </span>
                  )}
                  {res.status === "Cancelled" && (
                    <span className="text-[12px] text-[#E63946] font-medium">
                      Cancelled
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Reservation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full border border-[#E5E7EB] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
              <h3 className="text-[16px] font-bold text-[#111827]">
                Create New Reservation
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#9CA3AF] hover:text-[#111827]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBooking} className="p-6 space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-[#4B5563] uppercase tracking-wider mb-1">
                  Guest Name
                </label>
                <input
                  type="text"
                  required
                  value={newBooking.guest}
                  onChange={(e) =>
                    setNewBooking({ ...newBooking, guest: e.target.value })
                  }
                  placeholder="e.g. Arjun Verma"
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-md text-[13px] text-[#111827] focus:outline-none focus:border-[#E63946]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#4B5563] uppercase tracking-wider mb-1">
                  Room Type
                </label>
                <select
                  value={newBooking.roomType}
                  onChange={(e) =>
                    setNewBooking({ ...newBooking, roomType: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-md text-[13px] text-[#111827] focus:outline-none focus:border-[#E63946]"
                >
                  <option value="Deluxe">Deluxe</option>
                  <option value="Suite">Suite</option>
                  <option value="Standard">Standard</option>
                  <option value="Executive">Executive</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#4B5563] uppercase tracking-wider mb-1">
                    Check-In
                  </label>
                  <input
                    type="text"
                    value={newBooking.checkIn}
                    onChange={(e) =>
                      setNewBooking({ ...newBooking, checkIn: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-md text-[13px] text-[#111827] focus:outline-none focus:border-[#E63946]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#4B5563] uppercase tracking-wider mb-1">
                    Check-Out
                  </label>
                  <input
                    type="text"
                    value={newBooking.checkOut}
                    onChange={(e) =>
                      setNewBooking({ ...newBooking, checkOut: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-md text-[13px] text-[#111827] focus:outline-none focus:border-[#E63946]"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-[13px] text-[#4B5563] hover:text-[#111827] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#E63946] hover:bg-[#D62839] text-white text-[13px] font-bold rounded-sm shadow-sm transition-colors"
                >
                  Save Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
