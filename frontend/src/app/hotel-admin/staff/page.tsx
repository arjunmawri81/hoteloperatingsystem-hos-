"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { staffApi, hotelsApi } from "@/lib/api";
import { Hotel, UserRole } from "@/types";
import { Plus, X, Search, Users, CheckCircle2, RefreshCw, Lock, Eye, EyeOff, Shield } from "lucide-react";

interface StaffMember {
  _id?: string;
  id: string;
  name: string;
  email: string;
  phone: string;
  hotel: string;
  department: "Reception" | "Housekeeping" | "Restaurant" | "Finance" | "Management" | "Area Operations";
  role: string;
  systemRole?: string;
  status: "active" | "inactive";
}

const DEPARTMENT_CONFIG: Record<
  StaffMember["department"],
  {
    systemRole: UserRole;
    systemRoleLabel: string;
    defaultDesignation: string;
    description: string;
  }
> = {
  Reception: {
    systemRole: "receptionist",
    systemRoleLabel: "Receptionist (/operations/front-desk)",
    defaultDesignation: "Front Desk Receptionist",
    description: "Front Desk PMS, Reservations, Room Map, & Guest CRM",
  },
  Housekeeping: {
    systemRole: "housekeeping",
    systemRoleLabel: "Housekeeping Staff (/operations/housekeeping)",
    defaultDesignation: "Housekeeping Attendant",
    description: "Room Cleaning Kanban, Room Map, & Housekeeping Inventory",
  },
  Restaurant: {
    systemRole: "restaurant_staff",
    systemRoleLabel: "Restaurant POS Staff (/operations/restaurant-pos)",
    defaultDesignation: "Restaurant POS Staff",
    description: "Table Orders, POS Billing, & Kitchen Inventory",
  },
  Finance: {
    systemRole: "finance",
    systemRoleLabel: "Finance & Billing Staff (/operations/billing)",
    defaultDesignation: "Accounts & Billing Executive",
    description: "Guest Folios, Invoices, & Revenue Settlement",
  },
  Management: {
    systemRole: "hotel_manager",
    systemRoleLabel: "Hotel Operations Manager (/operations)",
    defaultDesignation: "Hotel Operations Manager",
    description: "Full Operations PMS Control across All Modules",
  },
  "Area Operations": {
    systemRole: "area_manager",
    systemRoleLabel: "Area / Regional Manager (/area-manager)",
    defaultDesignation: "Area Regional Manager",
    description: "Multi-Property Regional Cluster Analytics",
  },
};

