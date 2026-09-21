"use client";

import { useState, useEffect } from "react";
import { reservationsApi, roomsApi, ratePlansApi, guestsApi } from "@/lib/api";
import { Reservation } from "@/types";
import {
  Search,
  Plus,
  X,
  RefreshCw,
  CheckCircle2,
  Calendar,
  Filter,
  Download,
  LayoutList,
  CalendarRange,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  UserCheck,
  Building,
  CreditCard,
  BedDouble,
  Utensils,
  ArrowRightLeft,
  CalendarPlus,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { useAuth } from "@/context/AuthContext";

export default function ReservationsPage() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // View Mode: List vs Tape Chart Calendar
  const [viewMode, setViewMode] = useState<"list" | "tape-chart">("list");
  const [tapeChartData, setTapeChartData] = useState<{ dates: string[]; tapeChart: any[] }>({
    dates: [],
    tapeChart: [],
  });
  const [ratePlans, setRatePlans] = useState<any[]>([]);

  // 3-Step Walk-In Wizard State (Video 7 & Video 6)
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [returningGuestFound, setReturningGuestFound] = useState<boolean>(false);
  const [isLookingUpPhone, setIsLookingUpPhone] = useState(false);

  // Step 1: Room & Tariff
  const [selectedRoomType, setSelectedRoomType] = useState("Standard Room");
  const [selectedRoomNumber, setSelectedRoomNumber] = useState("104");
  const [mealPlan, setMealPlan] = useState<"EP" | "CP" | "MAP" | "AP">("CP");
  const [checkInDate, setCheckInDate] = useState(new Date().toISOString().split("T")[0]);
  const [checkOutDate, setCheckOutDate] = useState(new Date(Date.now() + 86400000).toISOString().split("T")[0]);
  const [adultsCount, setAdultsCount] = useState(2);
  const [childrenCount, setChildrenCount] = useState(0);
  const [hasExtraBed, setHasExtraBed] = useState(false);

  // Step 2: Guest Details & Verification
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [idType, setIdType] = useState("Aadhaar");
  const [idNumber, setIdNumber] = useState("");
  const [isCorporateBooking, setIsCorporateBooking] = useState(false);
  const [corporateName, setCorporateName] = useState("");
  const [corporateGstin, setCorporateGstin] = useState("");

  // Step 3: Billing, Payment & Instant Check-in
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [advancePaid, setAdvancePaid] = useState<number>(2000);
  const [instantCheckIn, setInstantCheckIn] = useState(true);

  // Stay Modification & Room Shift Modal (Video 2)
  const [modifyModalOpen, setModifyModalOpen] = useState(false);
  const [selectedResvForModify, setSelectedResvForModify] = useState<Reservation | null>(null);
  const [modifyAction, setModifyAction] = useState<"extend" | "shift">("extend");
  const [newExtendCheckOut, setNewExtendCheckOut] = useState("");
  const [extendNightRate, setExtendNightRate] = useState(2500);
  const [targetShiftRoomNumber, setTargetShiftRoomNumber] = useState("");
  const [isPaidUpgrade, setIsPaidUpgrade] = useState(false);
  const [upgradePriceDiff, setUpgradePriceDiff] = useState(1000);
  const [shiftReason, setShiftReason] = useState("Guest Room Upgrade");

  // Web Check-in Link Share Modal
  const [shareLinkModalOpen, setShareLinkModalOpen] = useState(false);
  const [shareLinkData, setShareLinkData] = useState<any | null>(null);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const resvParams: any = {};
      const roomParams: any = { status: "available" };
      const tcParams: any = { days: 14 };

      if (user?.hotelId) {
        resvParams.hotelId = user.hotelId;
        roomParams.hotelId = user.hotelId;
        tcParams.hotelId = user.hotelId;
      }
      if (user?.hotelName) {
        resvParams.hotelName = user.hotelName;
      }
      if (user?.orgId) {
        resvParams.orgId = user.orgId;
        roomParams.orgId = user.orgId;
        tcParams.orgId = user.orgId;
      }

      const [resvs, tc, plans, rooms] = await Promise.all([
        reservationsApi.getAll(resvParams),
        roomsApi.getTapeChart(tcParams),
        ratePlansApi.getAll(),
        roomsApi.getAll(roomParams),
      ]);
      setReservations(resvs);
      if (tc?.data) {
        setTapeChartData(tc.data);
      } else if (tc?.tapeChart) {
        setTapeChartData(tc);
      }
      setRatePlans(plans);
      setAvailableRooms(rooms || []);
      if (rooms && rooms.length > 0) {
        setSelectedRoomNumber(rooms[0].number);
        setSelectedRoomType(rooms[0].type || "Standard Room");
      }
    } catch (e) {
      console.error("Error loading reservations data", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [user?.hotelId, user?.hotelName, user?.orgId]);

  // Returning Guest Auto-Lookup by Phone
  const handlePhoneChange = async (val: string) => {
    setGuestPhone(val);
    const cleanDigits = val.replace(/[^0-9]/g, "");
    if (cleanDigits.length >= 10) {
      setIsLookingUpPhone(true);
      try {
        const res = await guestsApi.lookupByPhone(cleanDigits);
        if (res && res.exists && res.data) {
          setReturningGuestFound(true);
          setGuestName(res.data.name || guestName);
          setGuestEmail(res.data.email || guestEmail);
          setIdType(res.data.idType || idType);
          setIdNumber(res.data.idNumber || idNumber);
          if (res.data.corporateName) {
            setIsCorporateBooking(true);
            setCorporateName(res.data.corporateName);
            setCorporateGstin(res.data.corporateGstin);
          }
        } else {
          setReturningGuestFound(false);
        }
      } catch (err) {
        console.error("Guest lookup failed", err);
      } finally {
        setIsLookingUpPhone(false);
      }
    } else {
      setReturningGuestFound(false);
    }
  };

  // Tariff Calculation
  const d1 = new Date(checkInDate).getTime();
  const d2 = new Date(checkOutDate).getTime();
  const nightsCount = Math.max(1, Math.round((d2 - d1) / (1000 * 3600 * 24)));

  const baseTariffPerNight =
    selectedRoomType === "Presidential Suite" ? 8000 :
    selectedRoomType === "Executive Suite" ? 5000 :
    selectedRoomType === "Deluxe King" ? 3500 : 2200;

  const mealAddonPerNight =
    mealPlan === "AP" ? 1100 * adultsCount :
    mealPlan === "MAP" ? 750 * adultsCount :
    mealPlan === "CP" ? 350 * adultsCount : 0;

  const extraBedCharge = hasExtraBed ? 800 * nightsCount : 0;
  const roomSubtotal = (baseTariffPerNight + mealAddonPerNight) * nightsCount + extraBedCharge;
  const gstTax = Math.round(roomSubtotal * 0.12);
  const grandTotal = roomSubtotal + gstTax;

  // Walk-In Submit
  const handleWalkInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (wizardStep < 3) {
      setWizardStep((prev) => ((prev + 1) as any));
      return;
    }

    if (!guestName || !guestPhone) {
      setFormError("Guest Name and Phone are required.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      const payload: any = {
        hotelId: user?.hotelId,
        hotelName: user?.hotelName,
        orgId: user?.orgId,
        guestName,
        guestEmail: guestEmail || "walkin@guest.hotel",
        guestPhone,
        roomType: selectedRoomType,
        roomNumber: selectedRoomNumber,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        totalAmount: grandTotal,
        paidAmount: Math.min(Number(advancePaid), grandTotal),
        adults: adultsCount,
        children: childrenCount,
        idType,
        idNumber,
        status: instantCheckIn ? "checked_in" : "confirmed",
        paymentMode: paymentMode,
        paymentMethod: paymentMode,
        corporateName: isCorporateBooking ? corporateName : "",
        corporateGstin: isCorporateBooking ? corporateGstin : "",
      };

      await reservationsApi.create(payload);

      setToastMsg(`✅ Walk-in reservation created for ${guestName} (Room ${selectedRoomNumber})!`);
      setIsModalOpen(false);
      setWizardStep(1);
      setFormError(null);
      loadAllData();
    } catch (err: any) {
      setFormError(err.message || "Failed to create walk-in reservation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Modification Modal
  const openModifyModal = (resv: Reservation) => {
    setSelectedResvForModify(resv);
    const nextDay = new Date(resv.checkOut);
    nextDay.setDate(nextDay.getDate() + 1);
    setNewExtendCheckOut(nextDay.toISOString().split("T")[0]);
    setExtendNightRate(2500);
    setTargetShiftRoomNumber(availableRooms[0]?.number || "");
    setIsPaidUpgrade(false);
    setUpgradePriceDiff(1000);
    setModifyAction("extend");
    setModifyModalOpen(true);
  };

  // Submit Stay Modification
  const handleSaveModification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResvForModify) return;
    setIsSubmitting(true);
    try {
      if (modifyAction === "extend") {
        await reservationsApi.extendStay(selectedResvForModify.id, {
          newCheckOutDate: newExtendCheckOut,
          additionalAmount: Number(extendNightRate),
        });
        setToastMsg(`Stay extended to ${newExtendCheckOut} (+₹${extendNightRate}) for ${selectedResvForModify.guestName}`);
      } else {
        await reservationsApi.changeRoom(selectedResvForModify.id, {
          newRoomNumber: targetShiftRoomNumber,
          reason: shiftReason,
          isPaidUpgrade,
          upgradePriceDifference: isPaidUpgrade ? Number(upgradePriceDiff) : 0,
        });
        setToastMsg(`Room changed to Room ${targetShiftRoomNumber} for ${selectedResvForModify.guestName}`);
      }
      setModifyModalOpen(false);
      loadAllData();
    } catch (err: any) {
      alert(err.message || "Modification failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate Web Check-in Link
  const handleShareWebLink = async (resv: Reservation) => {
    try {
      const res = await reservationsApi.generateWebCheckInLink(resv.id, 24);
      if (res && res.success) {
        setShareLinkData(res.data);
        setShareLinkModalOpen(true);
      }
    } catch (e: any) {
      alert("Failed to generate link");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <span className="px-2.5 py-1 text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-full">Confirmed</span>;
      case "checked_in":
        return <span className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">Checked In</span>;
      case "checked_out":
        return <span className="px-2.5 py-1 text-[11px] font-bold bg-gray-100 text-gray-700 border border-gray-200 rounded-full">Checked Out</span>;
      case "cancelled":
        return <span className="px-2.5 py-1 text-[11px] font-bold bg-red-50 text-red-700 border border-red-200 rounded-full">Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 text-[11px] font-bold bg-gray-50 text-gray-700 border border-gray-200 rounded-full">{status}</span>;
    }
  };

  const filteredReservations = reservations.filter((r) => {
    if (user?.role !== "super_admin") {
      if (user?.hotelId && r.hotelId && r.hotelId !== user.hotelId) return false;
      if (user?.hotelName && r.hotelName && r.hotelName.toLowerCase() !== user.hotelName.toLowerCase()) return false;
    }

    const matchesSearch =
      r.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.roomNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <RoleGuard
      allowedRoles={["super_admin", "hotel_admin", "hotel_manager", "receptionist", "finance"]}
      moduleName="Reservations & Booking Management"
    >
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-bold text-[#111827] tracking-tight">
              Reservations &amp; Booking Management
            </h1>
            <p className="text-[13px] text-[#6B7280] mt-0.5">
              3-Step walk-in bookings, visual tape-chart matrix, stay extensions &amp; room shifts
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Switcher */}
            <div className="flex items-center bg-[#F3F4F6] p-0.5 rounded border border-[#E5E7EB]">
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-bold transition-all ${
                  viewMode === "list" ? "bg-white text-[#111827] shadow-xs" : "text-[#6B7280] hover:text-[#111827]"
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>List</span>
              </button>
              <button
                onClick={() => setViewMode("tape-chart")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-bold transition-all ${
                  viewMode === "tape-chart" ? "bg-white text-[#111827] shadow-xs" : "text-[#6B7280] hover:text-[#111827]"
                }`}
              >
                <CalendarRange className="w-3.5 h-3.5" />
                <span>Tape Chart</span>
              </button>
            </div>

            <button
              onClick={loadAllData}
              title="Refresh"
              className="p-2 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] rounded text-[#4B5563] transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#EC3013]" : ""}`} />
            </button>

            <button
              onClick={() => {
                setWizardStep(1);
                setFormError(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white text-[13px] font-bold rounded shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>3-Step Walk-In Booking</span>
            </button>
          </div>
        </div>

        {/* Toast */}
        {toastMsg && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-[13px] px-4 py-2.5 rounded-lg flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{toastMsg}</span>
            </div>
            <button onClick={() => setToastMsg(null)} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-3.5 rounded-lg border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 overflow-x-auto">
            {["all", "confirmed", "checked_in", "checked_out", "cancelled"].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded text-[12px] font-semibold capitalize transition-colors ${
                  statusFilter === tab ? "bg-[#111827] text-white" : "text-[#4B5563] hover:bg-[#F3F4F6]"
                }`}
              >
                {tab.replace("_", " ")}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search booking or guest..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-[#F9FAFB] border border-[#D1D5DB] rounded text-[13px] text-[#111827] focus:outline-none focus:border-[#EC3013] w-full sm:w-64"
            />
          </div>
        </div>

        {/* List View */}
        {viewMode === "list" ? (
          <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-[#E5E7EB] text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider bg-[#F9FAFB]">
                    <th className="py-3 px-4 font-bold">BOOKING ID</th>
                    <th className="py-3 px-4 font-bold">GUEST</th>
                    <th className="py-3 px-4 font-bold">ROOM</th>
                    <th className="py-3 px-4 font-bold">STAY DATES</th>
                    <th className="py-3 px-4 font-bold">STATUS</th>
                    <th className="py-3 px-4 text-right font-bold">AMOUNT</th>
                    <th className="py-3 px-4 text-right font-bold">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {filteredReservations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-[#9CA3AF]">
                        No reservations found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredReservations.map((res) => (
                      <tr key={res.id} className="hover:bg-[#F9FAFB] transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#111827]">
                          {res.id}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#111827] flex items-center gap-1.5">
                            <span>{res.guestName}</span>
                            {(res as any).isPreCheckedIn && (
                              <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <ShieldCheck className="w-2.5 h-2.5" /> Web Checked-In
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#9CA3AF]">{res.guestPhone}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#374151]">Room {res.roomNumber}</div>
                          <div className="text-[11px] text-[#9CA3AF]">{res.roomType}</div>
                        </td>
                        <td className="py-3.5 px-4 text-[#4B5563] text-[12px]">
                          {res.checkIn} → {res.checkOut}
                        </td>
                        <td className="py-3.5 px-4">{getStatusBadge(res.status)}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-[#111827]">
                          ₹{Number(res.totalAmount || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleShareWebLink(res)}
                              title="Generate Web Check-In WhatsApp Link"
                              className="px-2 py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded text-[11px] font-bold flex items-center gap-1"
                            >
                              <Sparkles className="w-3 h-3 text-emerald-600" />
                              <span>Link</span>
                            </button>
                            <button
                              onClick={() => openModifyModal(res)}
                              title="Modify Dates or Shift Room"
                              className="px-2 py-1 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded text-[11px] font-bold flex items-center gap-1"
                            >
                              <ArrowRightLeft className="w-3 h-3 text-indigo-600" />
                              <span>Modify</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Tape Chart Calendar Gantt Matrix */
          <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-xs overflow-hidden">
            <div className="p-3 bg-gray-50 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarRange className="w-4 h-4 text-[#EC3013]" />
                <span className="text-xs font-bold text-gray-800">14-Day Visual Tape Chart (Room Gantt Calendar)</span>
              </div>
              <div className="flex items-center gap-4 text-[11px]">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Checked-In</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Confirmed</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 border-b">
                    <th className="p-2.5 border-r font-bold sticky left-0 bg-gray-100 z-10 w-28">Room</th>
                    {tapeChartData.dates.map((d: string) => (
                      <th key={d} className="p-2 text-center border-r min-w-[65px] font-semibold">{d.slice(5)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tapeChartData.tapeChart.map((row: any) => (
                    <tr key={row.roomNumber} className="border-b hover:bg-gray-50/50">
                      <td className="p-2 border-r font-bold text-gray-900 sticky left-0 bg-white z-10 shadow-xs">
                        {row.roomNumber} <span className="text-[10px] text-gray-400 font-normal block">{row.roomType}</span>
                      </td>
                      {tapeChartData.dates.map((d: string) => {
                        const cell = row.days ? row.days[d] : null;
                        if (!cell || !cell.isBooked) {
                          return (
                            <td
                              key={d}
                              onClick={() => {
                                setSelectedRoomNumber(row.roomNumber);
                                setSelectedRoomType(row.roomType);
                                setCheckInDate(d);
                                setIsModalOpen(true);
                              }}
                              className="border-r p-1 text-center cursor-pointer hover:bg-emerald-50 text-gray-300"
                              title={`Click to book Room ${row.roomNumber} on ${d}`}
                            >
                              ·
                            </td>
                          );
                        }
                        const isCheckIn = cell.status === "checked_in";
                        return (
                          <td
                            key={d}
                            className={`border-r p-1 text-center font-bold text-[10px] truncate max-w-[65px] ${
                              isCheckIn ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                            }`}
                            title={`Booking: ${cell.guestName} (${cell.resId})`}
                          >
                            {cell.guestName?.split(" ")[0]}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================================== */}
        {/* MODAL: 3-STEP WALK-IN BOOKING WIZARD (Video 7 & Video 6)               */}
        {/* ======================================================================== */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 my-8">
              {/* Modal Top Header with Steps */}
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-[18px] font-bold text-[#111827]">Fast-Track Walk-In Booking</h3>
                  <p className="text-[12px] text-gray-500">Step {wizardStep} of 3: {wizardStep === 1 ? "Room & Meal Plan" : wizardStep === 2 ? "Guest Details & ID Proof" : "Review & Check-In"}</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Progress Indicator */}
              <div className="grid grid-cols-3 gap-2 text-center text-[12px] font-bold">
                <div className={`py-1.5 rounded-lg border transition-all ${wizardStep === 1 ? "bg-[#EC3013] text-white border-[#EC3013]" : "bg-gray-50 text-gray-600 border-gray-200"}`}>
                  1. Room &amp; Tariff
                </div>
                <div className={`py-1.5 rounded-lg border transition-all ${wizardStep === 2 ? "bg-[#EC3013] text-white border-[#EC3013]" : "bg-gray-50 text-gray-600 border-gray-200"}`}>
                  2. Guest &amp; KYC
                </div>
                <div className={`py-1.5 rounded-lg border transition-all ${wizardStep === 3 ? "bg-[#EC3013] text-white border-[#EC3013]" : "bg-gray-50 text-gray-600 border-gray-200"}`}>
                  3. Payment &amp; Key
                </div>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-[12px] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleWalkInSubmit} className="space-y-4 text-[13px]">
                {/* STEP 1: ROOM & TARIFF */}
                {wizardStep === 1 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Check-In Date</label>
                        <input
                          type="date"
                          required
                          value={checkInDate}
                          onChange={(e) => setCheckInDate(e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-[13px]"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Check-Out Date ({nightsCount} nights)</label>
                        <input
                          type="date"
                          required
                          min={checkInDate}
                          value={checkOutDate}
                          onChange={(e) => setCheckOutDate(e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-[13px]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Room Category</label>
                        <select
                          value={selectedRoomType}
                          onChange={(e) => setSelectedRoomType(e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-[13px] bg-white"
                        >
                          <option value="Standard Room">Standard Room (₹2,200/night)</option>
                          <option value="Deluxe King">Deluxe King (₹3,500/night)</option>
                          <option value="Executive Suite">Executive Suite (₹5,000/night)</option>
                          <option value="Presidential Suite">Presidential Suite (₹8,000/night)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Clean Available Room</label>
                        <select
                          value={selectedRoomNumber}
                          onChange={(e) => setSelectedRoomNumber(e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-[13px] bg-white font-bold text-emerald-700"
                        >
                          {availableRooms.map((rm) => (
                            <option key={rm.number} value={rm.number}>
                              Room {rm.number} ({rm.type || "Available"})
                            </option>
                          ))}
                          <option value="104">Room 104 (Standard Clean)</option>
                          <option value="201">Room 201 (Deluxe Clean)</option>
                          <option value="305">Room 305 (Executive Suite)</option>
                        </select>
                      </div>
                    </div>

                    {/* Meal Plan Selector */}
                    <div>
                      <label className="block font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                        <Utensils className="w-3.5 h-3.5 text-amber-600" />
                        <span>Meal Plan Selection</span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px]">
                        {[
                          { key: "EP", label: "EP (Room Only)", desc: "No Meals", price: 0 },
                          { key: "CP", label: "CP (Breakfast)", desc: "+₹350/guest", price: 350 },
                          { key: "MAP", label: "MAP (Half Board)", desc: "+₹750/guest", price: 750 },
                          { key: "AP", label: "AP (Full Board)", desc: "+₹1,100/guest", price: 1100 },
                        ].map((mp) => (
                          <div
                            key={mp.key}
                            onClick={() => setMealPlan(mp.key as any)}
                            className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                              mealPlan === mp.key ? "bg-amber-50 border-amber-500 text-amber-900 font-bold shadow-xs" : "bg-gray-50 border-gray-200 text-gray-600"
                            }`}
                          >
                            <div className="font-bold text-[12px]">{mp.label}</div>
                            <div className="text-[10px] text-gray-500 mt-0.5">{mp.desc}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Extra Bed & Occupancy */}
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={hasExtraBed}
                            onChange={(e) => setHasExtraBed(e.target.checked)}
                            className="rounded text-[#EC3013]"
                          />
                          <span className="font-bold text-gray-800">Add Extra Mattress / Rollaway Bed (+₹800/night)</span>
                        </label>
                      </div>
                      <div className="text-[12px] text-gray-600">
                        {adultsCount} Adults, {childrenCount} Kids
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: GUEST DETAILS & VERIFICATION */}
                {wizardStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block font-bold text-gray-700">Guest Mobile Phone *</label>
                        {isLookingUpPhone && <span className="text-[11px] text-gray-400 animate-pulse">Searching CRM...</span>}
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 9876543210 (Auto-fetches returning guest)"
                        value={guestPhone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-[13px] font-bold text-[#111827]"
                      />
                      {returningGuestFound && (
                        <div className="mt-1.5 p-2 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded text-[11px] font-bold flex items-center gap-1.5 animate-in fade-in">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Returning Guest Found! Name &amp; ID Proof auto-populated.</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Guest Full Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Rohit Sharma"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-[13px]"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Email Address</label>
                        <input
                          type="email"
                          placeholder="rohit@example.com"
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-[13px]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">ID Document Type</label>
                        <select
                          value={idType}
                          onChange={(e) => setIdType(e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-[13px] bg-white"
                        >
                          <option value="Aadhaar">Aadhaar Card</option>
                          <option value="Passport">Passport</option>
                          <option value="Driving License">Driving License</option>
                          <option value="Voter ID">Voter ID</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">ID Number</label>
                        <input
                          type="text"
                          placeholder="XXXX XXXX XXXX"
                          value={idNumber}
                          onChange={(e) => setIdNumber(e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-[13px] font-mono"
                        />
                      </div>
                    </div>

                    {/* Corporate Booking Toggle */}
                    <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isCorporateBooking}
                          onChange={(e) => setIsCorporateBooking(e.target.checked)}
                          className="rounded text-blue-600"
                        />
                        <span className="font-bold text-blue-900">Corporate / Business Stay (GST Invoice)</span>
                      </label>
                      {isCorporateBooking && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 animate-in fade-in">
                          <input
                            type="text"
                            placeholder="Company Name (e.g. Infosys Ltd)"
                            value={corporateName}
                            onChange={(e) => setCorporateName(e.target.value)}
                            className="p-2 border border-blue-300 rounded bg-white text-[12px]"
                          />
                          <input
                            type="text"
                            placeholder="Company GSTIN (e.g. 29AAAAA0000A1Z5)"
                            value={corporateGstin}
                            onChange={(e) => setCorporateGstin(e.target.value)}
                            className="p-2 border border-blue-300 rounded bg-white font-mono text-[12px]"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 3: REVIEW & CHECK-IN */}
                {wizardStep === 3 && (
                  <div className="space-y-4">
                    {/* Bill Breakdown Card */}
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2 text-[12px]">
                      <div className="flex justify-between font-bold text-gray-900 border-b pb-1.5">
                        <span>Rate &amp; Stay Breakdown</span>
                        <span>{nightsCount} Night(s)</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Room Tariff ({selectedRoomType}):</span>
                        <span>₹{(baseTariffPerNight * nightsCount).toLocaleString("en-IN")}</span>
                      </div>
                      {mealAddonPerNight > 0 && (
                        <div className="flex justify-between text-gray-600">
                          <span>Meal Plan ({mealPlan}):</span>
                          <span>+₹{(mealAddonPerNight * nightsCount).toLocaleString("en-IN")}</span>
                        </div>
                      )}
                      {extraBedCharge > 0 && (
                        <div className="flex justify-between text-gray-600">
                          <span>Extra Bed:</span>
                          <span>+₹{extraBedCharge.toLocaleString("en-IN")}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-gray-600">
                        <span>GST Tax (12%):</span>
                        <span>+₹{gstTax.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="border-t pt-1.5 flex justify-between font-black text-[15px] text-[#EC3013]">
                        <span>Total Payable:</span>
                        <span>₹{grandTotal.toLocaleString("en-IN")}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Payment Mode</label>
                        <select
                          value={paymentMode}
                          onChange={(e) => setPaymentMode(e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-[13px] bg-white font-semibold"
                        >
                          <option value="Cash">Cash at Counter</option>
                          <option value="UPI">UPI / QR Code</option>
                          <option value="Card">Credit / Debit Card</option>
                          <option value="PostToCompany">Bill to Company</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Advance Amount Collected (₹)</label>
                        <input
                          type="number"
                          min="0"
                          max={grandTotal}
                          value={advancePaid}
                          onChange={(e) => setAdvancePaid(Number(e.target.value))}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-[13px] font-bold text-emerald-700"
                        />
                      </div>
                    </div>

                    {/* Instant Check-In Checkbox */}
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={instantCheckIn}
                          onChange={(e) => setInstantCheckIn(e.target.checked)}
                          className="rounded text-emerald-600"
                        />
                        <div>
                          <span className="font-bold text-emerald-900 block">Instant Check-In &amp; Issue Room Key</span>
                          <span className="text-[11px] text-emerald-700">Guest is standing at counter, mark room occupied immediately.</span>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* Footer Navigation Buttons */}
                <div className="flex justify-between items-center pt-3 border-t">
                  {wizardStep > 1 ? (
                    <button
                      type="button"
                      onClick={() => setWizardStep((prev) => ((prev - 1) as any))}
                      className="px-4 py-2 border border-gray-300 rounded font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                  ) : (
                    <div />
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 border border-gray-300 rounded font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white rounded font-bold shadow-xs flex items-center gap-1.5"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Creating...</span>
                        </>
                      ) : wizardStep < 3 ? (
                        <>
                          <span>Next Step</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Confirm Walk-In Booking</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================================== */}
        {/* MODAL: STAY MODIFICATION & ROOM SHIFTING (Video 2)                        */}
        {/* ======================================================================== */}
        {modifyModalOpen && selectedResvForModify && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-[17px] font-bold text-[#111827]">Modify Reservation &amp; Stay</h3>
                  <p className="text-[12px] text-gray-500">Booking: {selectedResvForModify.id} · {selectedResvForModify.guestName}</p>
                </div>
                <button onClick={() => setModifyModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Action Segment */}
              <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-lg text-[12px] font-bold text-center">
                <button
                  type="button"
                  onClick={() => setModifyAction("extend")}
                  className={`py-1.5 rounded transition-all ${modifyAction === "extend" ? "bg-white text-gray-900 shadow-xs" : "text-gray-600"}`}
                >
                  Extend Stay Dates
                </button>
                <button
                  type="button"
                  onClick={() => setModifyAction("shift")}
                  className={`py-1.5 rounded transition-all ${modifyAction === "shift" ? "bg-white text-gray-900 shadow-xs" : "text-gray-600"}`}
                >
                  Shift / Upgrade Room
                </button>
              </div>

              <form onSubmit={handleSaveModification} className="space-y-4 text-[13px]">
                {modifyAction === "extend" ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded border text-[12px]">
                      Current Stay: <b>{selectedResvForModify.checkIn}</b> to <b>{selectedResvForModify.checkOut}</b>
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">New Extended Check-Out Date</label>
                      <input
                        type="date"
                        required
                        min={selectedResvForModify.checkOut}
                        value={newExtendCheckOut}
                        onChange={(e) => setNewExtendCheckOut(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-[13px]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Additional Nightly Charge (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={extendNightRate}
                        onChange={(e) => setExtendNightRate(Number(e.target.value))}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-[13px] font-bold text-emerald-700"
                      />
                      <span className="text-[11px] text-gray-500 mt-1 block">
                        Will automatically add ₹{extendNightRate} (+12% GST) to guest folio charges.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded border text-[12px]">
                      Currently in: <b>Room {selectedResvForModify.roomNumber}</b> ({selectedResvForModify.roomType})
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Target Clean Room</label>
                      <select
                        value={targetShiftRoomNumber}
                        onChange={(e) => setTargetShiftRoomNumber(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-[13px] bg-white font-bold"
                      >
                        {availableRooms.map((rm) => (
                          <option key={rm.number} value={rm.number}>
                            Room {rm.number} ({rm.type} - Clean)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Reason for Room Shift</label>
                      <input
                        type="text"
                        required
                        value={shiftReason}
                        onChange={(e) => setShiftReason(e.target.value)}
                        placeholder="e.g. Guest requested high floor / upgrade"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-[13px]"
                      />
                    </div>

                    <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isPaidUpgrade}
                          onChange={(e) => setIsPaidUpgrade(e.target.checked)}
                          className="rounded text-indigo-600"
                        />
                        <span className="font-bold text-indigo-900">Paid Room Upgrade (Charge Tariff Difference)</span>
                      </label>
                      {isPaidUpgrade && (
                        <div>
                          <input
                            type="number"
                            min="1"
                            value={upgradePriceDiff}
                            onChange={(e) => setUpgradePriceDiff(Number(e.target.value))}
                            placeholder="Upgrade Difference (₹)"
                            className="w-full p-2 border border-indigo-300 rounded bg-white text-[13px] font-bold"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setModifyModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white rounded font-bold shadow-xs"
                  >
                    {isSubmitting ? "Saving..." : "Confirm Modification"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================================== */}
        {/* MODAL: SHARE WEB CHECK-IN LINK (Video 1)                                */}
        {/* ======================================================================== */}
        {shareLinkModalOpen && shareLinkData && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-[17px] font-bold text-[#111827]">Web Check-In Link</h3>
                </div>
                <button onClick={() => setShareLinkModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-1">
                <span className="text-[11px] font-bold text-gray-500 uppercase block">Guest Mobile Link</span>
                <input
                  type="text"
                  readOnly
                  value={shareLinkData.checkInUrl}
                  className="w-full text-[12px] bg-white border border-gray-300 rounded px-2.5 py-1.5 font-mono"
                />
              </div>

              <div className="space-y-2 pt-1">
                <a
                  href={shareLinkData.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[13px] rounded-lg flex items-center justify-center gap-2 shadow-xs"
                >
                  <span>Share via WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(shareLinkData.checkInUrl);
                    alert("Link copied to clipboard!");
                  }}
                  className="w-full py-2 border border-gray-300 text-gray-700 text-[13px] font-semibold rounded hover:bg-gray-50"
                >
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
