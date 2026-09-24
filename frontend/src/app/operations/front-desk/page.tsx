"use client";

import { useState, useEffect } from "react";
import { reservationsApi, roomsApi, leadsApi } from "@/lib/api";
import { Reservation } from "@/types";
import {
  CheckCircle2,
  Search,
  RefreshCw,
  LogIn,
  LogOut,
  UserCheck,
  CreditCard,
  ArrowRightLeft,
  CalendarPlus,
  FileText,
  Printer,
  X,
  AlertCircle,
  Clock,
  ShieldCheck,
  Sparkles,
  PhoneCall,
  Plus,
  Eye,
  User,
  Phone,
  BedDouble,
} from "lucide-react";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { useAuth } from "@/context/AuthContext";

export default function FrontDeskPage() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionNotice, setActionNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Quick Inbound Call Lead Capture Modal State
  const [quickCallLeadOpen, setQuickCallLeadOpen] = useState(false);
  const [isSavingLead, setIsSavingLead] = useState(false);
  const [quickLeadForm, setQuickLeadForm] = useState({
    name: "",
    phone: "",
    requirement: "",
    budget: 25000,
    source: "AI Phone Call",
    aiSummary: "",
  });

  // Guest Details & Document Inspector Modal
  const [guestDocModalOpen, setGuestDocModalOpen] = useState(false);
  const [inspectingResv, setInspectingResv] = useState<Reservation | null>(null);

  // Modals state
  const [selectedResv, setSelectedResv] = useState<Reservation | null>(null);
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [roomChangeModalOpen, setRoomChangeModalOpen] = useState(false);
  const [stayExtensionModalOpen, setStayExtensionModalOpen] = useState(false);
  const [folioModalOpen, setFolioModalOpen] = useState(false);
  const [printDocType, setPrintDocType] = useState<"reg_card" | "tax_invoice" | null>(null);

  // Web Check-In Modal (Video 1)
  const [webCheckInModalOpen, setWebCheckInModalOpen] = useState(false);
  const [webCheckInLinkData, setWebCheckInLinkData] = useState<any | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Room Upgrade / Shifting State (Video 2)
  const [isPaidUpgrade, setIsPaidUpgrade] = useState(false);
  const [upgradePriceDiff, setUpgradePriceDiff] = useState<number>(0);

  // Form Inputs
  const [idType, setIdType] = useState("Aadhaar");
  const [idNumber, setIdNumber] = useState("");
  const [advanceDeposit, setAdvanceDeposit] = useState<number>(0);
  const [depositPaymentMethod, setDepositPaymentMethod] = useState("Cash");

  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [roomChangeReason, setRoomChangeReason] = useState("Guest Upgrade");

  const [newCheckOutDate, setNewCheckOutDate] = useState("");
  const [extensionNightCharge, setExtensionNightCharge] = useState<number>(2500);

  const [finalSettlementMethod, setFinalSettlementMethod] = useState("Credit Card");
  const [checkInRoomNumber, setCheckInRoomNumber] = useState("");

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const resvParams: any = {};
      const roomParams: any = { status: "available" };
      if (user?.hotelId) {
        resvParams.hotelId = user.hotelId;
        roomParams.hotelId = user.hotelId;
      }
      if (user?.hotelName) {
        resvParams.hotelName = user.hotelName;
      }
      if (user?.orgId) {
        resvParams.orgId = user.orgId;
        roomParams.orgId = user.orgId;
      }

      const [resvs, rooms] = await Promise.all([
        reservationsApi.getAll(resvParams),
        roomsApi.getAll(roomParams),
      ]);
      setReservations(resvs);
      setAvailableRooms(rooms);
    } catch (e) {
      console.error("Failed to load front desk data", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [user?.hotelId, user?.hotelName, user?.orgId]);

  const notify = (message: string, type: "success" | "error" = "success") => {
    setActionNotice({ type, message });
    setTimeout(() => setActionNotice(null), 5000);
  };

  const handleSaveCallLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickLeadForm.name || !quickLeadForm.phone) return;
    setIsSavingLead(true);
    try {
      await leadsApi.create({
        name: quickLeadForm.name,
        phone: quickLeadForm.phone,
        email: "caller@guest.com",
        source: quickLeadForm.source,
        requirement: quickLeadForm.requirement || "Phone inquiry for room booking",
        budget: Number(quickLeadForm.budget),
        stage: "New",
        aiSummary: quickLeadForm.aiSummary || "Front Desk receptionist logged inbound phone call inquiry.",
        nextFollowUp: "Today, within 2 hours",
        hotelId: user?.hotelId || "hotel-taj-delhi",
        leadType: "hotel_guest",
      });
      notify(`📞 Inbound Call Lead for "${quickLeadForm.name}" saved in Leads CRM!`);
      setQuickCallLeadOpen(false);
      setQuickLeadForm({
        name: "",
        phone: "",
        requirement: "",
        budget: 25000,
        source: "AI Phone Call",
        aiSummary: "",
      });
    } catch (err: any) {
      notify(err.message || "Failed to save call lead", "error");
    } finally {
      setIsSavingLead(false);
    }
  };

  // --- Handlers ---
  const handleOpenCheckIn = (resv: Reservation) => {
    setSelectedResv(resv);
    setIdType((resv as any).idType || "Aadhaar");
    setIdNumber((resv as any).idNumber || "");
    setAdvanceDeposit(0);
    if (resv.roomNumber && resv.roomNumber !== "TBD") {
      setCheckInRoomNumber(resv.roomNumber);
    } else {
      setCheckInRoomNumber(availableRooms[0]?.number || "");
    }
    setCheckInModalOpen(true);
  };

  const submitCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResv) return;

    try {
      const assignedRoom = checkInRoomNumber || selectedResv.roomNumber;
      await reservationsApi.checkIn(selectedResv.id, {
        idType,
        idNumber,
        roomNumber: assignedRoom,
        advanceDeposit: Number(advanceDeposit),
        paymentMethod: depositPaymentMethod,
      });
      notify(`✅ Guest ${selectedResv.guestName} checked in to Room ${assignedRoom}`);
      setCheckInModalOpen(false);
      fetchAllData();
    } catch (err: any) {
      notify(err.message || "Failed to complete check-in", "error");
    }
  };

  const handleOpenRoomChange = (resv: Reservation) => {
    setSelectedResv(resv);
    setNewRoomNumber(availableRooms[0]?.number || "");
    setRoomChangeReason("AC / Maintenance Issue");
    setIsPaidUpgrade(false);
    setUpgradePriceDiff(0);
    setRoomChangeModalOpen(true);
  };

  const handleGenerateWebCheckIn = async (resv: Reservation) => {
    try {
      const res = await reservationsApi.generateWebCheckInLink(resv.id, 24);
      if (res && res.success) {
        setWebCheckInLinkData(res.data);
        setIsCopied(false);
        setWebCheckInModalOpen(true);
      } else {
        notify("Failed to generate web check-in link", "error");
      }
    } catch (e: any) {
      notify(e.message || "Failed to generate link", "error");
    }
  };

  const submitRoomChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResv || !newRoomNumber) return;

    try {
      await reservationsApi.changeRoom(selectedResv.id, {
        newRoomNumber,
        reason: roomChangeReason,
        isPaidUpgrade,
        upgradePriceDifference: Number(upgradePriceDiff),
      });
      notify(`🔄 Room changed: ${selectedResv.guestName} moved to Room ${newRoomNumber} (${isPaidUpgrade ? `+₹${upgradePriceDiff}` : "Complimentary"})`);
      setRoomChangeModalOpen(false);
      fetchAllData();
    } catch (err: any) {
      notify(err.message || "Room change failed", "error");
    }
  };

  const handleOpenStayExtension = (resv: Reservation) => {
    setSelectedResv(resv);
    // Suggest next day
    const nextDay = new Date(resv.checkOut);
    nextDay.setDate(nextDay.getDate() + 1);
    setNewCheckOutDate(nextDay.toISOString().split("T")[0]);
    setExtensionNightCharge(2500);
    setStayExtensionModalOpen(true);
  };

  const submitStayExtension = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResv || !newCheckOutDate) return;

    try {
      await reservationsApi.extendStay(selectedResv.id, {
        newCheckOutDate,
        additionalAmount: Number(extensionNightCharge),
      });
      notify(`📅 Stay extended to ${newCheckOutDate} for ${selectedResv.guestName}`);
      setStayExtensionModalOpen(false);
      fetchAllData();
    } catch (err: any) {
      notify(err.message || "Stay extension failed", "error");
    }
  };

  const handleOpenFolio = (resv: Reservation) => {
    setSelectedResv(resv);
    setFolioModalOpen(true);
  };

  const submitCheckOut = async (finalAmount: number) => {
    if (!selectedResv) return;

    try {
      await reservationsApi.checkOut(selectedResv.id, {
        finalPaymentAmount: finalAmount,
        paymentMethod: finalSettlementMethod,
      });
      notify(`👋 ${selectedResv.guestName} checked out. Room ${selectedResv.roomNumber} set to Dirty for housekeeping.`);
      setFolioModalOpen(false);
      fetchAllData();
    } catch (err: any) {
      notify(err.message || "Checkout failed", "error");
    }
  };

  // Filter lists
  const filtered = reservations.filter((r) => {
    if (user?.role !== "super_admin") {
      if (user?.hotelId && r.hotelId && r.hotelId !== user.hotelId) return false;
      if (user?.hotelName && r.hotelName && r.hotelName.toLowerCase() !== user.hotelName.toLowerCase()) return false;
    }

    return (
      r.guestName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.roomNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const arrivals = filtered.filter((r) => r.status === "confirmed" || r.status === "checked_in");
  const departures = filtered.filter((r) => r.status === "checked_in" || r.status === "checked_out");

  // Helper for Date & Time display
  const formatDateTimeDisplay = (
    dateVal?: string | Date | null,
    defaultTime = "12:00 PM",
    isActual = false
  ) => {
    if (!dateVal) return { date: "-", time: defaultTime, full: `-` };
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return { date: String(dateVal), time: defaultTime, full: `${dateVal} · ${defaultTime}` };

      const dateStr = d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      const hasExplicitTime =
        isActual ||
        (typeof dateVal === "string" && (dateVal.includes("T") || dateVal.includes(":"))) ||
        dateVal instanceof Date;

      const timeStr = hasExplicitTime
        ? d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
        : defaultTime;

      return { date: dateStr, time: timeStr, full: `${dateStr} · ${timeStr}` };
    } catch {
      return { date: String(dateVal), time: defaultTime, full: `${dateVal} · ${defaultTime}` };
    }
  };

  return (
    <RoleGuard
      allowedRoles={["super_admin", "hotel_admin", "hotel_manager", "receptionist"]}
      moduleName="Front Desk Check-In & Departures"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-bold text-[#111827] tracking-tight">Front Desk Operations</h1>
            <p className="text-[13px] text-[#6B7280] mt-0.5">
              Live guest arrivals, digital ID check-in, room swaps, stay extensions &amp; folio settlement
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search guest, room or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-white border border-[#D1D5DB] rounded text-[13px] text-[#111827] focus:outline-none focus:border-[#EC3013] w-64"
              />
            </div>
            <button
              onClick={fetchAllData}
              title="Refresh"
              className="p-2 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] rounded text-[#4B5563] transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#EC3013]" : ""}`} />
            </button>

            <button
              onClick={() => setQuickCallLeadOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#EC3013] hover:bg-[#D62839] text-white text-[13px] font-bold rounded shadow-xs transition-colors cursor-pointer"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Log Call Lead</span>
            </button>
          </div>
        </div>

        {/* Notifications */}
        {actionNotice && (
          <div
            className={`p-3 rounded-lg text-[13px] flex items-center gap-2 ${actionNotice.type === "success"
                ? "bg-emerald-50 border border-emerald-300 text-emerald-800"
                : "bg-red-50 border border-red-300 text-red-800"
              }`}
          >
            {actionNotice.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{actionNotice.message}</span>
          </div>
        )}

        {/* 4 Front Desk Metric Cards (Vibrant Reference Style - Red, Green, Orange, Cyan) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="relative overflow-hidden bg-[#E53935] hover:bg-[#D32F2F] p-6 rounded-xl text-white shadow-lg shadow-red-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 group">
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <div className="text-[34px] font-extrabold tracking-tight leading-none text-white drop-shadow-xs">
                  {arrivals.length}
                </div>
                <div className="text-[12px] font-semibold text-white/90 uppercase tracking-wide">
                  Expected Arrivals
                </div>
                <div className="text-[11px] text-white/75 font-medium truncate max-w-[150px]">
                  {arrivals.filter((a) => a.status === "confirmed").length} awaiting check-in
                </div>
              </div>
              <div className="w-14 h-14 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10 text-white/90 shrink-0 group-hover:scale-105 group-hover:bg-white/20 transition-all">
                <LogIn className="w-7 h-7 stroke-[2]" />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden bg-[#43A047] hover:bg-[#388E3C] p-6 rounded-xl text-white shadow-lg shadow-green-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 group">
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <div className="text-[34px] font-extrabold tracking-tight leading-none text-white drop-shadow-xs">
                  {departures.filter((d) => d.status === "checked_in").length}
                </div>
                <div className="text-[12px] font-semibold text-white/90 uppercase tracking-wide">
                  In-House Guests
                </div>
                <div className="text-[11px] text-white/75 font-medium truncate max-w-[150px]">
                  Active occupied rooms
                </div>
              </div>
              <div className="w-14 h-14 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10 text-white/90 shrink-0 group-hover:scale-105 group-hover:bg-white/20 transition-all">
                <UserCheck className="w-7 h-7 stroke-[2]" />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden bg-[#FB8C00] hover:bg-[#F57C00] p-6 rounded-xl text-white shadow-lg shadow-orange-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 group">
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <div className="text-[34px] font-extrabold tracking-tight leading-none text-white drop-shadow-xs">
                  {departures.filter((d) => d.status === "checked_out").length}
                </div>
                <div className="text-[12px] font-semibold text-white/90 uppercase tracking-wide">
                  Departures Settled
                </div>
                <div className="text-[11px] text-white/75 font-medium truncate max-w-[150px]">
                  Checked-out today
                </div>
              </div>
              <div className="w-14 h-14 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10 text-white/90 shrink-0 group-hover:scale-105 group-hover:bg-white/20 transition-all">
                <LogOut className="w-7 h-7 stroke-[2]" />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden bg-[#00ACC1] hover:bg-[#0097A7] p-6 rounded-xl text-white shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 group">
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <div className="text-[34px] font-extrabold tracking-tight leading-none text-white drop-shadow-xs">
                  {availableRooms.length}
                </div>
                <div className="text-[12px] font-semibold text-white/90 uppercase tracking-wide">
                  Available Rooms
                </div>
                <div className="text-[11px] text-white/75 font-medium truncate max-w-[150px]">
                  Clean &amp; ready to assign
                </div>
              </div>
              <div className="w-14 h-14 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10 text-white/90 shrink-0 group-hover:scale-105 group-hover:bg-white/20 transition-all">
                <BedDouble className="w-7 h-7 stroke-[2]" />
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Grid: Arrivals & Departures */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Arrivals */}
          <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LogIn className="w-4 h-4 text-[#EC3013]" />
                <h2 className="text-[14px] font-bold text-[#111827]">
                  Expected Arrivals ({arrivals.length})
                </h2>
              </div>
              <span className="text-[11px] font-semibold text-[#6B7280]">
                {arrivals.filter((a) => a.status === "checked_in").length} checked in
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-[#E5E7EB] text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider bg-white">
                    <th className="py-2.5 px-4 font-bold">GUEST</th>
                    <th className="py-2.5 px-4 font-bold">ROOM</th>
                    <th className="py-2.5 px-4 font-bold">DATES &amp; TIME</th>
                    <th className="py-2.5 px-4 text-right font-bold">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {arrivals.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-[#9CA3AF]">
                        No arrivals found
                      </td>
                    </tr>
                  ) : (
                    arrivals.map((row) => {
                      const isCheckedIn = row.status === "checked_in";
                      const isPreChecked = (row as any).isPreCheckedIn;
                      const checkInInfo = formatDateTimeDisplay(
                        (row as any).actualCheckIn || row.checkIn,
                        (row as any).estimatedArrivalTime || "02:00 PM",
                        !!(row as any).actualCheckIn
                      );
                      const checkOutInfo = formatDateTimeDisplay(row.checkOut, "11:00 AM");

                      return (
                        <tr key={row.id} className="hover:bg-[#F9FAFB] transition-colors">
                          <td className="py-3 px-4 font-semibold text-[#111827]">
                            <div className="flex items-center gap-1.5">
                              <span>{row.guestName}</span>
                              {isPreChecked && (
                                <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                  <ShieldCheck className="w-2.5 h-2.5" /> Pre-Checkin
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-normal text-[#9CA3AF]">
                              {row.id} · {row.roomType}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-[#374151] font-mono font-bold">
                            {row.roomNumber}
                          </td>
                          <td className="py-3 px-4 text-[#374151] text-[11px]">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-emerald-700">IN:</span>
                                <span className="font-semibold text-gray-800">{checkInInfo.date}</span>
                                <span className="text-gray-500 font-mono bg-gray-100 px-1.5 py-0.2 rounded text-[10px] flex items-center gap-0.5">
                                  <Clock className="w-2.5 h-2.5 text-emerald-600" /> {checkInInfo.time}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-gray-400">OUT:</span>
                                <span className="text-gray-600">{checkOutInfo.date}</span>
                                <span className="text-gray-400 font-mono text-[10px]">
                                  {checkOutInfo.time}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {isCheckedIn ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setInspectingResv(row);
                                    setGuestDocModalOpen(true);
                                  }}
                                  title="View Guest Profile, ID Proof & Documents"
                                  className="p-1.5 text-gray-600 hover:text-[#EC3013] hover:bg-red-50 rounded border border-gray-200 text-[11px] font-semibold flex items-center gap-1 shadow-2xs"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleOpenRoomChange(row)}
                                  title="Change Room"
                                  className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded border border-indigo-200 text-[11px] font-semibold flex items-center gap-1"
                                >
                                  <ArrowRightLeft className="w-3 h-3" /> Change
                                </button>
                                <button
                                  onClick={() => handleOpenStayExtension(row)}
                                  title="Extend Stay"
                                  className="p-1.5 text-amber-700 hover:bg-amber-50 rounded border border-amber-200 text-[11px] font-semibold flex items-center gap-1"
                                >
                                  <CalendarPlus className="w-3 h-3" /> Extend
                                </button>
                                <button
                                  onClick={() => handleOpenFolio(row)}
                                  title="View Folio"
                                  className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded border border-emerald-200 text-[11px] font-semibold flex items-center gap-1"
                                >
                                  <CreditCard className="w-3 h-3" /> Folio
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setInspectingResv(row);
                                    setGuestDocModalOpen(true);
                                  }}
                                  title="View Guest Profile, ID Proof & Documents"
                                  className="p-1.5 text-gray-600 hover:text-[#EC3013] hover:bg-red-50 rounded border border-gray-200 shadow-2xs"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedResv(row);
                                    setPrintDocType("reg_card");
                                  }}
                                  title="Print Registration Card"
                                  className="p-1.5 text-[#4B5563] hover:bg-gray-100 rounded border border-gray-200"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleGenerateWebCheckIn(row)}
                                  title="Send Web Check-In WhatsApp Link"
                                  className="px-2.5 py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-300 text-[11px] font-bold flex items-center gap-1 transition-colors"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Web Link</span>
                                </button>
                                <button
                                  onClick={() => handleOpenCheckIn(row)}
                                  className="px-3 py-1 bg-[#EC3013] hover:bg-[#D62839] text-white text-[12px] font-bold rounded shadow-xs transition-colors cursor-pointer"
                                >
                                  Check-In
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Departures */}
          <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LogOut className="w-4 h-4 text-[#4B5563]" />
                <h2 className="text-[14px] font-bold text-[#111827]">
                  Departures &amp; In-House ({departures.length})
                </h2>
              </div>
              <span className="text-[11px] font-semibold text-[#6B7280]">
                {departures.filter((d) => d.status === "checked_out").length} settled &amp; checked out
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-[#E5E7EB] text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider bg-white">
                    <th className="py-2.5 px-4 font-bold">GUEST</th>
                    <th className="py-2.5 px-4 font-bold">ROOM</th>
                    <th className="py-2.5 px-4 font-bold">CHECK-OUT &amp; TIME</th>
                    <th className="py-2.5 px-4 text-right font-bold">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {departures.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-[#9CA3AF]">
                        No departures recorded
                      </td>
                    </tr>
                  ) : (
                    departures.map((row) => {
                      const isCheckedOut = row.status === "checked_out";
                      const checkOutInfo = formatDateTimeDisplay(
                        (row as any).actualCheckOut || row.checkOut,
                        "11:00 AM",
                        !!(row as any).actualCheckOut
                      );

                      return (
                        <tr key={row.id} className="hover:bg-[#F9FAFB] transition-colors">
                          <td className="py-3 px-4 font-semibold text-[#111827]">
                            <div>{row.guestName}</div>
                            <div className="text-[11px] font-normal text-[#9CA3AF]">
                              {row.id} · Total: ₹{row.totalAmount}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-[#374151] font-mono font-bold">
                            {row.roomNumber}
                          </td>
                          <td className="py-3 px-4 text-[#374151] text-[12px]">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-gray-800">{checkOutInfo.date}</span>
                              <span className="text-gray-600 font-mono bg-gray-100 px-1.5 py-0.2 rounded text-[11px] flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5 text-[#EC3013]" /> {checkOutInfo.time}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {isCheckedOut ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#6B7280] bg-[#F3F4F6] px-2.5 py-1 rounded border border-[#E5E7EB]">
                                  Checked Out
                                </span>
                                <button
                                  onClick={() => {
                                    setSelectedResv(row);
                                    setPrintDocType("tax_invoice");
                                  }}
                                  title="Print GST Invoice"
                                  className="p-1.5 text-[#4B5563] hover:bg-gray-100 rounded border border-gray-200"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5 ml-auto">
                                <button
                                  onClick={() => {
                                    setInspectingResv(row);
                                    setGuestDocModalOpen(true);
                                  }}
                                  title="View Guest Profile, ID Proof & Documents"
                                  className="p-1.5 text-gray-600 hover:text-[#EC3013] hover:bg-red-50 rounded border border-gray-200 shadow-2xs cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleOpenFolio(row)}
                                  className="px-3.5 py-1 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#111827] text-[12px] font-bold rounded shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <CreditCard className="w-3.5 h-3.5 text-[#EC3013]" /> Settle &amp; Check-Out
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ----------------- MODAL: CHECK-IN WITH ID CAPTURE & ADVANCE DEPOSIT ----------------- */}
        {checkInModalOpen && selectedResv && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95">
              <button
                onClick={() => setCheckInModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-[18px] font-bold text-[#111827] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#EC3013]" /> Guest Check-In &amp; ID Verification
              </h3>
              <p className="text-[12px] text-gray-500 mt-1">
                Booking #{selectedResv.id} · {selectedResv.guestName} · Room {selectedResv.roomNumber}
              </p>

              {/* Date & Time Schedule Card */}
              <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center gap-1 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" /> Check-In Date &amp; Time:
                  </span>
                  <span className="font-bold text-emerald-800">
                    {formatDateTimeDisplay(selectedResv.checkIn, "02:00 PM").date} · {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-gray-500 pt-1 border-t border-slate-200/60">
                  <span>Planned Check-Out:</span>
                  <span className="font-semibold text-slate-700">
                    {formatDateTimeDisplay(selectedResv.checkOut, "11:00 AM").full}
                  </span>
                </div>
              </div>

              <form onSubmit={submitCheckIn} className="mt-4 space-y-4">
                <div>
                  <label className="block text-[12px] font-bold text-gray-700 mb-1">
                    Room Allocation {(!selectedResv.roomNumber || selectedResv.roomNumber === "TBD") && (
                      <span className="text-amber-600 font-normal">(OTA Unallocated - Please Assign)</span>
                    )}
                  </label>
                  <select
                    value={checkInRoomNumber}
                    onChange={(e) => setCheckInRoomNumber(e.target.value)}
                    required
                    className="w-full p-2 border border-gray-300 rounded text-[13px] bg-white font-semibold text-gray-800"
                  >
                    {selectedResv.roomNumber && selectedResv.roomNumber !== "TBD" && (
                      <option value={selectedResv.roomNumber}>
                        Room {selectedResv.roomNumber} ({selectedResv.roomType || "Assigned"})
                      </option>
                    )}
                    {availableRooms.map((r) => (
                      <option key={r.id || r.number} value={r.number}>
                        Room {r.number} ({r.type || "Available Room"}) - ₹{r.rate || 0}/night
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-gray-700 mb-1">Government ID Type</label>
                  <select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-[13px] bg-white"
                  >
                    <option value="Aadhaar">Aadhaar Card</option>
                    <option value="Passport">Passport</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Voter ID">Voter ID</option>
                    <option value="Govt ID">Govt Official ID</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-gray-700 mb-1">ID Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5489 1234 8921"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-[13px]"
                  />
                </div>

                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center text-[12px] mb-2">
                    <span className="text-gray-600">Total Booking Amount:</span>
                    <span className="font-bold text-gray-900">₹{selectedResv.totalAmount}</span>
                  </div>
                  <div className="flex justify-between items-center text-[12px] mb-3">
                    <span className="text-gray-600">Already Paid:</span>
                    <span className="font-bold text-emerald-700">₹{selectedResv.paidAmount || 0}</span>
                  </div>

                  <label className="block text-[12px] font-bold text-gray-700 mb-1">Advance Deposit at Check-In</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={0}
                      value={advanceDeposit}
                      onChange={(e) => setAdvanceDeposit(Number(e.target.value))}
                      className="w-1/2 p-2 border border-gray-300 rounded text-[13px] font-semibold"
                    />
                    <select
                      value={depositPaymentMethod}
                      onChange={(e) => setDepositPaymentMethod(e.target.value)}
                      className="w-1/2 p-2 border border-gray-300 rounded text-[13px] bg-white"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCheckInModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded text-[13px] text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white font-bold rounded text-[13px] shadow-sm"
                  >
                    Confirm Check-In
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ----------------- MODAL: ROOM CHANGE ----------------- */}
        {roomChangeModalOpen && selectedResv && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95">
              <button
                onClick={() => setRoomChangeModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-[18px] font-bold text-[#111827] flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-indigo-600" /> Switch Guest Room
              </h3>
              <p className="text-[12px] text-gray-500 mt-1">
                Currently in <span className="font-bold text-gray-800">Room {selectedResv.roomNumber}</span>
              </p>

              <form onSubmit={submitRoomChange} className="mt-5 space-y-4">
                <div>
                  <label className="block text-[12px] font-bold text-gray-700 mb-1">Select New Clean Room</label>
                  {availableRooms.length === 0 ? (
                    <div className="p-3 bg-amber-50 text-amber-800 text-[12px] rounded border border-amber-200">
                      No other clean rooms available right now.
                    </div>
                  ) : (
                    <select
                      value={newRoomNumber}
                      onChange={(e) => setNewRoomNumber(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded text-[13px] bg-white font-semibold"
                    >
                      {availableRooms.map((rm) => (
                        <option key={rm.number} value={rm.number}>
                          Room {rm.number} ({rm.type} - Floor {rm.floor} - ₹{rm.rate}/night)
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-gray-700 mb-1">Reason for Room Change</label>
                  <input
                    type="text"
                    required
                    value={roomChangeReason}
                    onChange={(e) => setRoomChangeReason(e.target.value)}
                    placeholder="e.g. AC cooling complaint, noise, guest upgrade"
                    className="w-full p-2 border border-gray-300 rounded text-[13px]"
                  />
                </div>

                {/* Upgrade Pricing (Video 2) */}
                <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-lg space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPaidUpgrade}
                      onChange={(e) => setIsPaidUpgrade(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-[12px] font-bold text-indigo-900">
                      Charge as Paid Room Upgrade
                    </span>
                  </label>
                  {isPaidUpgrade ? (
                    <div>
                      <span className="text-[11px] text-gray-600 block mb-1">Upgrade Rate Difference (₹)</span>
                      <input
                        type="number"
                        min="1"
                        required
                        value={upgradePriceDiff}
                        onChange={(e) => setUpgradePriceDiff(Number(e.target.value))}
                        className="w-full p-2 border border-indigo-300 rounded bg-white text-[13px] font-bold text-indigo-900"
                        placeholder="e.g. 1200"
                      />
                      <span className="text-[10px] text-indigo-700 mt-1 block">
                        Will automatically add ₹{upgradePriceDiff} (+12% GST) to guest folio.
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-indigo-700 block">
                      Complimentary Upgrade: No additional tariff charge added to room folio.
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-gray-500 bg-gray-50 p-2.5 rounded border border-gray-200">
                  ℹ️ Notice: Room {selectedResv.roomNumber} will automatically be marked <strong>Dirty</strong> for
                  housekeeping sanitization.
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setRoomChangeModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded text-[13px] text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={availableRooms.length === 0}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded text-[13px] shadow-sm"
                  >
                    Confirm Room Swap
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ----------------- MODAL: STAY EXTENSION ----------------- */}
        {stayExtensionModalOpen && selectedResv && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95">
              <button
                onClick={() => setStayExtensionModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-[18px] font-bold text-[#111827] flex items-center gap-2">
                <CalendarPlus className="w-5 h-5 text-amber-600" /> Extend Stay
              </h3>
              <p className="text-[12px] text-gray-500 mt-1">
                Guest: {selectedResv.guestName} · Room {selectedResv.roomNumber} (Current Check-out:{" "}
                {selectedResv.checkOut})
              </p>

              <form onSubmit={submitStayExtension} className="mt-5 space-y-4">
                <div>
                  <label className="block text-[12px] font-bold text-gray-700 mb-1">New Check-Out Date</label>
                  <input
                    type="date"
                    required
                    value={newCheckOutDate}
                    onChange={(e) => setNewCheckOutDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-[13px]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-gray-700 mb-1">
                    Additional Amount to Charge (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={extensionNightCharge}
                    onChange={(e) => setExtensionNightCharge(Number(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded text-[13px] font-bold text-gray-900"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStayExtensionModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded text-[13px] text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-[13px] shadow-sm"
                  >
                    Extend Booking
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ----------------- MODAL: FOLIO BREAKDOWN & CHECKOUT SETTLEMENT ----------------- */}
        {folioModalOpen && selectedResv && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setFolioModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-[18px] font-bold text-[#111827] flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-600" /> Guest Folio &amp; Settlement
                  </h3>
                  <p className="text-[12px] text-gray-500">
                    Room {selectedResv.roomNumber} · {selectedResv.guestName} (#{selectedResv.id})
                  </p>
                </div>
                <button
                  onClick={() => setPrintDocType("tax_invoice")}
                  className="px-2.5 py-1 border border-gray-300 hover:bg-gray-50 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3 h-3" /> Print GST Bill
                </button>
              </div>

              {/* Stay Timeline & Time Stamps */}
              <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-gray-500 font-bold block uppercase">Check-In</span>
                  <span className="font-semibold text-gray-900">
                    {formatDateTimeDisplay((selectedResv as any).actualCheckIn || selectedResv.checkIn, "02:00 PM", !!(selectedResv as any).actualCheckIn).full}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 font-bold block uppercase">Check-Out (Settlement)</span>
                  <span className="font-semibold text-[#EC3013]">
                    {formatDateTimeDisplay(new Date(), "11:00 AM", true).full}
                  </span>
                </div>
              </div>

              {/* Folio Items List */}
              <div className="mt-4 space-y-2">
                <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Itemized Folio Charges</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100 text-[12px]">
                  <div className="p-2.5 bg-gray-50 flex justify-between font-semibold">
                    <span>Base Room Stay ({selectedResv.roomType})</span>
                    <span>₹{selectedResv.totalAmount - (selectedResv.folioCharges?.reduce((acc: number, c: any) => acc + c.amount, 0) || 0)}</span>
                  </div>
                  {(selectedResv.folioCharges || []).map((chg: any, idx: number) => (
                    <div key={idx} className="p-2.5 flex justify-between">
                      <div>
                        <span className="font-semibold text-gray-800">{chg.description}</span>
                        <span className="text-[10px] text-gray-400 ml-2">[{chg.department || "Service"}]</span>
                      </div>
                      <span className="font-semibold text-gray-900">₹{chg.amount}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payments Recorded */}
              <div className="mt-4 space-y-2">
                <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Payments Received</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100 text-[12px]">
                  {(selectedResv.payments && selectedResv.payments.length > 0) ? (
                    selectedResv.payments.map((p: any, i: number) => (
                      <div key={i} className="p-2.5 flex justify-between text-emerald-700 bg-emerald-50/50">
                        <span>{p.note || "Payment"} ({p.method})</span>
                        <span className="font-bold">₹{p.amount}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-2.5 text-gray-400 italic">No advance payments recorded</div>
                  )}
                </div>
              </div>

              {/* Calculation Summary */}
              {(() => {
                const total = selectedResv.totalAmount || 0;
                const paid = selectedResv.paidAmount || 0;
                const balanceDue = Math.max(0, total - paid);

                return (
                  <div className="mt-5 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                    <div className="flex justify-between text-[13px] text-gray-600">
                      <span>Total Charges:</span>
                      <span className="font-bold text-gray-900">₹{total}</span>
                    </div>
                    <div className="flex justify-between text-[13px] text-emerald-700">
                      <span>Total Paid So Far:</span>
                      <span className="font-bold">₹{paid}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between text-[15px] font-bold">
                      <span className="text-gray-900">Net Balance Due:</span>
                      <span className={balanceDue > 0 ? "text-[#EC3013]" : "text-emerald-600"}>
                        ₹{balanceDue}
                      </span>
                    </div>

                    {selectedResv.status === "checked_in" && (
                      <div className="mt-4 pt-3 border-t">
                        <label className="block text-[12px] font-bold text-gray-700 mb-1">
                          Settlement Payment Method
                        </label>
                        <select
                          value={finalSettlementMethod}
                          onChange={(e) => setFinalSettlementMethod(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded text-[13px] bg-white mb-3"
                        >
                          <option value="Credit Card">Credit / Debit Card</option>
                          <option value="UPI">UPI / QR Code</option>
                          <option value="Cash">Cash at Front Desk</option>
                          <option value="Corporate Ledger">Direct Bill to Company</option>
                        </select>

                        <button
                          onClick={() => submitCheckOut(balanceDue)}
                          className="w-full py-2.5 bg-[#EC3013] hover:bg-[#D62839] text-white font-bold rounded-lg text-[13px] shadow-sm flex items-center justify-center gap-2"
                        >
                          <LogOut className="w-4 h-4" /> Settle Balance & Complete Check-Out
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ----------------- MODAL: PRINTABLE REGISTRATION CARD / GST TAX INVOICE ----------------- */}
        {printDocType && selectedResv && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto print:p-0 print:shadow-none">
              <button
                onClick={() => setPrintDocType(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 print:hidden"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex justify-between items-center mb-6 print:hidden">
                <h3 className="text-lg font-bold text-gray-900">
                  {printDocType === "reg_card" ? "Guest Registration Card" : "GST Tax Invoice / Bill"}
                </h3>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-[#EC3013] text-white font-bold rounded text-[13px] flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Print Document
                </button>
              </div>

              {/* Printable Body */}
              <div className="border border-gray-300 p-6 rounded-lg bg-white font-sans text-gray-800">
                {/* Hotel Header */}
                <div className="flex justify-between items-start border-b pb-4">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">MERIDIAN GRAND PLAZA</h2>
                    <p className="text-xs text-gray-500">Luxury Hospitality & Suites</p>
                    <p className="text-xs text-gray-500">GSTIN: 07AAACH7409R1ZZ · SAC Code: 996311</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 bg-gray-100 rounded">
                      {printDocType === "reg_card" ? "REGISTRATION CARD" : "TAX INVOICE"}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">Date: {new Date().toLocaleDateString()}</p>
                    <p className="text-xs font-mono font-bold text-gray-800">Folio: #{selectedResv.id}</p>
                  </div>
                </div>

                {/* Guest & Room Details Grid */}
                <div className="grid grid-cols-2 gap-4 py-4 border-b text-xs">
                  <div>
                    <span className="font-bold text-gray-500 block">GUEST INFORMATION</span>
                    <p className="font-bold text-sm text-gray-900 mt-0.5">{selectedResv.guestName}</p>
                    <p className="text-gray-600">{selectedResv.guestPhone || "+91 98765 43210"}</p>
                    <p className="text-gray-600">{selectedResv.guestEmail || "guest@example.com"}</p>
                    <p className="text-gray-600 mt-1">
                      ID: {(selectedResv as any).idType || "Govt ID"} - {(selectedResv as any).idNumber || "VERIFIED"}
                    </p>
                  </div>
                  <div>
                    <span className="font-bold text-gray-500 block">STAY SPECIFICATIONS</span>
                    <p className="mt-0.5 font-bold">Room: <span className="font-mono">{selectedResv.roomNumber}</span> ({selectedResv.roomType})</p>
                    <p>Check-In: {formatDateTimeDisplay((selectedResv as any).actualCheckIn || selectedResv.checkIn, "02:00 PM", !!(selectedResv as any).actualCheckIn).full}</p>
                    <p>Check-Out: {formatDateTimeDisplay((selectedResv as any).actualCheckOut || selectedResv.checkOut, "11:00 AM", !!(selectedResv as any).actualCheckOut).full}</p>
                    <p>Rate Plan: {(selectedResv as any).ratePlan || "European Plan (EP)"}</p>
                  </div>
                </div>

                {printDocType === "tax_invoice" ? (
                  /* Invoice Breakdown Table */
                  <div className="mt-4">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="py-2 px-2">DESCRIPTION</th>
                          <th className="py-2 px-2">DEPARTMENT</th>
                          <th className="py-2 px-2 text-right">AMOUNT (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        <tr>
                          <td className="py-2 px-2 font-semibold">Room Accommodation Charges</td>
                          <td className="py-2 px-2">Rooms</td>
                          <td className="py-2 px-2 text-right">₹{selectedResv.totalAmount - ((selectedResv.folioCharges || []).reduce((a: number, c: any) => a + c.amount, 0))}</td>
                        </tr>
                        {(selectedResv.folioCharges || []).map((c: any, idx: number) => (
                          <tr key={idx}>
                            <td className="py-2 px-2">{c.description}</td>
                            <td className="py-2 px-2">{c.department}</td>
                            <td className="py-2 px-2 text-right">₹{c.amount}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t font-bold">
                          <td colSpan={2} className="py-2 px-2 text-right">Net Subtotal:</td>
                          <td className="py-2 px-2 text-right">₹{selectedResv.totalAmount}</td>
                        </tr>
                        <tr className="text-gray-600">
                          <td colSpan={2} className="py-1 px-2 text-right">CGST (6%):</td>
                          <td className="py-1 px-2 text-right">₹{Math.round(selectedResv.totalAmount * 0.06)}</td>
                        </tr>
                        <tr className="text-gray-600">
                          <td colSpan={2} className="py-1 px-2 text-right">SGST (6%):</td>
                          <td className="py-1 px-2 text-right">₹{Math.round(selectedResv.totalAmount * 0.06)}</td>
                        </tr>
                        <tr className="border-t font-bold text-sm bg-gray-50">
                          <td colSpan={2} className="py-2 px-2 text-right">Grand Total:</td>
                          <td className="py-2 px-2 text-right text-[#EC3013]">₹{selectedResv.totalAmount}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  /* Registration Card Terms & Signature */
                  <div className="mt-4 text-xs space-y-4">
                    <p className="text-gray-600 leading-relaxed text-[11px]">
                      <strong>Guest Declaration:</strong> I hereby certify that the particulars furnished above are true
                      and correct. I agree to abide by the hotel rules and policies, and accept financial liability for all
                      charges incurred during my stay.
                    </p>
                    <div className="flex justify-between pt-12 text-center text-xs">
                      <div className="border-t border-gray-400 w-44 pt-1">
                        Guest Signature
                      </div>
                      <div className="border-t border-gray-400 w-44 pt-1">
                        Duty Manager / Front Desk
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ----------------- MODAL: WEB CHECK-IN LINK (Video 1) ----------------- */}
        {webCheckInModalOpen && webCheckInLinkData && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 space-y-4">
              <button
                onClick={() => setWebCheckInModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[17px] font-bold text-[#111827]">Web Check-In Link Ready</h3>
                  <p className="text-[12px] text-gray-500">Contactless arrival for {webCheckInLinkData.guestName}</p>
                </div>
              </div>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-1">
                <label className="text-[11px] font-bold uppercase text-gray-500 block">Shareable Guest Link</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={webCheckInLinkData.checkInUrl}
                    className="w-full text-[12px] bg-white border border-gray-300 rounded px-2.5 py-1.5 font-mono text-gray-700"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(webCheckInLinkData.checkInUrl);
                      setIsCopied(true);
                      setTimeout(() => setIsCopied(false), 2000);
                    }}
                    className="px-3 py-1.5 bg-gray-900 hover:bg-black text-white text-[11px] font-bold rounded shrink-0"
                  >
                    {isCopied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Valid for 24 hours until {new Date(webCheckInLinkData.expiresAt).toLocaleTimeString()}
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <a
                  href={webCheckInLinkData.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[13px] rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <span>Share via WhatsApp Directly</span>
                </a>
                <button
                  type="button"
                  onClick={() => setWebCheckInModalOpen(false)}
                  className="w-full py-2 border border-gray-300 text-gray-700 text-[13px] font-semibold rounded hover:bg-gray-50"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Inbound Call Lead Capture Modal */}
        {quickCallLeadOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-5 h-5 text-[#EC3013]" />
                  <h3 className="text-[16px] font-bold text-[#111827]">
                    Log Inbound Phone Call Inquiry
                  </h3>
                </div>
                <button
                  onClick={() => setQuickCallLeadOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCallLead} className="p-6 space-y-4 text-[13px]">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Caller / Guest Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Chandra"
                    value={quickLeadForm.name}
                    onChange={(e) => setQuickLeadForm({ ...quickLeadForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#EC3013]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+91 98111 22334"
                      value={quickLeadForm.phone}
                      onChange={(e) => setQuickLeadForm({ ...quickLeadForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#EC3013]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                      Est. Deal Value (₹)
                    </label>
                    <input
                      type="number"
                      value={quickLeadForm.budget}
                      onChange={(e) => setQuickLeadForm({ ...quickLeadForm, budget: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#EC3013]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Requirement / Inquired Stay
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2 Deluxe Rooms for 3 Nights (Oct 10-13)"
                    value={quickLeadForm.requirement}
                    onChange={(e) => setQuickLeadForm({ ...quickLeadForm, requirement: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#EC3013]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Call Conversation Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Inquired about breakfast inclusion. Promised callback by evening with custom tariff."
                    value={quickLeadForm.aiSummary}
                    onChange={(e) => setQuickLeadForm({ ...quickLeadForm, aiSummary: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
                  <button
                    type="button"
                    onClick={() => setQuickCallLeadOpen(false)}
                    className="px-4 py-2 border border-[#D1D5DB] rounded-lg text-[#374151] font-semibold hover:bg-[#F3F4F6] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingLead}
                    className="px-5 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    {isSavingLead ? "Saving..." : "Save Call Lead to CRM"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================================== */}
        {/* MODAL: CLEAN, MINIMAL GUEST DETAILS & ID INSPECTOR (Front Desk)         */}
        {/* ======================================================================== */}
        {guestDocModalOpen && inspectingResv && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-xl w-full overflow-hidden border border-gray-200 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-98 duration-150">
              
              {/* Clean Minimal Header */}
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-900">
                      {inspectingResv.guestName}
                    </h3>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                      Room {inspectingResv.roomNumber}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Booking #{inspectingResv.id} • {inspectingResv.roomType}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setGuestDocModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="p-5 overflow-y-auto space-y-4 text-xs">
                
                {/* 1. Identity & Government KYC Proof */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900 text-[13px] flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-gray-700" />
                      Government ID &amp; KYC
                    </span>
                    <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                      ● Verified ID
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-gray-500 text-[11px] block">Document Type</span>
                      <span className="font-semibold text-gray-800">
                        {(inspectingResv as any).idType || "Aadhaar Card"}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-500 text-[11px] block">Document Number</span>
                      <span className="font-mono font-bold text-gray-900">
                        {(inspectingResv as any).idNumber || "5482 9102 3841"}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-500 text-[11px] block">Date of Birth / Gender</span>
                      <span className="text-gray-800 font-medium">
                        {(inspectingResv as any).dob || "15/08/1992"} ({(inspectingResv as any).gender || "Male"})
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-500 text-[11px] block">Nationality</span>
                      <span className="text-gray-800 font-medium">Indian</span>
                    </div>

                    <div className="col-span-2">
                      <span className="text-gray-500 text-[11px] block">Permanent Address</span>
                      <span className="text-gray-800 font-medium leading-relaxed">
                        {(inspectingResv as any).address || "Flat 402, Royal Residency, MG Road, Bengaluru, Karnataka - 560001"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Stay & Guest Details */}
                <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <span className="font-semibold text-gray-900 text-[13px] block">
                    Stay &amp; Contact Details
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-gray-500 text-[11px] block">Check-In</span>
                      <span className="font-medium text-gray-800">
                        {inspectingResv.checkIn} (from 02:00 PM)
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-500 text-[11px] block">Check-Out</span>
                      <span className="font-medium text-gray-800">
                        {inspectingResv.checkOut} (until 11:00 AM)
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-500 text-[11px] block">Phone Number</span>
                      <a href={`tel:${inspectingResv.guestPhone}`} className="font-medium text-gray-900 hover:underline">
                        {inspectingResv.guestPhone || "+91 98765 43210"}
                      </a>
                    </div>

                    <div>
                      <span className="text-gray-500 text-[11px] block">Email</span>
                      <span className="text-gray-800 font-medium">
                        {inspectingResv.guestEmail || "guest@example.com"}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-500 text-[11px] block">Meal Plan</span>
                      <span className="text-gray-800 font-medium">
                        {(inspectingResv as any).mealPlan || "CP (Breakfast Included)"}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-500 text-[11px] block">Special Request</span>
                      <span className="text-gray-800 font-medium">
                        {(inspectingResv as any).specialRequests || "None"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Folio & Payment Summary */}
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/50 flex items-center justify-between text-center">
                  <div className="flex-1">
                    <span className="text-[11px] text-gray-500 block">Total Tariff</span>
                    <span className="font-bold text-gray-900 text-sm">
                      ₹{Number(inspectingResv.totalAmount || 0).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="h-6 w-px bg-gray-200" />

                  <div className="flex-1">
                    <span className="text-[11px] text-gray-500 block">Advance Paid</span>
                    <span className="font-bold text-gray-900 text-sm">
                      ₹{Number(inspectingResv.paidAmount || 0).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="h-6 w-px bg-gray-200" />

                  <div className="flex-1">
                    <span className="text-[11px] text-gray-500 block">Balance Due</span>
                    <span className="font-bold text-gray-900 text-sm">
                      ₹{Math.max(0, Number(inspectingResv.totalAmount || 0) - Number(inspectingResv.paidAmount || 0)).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Clean Minimal Footer */}
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between gap-2 bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <a
                    href={`https://wa.me/${(inspectingResv.guestPhone || "").replace(/[^0-9]/g, "")}?text=Namaste%20${encodeURIComponent(inspectingResv.guestName)}%20ji!%20Greetings%20from%20Taj%20Palace.%20Your%20Reservation%20%23${inspectingResv.id}%20for%20Room%20${inspectingResv.roomNumber}%20is%20active.%20How%20can%20we%20assist%20you%20today?`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 border border-gray-300 hover:bg-white text-gray-700 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5 text-gray-600" />
                    <span>WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-1.5 border border-gray-300 hover:bg-white text-gray-700 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-gray-600" />
                    <span>Print Form-F</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setGuestDocModalOpen(false)}
                  className="px-4 py-1.5 bg-gray-900 hover:bg-black text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
