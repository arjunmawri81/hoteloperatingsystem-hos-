"use client";

import { useState } from "react";

export default function RoomMapPage() {
  const [rooms, setRooms] = useState([
    { number: 100, status: "Available" },
    { number: 101, status: "Occupied" },
    { number: 102, status: "Occupied" },
    { number: 103, status: "Dirty" },
    { number: 104, status: "Available" },
    { number: 105, status: "Occupied" },
    { number: 106, status: "Out of Order" },
    { number: 107, status: "Occupied" },
    { number: 108, status: "Available" },
    { number: 109, status: "Occupied" },
    { number: 110, status: "Occupied" },
    { number: 111, status: "Dirty" },
    { number: 112, status: "Available" },
    { number: 113, status: "Occupied" },
    { number: 114, status: "Out of Order" },
    { number: 115, status: "Occupied" },
    { number: 116, status: "Available" },
    { number: 117, status: "Occupied" },
    { number: 118, status: "Occupied" },
    { number: 119, status: "Dirty" },
    { number: 120, status: "Available" },
    { number: 121, status: "Occupied" },
    { number: 122, status: "Out of Order" },
    { number: 123, status: "Occupied" },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Occupied":
        return "border-l-4 border-l-[#E63946]";
      case "Dirty":
        return "border-l-4 border-l-[#8B0000]";
      case "Out of Order":
        return "border-l-4 border-l-[#1F2937]";
      case "Available":
      default:
        return "border-l-4 border-l-[#9CA3AF]";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-[#111827] tracking-tight">
          Room Map
        </h1>
        <p className="text-[14px] text-[#6B7280] mt-1">
          Visual layout of room status
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-6 text-[13px] text-[#4B5563] pt-1">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-[#9CA3AF] rounded-xs" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-[#E63946] rounded-xs" />
          <span>Occupied</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-[#8B0000] rounded-xs" />
          <span>Dirty</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-[#1F2937] rounded-xs" />
          <span>Out of Order</span>
        </div>
      </div>

      {/* 6 Column Room Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-2">
        {rooms.map((room) => (
          <div
            key={room.number}
            className={`bg-white p-4 rounded-md border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow ${getStatusColor(
              room.status
            )}`}
          >
            <div className="text-[16px] font-bold text-[#111827]">
              {room.number}
            </div>
            <div className="text-[12px] text-[#6B7280] mt-0.5">
              {room.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
