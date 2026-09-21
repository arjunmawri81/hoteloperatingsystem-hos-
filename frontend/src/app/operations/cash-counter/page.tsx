"use client";

import { useState, useEffect } from "react";
import { cashCounterApi, hotelsApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Hotel } from "@/types";
import { RoleGuard } from "@/components/layout/RoleGuard";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Calculator,
  Lock,
  Unlock,
  Receipt,
  Printer,
  Clock,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Plus,
  X,
  History,
  Coins,
  Building2,
} from "lucide-react";

export default function CashCounterPage() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeShift, setActiveShift] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [historyShifts, setHistoryShifts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"current" | "history">("current");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Multi-Hotel Property Selection
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<string>("");
  const [selectedHotelName, setSelectedHotelName] = useState<string>("");

  // Modals
  const [openShiftModal, setOpenShiftModal] = useState(false);
  const [transactionModal, setTransactionModal] = useState(false);
  const [closeShiftModal, setCloseShiftModal] = useState(false);
  const [printShiftData, setPrintShiftData] = useState<any | null>(null);

  // Open Shift Form
  const [cashierName, setCashierName] = useState(user?.name || "Front Desk Cashier");
  const [openingFloat, setOpeningFloat] = useState(5000);
  const [openNotes, setOpenNotes] = useState("Morning shift starting cash");

  // Transaction Form
  const [txType, setTxType] = useState<"cash_in" | "cash_out">("cash_out");
  const [txCategory, setTxCategory] = useState("petty_cash_expense");
  const [txAmount, setTxAmount] = useState<number>(250);
  const [txDescription, setTxDescription] = useState("");
  const [txVoucher, setTxVoucher] = useState("");

  // Close Shift & Denominations Form
  const [denominations, setDenominations] = useState<{ [key: string]: number }>({
    note500: 0,
    note200: 0,
    note100: 0,
    note50: 0,
    note20: 0,
    note10: 0,
    coins: 0,
  });
  const [discrepancyReason, setDiscrepancyReason] = useState("");
  const [handoverTo, setHandoverTo] = useState("");
  const [handoverNotes, setHandoverNotes] = useState("");

  // Initial load of Hotels
  useEffect(() => {
    const loadHotels = async () => {
      try {
        const hotelList = await hotelsApi.getAll(user?.orgId ? { orgId: user.orgId } : undefined);
        setHotels(hotelList || []);
        if (hotelList && hotelList.length > 0) {
          const defaultHotel = user?.hotelId
            ? hotelList.find((h) => h.id === user.hotelId) || hotelList[0]
            : user?.hotelName
            ? hotelList.find((h) => h.name.toLowerCase() === user.hotelName?.toLowerCase()) || hotelList[0]
            : hotelList[0];
          setSelectedHotelId(defaultHotel.id);
          setSelectedHotelName(defaultHotel.name);
        }
      } catch (err) {
        console.error("Error loading properties for cash counter:", err);
      }
    };
    loadHotels();
  }, [user?.orgId, user?.hotelId, user?.hotelName]);

  useEffect(() => {
    if (user?.name) {
      setCashierName(user.name);
    }
  }, [user?.name]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const activeHotel = selectedHotelId || user?.hotelId;
      const res = await cashCounterApi.getCurrentShift(activeHotel);
      if (res && res.success) {
        setIsOpen(res.isOpen);
        setActiveShift(res.activeShift);
        setTransactions(res.transactions || []);
      } else {
        setIsOpen(false);
        setActiveShift(null);
        setTransactions([]);
      }
      const history = await cashCounterApi.getHistory(activeHotel);
      setHistoryShifts(history || []);
    } catch (err) {
      console.error("Failed to load cash counter data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedHotelId) {
      loadData();
    }
  }, [selectedHotelId]);

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await cashCounterApi.openShift({
        hotelId: selectedHotelId || user?.hotelId,
        hotelName: selectedHotelName || user?.hotelName,
        orgId: user?.orgId,
        cashierName: cashierName || user?.name || "Front Desk Cashier",
        openingFloat: Number(openingFloat),
        notes: openNotes,
      });
      if (res.success) {
        setToastMsg(`Shift #${res.data.shiftId} opened for ${selectedHotelName || "property"} with float ₹${openingFloat}!`);
        setOpenShiftModal(false);
        await loadData();
      } else {
        alert(res.message || "Failed to open shift");
      }
    } catch (err: any) {
      alert(err.message || "Failed to open shift");
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;
    try {
      const res = await cashCounterApi.recordTransaction({
        shiftId: activeShift.shiftId,
        type: txType,
        category: txCategory,
        amount: Number(txAmount),
        description: txDescription,
        voucherNumber: txVoucher,
        recordedBy: cashierName,
      });
      if (res.success) {
        setToastMsg(`₹${txAmount} recorded as ${txType === "cash_in" ? "Cash In" : "Cash Out"}!`);
        setTransactionModal(false);
        setTxDescription("");
        setTxVoucher("");
        await loadData();
      } else {
        alert(res.message || "Failed to record transaction");
      }
    } catch (err: any) {
      alert(err.message || "Failed to record transaction");
    }
  };

  // Calculate physical total from denomination counts
  const countedCash =
    (Number(denominations.note500) || 0) * 500 +
    (Number(denominations.note200) || 0) * 200 +
    (Number(denominations.note100) || 0) * 100 +
    (Number(denominations.note50) || 0) * 50 +
    (Number(denominations.note20) || 0) * 20 +
    (Number(denominations.note10) || 0) * 10 +
    (Number(denominations.coins) || 0);

  const expectedCash = activeShift?.expectedCash || 0;
  const discrepancy = countedCash - expectedCash;

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;
    try {
      const res = await cashCounterApi.closeShift({
        shiftId: activeShift.shiftId,
        denominations,
        actualCashCounted: countedCash,
        discrepancyReason: discrepancy !== 0 ? discrepancyReason : "",
        handoverTo,
        handoverNotes,
      });
      if (res.success) {
        setToastMsg(`Shift #${activeShift.shiftId} closed and reconciled successfully!`);
        setCloseShiftModal(false);
        setPrintShiftData(res.data);
        await loadData();
      } else {
        alert(res.message || "Failed to close shift");
      }
    } catch (err: any) {
      alert(err.message || "Failed to close shift");
    }
  };

  return (
    <RoleGuard
      allowedRoles={["super_admin", "hotel_admin", "hotel_manager", "receptionist", "finance"]}
      moduleName="Cash Counter Management"
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-[26px] font-bold text-[#111827] tracking-tight">
                Cash Counter &amp; Shift Closing
              </h1>
              {isOpen ? (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Shift Open
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-bold bg-gray-100 text-gray-700 border border-gray-300">
                  <Lock className="w-3 h-3" />
                  Counter Closed
                </span>
              )}
            </div>
            <p className="text-[13px] text-[#6B7280] mt-0.5">
              Live cash drawer ledger, petty cash payouts, denomination calculator &amp; shift reconciliation
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Multi-Property Switcher */}
            {hotels.length > 0 && (
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-[#D1D5DB] rounded shadow-xs">
                <Building2 className="w-4 h-4 text-[#EC3013]" />
                <select
                  value={selectedHotelId}
                  onChange={(e) => {
                    const hId = e.target.value;
                    setSelectedHotelId(hId);
                    const match = hotels.find((h) => h.id === hId);
                    if (match) setSelectedHotelName(match.name);
                  }}
                  className="bg-transparent text-[13px] font-bold text-[#111827] focus:outline-none cursor-pointer"
                >
                  {hotels.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} {h.city ? `(${h.city})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={loadData}
              title="Refresh"
              className="p-2 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] rounded text-[#4B5563] transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#EC3013]" : ""}`} />
            </button>

            {isOpen ? (
              <>
                <button
                  onClick={() => {
                    setTxType("cash_out");
                    setTransactionModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#374151] text-[13px] font-bold rounded shadow-xs transition-colors"
                >
                  <Receipt className="w-4 h-4 text-amber-600" />
                  <span>Petty Cash Out</span>
                </button>

                <button
                  onClick={() => {
                    setTxType("cash_in");
                    setTransactionModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#374151] text-[13px] font-bold rounded shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <span>Cash In</span>
                </button>

                <button
                  onClick={() => setCloseShiftModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white text-[13px] font-bold rounded shadow-xs transition-colors cursor-pointer"
                >
                  <Calculator className="w-4 h-4" />
                  <span>Close Shift &amp; Audit</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setOpenShiftModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold rounded shadow-xs transition-colors cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                <span>Start New Shift</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Toast */}
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-[#E5E7EB]">
          <button
            onClick={() => setActiveTab("current")}
            className={`pb-2.5 px-3 text-[13px] font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "current"
                ? "border-[#EC3013] text-[#EC3013]"
                : "border-transparent text-[#6B7280] hover:text-[#111827]"
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Active Cash Drawer</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`pb-2.5 px-3 text-[13px] font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "history"
                ? "border-[#EC3013] text-[#EC3013]"
                : "border-transparent text-[#6B7280] hover:text-[#111827]"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Shift Handover History ({historyShifts.length})</span>
          </button>
        </div>

        {activeTab === "current" ? (
          isOpen && activeShift ? (
            <div className="space-y-6">
              {/* Financial Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-xs">
                  <div className="flex items-center justify-between text-[#6B7280]">
                    <span className="text-[12px] font-bold uppercase tracking-wider">Net Drawer Cash</span>
                    <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                      <Wallet className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2 text-[26px] font-black text-emerald-700">
                    ₹{activeShift.expectedCash.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[11px] text-[#6B7280] mt-1 flex items-center gap-1">
                    <span>Expected physical balance right now</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-xs">
                  <div className="flex items-center justify-between text-[#6B7280]">
                    <span className="text-[12px] font-bold uppercase tracking-wider">Opening Float</span>
                    <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                      <Coins className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2 text-[26px] font-black text-[#111827]">
                    ₹{activeShift.openingFloat.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[11px] text-[#6B7280] mt-1 font-medium">
                    Shift #{activeShift.shiftId} • {activeShift.hotelName || selectedHotelName || "Property"} by {activeShift.cashierName}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-xs">
                  <div className="flex items-center justify-between text-[#6B7280]">
                    <span className="text-[12px] font-bold uppercase tracking-wider">Total Cash In</span>
                    <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                      <ArrowDownLeft className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2 text-[26px] font-black text-emerald-600">
                    +₹{(activeShift.totalCashIn - activeShift.openingFloat > 0 ? activeShift.totalCashIn - activeShift.openingFloat : 0).toLocaleString("en-IN")}
                  </div>
                  <div className="text-[11px] text-[#6B7280] mt-1">
                    Guest payments, booking advances
                  </div>
                </div>

                <div className="bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-xs">
                  <div className="flex items-center justify-between text-[#6B7280]">
                    <span className="text-[12px] font-bold uppercase tracking-wider">Total Cash Out</span>
                    <div className="w-8 h-8 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2 text-[26px] font-black text-red-600">
                    -₹{(activeShift.totalCashOut || 0).toLocaleString("en-IN")}
                  </div>
                  <div className="text-[11px] text-[#6B7280] mt-1">
                    Petty cash, emergency supplies &amp; payouts
                  </div>
                </div>
              </div>

              {/* Live Cash Ledger Table */}
              <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-xs overflow-hidden">
                <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
                  <div>
                    <h2 className="text-[15px] font-bold text-[#111827]">
                      Live Cash Movement Ledger ({transactions.length} entries)
                    </h2>
                    <p className="text-[12px] text-[#6B7280]">
                      Shift started: {new Date(activeShift.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} | Cashier: {activeShift.cashierName}
                    </p>
                  </div>
                  <div className="text-[12px] text-[#6B7280] font-medium">
                    Auto-reconciled with front desk billing
                  </div>
                </div>

                {transactions.length === 0 ? (
                  <div className="p-12 text-center text-[#6B7280]">
                    <Receipt className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                    <p className="font-semibold">No cash transactions yet for this shift.</p>
                    <p className="text-[12px]">Any cash payments collected or petty cash payouts will appear here.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[13px]">
                      <thead>
                        <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#4B5563] text-[11px] uppercase tracking-wider">
                          <th className="py-3 px-4">Time</th>
                          <th className="py-3 px-4">Type</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Description</th>
                          <th className="py-3 px-4">Voucher / Ref</th>
                          <th className="py-3 px-4">Recorded By</th>
                          <th className="py-3 px-4 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F3F4F6]">
                        {transactions.map((tx) => (
                          <tr key={tx._id || tx.transactionId} className="hover:bg-[#F9FAFB] transition-colors">
                            <td className="py-3 px-4 text-[#6B7280] whitespace-nowrap">
                              {new Date(tx.timestamp || tx.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              {tx.type === "cash_in" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <ArrowDownLeft className="w-3 h-3" /> Cash In
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                                  <ArrowUpRight className="w-3 h-3" /> Cash Out
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 font-semibold text-[#111827] capitalize">
                              {tx.category.replace(/_/g, " ")}
                            </td>
                            <td className="py-3 px-4 text-[#374151]">
                              {tx.description}
                            </td>
                            <td className="py-3 px-4 text-[#6B7280] font-mono text-[12px]">
                              {tx.voucherNumber || tx.referenceId || "—"}
                            </td>
                            <td className="py-3 px-4 text-[#4B5563]">
                              {tx.recordedBy}
                            </td>
                            <td className={`py-3 px-4 text-right font-bold whitespace-nowrap ${tx.type === "cash_in" ? "text-emerald-700" : "text-red-700"}`}>
                              {tx.type === "cash_in" ? "+" : "-"}₹{Number(tx.amount).toLocaleString("en-IN")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-lg border border-[#E5E7EB] shadow-xs text-center max-w-lg mx-auto space-y-4">
              <div className="w-14 h-14 bg-gray-100 border border-gray-300 rounded-full flex items-center justify-center mx-auto text-gray-500">
                <Lock className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-[18px] font-bold text-[#111827]">Cash Counter is Currently Closed</h3>
                <p className="text-[13px] text-[#6B7280] mt-1">
                  Start your shift by entering the opening cash float in the drawer to begin recording cash transactions and room payments.
                </p>
              </div>
              <button
                onClick={() => setOpenShiftModal(true)}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold rounded shadow-xs transition-colors cursor-pointer"
              >
                Open Shift Now
              </button>
            </div>
          )
        ) : (
          /* History Tab */
          <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#E5E7EB]">
              <h2 className="text-[15px] font-bold text-[#111827]">Closed Shifts Audit Trail</h2>
              <p className="text-[12px] text-[#6B7280]">Complete historical record of shift handovers, counted cash, and variance</p>
            </div>

            {historyShifts.length === 0 ? (
              <div className="p-10 text-center text-[#6B7280]">
                No past shifts recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[13px]">
                  <thead>
                    <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#4B5563] text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4">Shift ID</th>
                      <th className="py-3 px-4">Property</th>
                      <th className="py-3 px-4">Cashier</th>
                      <th className="py-3 px-4">Start - End Time</th>
                      <th className="py-3 px-4 text-right">Opening Float</th>
                      <th className="py-3 px-4 text-right">Expected Cash</th>
                      <th className="py-3 px-4 text-right">Physical Counted</th>
                      <th className="py-3 px-4 text-right">Discrepancy</th>
                      <th className="py-3 px-4">Handover To</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F4F6]">
                    {historyShifts.map((shift) => {
                      const hasDiscrepancy = shift.discrepancy !== 0;
                      return (
                        <tr key={shift._id || shift.shiftId} className="hover:bg-[#F9FAFB]">
                          <td className="py-3 px-4 font-mono font-bold text-[#111827]">
                            {shift.shiftId}
                          </td>
                          <td className="py-3 px-4 font-semibold text-[#111827]">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                              <span>{shift.hotelName || selectedHotelName || "Main Property"}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-semibold text-[#374151]">
                            {shift.cashierName}
                          </td>
                          <td className="py-3 px-4 text-[#6B7280] text-[12px]">
                            {new Date(shift.startTime).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            {" → "}
                            {shift.endTime ? new Date(shift.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-[#111827]">
                            ₹{Number(shift.openingFloat || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-[#111827]">
                            ₹{Number(shift.expectedCash || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-700">
                            ₹{Number(shift.actualCashCounted || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-4 text-right font-bold">
                            {hasDiscrepancy ? (
                              <span className={`px-2 py-0.5 rounded text-[11px] ${shift.discrepancy < 0 ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}`}>
                                {shift.discrepancy < 0 ? `Shortage: -₹${Math.abs(shift.discrepancy)}` : `Excess: +₹${shift.discrepancy}`}
                              </span>
                            ) : (
                              <span className="text-emerald-600 text-[11px] font-bold">Matched (₹0)</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-[#4B5563]">
                            {shift.handoverTo || "—"}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => setPrintShiftData(shift)}
                              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                              title="Print Summary Slip"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Modal: Open Shift */}
        {openShiftModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-[17px] font-bold text-[#111827]">Start Cashier Shift</h3>
                <button onClick={() => setOpenShiftModal(false)} className="text-gray-400 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleOpenShift} className="space-y-4 text-[13px]">
                {hotels.length > 0 && (
                  <div>
                    <label className="block font-semibold text-[#374151] mb-1">Select Hotel / Property</label>
                    <select
                      value={selectedHotelId}
                      onChange={(e) => {
                        const hId = e.target.value;
                        setSelectedHotelId(hId);
                        const match = hotels.find((h) => h.id === hId);
                        if (match) setSelectedHotelName(match.name);
                      }}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-[13px] font-bold text-gray-800 bg-gray-50 focus:outline-none focus:border-[#EC3013]"
                    >
                      {hotels.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name} {h.city ? `(${h.city})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Cashier Name</label>
                  <input
                    type="text"
                    required
                    value={cashierName}
                    onChange={(e) => setCashierName(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-[13px] focus:outline-none focus:border-[#EC3013]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Starting Cash / Opening Float (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={openingFloat}
                    onChange={(e) => setOpeningFloat(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-[14px] font-bold text-emerald-700 focus:outline-none focus:border-[#EC3013]"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">Physical cash currently inside the cash drawer.</p>
                </div>
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Remarks / Shift Notes</label>
                  <textarea
                    rows={2}
                    value={openNotes}
                    onChange={(e) => setOpenNotes(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-[13px] focus:outline-none focus:border-[#EC3013]"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setOpenShiftModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold shadow-xs"
                  >
                    Open Shift &amp; Start
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Record Petty Cash Out / Cash In */}
        {transactionModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-[17px] font-bold text-[#111827]">
                  {txType === "cash_in" ? "Record Cash In (Deposit)" : "Record Petty Cash Payout"}
                </h3>
                <button onClick={() => setTransactionModal(false)} className="text-gray-400 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddTransaction} className="space-y-4 text-[13px]">
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Category</label>
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-[13px] focus:outline-none focus:border-[#EC3013]"
                  >
                    {txType === "cash_in" ? (
                      <>
                        <option value="room_payment">Room Booking Payment</option>
                        <option value="restaurant_pos">Restaurant / F&amp;B Cash</option>
                        <option value="advance_deposit">Guest Advance Deposit</option>
                        <option value="other">Other Cash Receipt</option>
                      </>
                    ) : (
                      <>
                        <option value="petty_cash_expense">Daily Petty Cash (Milk, Tea, Stationery)</option>
                        <option value="vendor_payout">Vendor / Courier Payout</option>
                        <option value="other">Emergency Maintenance / Other Payout</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={txAmount}
                    onChange={(e) => setTxAmount(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-[15px] font-black focus:outline-none focus:border-[#EC3013]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Description / Purpose</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5 Liters milk for restaurant & reception tea"
                    value={txDescription}
                    onChange={(e) => setTxDescription(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-[13px] focus:outline-none focus:border-[#EC3013]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Voucher Number / Bill Ref</label>
                  <input
                    type="text"
                    placeholder="e.g. VCH-0042 or Bill #81"
                    value={txVoucher}
                    onChange={(e) => setTxVoucher(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-[13px] focus:outline-none focus:border-[#EC3013]"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setTransactionModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-5 py-2 text-white rounded font-bold shadow-xs ${txType === "cash_in" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}`}
                  >
                    Confirm &amp; Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Close Shift & Denomination Calculator */}
        {closeShiftModal && activeShift && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 my-8">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-[18px] font-bold text-[#111827]">Shift Closing &amp; Cash Reconciliation</h3>
                  <p className="text-[12px] text-gray-500">
                    Enter physical currency notes in the drawer to reconcile with expected system cash
                  </p>
                </div>
                <button onClick={() => setCloseShiftModal(false)} className="text-gray-400 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* System Expected vs Counted Comparison Banner */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-lg bg-gray-50 border border-gray-200 text-center">
                <div>
                  <div className="text-[11px] font-bold uppercase text-gray-500">System Expected</div>
                  <div className="text-[20px] font-black text-gray-900">₹{expectedCash.toLocaleString("en-IN")}</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase text-gray-500">Physical Counted</div>
                  <div className="text-[20px] font-black text-emerald-700">₹{countedCash.toLocaleString("en-IN")}</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase text-gray-500">Discrepancy</div>
                  <div className={`text-[20px] font-black ${discrepancy === 0 ? "text-emerald-600" : discrepancy < 0 ? "text-red-600" : "text-blue-600"}`}>
                    {discrepancy === 0 ? "₹0 (Perfect)" : discrepancy < 0 ? `-₹${Math.abs(discrepancy)} Short` : `+₹${discrepancy} Excess`}
                  </div>
                </div>
              </div>

              <form onSubmit={handleCloseShift} className="space-y-4 text-[13px]">
                {/* Denomination Counter */}
                <div>
                  <label className="block font-bold text-gray-800 mb-2">Currency Denomination Counter</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 border border-gray-200 rounded-lg">
                    {[
                      { key: "note500", mult: 500, label: "₹500 Notes" },
                      { key: "note200", mult: 200, label: "₹200 Notes" },
                      { key: "note100", mult: 100, label: "₹100 Notes" },
                      { key: "note50", mult: 50, label: "₹50 Notes" },
                      { key: "note20", mult: 20, label: "₹20 Notes" },
                      { key: "note10", mult: 10, label: "₹10 Notes" },
                      { key: "coins", mult: 1, label: "Coins Total (₹)" },
                    ].map((item) => (
                      <div key={item.key} className="space-y-1">
                        <span className="text-[11px] font-bold text-gray-600">{item.label}</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            value={denominations[item.key]}
                            onChange={(e) =>
                              setDenominations({
                                ...denominations,
                                [item.key]: Math.max(0, parseInt(e.target.value) || 0),
                              })
                            }
                            className="w-full border border-gray-300 rounded px-2 py-1 text-[13px] font-bold text-center focus:outline-none focus:border-[#EC3013]"
                          />
                        </div>
                        <div className="text-[10px] text-gray-400 text-right">
                          = ₹{(denominations[item.key] * item.mult).toLocaleString("en-IN")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {discrepancy !== 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg space-y-1">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-[12px]">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span>Cash Discrepancy Reason Required</span>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Explain reason for shortage/excess (e.g. pending guest refund or change shortage)"
                      value={discrepancyReason}
                      onChange={(e) => setDiscrepancyReason(e.target.value)}
                      className="w-full border border-amber-300 rounded px-3 py-1.5 text-[12px] bg-white"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Handover To (Next Shift Staff)</label>
                    <input
                      type="text"
                      required
                      value={handoverTo}
                      onChange={(e) => setHandoverTo(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-[13px]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Handover Notes / Keys</label>
                    <input
                      type="text"
                      value={handoverNotes}
                      onChange={(e) => setHandoverNotes(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-[13px]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setCloseShiftModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white rounded font-bold shadow-xs"
                  >
                    Confirm Shift Close &amp; Handover
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Printable Shift Summary Slip */}
        {printShiftData && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-[17px] font-bold text-[#111827]">Shift Closing Summary Slip</h3>
                <button onClick={() => setPrintShiftData(null)} className="text-gray-400 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200 rounded font-mono text-[12px] space-y-2">
                <div className="text-center font-bold text-[14px] text-gray-900 border-b pb-1">
                  HOTEL OPERATING SYSTEM
                  <div className="text-[11px] font-normal text-gray-500">CASH DRAWER CLOSING REPORT</div>
                </div>
                <div className="flex justify-between">
                  <span>Shift ID:</span>
                  <span className="font-bold">{printShiftData.shiftId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cashier:</span>
                  <span>{printShiftData.cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Closed Time:</span>
                  <span>{new Date(printShiftData.endTime || Date.now()).toLocaleTimeString()}</span>
                </div>
                <div className="border-t my-1" />
                <div className="flex justify-between">
                  <span>Opening Float:</span>
                  <span>₹{printShiftData.openingFloat?.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Total Cash In:</span>
                  <span>+₹{printShiftData.totalCashIn?.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-red-700">
                  <span>Total Cash Out:</span>
                  <span>-₹{printShiftData.totalCashOut?.toLocaleString("en-IN")}</span>
                </div>
                <div className="border-t my-1" />
                <div className="flex justify-between font-bold text-[13px]">
                  <span>System Expected:</span>
                  <span>₹{printShiftData.expectedCash?.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between font-bold text-[13px] text-emerald-700">
                  <span>Physical Counted:</span>
                  <span>₹{printShiftData.actualCashCounted?.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between font-bold text-[13px]">
                  <span>Discrepancy:</span>
                  <span className={printShiftData.discrepancy === 0 ? "text-emerald-600" : "text-red-600"}>
                    {printShiftData.discrepancy === 0 ? "₹0 (Balanced)" : `₹${printShiftData.discrepancy}`}
                  </span>
                </div>
                {printShiftData.handoverTo && (
                  <div className="pt-2 border-t text-gray-600">
                    <div>Handed over to: <b>{printShiftData.handoverTo}</b></div>
                    {printShiftData.handoverNotes && <div>Note: {printShiftData.handoverNotes}</div>}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setPrintShiftData(null)}
                  className="px-4 py-2 border border-gray-300 rounded font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2 bg-gray-900 hover:bg-black text-white rounded font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Slip</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
