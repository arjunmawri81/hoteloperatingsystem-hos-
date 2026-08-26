"use client";

import { useState } from "react";
import { X } from "lucide-react";

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState([
    {
      id: "org-1",
      name: "Meridian Hotels & Resorts",
      owner: "A. Whitfield",
      hotels: 4,
      users: 62,
      subscription: "Enterprise",
      status: "Active",
    },
    {
      id: "org-2",
      name: "Sunstone Hospitality",
      owner: "D. Mercer",
      hotels: 6,
      users: 91,
      subscription: "Growth",
      status: "Active",
    },
    {
      id: "org-3",
      name: "Coastal Retreats",
      owner: "P. Nakamura",
      hotels: 3,
      users: 34,
      subscription: "Growth",
      status: "Active",
    },
    {
      id: "org-4",
      name: "Blue Horizon Hotels",
      owner: "S. Kapoor",
      hotels: 5,
      users: 48,
      subscription: "Enterprise",
      status: "Trial",
    },
    {
      id: "org-5",
      name: "Zenith Stays",
      owner: "L. Ferreira",
      hotels: 2,
      users: 19,
      subscription: "Starter",
      status: "Suspended",
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newOrg, setNewOrg] = useState({
    name: "",
    owner: "",
    hotels: 1,
    users: 10,
    subscription: "Enterprise",
    status: "Active",
  });

  const handleCreateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrg.name || !newOrg.owner) return;
    setOrganizations([
      ...organizations,
      {
        id: `org-${Date.now()}`,
        ...newOrg,
      },
    ]);
    setIsModalOpen(false);
    setNewOrg({
      name: "",
      owner: "",
      hotels: 1,
      users: 10,
      subscription: "Enterprise",
      status: "Active",
    });
  };

  return (
    <div className="space-y-8">
      {/* Top Header Section with Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#111827] tracking-tight">
            Organizations
          </h1>
          <p className="text-[14px] text-[#6B7280] mt-1">
            All hotel organizations registered on the platform
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="self-start sm:self-auto px-5 py-2.5 bg-[#E63946] hover:bg-[#D62839] text-white text-[13px] font-bold rounded-sm shadow-sm transition-colors cursor-pointer"
        >
          Create Organization
        </button>
      </div>

      {/* Organizations Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#E5E7EB] text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
              <th className="pb-3 pr-6 font-bold">ORGANIZATION</th>
              <th className="pb-3 pr-6 font-bold">OWNER</th>
              <th className="pb-3 pr-6 font-bold">HOTELS</th>
              <th className="pb-3 pr-6 font-bold">USERS</th>
              <th className="pb-3 pr-6 font-bold">SUBSCRIPTION</th>
              <th className="pb-3 text-right font-bold">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3F4F6] text-[14px]">
            {organizations.map((org) => (
              <tr
                key={org.id}
                className={`hover:bg-[#F9FAFB]/80 transition-colors ${
                  org.status === "Suspended" ? "bg-[#FAF5F5]/40" : ""
                }`}
              >
                <td className="py-4 pr-6 font-medium text-[#111827]">
                  {org.name}
                </td>
                <td className="py-4 pr-6 text-[#4B5563]">{org.owner}</td>
                <td className="py-4 pr-6 text-[#4B5563]">{org.hotels}</td>
                <td className="py-4 pr-6 text-[#4B5563]">{org.users}</td>
                <td className="py-4 pr-6 text-[#4B5563]">
                  {org.subscription}
                </td>
                <td className="py-4 text-right">
                  {org.status === "Active" && (
                    <span className="text-[12px] text-[#4B5563] bg-[#F3F4F6] px-2.5 py-1 rounded-sm">
                      Active
                    </span>
                  )}
                  {org.status === "Trial" && (
                    <span className="text-[12px] text-[#E63946] border border-[#E63946]/50 bg-[#FFF5F5] px-2.5 py-0.5 rounded-sm font-medium">
                      Trial
                    </span>
                  )}
                  {org.status === "Suspended" && (
                    <span className="text-[12px] text-[#E63946] bg-[#FDE8E8] px-2.5 py-1 rounded-sm font-medium">
                      Suspended
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Organization Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full border border-[#E5E7EB] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
              <h3 className="text-[16px] font-bold text-[#111827]">
                Create New Organization
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#9CA3AF] hover:text-[#111827]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrg} className="p-6 space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-[#4B5563] uppercase tracking-wider mb-1">
                  Organization Name
                </label>
                <input
                  type="text"
                  required
                  value={newOrg.name}
                  onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                  placeholder="e.g. Royal Mirage Hotels"
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-md text-[13px] text-[#111827] focus:outline-none focus:border-[#E63946]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#4B5563] uppercase tracking-wider mb-1">
                  Owner / Administrator
                </label>
                <input
                  type="text"
                  required
                  value={newOrg.owner}
                  onChange={(e) => setNewOrg({ ...newOrg, owner: e.target.value })}
                  placeholder="e.g. R. K. Singhania"
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-md text-[13px] text-[#111827] focus:outline-none focus:border-[#E63946]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#4B5563] uppercase tracking-wider mb-1">
                    Hotels Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newOrg.hotels}
                    onChange={(e) =>
                      setNewOrg({ ...newOrg, hotels: parseInt(e.target.value) || 1 })
                    }
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-md text-[13px] text-[#111827] focus:outline-none focus:border-[#E63946]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#4B5563] uppercase tracking-wider mb-1">
                    Subscription Tier
                  </label>
                  <select
                    value={newOrg.subscription}
                    onChange={(e) =>
                      setNewOrg({ ...newOrg, subscription: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-md text-[13px] text-[#111827] focus:outline-none focus:border-[#E63946]"
                  >
                    <option value="Enterprise">Enterprise</option>
                    <option value="Growth">Growth</option>
                    <option value="Starter">Starter</option>
                  </select>
                </div>
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
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
