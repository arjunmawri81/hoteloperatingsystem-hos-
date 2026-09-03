"use client";

import { useState, useEffect } from "react";
import { hotelsApi } from "@/lib/api";
import { Hotel } from "@/types";
import { Plus, X, Search, RefreshCw, CheckCircle2, Building2, MapPin } from "lucide-react";

export default function HotelsManagementPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [newHotel, setNewHotel] = useState({
    name: "",
    city: "Mumbai",
    region: "West Zone",
    totalRooms: 80,
    managerName: "General Manager",
    phone: "+91 99999 12345",
  });

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

  const handleAddHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHotel.name) return;

    try {
      const created = await hotelsApi.create({
        name: newHotel.name,
        city: newHotel.city,
        region: newHotel.region,
        totalRooms: Number(newHotel.totalRooms),
        managerName: newHotel.managerName,
        phone: newHotel.phone,
      });

      setHotels([created, ...hotels]);
      setIsModalOpen(false);
      setToastMsg(`✅ Property "${created.name}" added to portfolio`);
      setTimeout(() => setToastMsg(null), 4000);

      setNewHotel({
        name: "",
        city: "Mumbai",
        region: "West Zone",
        totalRooms: 80,
        managerName: "General Manager",
        phone: "+91 99999 12345",
      });
    } catch (err) {
      console.error(err);
    }
  };

  const filteredHotels = hotels.filter(
    (h) =>
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.managerName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#111827] tracking-tight">
            Hotel Properties
          </h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            Manage your chain properties, room capacities, and regional allocation ({hotels.length} hotels)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadHotels}
            title="Refresh"
            className="p-2 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] rounded text-[#4B5563]"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#EC3013]" : ""}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white text-[13px] font-bold rounded shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Property</span>
          </button>
        </div>
      </div>

      {/* Toast Notice */}
      {toastMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-[13px] px-4 py-2.5 rounded flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-lg border border-[#E5E7EB] flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search hotel, city or manager..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#F9FAFB] border border-[#D1D5DB] rounded text-[13px] text-[#111827] focus:outline-none focus:border-[#EC3013]"
          />
        </div>
        <span className="text-[12px] text-[#6B7280]">
          Showing {filteredHotels.length} of {hotels.length}
        </span>
      </div>

      {/* Hotels Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider bg-[#F9FAFB]">
                <th className="py-3 px-4 font-bold">HOTEL NAME</th>
                <th className="py-3 px-4 font-bold">LOCATION</th>
                <th className="py-3 px-4 font-bold">GENERAL MANAGER</th>
                <th className="py-3 px-4 font-bold">TOTAL ROOMS</th>
                <th className="py-3 px-4 font-bold">OCCUPANCY</th>
                <th className="py-3 px-4 text-right font-bold">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {filteredHotels.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#9CA3AF]">
                    No hotel properties matching search
                  </td>
                </tr>
              ) : (
                filteredHotels.map((h) => (
                  <tr key={h.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#111827]">{h.name}</div>
                      <div className="text-[11px] text-[#9CA3AF]">{h.phone || "+1 555 0192"}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[#374151]">
                      <div>{h.city || "City Center"}</div>
                      <div className="text-[11px] text-[#9CA3AF]">{h.region || "Central"}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#111827]">
                      {h.managerName}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#374151]">
                      {h.totalRooms} Rooms
                    </td>
                    <td className="py-3.5 px-4 text-[#4B5563]">
                      <span className="font-bold text-[#111827]">{h.occupancyRate || 80}%</span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded capitalize bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Active
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Hotel Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#EC3013]" />
                <h3 className="text-[16px] font-bold text-[#111827]">Add Hotel Property</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#9CA3AF] hover:text-[#111827] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddHotel} className="space-y-4 text-[13px]">
              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                  Property Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Meridian Seaside Resort"
                  value={newHotel.name}
                  onChange={(e) => setNewHotel({ ...newHotel, name: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded focus:outline-none focus:border-[#EC3013]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Goa"
                    value={newHotel.city}
                    onChange={(e) => setNewHotel({ ...newHotel, city: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Region / Area
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Coastal Area"
                    value={newHotel.region}
                    onChange={(e) => setNewHotel({ ...newHotel, region: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Total Rooms
                  </label>
                  <input
                    type="number"
                    value={newHotel.totalRooms}
                    onChange={(e) => setNewHotel({ ...newHotel, totalRooms: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    General Manager
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. R. Sharma"
                    value={newHotel.managerName}
                    onChange={(e) => setNewHotel({ ...newHotel, managerName: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  placeholder="+1 555 0199"
                  value={newHotel.phone}
                  onChange={(e) => setNewHotel({ ...newHotel, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
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
                  Save Property
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
