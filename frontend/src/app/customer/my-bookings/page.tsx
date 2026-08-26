"use client";

import { useState } from "react";

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([
    {
      id: "b-1",
      hotel: "Meridian Downtown",
      details: "Sep 12 — Sep 15 · Deluxe Room",
      status: "Upcoming",
      action: "Digital Check-In",
      actionDone: false,
    },
    {
      id: "b-2",
      hotel: "Meridian Riverside",
      details: "Jun 3 — Jun 5 · Standard Room",
      status: "Completed",
      action: "View Invoice",
      actionDone: false,
    },
    {
      id: "b-3",
      hotel: "Meridian Airport",
      details: "Apr 20 — Apr 21 · Suite",
      status: "Completed",
      action: "View Invoice",
      actionDone: false,
    },
  ]);

  const handleAction = (id: string) => {
    setBookings(
      bookings.map((b) => (b.id === id ? { ...b, actionDone: true } : b))
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-[#111827] tracking-tight">
          My Bookings
        </h1>
        <p className="text-[14px] text-[#6B7280] mt-1">
          Upcoming and past stays
        </p>
      </div>

      {/* Bookings Cards List */}
      <div className="space-y-4 pt-2">
        {bookings.map((booking) => (
          <div
            key={booking.id}
            className="bg-[#E5E7EB]/40 p-8 rounded-md flex flex-col items-center justify-center text-center space-y-4 hover:bg-[#E5E7EB]/60 transition-colors"
          >
            <div>
              <h2 className="text-[18px] font-bold text-[#111827]">
                {booking.hotel}
              </h2>
              <div className="text-[13px] text-[#6B7280] mt-1">
                {booking.details}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {booking.status === "Upcoming" ? (
                <span className="text-[12px] text-[#6B7280] bg-[#E5E7EB] px-2.5 py-1 rounded-sm">
                  Upcoming
                </span>
              ) : (
                <span className="text-[12px] text-[#E63946] border border-[#E63946]/50 bg-white px-2.5 py-0.5 rounded-sm font-medium">
                  Completed
                </span>
              )}

              <button
                onClick={() => handleAction(booking.id)}
                className="px-5 py-1.5 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#111827] text-[13px] font-bold rounded-sm transition-colors cursor-pointer"
              >
                {booking.actionDone ? "Done ✓" : booking.action}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
