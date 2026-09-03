"use client";

import { useState, useEffect } from "react";
import { areasApi } from "@/lib/api";
import { Plus, X, Search, MapPin, CheckCircle2, RefreshCw } from "lucide-react";

interface Area {
  _id?: string;
  id: string;
  name: string;
  region: string;
  manager: string;
  hotelsCount: number;
  totalRooms: number;
  occupancy: string;
  revenue: string;
  status: "active" | "inactive";
}

export default function AreaManagementPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [newArea, setNewArea] = useState({
    name: "",
    region: "West Region",
    manager: "",
    hotelsCount: 1,
    totalRooms: 80,
  });

  const loadAreas = async () => {
    setIsLoading(true);
    try {
      const res = await areasApi.getAll();
      setAreas(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAreas();
  }, []);

  const handleCreateArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArea.name || !newArea.manager) return;

    try {
      const created = await areasApi.create({
        name: newArea.name,
        region: newArea.region,
        manager: newArea.manager,
        hotelsCount: Number(newArea.hotelsCount),
        totalRooms: Number(newArea.totalRooms),
        occupancy: "0%",
        revenue: "$0",
        status: "active",
      });

      setAreas([created, ...areas]);
      setIsModalOpen(false);
      setToastMsg(`✅ Area "${created.name}" saved to MongoDB database`);
      setTimeout(() => setToastMsg(null), 3500);

      setNewArea({ name: "", region: "West Region", manager: "", hotelsCount: 1, totalRooms: 80 });
    } catch (err) {
      console.error("Failed to create area:", err);
    }
  };

  const filteredAreas = areas.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.manager.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#111827] tracking-tight">
            Area Management
          </h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            Group properties geographically &amp; assign Area Managers (Database Persisted)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAreas}
            title="Refresh database records"
            className="p-2 border border-[#D1D5DB] rounded text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#EC3013]" : ""}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white text-[13px] font-bold rounded shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Area Cluster</span>
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
            placeholder="Search area cluster, manager, or region..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#F9FAFB] border border-[#D1D5DB] rounded text-[13px] text-[#111827] focus:outline-none focus:border-[#EC3013]"
          />
        </div>
        <span className="text-[12px] text-[#6B7280]">
          Showing {filteredAreas.length} clusters in database
        </span>
      </div>

      {/* Areas Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider bg-[#F9FAFB]">
                <th className="py-3 px-4 font-bold">AREA CLUSTER</th>
                <th className="py-3 px-4 font-bold">REGION</th>
                <th className="py-3 px-4 font-bold">ASSIGNED AREA MANAGER</th>
                <th className="py-3 px-4 font-bold">HOTELS</th>
                <th className="py-3 px-4 font-bold">ROOMS</th>
                <th className="py-3 px-4 font-bold">OCCUPANCY</th>
                <th className="py-3 px-4 text-right font-bold">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#9CA3AF]">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#EC3013]" />
                      <span>Loading area clusters from database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredAreas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#9CA3AF]">
                    No area clusters registered in database yet. Click &quot;Create Area Cluster&quot; to add one.
                  </td>
                </tr>
              ) : (
                filteredAreas.map((area) => (
                  <tr key={area.id || area._id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#111827]">
                      {area.name}
                    </td>
                    <td className="py-3.5 px-4 text-[#4B5563]">
                      {area.region}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#111827]">
                      {area.manager}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#374151]">
                      {area.hotelsCount || 1} Properties
                    </td>
                    <td className="py-3.5 px-4 text-[#4B5563]">
                      {area.totalRooms || 0} Rooms
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#111827]">
                      {area.occupancy || "0%"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded capitalize bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {area.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Area Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 space-y-4 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#EC3013]" />
                <h3 className="text-[16px] font-bold text-[#111827]">Create Area Cluster</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#9CA3AF] hover:text-[#111827] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateArea} className="space-y-4 text-[13px]">
              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                  Area Cluster Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Western Corridor"
                  value={newArea.name}
                  onChange={(e) => setNewArea({ ...newArea, name: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded focus:outline-none focus:border-[#EC3013]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Region
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. West Region"
                    value={newArea.region}
                    onChange={(e) => setNewArea({ ...newArea, region: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Hotels Count
                  </label>
                  <input
                    type="number"
                    value={newArea.hotelsCount}
                    onChange={(e) => setNewArea({ ...newArea, hotelsCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                  Assigned Area Manager Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Mercer"
                  value={newArea.manager}
                  onChange={(e) => setNewArea({ ...newArea, manager: e.target.value })}
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
                  Save to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
