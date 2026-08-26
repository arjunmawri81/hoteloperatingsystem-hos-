"use client";

import { useState } from "react";

export default function HousekeepingPage() {
  const [board, setBoard] = useState({
    dirty: [
      { room: "Room 215", sub: "Unassigned" },
      { room: "Room 306", sub: "Unassigned" },
      { room: "Room 119", sub: "Unassigned" },
    ],
    cleaning: [
      { room: "Room 204", sub: "P. Mensah" },
      { room: "Room 311", sub: "L. Osei" },
    ],
    inspection: [
      { room: "Room 108", sub: "Supervisor: T. Alonso" },
    ],
    clean: [
      { room: "Room 412", sub: "Ready for arrival" },
      { room: "Room 301", sub: "Ready for arrival" },
    ],
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-[#111827] tracking-tight">
          Housekeeping
        </h1>
        <p className="text-[14px] text-[#6B7280] mt-1">
          Room Board — task status by stage
        </p>
      </div>

      {/* 4-Stage Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
        {/* Column 1: DIRTY (9) */}
        <div>
          <div className="text-[12px] font-bold text-[#111827] tracking-wider uppercase mb-4 border-b border-[#E5E7EB] pb-2">
            DIRTY (9)
          </div>
          <div className="space-y-3">
            {board.dirty.map((item, idx) => (
              <div
                key={idx}
                className="bg-[#E5E7EB]/50 p-4 rounded-md hover:bg-[#E5E7EB]/70 transition-colors"
              >
                <div className="text-[14px] font-bold text-[#111827]">
                  {item.room}
                </div>
                <div className="text-[12px] text-[#6B7280] mt-1">
                  {item.sub}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: CLEANING (5) */}
        <div>
          <div className="text-[12px] font-bold text-[#111827] tracking-wider uppercase mb-4 border-b border-[#E5E7EB] pb-2">
            CLEANING (5)
          </div>
          <div className="space-y-3">
            {board.cleaning.map((item, idx) => (
              <div
                key={idx}
                className="bg-[#E5E7EB]/50 p-4 rounded-md hover:bg-[#E5E7EB]/70 transition-colors"
              >
                <div className="text-[14px] font-bold text-[#111827]">
                  {item.room}
                </div>
                <div className="text-[12px] text-[#6B7280] mt-1">
                  {item.sub}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: INSPECTION (3) */}
        <div>
          <div className="text-[12px] font-bold text-[#111827] tracking-wider uppercase mb-4 border-b border-[#E5E7EB] pb-2">
            INSPECTION (3)
          </div>
          <div className="space-y-3">
            {board.inspection.map((item, idx) => (
              <div
                key={idx}
                className="bg-[#E5E7EB]/50 p-4 rounded-md hover:bg-[#E5E7EB]/70 transition-colors"
              >
                <div className="text-[14px] font-bold text-[#111827]">
                  {item.room}
                </div>
                <div className="text-[12px] text-[#6B7280] mt-1">
                  {item.sub}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 4: CLEAN (12) */}
        <div>
          <div className="text-[12px] font-bold text-[#111827] tracking-wider uppercase mb-4 border-b border-[#E5E7EB] pb-2">
            CLEAN (12)
          </div>
          <div className="space-y-3">
            {board.clean.map((item, idx) => (
              <div
                key={idx}
                className="bg-[#E5E7EB]/50 p-4 rounded-md hover:bg-[#E5E7EB]/70 transition-colors"
              >
                <div className="text-[14px] font-bold text-[#111827]">
                  {item.room}
                </div>
                <div className="text-[12px] text-[#6B7280] mt-1">
                  {item.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
