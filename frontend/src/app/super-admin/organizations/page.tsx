"use client";

import { useState, useEffect } from "react";
import { organizationsApi } from "@/lib/api";
import { Organization } from "@/types";
import { Plus, X, Search, RefreshCw, CheckCircle2, Building, Users, Lock, Eye, EyeOff, Key } from "lucide-react";

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [newOrg, setNewOrg] = useState<{
    name: string;
    code: string;
    ownerName: string;
    ownerEmail: string;
    ownerPassword: string;
    hotelsCount: string | number;
    activeRooms: string | number;
    monthlyRevenue: string | number;
    status: Organization["status"];
  }>({
    name: "",
    code: "",
    ownerName: "",
    ownerEmail: "",
    ownerPassword: "",
    hotelsCount: "",
    activeRooms: "",
    monthlyRevenue: "",
    status: "active",
  });

  const loadOrgs = async () => {
    setIsLoading(true);
    try {
      const data = await organizationsApi.getAll();
      setOrganizations(data);
    } catch (e) {
      console.error("Failed to load organizations:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrgs();
  }, []);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrg.name || !newOrg.ownerName || !newOrg.ownerEmail) {
      setToastMsg("⚠️ Please enter organization name, owner name, and owner email.");
      return;
    }

    if (!newOrg.ownerPassword.trim() || newOrg.ownerPassword.trim().length < 6) {
      setToastMsg("⚠️ Please set a password (min 6 characters) for this organization owner.");
      return;
    }

    const assignedPassword = newOrg.ownerPassword.trim();
    const assignedEmail = newOrg.ownerEmail.toLowerCase().trim();

    try {
      const created = await organizationsApi.create({
        name: newOrg.name.trim(),
        code: (newOrg.code.trim() || newOrg.name.toUpperCase().slice(0, 4)),
        ownerName: newOrg.ownerName.trim(),
        ownerEmail: assignedEmail,
        ownerPassword: assignedPassword,
        hotelsCount: Number(newOrg.hotelsCount) || 1,
        activeRooms: Number(newOrg.activeRooms) || 0,
        monthlyRevenue: Number(newOrg.monthlyRevenue) || 0,
        status: newOrg.status,
      });

      setOrganizations((prev) => [created, ...prev.filter((o) => o.id !== created.id)]);
      setIsModalOpen(false);
      setToastMsg(`✅ Organization "${created.name}" saved to database! Owner Login: ${assignedEmail} | Password: ${assignedPassword}`);
      setTimeout(() => setToastMsg(null), 8000);

      setNewOrg({
        name: "",
        code: "",
        ownerName: "",
        ownerEmail: "",
        ownerPassword: "",
        hotelsCount: "",
        activeRooms: "",
        monthlyRevenue: "",
        status: "active",
      });
    } catch (err: any) {
      console.error("Failed to create organization:", err);
      setToastMsg(`❌ Failed to save organization: ${err?.message || "Server error"}`);
    }
  };

  const filtered = organizations.filter(
    (o) =>
      o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.ownerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header Section with Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#111827] tracking-tight">
            Organizations
          </h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            All hotel organizations &amp; hospitality chains registered on the platform ({organizations.length})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadOrgs}
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
            <span>Create Organization</span>
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
            placeholder="Search organization or owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#F9FAFB] border border-[#D1D5DB] rounded text-[13px] text-[#111827] focus:outline-none focus:border-[#EC3013]"
          />
        </div>
        <span className="text-[12px] text-[#6B7280]">
          Showing {filtered.length} of {organizations.length}
        </span>
      </div>

      {/* Organizations Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider bg-[#F9FAFB]">
                <th className="py-3 px-4 font-bold">ORGANIZATION</th>
                <th className="py-3 px-4 font-bold">OWNER</th>
                <th className="py-3 px-4 font-bold">HOTELS</th>
                <th className="py-3 px-4 font-bold">ACTIVE ROOMS</th>
                <th className="py-3 px-4 font-bold">MONTHLY REVENUE</th>
                <th className="py-3 px-4 text-right font-bold">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#9CA3AF]">
                    No organizations matching search
                  </td>
                </tr>
              ) : (
                filtered.map((org) => (
                  <tr key={org.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#111827]">{org.name}</div>
                      <div className="text-[11px] font-mono text-[#9CA3AF]">Code: {org.code || "ORG"}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#374151]">{org.ownerName}</div>
                      <div className="text-[11px] text-[#9CA3AF]">{org.ownerEmail}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#111827]">
                      {org.hotelsCount} Properties
                    </td>
                    <td className="py-3.5 px-4 text-[#4B5563]">
                      {org.activeRooms} Rooms
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#111827]">
                      ₹{org.monthlyRevenue?.toLocaleString?.() || org.monthlyRevenue}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                          org.status === "active"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : org.status === "trial"
                            ? "bg-blue-50 text-blue-800 border border-blue-200"
                            : "bg-rose-50 text-rose-800 border border-rose-200"
                        }`}
                      >
                        {org.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Organization Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <h3 className="text-[16px] font-bold text-[#111827]">Create Organization</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#9CA3AF] hover:text-[#111827] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrg} className="space-y-4 text-[13px]">
              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                  Organization / Chain Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grand Horizon Resorts"
                  value={newOrg.name}
                  onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded focus:outline-none focus:border-[#EC3013]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Org Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. GHR"
                    value={newOrg.code}
                    onChange={(e) => setNewOrg({ ...newOrg, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Initial Properties
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 1"
                    value={newOrg.hotelsCount}
                    onChange={(e) => setNewOrg({ ...newOrg, hotelsCount: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Owner Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. David Mercer"
                    value={newOrg.ownerName}
                    onChange={(e) => setNewOrg({ ...newOrg, ownerName: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded focus:outline-none focus:border-[#EC3013]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Owner Email (Login ID) *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="owner@hotel.com"
                    value={newOrg.ownerEmail}
                    onChange={(e) => setNewOrg({ ...newOrg, ownerEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded focus:outline-none focus:border-[#EC3013]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                  Owner Login Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="Enter new password for owner account (min 6 chars)..."
                    value={newOrg.ownerPassword}
                    onChange={(e) => setNewOrg({ ...newOrg, ownerPassword: e.target.value })}
                    className="w-full pl-3 pr-10 py-2 border border-[#D1D5DB] rounded focus:outline-none focus:border-[#EC3013] text-[13px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#9CA3AF] hover:text-[#4B5563]"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-[#6B7280] mt-1">
                  The Super Admin must set a new password for this hotel organization owner to log in.
                </p>
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
                  Save Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
