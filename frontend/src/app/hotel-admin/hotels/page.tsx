"use client";

import { useState } from "react";
import { X } from "lucide-react";

export default function HotelAdminHotelsPage() {
  const [hotels, setHotels] = useState([
    {
      id: "h-1",
      name: "Meridian Downtown",
      area: "North Area",
      manager: "R. Sharma",
      rooms: 96,
      occupancy: "84%",
      revenue: "$31,200",
      status: "Active",
    },
    {
      id: "h-2",
      name: "Meridian Airport",
      area: "North Area",
      manager: "T. Alonso",
      rooms: 84,
      occupancy: "76%",
      revenue: "$22,900",
      status: "Active",
    },
    {
      id: "h-3",
      name: "Meridian Riverside",
      area: "South Area",
      manager: "K. Boateng",
      rooms: 68,
      occupancy: "71%",
      revenue: "$19,400",
      status: "Active",
    },
    {
      id: "h-4",
      name: "Meridian Business Bay",
      area: "South Area",
      manager: "M. Osei",
      rooms: 64,
      occupancy: "80%",
      revenue: "$20,700",
      status: "Maintenance Mode",
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newHotel, setNewHotel] = useState({
    name: "",
    area: "North Area",
    manager: "",
    rooms: 80,
    occupancy: "0%",
    revenue: "$0",
    status: "Active",
  });

  const handleAddHotel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHotel.name || !newHotel.manager) return;
    setHotels([
      ...hotels,
      {
        id: `h-${Date.now()}`,
        ...newHotel,
      },
    ]);
    setIsModalOpen(false);
    setNewHotel({
      name: "",
      area: "North Area",
      manager: "",
      rooms: 80,
      occupancy: "0%",
      revenue: "$0",
      status: "Active",
    });
  };

  return (
    <div className="space-y-8">
      {/* Top Header with Add Hotel Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#111827] tracking-tight">
            Hotels
          </h1>
          <p className="text-[14px] text-[#6B7280] mt-1">
            Properties under Meridian Hotels & Resorts
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="self-start sm:self-auto px-5 py-2.5 bg-[#E63946] hover:bg-[#D62839] text-white text-[13px] font-bold rounded-sm shadow-sm transition-colors cursor-pointer"
        >
          Add Hotel
        </button>
      </div>

      {/* Hotels Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#E5E7EB] text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
              <th className="pb-3 pr-6 font-bold">HOTEL</th>
              <th className="pb-3 pr-6 font-bold">AREA</th>
              <th className="pb-3 pr-6 font-bold">MANAGER</th>
              <th className="pb-3 pr-6 font-bold">ROOMS</th>
              <th className="pb-3 pr-6 font-bold">OCCUPANCY</th>
              <th className="pb-3 pr-6 font-bold">REVENUE</th>
              <th className="pb-3 text-right font-bold">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3F4F6] text-[14px]">
            {hotels.map((hotel) => (
              <tr
                key={hotel.id}
                className="hover:bg-[#F9FAFB]/80 transition-colors"
              >
                <td className="py-4 pr-6 font-medium text-[#111827]">
                  {hotel.name}
                </td>
                <td className="py-4 pr-6 text-[#4B5563]">{hotel.area}</td>
                <td className="py-4 pr-6 text-[#4B5563]">{hotel.manager}</td>
                <td className="py-4 pr-6 text-[#4B5563]">{hotel.rooms}</td>
                <td className="py-4 pr-6 text-[#4B5563]">{hotel.occupancy}</td>
                <td className="py-4 pr-6 text-[#4B5563]">{hotel.revenue}</td>
                <td className="py-4 text-right">
                  {hotel.status === "Active" && (
                    <span className="text-[12px] text-[#4B5563] bg-[#F3F4F6] px-2.5 py-1 rounded-sm">
                      Active
                    </span>
                  )}
                  {hotel.status === "Maintenance Mode" && (
                    <span className="text-[12px] text-[#E63946] border border-[#E63946]/50 bg-[#FFF5F5] px-2.5 py-0.5 rounded-sm font-medium">
                      Maintenance Mode
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Hotel Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full border border-[#E5E7EB] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
              <h3 className="text-[16px] font-bold text-[#111827]">
                Add New Hotel Property
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#9CA3AF] hover:text-[#111827]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddHotel} className="p-6 space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-[#4B5563] uppercase tracking-wider mb-1">
                  Property Name
                </label>
                <input
                  type="text"
                  required
                  value={newHotel.name}
                  onChange={(e) =>
                    setNewHotel({ ...newHotel, name: e.target.value })
                  }
                  placeholder="e.g. Meridian Coastal Resort"
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-md text-[13px] text-[#111827] focus:outline-none focus:border-[#E63946]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#4B5563] uppercase tracking-wider mb-1">
                    Assigned Area
                  </label>
                  <select
                    value={newHotel.area}
                    onChange={(e) =>
                      setNewHotel({ ...newHotel, area: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-md text-[13px] text-[#111827] focus:outline-none focus:border-[#E63946]"
                  >
                    <option value="North Area">North Area</option>
                    <option value="South Area">South Area</option>
                    <option value="West Area">West Area</option>
                    <option value="East Area">East Area</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#4B5563] uppercase tracking-wider mb-1">
                    Total Rooms
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newHotel.rooms}
                    onChange={(e) =>
                      setNewHotel({
                        ...newHotel,
                        rooms: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-md text-[13px] text-[#111827] focus:outline-none focus:border-[#E63946]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#4B5563] uppercase tracking-wider mb-1">
                  General Manager
                </label>
                <input
                  type="text"
                  required
                  value={newHotel.manager}
                  onChange={(e) =>
                    setNewHotel({ ...newHotel, manager: e.target.value })
                  }
                  placeholder="e.g. S. Sen"
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-md text-[13px] text-[#111827] focus:outline-none focus:border-[#E63946]"
                />
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
                  Add Property
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
