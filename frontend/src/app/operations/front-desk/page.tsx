"use client";

import { useState } from "react";

export default function FrontDeskPage() {
  const [arrivals, setArrivals] = useState([
    { id: "a-1", guest: "E. Thornton", room: "204", time: "2:00 PM", checkedIn: false },
    { id: "a-2", guest: "M. Al-Farsi", room: "311", time: "2:30 PM", checkedIn: false },
    { id: "a-3", guest: "S. Lindqvist", room: "108", time: "3:15 PM", checkedIn: false },
    { id: "a-4", guest: "J. Okafor", room: "412", time: "4:00 PM", checkedIn: false },
  ]);

  const [departures, setDepartures] = useState([
    { id: "d-1", guest: "C. Duval", room: "215", time: "11:00 AM", checkedOut: false },
    { id: "d-2", guest: "R. Petrov", room: "306", time: "11:30 AM", checkedOut: false },
    { id: "d-3", guest: "H. Yamada", room: "119", time: "12:00 PM", checkedOut: false },
  ]);

  const handleCheckIn = (id: string) => {
    setArrivals(arrivals.map((a) => (a.id === id ? { ...a, checkedIn: true } : a)));
  };

  const handleCheckOut = (id: string) => {
    setDepartures(departures.map((d) => (d.id === id ? { ...d, checkedOut: true } : d)));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-[#111827] tracking-tight">
          Front Desk
        </h1>
        <p className="text-[14px] text-[#6B7280] mt-1">
          Today&apos;s arrivals and departures
        </p>
      </div>

      {/* Two Column Grid: Arrivals & Departures */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left: Arrivals */}
        <div>
          <h2 className="text-[16px] font-bold text-[#111827] mb-4">
            Arrivals
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                  <th className="pb-3 pr-4 font-bold">GUEST</th>
                  <th className="pb-3 pr-4 font-bold">ROOM</th>
                  <th className="pb-3 pr-4 font-bold">TIME</th>
                  <th className="pb-3 text-right font-bold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6] text-[14px]">
                {arrivals.map((row) => (
                  <tr key={row.id} className="hover:bg-[#F9FAFB]/60 transition-colors">
                    <td className="py-4 pr-4 font-medium text-[#111827]">
                      {row.guest}
                    </td>
                    <td className="py-4 pr-4 text-[#4B5563]">{row.room}</td>
                    <td className="py-4 pr-4 text-[#6B7280]">{row.time}</td>
                    <td className="py-4 text-right">
                      {row.checkedIn ? (
                        <span className="text-[12px] font-bold text-[#03543F] bg-[#DEF7EC] px-3 py-1.5 rounded-sm">
                          Checked In
                        </span>
                      ) : (
                        <button
                          onClick={() => handleCheckIn(row.id)}
                          className="px-4 py-1.5 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#111827] text-[13px] font-bold rounded-sm transition-colors cursor-pointer"
                        >
                          Check-In
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Departures */}
        <div>
          <h2 className="text-[16px] font-bold text-[#111827] mb-4">
            Departures
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                  <th className="pb-3 pr-4 font-bold">GUEST</th>
                  <th className="pb-3 pr-4 font-bold">ROOM</th>
                  <th className="pb-3 pr-4 font-bold">TIME</th>
                  <th className="pb-3 text-right font-bold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6] text-[14px]">
                {departures.map((row) => (
                  <tr key={row.id} className="hover:bg-[#F9FAFB]/60 transition-colors">
                    <td className="py-4 pr-4 font-medium text-[#111827]">
                      {row.guest}
                    </td>
                    <td className="py-4 pr-4 text-[#4B5563]">{row.room}</td>
                    <td className="py-4 pr-4 text-[#6B7280]">{row.time}</td>
                    <td className="py-4 text-right">
                      {row.checkedOut ? (
                        <span className="text-[12px] font-bold text-[#6B7280] bg-[#F3F4F6] px-3 py-1.5 rounded-sm">
                          Checked Out
                        </span>
                      ) : (
                        <button
                          onClick={() => handleCheckOut(row.id)}
                          className="px-4 py-1.5 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#111827] text-[13px] font-bold rounded-sm transition-colors cursor-pointer"
                        >
                          Check-Out
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
