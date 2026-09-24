"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { invoicesApi, InvoiceRecord, roomsApi } from "@/lib/api";
import { Receipt, Plus, Search, CheckCircle2, X, CreditCard, RefreshCw } from "lucide-react";
import { RoleGuard } from "@/components/layout/RoleGuard";

export default function BillingPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [newInvoice, setNewInvoice] = useState<{
    guest: string;
    room: string;
    amount: string | number;
    status: InvoiceRecord["status"];
    paymentMethod: string;
  }>({
    guest: "",
    room: "",
    amount: "",
    status: "pending",
    paymentMethod: "Credit Card",
  });

  const loadInvoices = async () => {
    setIsLoading(true);
    try {
      const effectiveOrgId = user?.orgId || "org-987123-1788542768377";
      const [res, roomList] = await Promise.all([
        invoicesApi.getAll({ orgId: effectiveOrgId }),
        roomsApi.getAll({ orgId: effectiveOrgId }),
      ]);

      if (res && res.data) {
        setInvoices(res.data);
      }
      setRooms(roomList || []);
    } catch (e) {
      console.error("Error loading invoices from database:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [user?.orgId]);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoice.guest) return;

    try {
      const selectedRoom = rooms.find(
        (r: any) => String(r.number || r.roomNumber) === String(newInvoice.room)
      );
      const targetHotelId = selectedRoom?.hotelId || user?.hotelId || "hotel-1788547097892";
      const targetHotelName =
        selectedRoom?.hotelName ||
        (targetHotelId === "hotel-1788547097892" ? "Regal 77" : (user?.hotelName || "Royal hotel"));

      const created = await invoicesApi.create({
        guest: newInvoice.guest,
        room: newInvoice.room,
        amount: Number(newInvoice.amount),
        status: newInvoice.status,
        paymentMethod: newInvoice.paymentMethod,
        hotelId: targetHotelId,
        hotelName: targetHotelName,
        orgId: user?.orgId || "org-987123-1788542768377",
        billedBy: user?.name || "Front Desk Staff",
        billedByRole: user?.role || "receptionist",
      });

      setInvoices([created, ...invoices]);
      setIsModalOpen(false);
      setToastMsg(`✅ Invoice ${created.id} (₹${created.amount}) saved directly to MongoDB database`);
      setTimeout(() => setToastMsg(null), 3500);

      // Broadcast real-time notification
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("hos_notification", {
            detail: {
              title: "Invoice & Revenue Record Created",
              description: `Invoice ${created.id} for ${created.guest} (Room ${created.room}) saved to database for ₹${created.amount}`,
              category: "billing",
              href: "/operations/billing",
            },
          })
        );
      }

      setNewInvoice({ guest: "", room: "", amount: "", status: "pending", paymentMethod: "Credit Card" });
    } catch (err: any) {
      console.error("Failed to save invoice:", err);
      setToastMsg(`❌ Failed to save invoice: ${err?.message || "Server error"}`);
    }
  };

  const markPaid = async (invoiceId: string) => {
    try {
      const updated = await invoicesApi.markPaid(invoiceId, "Credit Card");
      setInvoices(invoices.map((inv) => (inv.id === invoiceId ? { ...inv, status: "paid" as const, transactionRef: updated.transactionRef } : inv)));

      setToastMsg(`✅ Invoice ${invoiceId} marked as Paid & transaction saved to database`);
      setTimeout(() => setToastMsg(null), 3000);

      // Broadcast real-time payment settlement notification
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("hos_notification", {
            detail: {
              title: "Payment Transaction Settled",
              description: `Invoice ${invoiceId} marked Paid & saved to MongoDB Atlas revenue ledger`,
              category: "billing",
              href: "/operations/billing",
            },
          })
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.guest.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.room.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalInvoiced = invoices.reduce((acc, i) => acc + (i.amount || 0), 0);
  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((acc, i) => acc + (i.amount || 0), 0);
  const totalPending = invoices.filter((i) => i.status === "pending").reduce((acc, i) => acc + (i.amount || 0), 0);
  const totalOverdue = invoices.filter((i) => i.status === "overdue").reduce((acc, i) => acc + (i.amount || 0), 0);

  return (
    <RoleGuard
      allowedRoles={["super_admin", "hotel_admin", "hotel_manager", "finance"]}
      moduleName="Billing & Revenue Transactions"
    >
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#111827] tracking-tight">
            Billing &amp; Revenue Transactions
          </h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            Guest folios, payment settlements, and revenue records persisted to database
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadInvoices}
            title="Refresh database records"
            className="p-2 border border-[#D1D5DB] rounded text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#EC3013]" : ""}`} />
          </button>
          <button
            onClick={() => {
              setNewInvoice({ guest: "", room: "", amount: "", status: "pending", paymentMethod: "Credit Card" });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white text-[13px] font-bold rounded shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Invoice</span>
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

      {/* Metric Cards (Vibrant Reference Style - Red, Green, Orange, Cyan) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="relative overflow-hidden bg-[#E53935] hover:bg-[#D32F2F] p-6 rounded-xl text-white shadow-lg shadow-red-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-1">
              <div className="text-[34px] font-extrabold tracking-tight leading-none text-white drop-shadow-xs">
                ₹{totalInvoiced.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
              <div className="text-[12px] font-semibold text-white/90 uppercase tracking-wide">
                Total Invoiced
              </div>
              <div className="text-[11px] text-white/75 font-medium truncate max-w-[150px]">
                Gross billings across folios
              </div>
            </div>
            <div className="w-14 h-14 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10 text-white/90 shrink-0 group-hover:scale-105 group-hover:bg-white/20 transition-all">
              <Receipt className="w-7 h-7 stroke-[2]" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-[#43A047] hover:bg-[#388E3C] p-6 rounded-xl text-white shadow-lg shadow-green-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-1">
              <div className="text-[34px] font-extrabold tracking-tight leading-none text-white drop-shadow-xs">
                ₹{totalPaid.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
              <div className="text-[12px] font-semibold text-white/90 uppercase tracking-wide">
                Paid &amp; Settled
              </div>
              <div className="text-[11px] text-white/75 font-medium truncate max-w-[150px]">
                Cleared payments in ledger
              </div>
            </div>
            <div className="w-14 h-14 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10 text-white/90 shrink-0 group-hover:scale-105 group-hover:bg-white/20 transition-all">
              <CheckCircle2 className="w-7 h-7 stroke-[2]" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-[#FB8C00] hover:bg-[#F57C00] p-6 rounded-xl text-white shadow-lg shadow-orange-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-1">
              <div className="text-[34px] font-extrabold tracking-tight leading-none text-white drop-shadow-xs">
                ₹{totalPending.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
              <div className="text-[12px] font-semibold text-white/90 uppercase tracking-wide">
                Pending Collection
              </div>
              <div className="text-[11px] text-white/75 font-medium truncate max-w-[150px]">
                Due at check-out or billing
              </div>
            </div>
            <div className="w-14 h-14 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10 text-white/90 shrink-0 group-hover:scale-105 group-hover:bg-white/20 transition-all">
              <CreditCard className="w-7 h-7 stroke-[2]" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-[#00ACC1] hover:bg-[#0097A7] p-6 rounded-xl text-white shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-1">
              <div className="text-[34px] font-extrabold tracking-tight leading-none text-white drop-shadow-xs">
                ₹{totalOverdue.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
              <div className="text-[12px] font-semibold text-white/90 uppercase tracking-wide">
                Overdue Balances
              </div>
              <div className="text-[11px] text-white/75 font-medium truncate max-w-[150px]">
                Awaiting immediate recovery
              </div>
            </div>
            <div className="w-14 h-14 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10 text-white/90 shrink-0 group-hover:scale-105 group-hover:bg-white/20 transition-all">
              <Receipt className="w-7 h-7 stroke-[2]" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3.5 rounded-lg border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {["all", "paid", "pending", "overdue"].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded text-[12px] font-semibold capitalize transition-colors ${
                statusFilter === tab
                  ? "bg-[#111827] text-white"
                  : "text-[#4B5563] hover:bg-[#F3F4F6]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search invoice or guest..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-1.5 bg-[#F9FAFB] border border-[#D1D5DB] rounded text-[13px] text-[#111827] focus:outline-none focus:border-[#EC3013] w-full sm:w-64"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider bg-[#F9FAFB]">
                <th className="py-3 px-4 font-bold">INVOICE</th>
                <th className="py-3 px-4 font-bold">GUEST</th>
                <th className="py-3 px-4 font-bold">ROOM</th>
                <th className="py-3 px-4 font-bold">DATE</th>
                <th className="py-3 px-4 font-bold">STATUS</th>
                <th className="py-3 px-4 font-bold">AMOUNT</th>
                <th className="py-3 px-4 text-right font-bold">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#9CA3AF]">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#EC3013]" />
                      <span>Loading revenue &amp; transaction records from database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#9CA3AF]">
                    No invoices in database matching this filter
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#111827]">
                      {inv.id}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#111827]">
                      {inv.guest}
                    </td>
                    <td className="py-3.5 px-4 text-[#374151] font-mono">
                      Room {inv.room}
                    </td>
                    <td className="py-3.5 px-4 text-[#6B7280]">
                      {inv.date}
                    </td>
                    <td className="py-3.5 px-4">
                      {inv.status === "paid" ? (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Paid
                        </span>
                      ) : inv.status === "pending" ? (
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Pending
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          Overdue
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#111827]">
                      ₹{(inv.amount || 0).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {inv.status !== "paid" ? (
                        <button
                          type="button"
                          onClick={() => markPaid(inv.id)}
                          className="px-3 py-1 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#111827] text-[11px] font-bold rounded shadow-xs cursor-pointer active:scale-95 transition-transform"
                        >
                          Mark Paid
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-700 font-bold">Settled ✓</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Invoice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 space-y-4 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#EC3013]" />
                <h3 className="text-[16px] font-bold text-[#111827]">Generate Invoice</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#9CA3AF] hover:text-[#111827] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4 text-[13px]">
              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                  Guest Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={newInvoice.guest}
                  onChange={(e) => setNewInvoice({ ...newInvoice, guest: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded focus:outline-none focus:border-[#EC3013]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Available Room *
                  </label>
                  {rooms.length > 0 ? (
                    <select
                      required
                      value={newInvoice.room}
                      onChange={(e) => setNewInvoice({ ...newInvoice, room: e.target.value })}
                      className="w-full px-3 py-2 border border-[#D1D5DB] rounded bg-white focus:outline-none focus:border-[#EC3013]"
                    >
                      <option value="">-- Select an Available Room --</option>
                      {rooms.map((r: any) => {
                        const num = r.number || r.roomNumber;
                        return (
                          <option key={r.id || num} value={num}>
                            Room {num} ({r.type || "Standard"} - Floor {r.floor || 1})
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <div className="px-2 py-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800">
                      ⚠️ No rooms configured
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="Enter amount (e.g. 3500)"
                    value={newInvoice.amount}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.]/g, "");
                      setNewInvoice({ ...newInvoice, amount: val });
                    }}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded focus:outline-none focus:border-[#EC3013]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Payment Status *
                  </label>
                  <select
                    value={newInvoice.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as any;
                      setNewInvoice({
                        ...newInvoice,
                        status: newStatus,
                        paymentMethod: newStatus === "paid" ? (newInvoice.paymentMethod && newInvoice.paymentMethod !== "—" ? newInvoice.paymentMethod : "Credit Card") : "—",
                      });
                    }}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded bg-white focus:outline-none focus:border-[#EC3013]"
                  >
                    <option value="pending">Pending Payment (Unpaid)</option>
                    <option value="paid">Paid (Immediate Settlement)</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
                {newInvoice.status === "paid" ? (
                  <div>
                    <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                      Payment Method *
                    </label>
                    <select
                      value={newInvoice.paymentMethod || "Credit Card"}
                      onChange={(e) => setNewInvoice({ ...newInvoice, paymentMethod: e.target.value })}
                      className="w-full px-3 py-2 border border-[#D1D5DB] rounded bg-white focus:outline-none focus:border-[#EC3013]"
                    >
                      <option value="Credit Card">Credit Card</option>
                      <option value="Cash">Cash</option>
                      <option value="UPI / Digital">UPI / Digital</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-bold text-[#9CA3AF] uppercase mb-1">
                      Payment Method
                    </label>
                    <div className="px-3 py-2 bg-[#F3F4F6] border border-[#E5E7EB] rounded text-[12px] text-[#6B7280] flex items-center justify-between">
                      <span>Unpaid (Pending)</span>
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded uppercase">Pending</span>
                    </div>
                  </div>
                )}
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
    </RoleGuard>
  );
}
