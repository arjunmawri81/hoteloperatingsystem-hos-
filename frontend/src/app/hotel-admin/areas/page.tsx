"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { areasApi } from "@/lib/api";
import { Plus, X, Search, MapPin, CheckCircle2, RefreshCw, Eye, EyeOff, Lock, Building2, BedDouble, Users } from "lucide-react";

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
  const { user, isLoading: isAuthLoading } = useAuth();
  const [areas, setAreas] = useState<Area[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [newArea, setNewArea] = useState<{
    name: string;
    region: string;
    manager: string;
    managerEmail: string;
    managerPassword: string;
    hotelsCount: string | number;
    totalRooms: string | number;
  }>({
    name: "",
    region: "",
    manager: "",
    managerEmail: "",
    managerPassword: "",
    hotelsCount: "",
    totalRooms: "",
  });

  const loadAreas = async () => {
    if (isAuthLoading) return;
    setIsLoading(true);
    try {
      const effectiveOrgId = user?.orgId;
      const res = await areasApi.getAll(effectiveOrgId ? { orgId: effectiveOrgId } : undefined);
      setAreas(res);
    } catch (e) {
      console.error("Failed to load areas:", e);
      setAreas([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthLoading) {
      loadAreas();
    }
  }, [user?.orgId, isAuthLoading]);

  const handleCreateArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArea.name.trim() || !newArea.manager.trim()) return;

    try {
      const effectiveOrgId = user?.orgId;
      const created = await areasApi.create({
        ...(effectiveOrgId ? { orgId: effectiveOrgId } : {}),
        name: newArea.name.trim(),
        region: newArea.region.trim() || "General Zone",
        manager: newArea.manager.trim(),
        managerEmail: newArea.managerEmail.trim(),
        managerPassword: newArea.managerPassword.trim(),
        hotelsCount: Number(newArea.hotelsCount) || 1,
        totalRooms: Number(newArea.totalRooms) || 0,
        occupancy: "0%",
        revenue: "₹0",
        status: "active",
      });

      setAreas((prev) => [created, ...prev.filter((a) => a.id !== created.id)]);
      setIsModalOpen(false);
      setToastMsg(`✅ Area "${created.name}" saved to database! ${newArea.managerEmail ? `Manager Login: ${newArea.managerEmail}` : ""}`);
      setTimeout(() => setToastMsg(null), 5000);

      setNewArea({
        name: "",
        region: "",
        manager: "",
        managerEmail: "",
        managerPassword: "",
        hotelsCount: "",
        totalRooms: "",
      });
    } catch (err: any) {
      console.error("Failed to create area:", err);
      setToastMsg(`❌ Failed to save area cluster: ${err?.message || "Server error"}`);
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
          <h1 className="text-[26px] font-bold text-[#0F172A] tracking-[-0.02em]">
            Area Management
          </h1>
          <p className="text-[13px] text-[#64748B] mt-1 font-normal">
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

      {/* 4 Area Metric Cards (Vibrant Reference Style - Red, Green, Orange, Cyan) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="relative overflow-hidden bg-[#E53935] hover:bg-[#D32F2F] p-6 rounded-xl text-white shadow-lg shadow-red-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-1">
              <div className="text-[34px] font-extrabold tracking-tight leading-none text-white drop-shadow-xs">
                {areas.length}
              </div>
              <div className="text-[12px] font-semibold text-white/90 uppercase tracking-wide">
                Total Clusters
              </div>
              <div className="text-[11px] text-white/75 font-medium truncate max-w-[150px]">
                Regional zone divisions
              </div>
            </div>
            <div className="w-14 h-14 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10 text-white/90 shrink-0 group-hover:scale-105 group-hover:bg-white/20 transition-all">
              <MapPin className="w-7 h-7 stroke-[2]" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-[#43A047] hover:bg-[#388E3C] p-6 rounded-xl text-white shadow-lg shadow-green-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-1">
              <div className="text-[34px] font-extrabold tracking-tight leading-none text-white drop-shadow-xs">
                {areas.reduce((acc, a) => acc + (Number(a.hotelsCount) || 1), 0)}
              </div>
              <div className="text-[12px] font-semibold text-white/90 uppercase tracking-wide">
                Properties In Clusters
              </div>
              <div className="text-[11px] text-white/75 font-medium truncate max-w-[150px]">
                Covered hotels
              </div>
            </div>
            <div className="w-14 h-14 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10 text-white/90 shrink-0 group-hover:scale-105 group-hover:bg-white/20 transition-all">
              <Building2 className="w-7 h-7 stroke-[2]" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-[#FB8C00] hover:bg-[#F57C00] p-6 rounded-xl text-white shadow-lg shadow-orange-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-1">
              <div className="text-[34px] font-extrabold tracking-tight leading-none text-white drop-shadow-xs">
                {areas.reduce((acc, a) => acc + (Number(a.totalRooms) || 0), 0)}
              </div>
              <div className="text-[12px] font-semibold text-white/90 uppercase tracking-wide">
                Total Cluster Rooms
              </div>
              <div className="text-[11px] text-white/75 font-medium truncate max-w-[150px]">
                Combined room units
              </div>
            </div>
            <div className="w-14 h-14 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10 text-white/90 shrink-0 group-hover:scale-105 group-hover:bg-white/20 transition-all">
              <BedDouble className="w-7 h-7 stroke-[2]" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-[#00ACC1] hover:bg-[#0097A7] p-6 rounded-xl text-white shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-1">
              <div className="text-[34px] font-extrabold tracking-tight leading-none text-white drop-shadow-xs">
                {new Set(areas.map((a) => a.manager).filter(Boolean)).size}
              </div>
              <div className="text-[12px] font-semibold text-white/90 uppercase tracking-wide">
                Assigned Managers
              </div>
              <div className="text-[11px] text-white/75 font-medium truncate max-w-[150px]">
                Dedicated area leadership
              </div>
            </div>
            <div className="w-14 h-14 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10 text-white/90 shrink-0 group-hover:scale-105 group-hover:bg-white/20 transition-all">
              <Users className="w-7 h-7 stroke-[2]" />
            </div>
          </div>
        </div>
      </div>

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
                    placeholder="e.g. 1"
                    value={newArea.hotelsCount}
                    onChange={(e) => setNewArea({ ...newArea, hotelsCount: e.target.value })}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Manager Email (Login ID)
                  </label>
                  <input
                    type="email"
                    placeholder="manager@hotel.com"
                    value={newArea.managerEmail}
                    onChange={(e) => setNewArea({ ...newArea, managerEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Manager Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      minLength={6}
                      placeholder="Min 6 chars..."
                      value={newArea.managerPassword}
                      onChange={(e) => setNewArea({ ...newArea, managerPassword: e.target.value })}
                      className="w-full pl-3 pr-9 py-2 border border-[#D1D5DB] rounded text-[13px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#9CA3AF] hover:text-[#4B5563]"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
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
                  className="px-5 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white font-bold rounded shadow-xs cursor-pointer"
                >
                  Create Area Cluster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