export default function StaffManagementPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [orgHotels, setOrgHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [newStaff, setNewStaff] = useState<{
    name: string;
    email: string;
    phone: string;
    hotel: string;
    department: StaffMember["department"] | "";
    role: string;
    systemRole: UserRole | "";
    password: string;
  }>({
    name: "",
    email: "",
    phone: "",
    hotel: "",
    department: "",
    role: "",
    systemRole: "",
    password: "",
  });

  const handleDepartmentChange = (dept: StaffMember["department"] | "") => {
    if (!dept) {
      setNewStaff((prev) => ({
        ...prev,
        department: "",
        systemRole: "",
        role: "",
      }));
      return;
    }

    const config = DEPARTMENT_CONFIG[dept];
    if (config) {
      setNewStaff((prev) => ({
        ...prev,
        department: dept,
        systemRole: config.systemRole,
        role: config.defaultDesignation,
      }));
    } else {
      setNewStaff((prev) => ({ ...prev, department: dept }));
    }
  };

  const loadStaff = async () => {
    if (isAuthLoading) return;
    setIsLoading(true);
    try {
      const effectiveOrgId = user?.orgId || "org-1";
      const [staffData, hotelsData] = await Promise.all([
        staffApi.getAll({ orgId: effectiveOrgId }),
        hotelsApi.getAll({ orgId: effectiveOrgId }),
      ]);
      setStaffList(staffData);
      setOrgHotels(hotelsData);
    } catch (e) {
      console.error("Failed to load staff:", e);
      setStaffList([]);
      setOrgHotels([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthLoading) {
      loadStaff();
    }
  }, [user?.orgId, isAuthLoading]);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name.trim() || !newStaff.email.trim()) {
      setToastMsg("⚠️ Please enter staff name and email.");
      return;
    }

    if (!newStaff.systemRole) {
      setToastMsg("⚠️ Please select a Department to assign the role.");
      return;
    }

    if (!newStaff.password || newStaff.password.length < 6) {
      setToastMsg("⚠️ Please enter a login password (min 6 characters) for this staff member.");
      return;
    }

    try {
      const effectiveOrgId = user?.orgId || "org-1";
      const created = await staffApi.create({
        orgId: effectiveOrgId,
        name: newStaff.name.trim(),
        email: newStaff.email.toLowerCase().trim(),
        phone: newStaff.phone.trim() || "+91 98000 00000",
        hotel: newStaff.hotel || (orgHotels[0]?.name || "Main Property"),
        department: (newStaff.department || "Reception") as any,
        role: newStaff.role.trim() || newStaff.systemRole,
        systemRole: newStaff.systemRole,
        password: newStaff.password.trim(),
        status: "active",
      });

      setStaffList((prev) => [created, ...prev.filter((s) => s.id !== created.id)]);
      setIsModalOpen(false);
      setToastMsg(`✅ Staff member "${newStaff.name}" saved to database! Login: ${newStaff.email} (${newStaff.systemRole})`);
      setTimeout(() => setToastMsg(null), 6000);

      setNewStaff({
        name: "",
        email: "",
        phone: "",
        hotel: "",
        department: "",
        role: "",
        systemRole: "",
        password: "",
      });
    } catch (err: any) {
      console.error("Failed to create staff:", err);
      setToastMsg(`❌ Failed to save staff member: ${err?.message || "Server error"}`);
    }
  };

  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.hotel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.role.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = deptFilter === "all" || s.department.toLowerCase() === deptFilter.toLowerCase();
    return matchesSearch && matchesDept;
  });

  const departments = ["all", "Reception", "Housekeeping", "Restaurant", "Finance", "Management", "Area Operations"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#111827] tracking-tight">
            Staff &amp; Role Management
          </h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            Personnel directory, property assignments, and RBAC roles (Database Persisted)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadStaff}
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
            <span>Add Staff Member</span>
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

      {/* Filters Bar */}
      <div className="bg-white p-3.5 rounded-lg border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setDeptFilter(dept)}
              className={`px-3 py-1.5 rounded text-[12px] font-semibold capitalize transition-colors ${
                deptFilter === dept
                  ? "bg-[#111827] text-white"
                  : "text-[#4B5563] hover:bg-[#F3F4F6]"
              }`}
            >
              {dept}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search staff, role, hotel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-1.5 bg-[#F9FAFB] border border-[#D1D5DB] rounded text-[13px] text-[#111827] focus:outline-none focus:border-[#EC3013] w-full sm:w-64"
          />
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider bg-[#F9FAFB]">
                <th className="py-3 px-4 font-bold">STAFF MEMBER</th>
                <th className="py-3 px-4 font-bold">ASSIGNED PROPERTY</th>
                <th className="py-3 px-4 font-bold">DEPARTMENT</th>
                <th className="py-3 px-4 font-bold">ROLE &amp; CAPABILITY</th>
                <th className="py-3 px-4 text-right font-bold">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#9CA3AF]">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#EC3013]" />
                      <span>Loading personnel records from database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-[#9CA3AF]">
                    No personnel records in database yet. Click &quot;Add Staff Member&quot; to register team members.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => (
                  <tr key={staff.id || staff._id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#111827]">{staff.name}</div>
                      <div className="text-[11px] text-[#9CA3AF]">{staff.email} · {staff.phone}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#374151]">
                      {staff.hotel}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-[#F3F4F6] text-[#374151] px-2 py-0.5 rounded text-[11px] font-bold">
                        {staff.department}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#111827] font-medium">
                      {staff.role}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded capitalize bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {staff.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 space-y-4 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#EC3013]" />
                <h3 className="text-[16px] font-bold text-[#111827]">Add Staff Member</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#9CA3AF] hover:text-[#111827] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-4 text-[13px]" autoComplete="off">
              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. David Mercer"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded focus:outline-none focus:border-[#EC3013]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    name="new_staff_member_email"
                    autoComplete="new-password"
                    placeholder="e.g. staff@hotel.com"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98000 00000"
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Assigned Property
                  </label>
                  <select
                    value={newStaff.hotel}
                    onChange={(e) => setNewStaff({ ...newStaff, hotel: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded bg-white"
                  >
                    <option value="">Select Property...</option>
                    {orgHotels.map((h) => (
                      <option key={h.id} value={h.name}>
                        {h.name}
                      </option>
                    ))}
                    {orgHotels.length === 0 && (
                      <option value="Head Office / Central Operations">
                        Head Office / Central Operations
                      </option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Department *
                  </label>
                  <select
                    required
                    value={newStaff.department}
                    onChange={(e) => handleDepartmentChange(e.target.value as any)}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded bg-white font-medium text-[#111827] focus:outline-none focus:border-[#EC3013]"
                  >
                    <option value="">Select Department...</option>
                    <option value="Reception">Reception (Receptionist)</option>
                    <option value="Housekeeping">Housekeeping (Housekeeping Staff)</option>
                    <option value="Restaurant">Restaurant (Restaurant POS Staff)</option>
                    <option value="Finance">Finance (Accounts & Billing)</option>
                    <option value="Management">Management (Hotel Manager)</option>
                    <option value="Area Operations">Area Operations (Area Manager)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Designation / Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Front Desk Receptionist"
                    value={newStaff.role}
                    onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded focus:outline-none focus:border-[#EC3013]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    System Login Role (1:1 Strict)
                  </label>
                  {newStaff.department && DEPARTMENT_CONFIG[newStaff.department as StaffMember["department"]] ? (
                    <div className="px-3 py-2 bg-[#F3F4F6] border border-[#E5E7EB] rounded text-[12px] font-semibold text-[#111827] flex items-center justify-between">
                      <span className="truncate">
                        {DEPARTMENT_CONFIG[newStaff.department as StaffMember["department"]].systemRoleLabel}
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded shrink-0 ml-1.5 uppercase">
                        1:1 Strict
                      </span>
                    </div>
                  ) : (
                    <div className="px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded text-[12px] text-[#9CA3AF]">
                      Auto-assigned by Department
                    </div>
                  )}
                </div>
              </div>

              {newStaff.department && DEPARTMENT_CONFIG[newStaff.department as StaffMember["department"]] && (
                <div className="p-2.5 bg-gray-50 border border-gray-200 rounded text-[11px] text-[#4B5563] flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#EC3013] shrink-0" />
                  <span>
                    <strong>Module Access:</strong> {DEPARTMENT_CONFIG[newStaff.department as StaffMember["department"]].description}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                  Staff Login Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    name="new_staff_member_password"
                    autoComplete="new-password"
                    placeholder="e.g. Pass@123 (min 6 chars)..."
                    value={newStaff.password}
                    onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                    className="w-full pl-3 pr-10 py-2 border border-[#D1D5DB] rounded focus:outline-none focus:border-[#EC3013] text-[13px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#9CA3AF] hover:text-[#4B5563]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-[#9CA3AF] mt-1">
                  The staff member will use this email and password to log in at <code>/login</code>.
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
                  className="px-5 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white font-bold rounded shadow-xs cursor-pointer"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
