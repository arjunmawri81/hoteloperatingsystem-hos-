"use client";

import Link from "next/link";
import { useState } from "react";

export default function HotelDiscoveryPage() {
  const [destination, setDestination] = useState("Any Meridian property");
  const [dates, setDates] = useState("Sep 12 — Sep 15");
  const [guests, setGuests] = useState("2 Adults");

  const hotels = [
    {
      id: "h-1",
      name: "Meridian Downtown",
      location: "City Center",
      rating: "4.6 ★",
      price: "$142/night",
    },
    {
      id: "h-2",
      name: "Meridian Airport",
      location: "Airport District",
      rating: "4.3 ★",
      price: "$118/night",
    },
    {
      id: "h-3",
      name: "Meridian Riverside",
      location: "Riverside Quarter",
      rating: "4.7 ★",
      price: "$156/night",
    },
    {
      id: "h-4",
      name: "Meridian Business Bay",
      location: "Business Bay",
      rating: "4.4 ★",
      price: "$134/night",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-[#111827] tracking-tight">
          Hotel Discovery
        </h1>
        <p className="text-[14px] text-[#6B7280] mt-1">
          Search Meridian properties
        </p>
      </div>

      {/* Search Bar Widget */}
      <div className="bg-white p-4 rounded-md border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-5">
            <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
              Destination
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full px-3 py-2 border border-[#E63946] rounded-sm text-[13px] text-[#111827] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
              Dates
            </label>
            <input
              type="text"
              value={dates}
              onChange={(e) => setDates(e.target.value)}
              className="w-full px-3 py-2 border border-[#D1D5DB] rounded-sm text-[13px] text-[#111827] bg-[#F9FAFB] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
              Guests
            </label>
            <input
              type="text"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="w-full px-3 py-2 border border-[#D1D5DB] rounded-sm text-[13px] text-[#111827] bg-[#F9FAFB] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <button className="w-full py-2 bg-[#E63946] hover:bg-[#D62839] text-white text-[13px] font-bold rounded-sm shadow-sm transition-colors cursor-pointer">
              Search
            </button>
          </div>
        </div>
      </div>

      {/* 2x2 Grid of Hotel Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {hotels.map((hotel) => (
          <div
            key={hotel.id}
            className="bg-white rounded-md border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden"
          >
            {/* Photo Placeholder */}
            <div className="h-44 bg-[#E5E7EB]/70 flex items-center justify-center text-[13px] text-[#9CA3AF]">
              Photo placeholder
            </div>

            <div className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-[16px] font-bold text-[#111827]">
                    {hotel.name}
                  </h3>
                  <div className="text-[13px] text-[#6B7280] mt-0.5">
                    {hotel.location}
                  </div>
                </div>

                <span className="text-[12px] font-bold text-[#E63946] border border-[#E63946]/40 px-2 py-0.5 rounded-sm">
                  {hotel.rating}
                </span>
              </div>

              <div className="mt-5 flex items-center justify-between pt-3 border-t border-[#F3F4F6]">
                <span className="text-[15px] font-bold text-[#111827]">
                  {hotel.price}
                </span>
                <Link
                  href="/customer/booking"
                  className="px-4 py-1.5 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#111827] text-[13px] font-bold rounded-sm transition-colors cursor-pointer"
                >
                  View
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
