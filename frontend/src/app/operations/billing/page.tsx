"use client";

import { useState, useEffect } from "react";
import { invoicesApi, InvoiceRecord } from "@/lib/api";
import { Receipt, Plus, Search, CheckCircle2, X, CreditCard, RefreshCw } from "lucide-react";

export default function BillingPage() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [newInvoice, setNewInvoice] = useState({
    guest: "",
    room: "204",
    amount: 350.0,
    status: "pending" as InvoiceRecord["status"],
    paymentMethod: "Credit Card",
  });

  const loadInvoices = async () => {
    setIsLoading(true);
    try {
      const res = await invoicesApi.getAll();
      if (res && res.data) {
        setInvoices(res.data);
      }
    } catch (e) {
      console.error("Error loading invoices from database:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoice.guest) return;

    try {
      const created = await invoicesApi.create({
        guest: newInvoice.guest,
        room: newInvoice.room,
        amount: Number(newInvoice.amount),
        status: newInvoice.status,
        paymentMethod: newInvoice.paymentMethod,
        hotelName: "Meridian Grand Palace",
      });

      setInvoices([created, ...invoices]);
      setIsModalOpen(false);
      setToastMsg(`✅ Invoice ${created.id} ($${created.amount}) saved directly to MongoDB database`);
      setTimeout(() => setToastMsg(null), 3500);

      // Broadcast real-time notification
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("hos_notification", {
            detail: {
              title: "Invoice & Revenue Record Created",
              description: `Invoice ${created.id} for ${created.guest} (Room ${created.room}) saved to database for $${created.amount}`,
              category: "billing",
              href: "/operations/billing",
            },
          })
        );
      }

      setNewInvoice({ guest: "", room: "204", amount: 350.0, status: "pending", paymentMethod: "Credit Card" });
    } catch (err: any) {
      console.error("Failed to save invoice:", err);
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
            onClick={() => setIsModalOpen(true)}
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

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-xs">
          <div className="text-[11px] font-bold text-[#6B7280] uppercase">Total Invoiced</div>
          <div className="text-[24px] font-bold text-[#111827] mt-1.5">${totalInvoiced.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-xs">
          <div className="text-[11px] font-bold text-emerald-600 uppercase">Paid &amp; Settled</div>
          <div className="text-[24px] font-bold text-emerald-700 mt-1.5">${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-xs">
          <div className="text-[11px] font-bold text-amber-600 uppercase">Pending Collection</div>
          <div className="text-[24px] font-bold text-amber-700 mt-1.5">${totalPending.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-xs">
          <div className="text-[11px] font-bold text-rose-600 uppercase">Overdue</div>
          <div className="text-[24px] font-bold text-rose-700 mt-1.5">${totalOverdue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
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
                      ${(inv.amount || 0).toFixed(2)}
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
                    Room Number
                  </label>
                  <input
                    type="text"
                    value={newInvoice.room}
                    onChange={(e) => setNewInvoice({ ...newInvoice, room: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newInvoice.amount}
                    onChange={(e) => setNewInvoice({ ...newInvoice, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Payment Status
                  </label>
                  <select
                    value={newInvoice.status}
                    onChange={(e) => setNewInvoice({ ...newInvoice, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded bg-white"
                  >
                    <option value="pending">Pending Payment</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Payment Method
                  </label>
                  <select
                    value={newInvoice.paymentMethod}
                    onChange={(e) => setNewInvoice({ ...newInvoice, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded bg-white"
                  >
                    <option value="Credit Card">Credit Card</option>
                    <option value="Cash">Cash</option>
                    <option value="UPI / Digital">UPI / Digital</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
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
