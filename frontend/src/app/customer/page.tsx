"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { hotelsApi } from "@/lib/api";
import { Hotel } from "@/types";
import { Search, Star, MapPin, Building, ArrowRight, RefreshCw } from "lucide-react";

export default function HotelDiscoveryPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [destination, setDestination] = useState("");
  const [dates, setDates] = useState("Sep 12 — Sep 15");
  const [guests, setGuests] = useState("2 Adults");

  const loadHotels = async () => {
    setIsLoading(true);
    try {
      const data = await hotelsApi.getAll();
      setHotels(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHotels();
  }, []);

  const filteredHotels = hotels.filter((h) => {
    if (!destination) return true;
    return (
      h.name.toLowerCase().includes(destination.toLowerCase()) ||
      h.city?.toLowerCase().includes(destination.toLowerCase()) ||
      h.region?.toLowerCase().includes(destination.toLowerCase())
    );
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#111827] tracking-tight">
            Hotel Discovery
          </h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            Search and book Meridian Hotels & Resorts properties directly
          </p>
        </div>

        <Link
          href="/customer/my-bookings"
          className="flex items-center gap-1.5 px-4 py-2 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#111827] text-[13px] font-bold rounded shadow-xs transition-colors"
        >
          <span>View My Bookings</span>
          <ArrowRight className="w-4 h-4 text-[#EC3013]" />
        </Link>
      </div>

      {/* Search Bar Widget */}
      <div className="bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          <div className="sm:col-span-5">
            <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1.5">
              Destination or Hotel Name
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="City, state, or property name..."
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-[#D1D5DB] rounded text-[13px] text-[#111827] focus:outline-none focus:border-[#EC3013]"
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1.5">
              Dates
            </label>
            <input
              type="text"
              value={dates}
              onChange={(e) => setDates(e.target.value)}
              className="w-full px-3 py-2 border border-[#D1D5DB] rounded text-[13px] text-[#111827] bg-[#F9FAFB]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1.5">
              Guests
            </label>
            <input
              type="text"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="w-full px-3 py-2 border border-[#D1D5DB] rounded text-[13px] text-[#111827] bg-[#F9FAFB]"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              onClick={loadHotels}
              className="w-full py-2 bg-[#EC3013] hover:bg-[#D62839] text-white text-[13px] font-bold rounded shadow-xs transition-colors cursor-pointer"
            >
              Search Hotels
            </button>
          </div>
        </div>
      </div>

      {/* Hotel Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-bold text-[#111827]">
            Available Properties ({filteredHotels.length})
          </h2>
          <button onClick={loadHotels} title="Refresh" className="text-[#6B7280] hover:text-[#111827]">
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#EC3013]" : ""}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          {filteredHotels.map((h) => {
            const price = h.totalRooms > 80 ? 180 : 142;
            return (
              <div
                key={h.id}
                className="bg-white rounded-lg border border-[#E5E7EB] hover:border-[#D1D5DB] shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Photo Header Placeholder */}
                  <div className="h-40 bg-gradient-to-tr from-[#201E1D] to-[#4B5563] p-4 flex flex-col justify-between text-white relative">
                    <div className="flex justify-between items-start">
                      <span className="bg-[#EC3013] text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                        Featured Stay
                      </span>
                      <span className="inline-flex items-center gap-1 bg-black/50 backdrop-blur-xs text-[11px] font-bold px-2 py-0.5 rounded">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        {h.rating || "4.6"}
                      </span>
                    </div>

                    <div>
                      <div className="text-[18px] font-black">{h.name}</div>
                      <div className="text-[12px] opacity-80 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        <span>{h.city || "City Center"}, {h.region || "Central"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-4 space-y-2 text-[13px] text-[#4B5563]">
                    <div className="flex justify-between">
                      <span>Total Rooms:</span>
                      <span className="font-semibold text-[#111827]">{h.totalRooms} Rooms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>General Manager:</span>
                      <span className="font-medium text-[#111827]">{h.managerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Contact:</span>
                      <span className="text-[#6B7280]">{h.phone || "+1 555 0192"}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Pricing & CTA */}
                <div className="p-4 bg-[#F9FAFB] border-t border-[#E5E7EB] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#6B7280] block uppercase font-bold">From</span>
                    <span className="text-[17px] font-black text-[#111827]">${price}</span>
                    <span className="text-[11px] text-[#6B7280]"> / night</span>
                  </div>

                  <Link
                    href={`/customer/booking?hotelId=${h.id}&hotelName=${encodeURIComponent(h.name)}`}
                    className="px-4 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white text-[12px] font-bold rounded shadow-xs transition-colors"
                  >
                    Select &amp; Book
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
