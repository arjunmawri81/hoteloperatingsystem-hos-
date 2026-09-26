"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { staffApi, hotelsApi } from "@/lib/api";
import { Hotel, UserRole } from "@/types";
import {
  Plus,
  X,
  Search,
  Users,
  CheckCircle2,
  RefreshCw,
  Eye,
  EyeOff,
  Shield,
  Building2,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  MapPin,
  UserCheck,
  Mail,
  Phone,
  BedDouble,
  Briefcase,
} from "lucide-react";

interface StaffMember {
  _id?: string;
  id: string;
  name: string;
  email: string;
  phone: string;
  hotel: string;
  department:
    | "Reception"
    | "Cash Counter"
    | "Housekeeping"
    | "Restaurant"
    | "Kitchen"
    | "Inventory"
    | "Banquet & Events"
    | "Channel Manager"
    | "Finance"
    | "Management"
    | "Area Operations";
  role: string;
  systemRole?: string;
  status: "active" | "inactive";
  assignedHotelNames?: string[];
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
    description: "Front Desk PMS, 3-Step Walk-In, Room Map, & WhatsApp Web Check-In",
  },
  "Cash Counter": {
    systemRole: "finance",
    systemRoleLabel: "Front Office Cashier (/operations/cash-counter)",
    defaultDesignation: "Front Office Cashier",
    description: "Cash Counter, Shift Opening Float, Denomination Counter & Shortage Audit",
  },
  Housekeeping: {
    systemRole: "housekeeping",
    systemRoleLabel: "Housekeeping Staff (/operations/housekeeping)",
    defaultDesignation: "Housekeeping Attendant",
    description: "Room Cleaning Kanban, Room Map Status, & Linen Verification",
  },
  Restaurant: {
    systemRole: "restaurant_staff",
    systemRoleLabel: "Restaurant POS Waiter (/operations/restaurant-pos)",
    defaultDesignation: "Restaurant POS Staff / Waiter",
    description: "Dine-in Tables, Table Transfer, 86 Out-of-Stock, & Room Folio Billing",
  },
  Kitchen: {
    systemRole: "kitchen_staff",
    systemRoleLabel: "Kitchen Chef / Cook (/operations/kitchen-kds)",
    defaultDesignation: "Head Chef / Kitchen Cook",
    description: "Kitchen Order Tickets (KOT) Display Screen & Cooking Status",
  },
  Inventory: {
    systemRole: "inventory_staff",
    systemRoleLabel: "Storekeeper / Inventory Executive (/operations/inventory)",
    defaultDesignation: "Storekeeper / Inventory Executive",
    description: "Departmental Stores, GRN Purchase Inward with GSTIN, & Staff Stock Issues",
  },
  "Banquet & Events": {
    systemRole: "banquet_staff",
    systemRoleLabel: "Banquet & Events Manager (/operations/banquet)",
    defaultDesignation: "Banquet Sales & Event Manager",
    description: "Ballrooms, Corporate Events, Packages, & Advance Booking Contracts",
  },
  "Channel Manager": {
    systemRole: "channel_manager",
    systemRoleLabel: "Revenue & Channel Manager (/operations/channel-manager)",
    defaultDesignation: "Revenue & Channel Manager",
    description: "OTA Two-Way Sync (MakeMyTrip, Booking.com), Rate Multipliers & Stop Sell",
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
  const [viewMode, setViewMode] = useState<"hotel_wise" | "all_table">("hotel_wise");
  const [expandedHotelIds, setExpandedHotelIds] = useState<Record<string, boolean>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetHotelName, setTargetHotelName] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [newStaff, setNewStaff] = useState<{
    name: string;
    email: string;
    phone: string;
    hotel: string;
    assignedHotels: string[];
    department: StaffMember["department"] | "";
    role: string;
    systemRole: UserRole | "";
    password: string;
  }>({
    name: "",
    email: "",
    phone: "",
    hotel: "",
    assignedHotels: [],
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
      const effectiveOrgId = user?.orgId;
      const [staffData, hotelsData] = await Promise.all([
        staffApi.getAll(effectiveOrgId ? { orgId: effectiveOrgId } : undefined),
        hotelsApi.getAll(effectiveOrgId ? { orgId: effectiveOrgId } : undefined),
      ]);
      setStaffList(staffData);
      setOrgHotels(hotelsData);

      // Auto expand all hotels by default for easy viewing
      const initialExpanded: Record<string, boolean> = {};
      hotelsData.forEach((h) => {
        initialExpanded[h.id] = true;
      });
      initialExpanded["central_ops"] = true;
      setExpandedHotelIds(initialExpanded);
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

  const toggleHotelExpand = (hotelId: string) => {
    setExpandedHotelIds((prev) => ({
      ...prev,
      [hotelId]: !prev[hotelId],
    }));
  };

  const openAddStaffForHotel = (hotelName: string) => {
    setTargetHotelName(hotelName);
    setNewStaff({
      name: "",
      email: "",
      phone: "",
      hotel: hotelName,
      assignedHotels: hotelName ? [hotelName] : [],
      department: "Reception",
      role: DEPARTMENT_CONFIG.Reception.defaultDesignation,
      systemRole: DEPARTMENT_CONFIG.Reception.systemRole,
      password: "",
    });
    setIsModalOpen(true);
  };

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
      const effectiveOrgId = user?.orgId;
      const created = await staffApi.create({
        ...(effectiveOrgId ? { orgId: effectiveOrgId } : {}),
        name: newStaff.name.trim(),
        email: newStaff.email.toLowerCase().trim(),
        phone: newStaff.phone.trim() || "+91 98000 00000",
        hotel:
          newStaff.assignedHotels.length > 0
            ? newStaff.assignedHotels.join(", ")
            : newStaff.hotel || (orgHotels[0]?.name || "Main Property"),
        assignedHotelNames: newStaff.assignedHotels,
        department: (newStaff.department || "Reception") as any,
        role: newStaff.role.trim() || newStaff.systemRole,
        systemRole: newStaff.systemRole,
        password: newStaff.password.trim(),
        status: "active",
      });

      setStaffList((prev) => [created, ...prev.filter((s) => s.id !== created.id)]);
      setIsModalOpen(false);
      setToastMsg(
        `✅ Staff member "${newStaff.name}" added to ${newStaff.hotel || "Hotel"} successfully!`
      );
      setTimeout(() => setToastMsg(null), 6000);
    } catch (err: any) {
      console.error("Failed to create staff:", err);
      setToastMsg(`❌ Failed to save staff member: ${err?.message || "Server error"}`);
    }
  };

  // Helper to get staff members belonging to a specific hotel
  const getStaffForHotel = (hotelName: string) => {
    return staffList.filter((s) => {
      const matchesHotel =
        (s.hotel && s.hotel.toLowerCase().includes(hotelName.toLowerCase())) ||
        (Array.isArray(s.assignedHotelNames) &&
          s.assignedHotelNames.some((n) => n.toLowerCase().includes(hotelName.toLowerCase())));

      const matchesSearch =
        !searchQuery ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.role.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDept =
        deptFilter === "all" || s.department.toLowerCase() === deptFilter.toLowerCase();

      return matchesHotel && matchesSearch && matchesDept;
    });
  };

  // Central / Area staff not tied to just one hotel
  const centralStaff = staffList.filter((s) => {
    const isArea =
      s.department === "Area Operations" ||
      s.systemRole === "area_manager" ||
      (s.hotel && s.hotel.includes(","));
    const matchesSearch =
      !searchQuery ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept =
      deptFilter === "all" || s.department.toLowerCase() === deptFilter.toLowerCase();
    return isArea && matchesSearch && matchesDept;
  });

  const departments = [
    "all",
    "Reception",
    "Cash Counter",
    "Housekeeping",
    "Restaurant",
    "Kitchen",
    "Inventory",
    "Banquet & Events",
    "Channel Manager",
    "Finance",
    "Management",
    "Area Operations",
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#0F172A] tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-[#EC3013]" /> Staff &amp; Roles by Hotel
          </h1>
          <p className="text-[13px] text-[#64748B] mt-1 font-normal">
            Hotel-wise team management: View staff members and add new staff directly to each hotel.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadStaff}
            title="Refresh database records"
            className="p-2 border border-[#D1D5DB] rounded-lg text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#EC3013]" : ""}`} />
          </button>

          {/* View Toggle */}
          <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex text-xs font-semibold">
            <button
              onClick={() => setViewMode("hotel_wise")}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "hotel_wise"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-[#EC3013]" />
              <span>By Hotel Properties</span>
            </button>
            <button
              onClick={() => setViewMode("all_table")}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "all_table"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>All Staff Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notice */}
      {toastMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-[13px] px-4 py-2.5 rounded-lg flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 4 Staff Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#E53935] p-5 rounded-xl text-white shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[30px] font-extrabold tracking-tight leading-none text-white">
              {staffList.length}
            </div>
            <div className="text-[11px] font-bold text-white/90 uppercase tracking-wider mt-1">
              Total Staff Members
            </div>
            <div className="text-[10px] text-white/75 mt-0.5">Across {orgHotels.length} properties</div>
          </div>
          <div className="w-12 h-12 rounded-full border border-white/30 flex items-center justify-center bg-white/10">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#43A047] p-5 rounded-xl text-white shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[30px] font-extrabold tracking-tight leading-none text-white">
              {staffList.filter((s) => ["Reception", "Cash Counter", "Housekeeping", "Restaurant", "Kitchen"].includes(s.department)).length}
            </div>
            <div className="text-[11px] font-bold text-white/90 uppercase tracking-wider mt-1">
              Frontline PMS Staff
            </div>
            <div className="text-[10px] text-white/75 mt-0.5">Front desk, Housekeeping, KDS</div>
          </div>
          <div className="w-12 h-12 rounded-full border border-white/30 flex items-center justify-center bg-white/10">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#FB8C00] p-5 rounded-xl text-white shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[30px] font-extrabold tracking-tight leading-none text-white">
              {staffList.filter((s) => ["Channel Manager", "Finance", "Banquet & Events", "Inventory"].includes(s.department)).length}
            </div>
            <div className="text-[11px] font-bold text-white/90 uppercase tracking-wider mt-1">
              Revenue &amp; Inventory
            </div>
            <div className="text-[10px] text-white/75 mt-0.5">OTAs, Banquets &amp; Stores</div>
          </div>
          <div className="w-12 h-12 rounded-full border border-white/30 flex items-center justify-center bg-white/10">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#00ACC1] p-5 rounded-xl text-white shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[30px] font-extrabold tracking-tight leading-none text-white">
              {staffList.filter((s) => ["Management", "Area Operations"].includes(s.department) || s.systemRole === "hotel_manager" || s.systemRole === "area_manager").length}
            </div>
            <div className="text-[11px] font-bold text-white/90 uppercase tracking-wider mt-1">
              Supervisors &amp; GMs
            </div>
            <div className="text-[10px] text-white/75 mt-0.5">General &amp; Area Managers</div>
          </div>
          <div className="w-12 h-12 rounded-full border border-white/30 flex items-center justify-center bg-white/10">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setDeptFilter(dept)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold capitalize transition-colors cursor-pointer shrink-0 ${
                deptFilter === dept
                  ? "bg-slate-900 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {dept}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search staff, role, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-[#EC3013] w-full sm:w-64"
          />
        </div>
      </div>

      {/* MAIN VIEW: 1. Hotel-Wise Grouping (Requested by User) */}
      {viewMode === "hotel_wise" && (
        <div className="space-y-5">
          {orgHotels.length === 0 && !isLoading && (
            <div className="bg-white p-12 text-center border border-slate-200 rounded-xl text-slate-500">
              No hotels found. Create hotel properties in the Hotels module first.
            </div>
          )}

          {orgHotels.map((hotel) => {
            const hotelStaff = getStaffForHotel(hotel.name);
            const isExpanded = expandedHotelIds[hotel.id] !== false;

            // Department count badges
            const receptionCount = hotelStaff.filter((s) => s.department === "Reception").length;
            const hkCount = hotelStaff.filter((s) => s.department === "Housekeeping").length;
            const kitchenCount = hotelStaff.filter((s) => s.department === "Kitchen").length;
            const restCount = hotelStaff.filter((s) => s.department === "Restaurant").length;
            const managerCount = hotelStaff.filter((s) => s.department === "Management").length;

            return (
              <div
                key={hotel.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all"
              >
                {/* Hotel Header Card */}
                <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 shrink-0 shadow-xs">
                      <Building2 className="w-6 h-6" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                          {hotel.name}
                        </h2>
                        <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-red-500" />
                          <span>{hotel.city}</span>
                        </span>
                        <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-bold">
                          5★ Luxury
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 flex-wrap">
                        <span className="font-semibold text-slate-800">
                          {hotelStaff.length} Total Staff
                        </span>
                        <span>•</span>
                        {receptionCount > 0 && (
                          <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                            {receptionCount} Front Desk
                          </span>
                        )}
                        {hkCount > 0 && (
                          <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                            {hkCount} Housekeeping
                          </span>
                        )}
                        {kitchenCount > 0 && (
                          <span className="bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                            {kitchenCount} Kitchen
                          </span>
                        )}
                        {restCount > 0 && (
                          <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                            {restCount} Restaurant
                          </span>
                        )}
                        {managerCount > 0 && (
                          <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                            {managerCount} Manager
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions for this Hotel */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      onClick={() => openAddStaffForHotel(hotel.name)}
                      className="px-3.5 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Staff for this Hotel</span>
                    </button>

                    <button
                      onClick={() => toggleHotelExpand(hotel.id)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{isExpanded ? "Hide Staff" : `View Staff (${hotelStaff.length})`}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Staff Table for this Hotel */}
                {isExpanded && (
                  <div className="overflow-x-auto">
                    {hotelStaff.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-medium">No staff members registered for {hotel.name} yet.</p>
                        <button
                          onClick={() => openAddStaffForHotel(hotel.name)}
                          className="mt-2 text-xs font-bold text-[#EC3013] hover:underline"
                        >
                          + Add the first staff member now
                        </button>
                      </div>
                    ) : (
                      <table className="w-full text-left text-[13px]">
                        <thead>
                          <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/70">
                            <th className="py-2.5 px-4 font-bold">STAFF MEMBER</th>
                            <th className="py-2.5 px-4 font-bold">DEPARTMENT</th>
                            <th className="py-2.5 px-4 font-bold">ROLE &amp; MODULE ACCESS</th>
                            <th className="py-2.5 px-4 font-bold">CONTACT &amp; LOGIN</th>
                            <th className="py-2.5 px-4 text-right font-bold">STATUS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {hotelStaff.map((staff) => (
                            <tr key={staff.id || staff._id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-4">
                                <div className="font-bold text-slate-900 flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                                    {staff.name.slice(0, 1).toUpperCase()}
                                  </div>
                                  <span>{staff.name}</span>
                                </div>
                              </td>

                              <td className="py-3 px-4">
                                <span className="bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded text-[11px] font-bold">
                                  {staff.department}
                                </span>
                              </td>

                              <td className="py-3 px-4">
                                <div className="font-semibold text-slate-800">{staff.role}</div>
                                <div className="text-[11px] text-slate-400 font-mono">
                                  {staff.systemRole || "Staff"}
                                </div>
                              </td>

                              <td className="py-3 px-4">
                                <div className="text-xs text-slate-700 flex items-center gap-1.5">
                                  <Mail className="w-3 h-3 text-slate-400" />
                                  <span>{staff.email}</span>
                                </div>
                                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  <span>{staff.phone}</span>
                                </div>
                              </td>

                              <td className="py-3 px-4 text-right">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded capitalize bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  {staff.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Central / Area Operations Cluster */}
          {centralStaff.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-50/50 via-white to-blue-50/50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Central &amp; Area Operations Cluster
                    </h2>
                    <p className="text-xs text-slate-500">
                      Regional managers and corporate executives managing multi-property portfolios.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => openAddStaffForHotel("Central Operations")}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Central Manager</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                      <th className="py-2.5 px-4 font-bold">EXECUTIVE</th>
                      <th className="py-2.5 px-4 font-bold">ROLE &amp; TITLE</th>
                      <th className="py-2.5 px-4 font-bold">ASSIGNED HOTELS</th>
                      <th className="py-2.5 px-4 font-bold">CONTACT</th>
                      <th className="py-2.5 px-4 text-right font-bold">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {centralStaff.map((staff) => (
                      <tr key={staff.id || staff._id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{staff.name}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{staff.role}</td>
                        <td className="py-3 px-4 text-xs text-blue-700 font-medium">{staff.hotel}</td>
                        <td className="py-3 px-4 text-xs text-slate-600">{staff.email}</td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded capitalize bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {staff.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: Master Staff Directory (All Staff Table) */}
      {viewMode === "all_table" && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                  <th className="py-3 px-4 font-bold">STAFF MEMBER</th>
                  <th className="py-3 px-4 font-bold">ASSIGNED PROPERTY</th>
                  <th className="py-3 px-4 font-bold">DEPARTMENT</th>
                  <th className="py-3 px-4 font-bold">ROLE &amp; CAPABILITY</th>
                  <th className="py-3 px-4 text-right font-bold">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-[#EC3013]" />
                        <span>Loading personnel records from database...</span>
                      </div>
                    </td>
                  </tr>
                ) : staffList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400">
                      No personnel records found.
                    </td>
                  </tr>
                ) : (
                  staffList
                    .filter((s) => {
                      const matchesSearch =
                        !searchQuery ||
                        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        s.hotel.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        s.role.toLowerCase().includes(searchQuery.toLowerCase());
                      const matchesDept =
                        deptFilter === "all" || s.department.toLowerCase() === deptFilter.toLowerCase();
                      return matchesSearch && matchesDept;
                    })
                    .map((staff) => (
                      <tr key={staff.id || staff._id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{staff.name}</div>
                          <div className="text-[11px] text-slate-400">{staff.email} · {staff.phone}</div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {staff.hotel}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] font-bold">
                            {staff.department}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-900 font-medium">
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
      )}

      {/* Add Staff Modal (Pre-bound to Selected Hotel) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-[#EC3013] flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Staff Member</h3>
                  {targetHotelName && (
                    <p className="text-xs text-purple-700 font-semibold flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      <span>Assigning to: {targetHotelName}</span>
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-4 text-[13px]" autoComplete="off">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-[#EC3013]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98000 00000"
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Department *
                  </label>
                  <select
                    required
                    value={newStaff.department}
                    onChange={(e) => handleDepartmentChange(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium text-slate-900 focus:outline-none focus:border-[#EC3013]"
                  >
                    <option value="">Select Department...</option>
                    <option value="Reception">Reception (Front Desk PMS &amp; Check-In)</option>
                    <option value="Housekeeping">Housekeeping (Room Cleaning &amp; Map)</option>
                    <option value="Kitchen">Kitchen (Cook / Chef - KDS Screen)</option>
                    <option value="Restaurant">Restaurant (Dining POS &amp; Table Orders)</option>
                    <option value="Cash Counter">Cash Counter (Front Office Cashier)</option>
                    <option value="Inventory">Inventory &amp; Stores (Storekeeper)</option>
                    <option value="Banquet & Events">Banquet &amp; Events (Sales Manager)</option>
                    <option value="Channel Manager">Channel Manager (MakeMyTrip &amp; OTAs)</option>
                    <option value="Finance">Finance &amp; Accounts (Billing)</option>
                    <option value="Management">Management (General Manager)</option>
                    <option value="Area Operations">Area Operations (Regional Cluster)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Assigned Property
                  </label>
                  <select
                    value={newStaff.hotel}
                    onChange={(e) => setNewStaff({ ...newStaff, hotel: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-semibold text-slate-800"
                  >
                    {orgHotels.map((h) => (
                      <option key={h.id} value={h.name}>
                        {h.name}
                      </option>
                    ))}
                    <option value="Central Operations">Central Operations</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Designation / Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Front Desk Receptionist"
                    value={newStaff.role}
                    onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-[#EC3013]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    System RBAC Login Role
                  </label>
                  {newStaff.department && DEPARTMENT_CONFIG[newStaff.department as StaffMember["department"]] ? (
                    <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-900 flex items-center justify-between">
                      <span className="truncate">
                        {DEPARTMENT_CONFIG[newStaff.department as StaffMember["department"]].systemRoleLabel}
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded shrink-0 ml-1.5 uppercase">
                        1:1 Strict
                      </span>
                    </div>
                  ) : (
                    <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] text-slate-400">
                      Auto-assigned by Department
                    </div>
                  )}
                </div>
              </div>

              {newStaff.department && DEPARTMENT_CONFIG[newStaff.department as StaffMember["department"]] && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#EC3013] shrink-0" />
                  <span>
                    <strong>Module Access:</strong> {DEPARTMENT_CONFIG[newStaff.department as StaffMember["department"]].description}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
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
                    className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-[#EC3013] text-[13px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Staff will log in at <code>/login</code> using this email and password.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white font-bold rounded-lg shadow-xs cursor-pointer"
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
