"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { invoicesApi, InvoiceRecord, hotelsApi, staffApi, roomsApi } from "@/lib/api";
import { Hotel } from "@/types";
import {
  Receipt,
  Plus,
  Search,
  CheckCircle2,
  X,
  CreditCard,
  RefreshCw,
  Building2,
  UserCheck,
  Printer,
  FileText,
  Clock,
  AlertCircle,
  Banknote,
  Smartphone,
  ChevronDown,
} from "lucide-react";

export default function HotelAdminBillingPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [hotelFilter, setHotelFilter] = useState("all");
  const [staffFilter, setStaffFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");

  // Modals & UI
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedFolio, setSelectedFolio] = useState<InvoiceRecord | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // New Invoice Form
  const [newInvoice, setNewInvoice] = useState<{
    guest: string;
    room: string;
    amount: string | number;
    hotelId: string;
    hotelName: string;
    billedBy: string;
    billedByRole: string;
    status: InvoiceRecord["status"];
    paymentMethod: string;
  }>({
    guest: "",
    room: "",
    amount: "",
    hotelId: "",
    hotelName: "",
    billedBy: "",
    billedByRole: "receptionist",
    status: "pending",
    paymentMethod: "UPI / Digital",
  });

  const loadData = async () => {
    if (isAuthLoading) return;
    setIsLoading(true);
    try {
      const effectiveOrgId = user?.orgId || "org-987123-1788542768377";
      const [invRes, hotelList, staffList, roomList] = await Promise.all([
        invoicesApi.getAll({ orgId: effectiveOrgId }),
        hotelsApi.getAll({ orgId: effectiveOrgId }),
        staffApi.getAll({ orgId: effectiveOrgId }),
        roomsApi.getAll({ orgId: effectiveOrgId }),
      ]);

      const items: InvoiceRecord[] = invRes?.data
        ? invRes.data
        : Array.isArray(invRes)
        ? invRes
        : [];
      setInvoices(items);
      setHotels(hotelList);
      setStaffMembers(staffList);
      setRooms(roomList);

      if (hotelList.length > 0 && !newInvoice.hotelId) {
        const firstHotel = hotelList[0];
        setNewInvoice((prev) => ({
          ...prev,
          hotelId: firstHotel.id,
          hotelName: firstHotel.name,
          room: "",
          billedBy: user?.name || "Hotel Admin",
        }));
      }
    } catch (e) {
      console.error("Failed to load organization billing records:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthLoading) {
      loadData();
    }
  }, [user?.orgId, isAuthLoading]);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoice.guest.trim()) return;

    try {
      const selectedHotel = hotels.find((h) => h.id === newInvoice.hotelId);
      const effectiveHotelName = selectedHotel?.name || newInvoice.hotelName || "Regal 77";

      const created = await invoicesApi.create({
        guest: newInvoice.guest.trim(),
        room: newInvoice.room.trim(),
        amount: Number(newInvoice.amount),
        status: newInvoice.status,
        paymentMethod: newInvoice.paymentMethod,
        hotelId: newInvoice.hotelId || "hotel-1788547097892",
        hotelName: effectiveHotelName,
        orgId: user?.orgId || "org-987123-1788542768377",
        billedBy: newInvoice.billedBy || user?.name || "Hotel Admin",
        billedByRole: newInvoice.billedByRole || "receptionist",
      });

      setInvoices([created, ...invoices]);
      setIsCreateModalOpen(false);
      setToastMsg(`✅ Invoice ${created.id} (₹${created.amount.toLocaleString("en-IN")}) issued by ${created.billedBy || user?.name} saved`);
      setTimeout(() => setToastMsg(null), 4000);

      setNewInvoice({
        guest: "",
        room: "",
        amount: "",
        hotelId: hotels[0]?.id || "",
        hotelName: hotels[0]?.name || "",
        billedBy: user?.name || "Hotel Admin",
        billedByRole: "receptionist",
        status: "pending",
        paymentMethod: "UPI / Digital",
      });
    } catch (err: any) {
      console.error("Failed to save invoice:", err);
      setToastMsg(`❌ Failed to save invoice: ${err?.message || "Server error"}`);
    }
  };

  const markPaid = async (invoiceId: string) => {
    try {
      const updated = await invoicesApi.markPaid(invoiceId, "UPI / Digital");
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invoiceId
            ? {
                ...inv,
                status: "paid" as const,
                transactionRef: updated.transactionRef,
                paidAt: new Date().toISOString(),
              }
            : inv
        )
      );

      if (selectedFolio && selectedFolio.id === invoiceId) {
        setSelectedFolio({
          ...selectedFolio,
          status: "paid",
          transactionRef: updated.transactionRef,
          paidAt: new Date().toISOString(),
        });
      }

      setToastMsg(`✅ Invoice ${invoiceId} marked as Paid & settled to ledger`);
      setTimeout(() => setToastMsg(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  // Filtered List
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      !searchQuery.trim() ||
      inv.guest.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.billedBy && inv.billedBy.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (inv.hotelName && inv.hotelName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;

    const selectedHotelObj = hotels.find((h) => h.id === hotelFilter);
    const matchesHotel =
      hotelFilter === "all" ||
      inv.hotelId === hotelFilter ||
      (selectedHotelObj && inv.hotelName && inv.hotelName.toLowerCase() === selectedHotelObj.name.toLowerCase()) ||
      (inv.hotelName && inv.hotelName.toLowerCase().includes(hotelFilter.toLowerCase()));

    const matchesStaff =
      staffFilter === "all" ||
      (inv.billedBy && inv.billedBy.trim().toLowerCase() === staffFilter.trim().toLowerCase()) ||
      (inv.billedBy && inv.billedBy.toLowerCase().includes(staffFilter.toLowerCase()));

    const matchesMethod =
      methodFilter === "all" ||
      (inv.paymentMethod && inv.paymentMethod.toLowerCase() === methodFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesHotel && matchesStaff && matchesMethod;
  });

  // Financial Metrics
  const totalInvoiced = invoices.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
  const totalPending = invoices.filter((i) => i.status === "pending").reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
  const totalOverdue = invoices.filter((i) => i.status === "overdue").reduce((acc, i) => acc + (Number(i.amount) || 0), 0);

  // Distinct Staff members who have billed
  const distinctStaff = Array.from(
    new Set(
      invoices
        .map((i) => i.billedBy)
        .filter(Boolean)
        .concat(staffMembers.map((s) => s.name).filter(Boolean))
    )
  );

  return (
    <div className="space-y-8 font-sans antialiased text-[#111827]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#111827] tracking-tight">
            Billing &amp; Revenue Transactions
          </h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            Full ledger of all transactions, folios, and collections by staff across{" "}
            <strong className="text-[#111827] font-semibold">{user?.orgName || "Hotel Organization"}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            title="Refresh database records"
            className="p-2 bg-white border border-[#D1D5DB] rounded text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#EC3013]" : ""}`} />
          </button>
          <button
            onClick={() => {
              setNewInvoice((prev) => ({
                ...prev,
                guest: "",
                room: "",
                amount: "",
                hotelId: hotels[0]?.id || prev.hotelId,
                hotelName: hotels[0]?.name || prev.hotelName,
                billedBy: user?.name || "Hotel Admin",
              }));
              setIsCreateModalOpen(true);
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

      {/* 4 Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
              Total Invoiced
            </span>
            <Receipt className="w-4 h-4 text-[#EC3013]" />
          </div>
          <div className="text-[28px] font-black text-[#111827] mt-2">
            ₹{totalInvoiced.toLocaleString("en-IN")}
          </div>
          <div className="text-[12px] text-[#9CA3AF] mt-1">
            {invoices.length} total folios generated
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
              Total Settled (Paid)
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-[28px] font-black text-emerald-600 mt-2">
            ₹{totalPaid.toLocaleString("en-IN")}
          </div>
          <div className="text-[12px] text-emerald-700/80 mt-1">
            {totalInvoiced > 0 ? `${Math.round((totalPaid / totalInvoiced) * 100)}% collection rate` : "0% settled"}
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
              Pending Collections
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-[28px] font-black text-amber-600 mt-2">
            ₹{totalPending.toLocaleString("en-IN")}
          </div>
          <div className="text-[12px] text-amber-700/80 mt-1">
            {invoices.filter((i) => i.status === "pending").length} active guest folios
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider">
              Overdue Amount
            </span>
            <AlertCircle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-[28px] font-black text-red-600 mt-2">
            ₹{totalOverdue.toLocaleString("en-IN")}
          </div>
          <div className="text-[12px] text-red-700/80 mt-1">
            {invoices.filter((i) => i.status === "overdue").length} overdue folios
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-[#E5E7EB] shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-4 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search by guest, invoice #, room, or staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#F9FAFB] border border-[#D1D5DB] rounded text-[13px] text-[#111827] focus:outline-none focus:border-[#EC3013]"
            />
          </div>

          {/* Filter by Property */}
          <div className="sm:col-span-3">
            <select
              value={hotelFilter}
              onChange={(e) => setHotelFilter(e.target.value)}
              className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#D1D5DB] rounded text-[13px] text-[#111827] focus:outline-none focus:border-[#EC3013]"
            >
              <option value="all">🏢 All Properties ({hotels.length})</option>
              {hotels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.city})
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Staff / Billed By */}
          <div className="sm:col-span-3">
            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#D1D5DB] rounded text-[13px] text-[#111827] focus:outline-none focus:border-[#EC3013]"
            >
              <option value="all">👤 All Staff / Users ({distinctStaff.length})</option>
              {distinctStaff.map((staffName) => (
                <option key={staffName} value={staffName}>
                  {staffName}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Status */}
          <div className="sm:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#D1D5DB] rounded text-[13px] text-[#111827] focus:outline-none focus:border-[#EC3013]"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid / Settled</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-[12px] text-[#6B7280] pt-1">
          <span>
            Showing <strong className="text-[#111827]">{filteredInvoices.length}</strong> of {invoices.length} transactions
          </span>
          {(searchQuery || statusFilter !== "all" || hotelFilter !== "all" || staffFilter !== "all" || methodFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setHotelFilter("all");
                setStaffFilter("all");
                setMethodFilter("all");
              }}
              className="text-[#EC3013] hover:underline font-semibold"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Transactions Ledger Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider bg-[#F9FAFB]">
                <th className="py-3 px-4 font-bold">INVOICE &amp; DATE</th>
                <th className="py-3 px-4 font-bold">GUEST &amp; ROOM</th>
                <th className="py-3 px-4 font-bold">PROPERTY</th>
                <th className="py-3 px-4 font-bold">BILLED BY / STAFF</th>
                <th className="py-3 px-4 font-bold">PAYMENT METHOD</th>
                <th className="py-3 px-4 font-bold">AMOUNT</th>
                <th className="py-3 px-4 font-bold">STATUS</th>
                <th className="py-3 px-4 text-right font-bold">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#9CA3AF]">
                    <Receipt className="w-8 h-8 mx-auto mb-2 text-[#D1D5DB]" />
                    <p className="font-semibold text-[#374151]">No transactions match your search or filter</p>
                    <p className="text-[12px] mt-0.5">Generate an invoice or clear filters to view transaction folios.</p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#F9FAFB] transition-colors">
                    {/* Invoice ID & Date */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#111827]">{inv.id}</div>
                      <div className="text-[11px] text-[#9CA3AF] flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-[#9CA3AF]" />
                        <span>{inv.date}</span>
                      </div>
                    </td>

                    {/* Guest & Room */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#111827]">{inv.guest}</div>
                      <div className="text-[11px] text-[#6B7280]">
                        Room <strong className="text-[#111827]">{inv.room}</strong>
                      </div>
                    </td>

                    {/* Property */}
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1 text-[12px] font-medium text-[#374151]">
                        <Building2 className="w-3.5 h-3.5 text-[#9CA3AF]" />
                        <span>{inv.hotelName || "Regal 77"}</span>
                      </div>
                    </td>

                    {/* Billed By / Staff */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-[#111827] flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{inv.billedBy || "Front Desk Staff"}</span>
                      </div>
                      <div className="text-[10px] text-[#6B7280] uppercase tracking-wider font-bold">
                        {inv.billedByRole || "receptionist"}
                      </div>
                    </td>

                    {/* Payment Method */}
                    <td className="py-3.5 px-4">
                      {inv.status === "paid" ? (
                        <span className="inline-flex items-center gap-1 text-[12px] text-[#374151] bg-[#F3F4F6] px-2 py-0.5 rounded">
                          {inv.paymentMethod === "UPI / Digital" ? (
                            <Smartphone className="w-3 h-3 text-indigo-600" />
                          ) : inv.paymentMethod === "Cash" ? (
                            <Banknote className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <CreditCard className="w-3 h-3 text-blue-600" />
                          )}
                          <span>{inv.paymentMethod || "Paid"}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[12px] text-[#9CA3AF]">
                          <span>— Unpaid</span>
                        </span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#111827] text-[14px]">
                        ₹{Number(inv.amount || 0).toLocaleString("en-IN")}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
                          inv.status === "paid"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : inv.status === "pending"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-red-50 text-red-800 border-red-200"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedFolio(inv)}
                          className="px-2.5 py-1 text-[12px] font-semibold text-[#374151] hover:text-[#111827] hover:bg-[#F3F4F6] border border-[#D1D5DB] rounded transition-colors cursor-pointer"
                        >
                          View Folio
                        </button>

                        {(inv.status === "pending" || inv.status === "overdue") && (
                          <button
                            onClick={() => markPaid(inv.id)}
                            className="px-2.5 py-1 text-[12px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors cursor-pointer shadow-2xs"
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Interactive Folio Receipt Modal */}
      {selectedFolio && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xl max-w-lg w-full overflow-hidden text-left">
            {/* Modal Header */}
            <div className="bg-[#111827] text-white p-6 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-[#EC3013] text-white font-black text-[10px] flex items-center justify-center rounded">
                    HOS
                  </span>
                  <h3 className="text-[17px] font-bold">{selectedFolio.hotelName || "Regal 77"}</h3>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Official Tax Invoice &amp; Guest Folio</p>
              </div>

              <button
                onClick={() => setSelectedFolio(null)}
                className="text-gray-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Folio Metadata */}
            <div className="p-6 space-y-5 text-[13px]">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-[#E5E7EB]">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#9CA3AF] block">INVOICE NUMBER</span>
                  <span className="font-bold text-[#111827] text-[15px]">{selectedFolio.id}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#9CA3AF] block">DATE &amp; TIME</span>
                  <span className="font-medium text-[#111827]">{selectedFolio.date}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#9CA3AF] block">GUEST NAME</span>
                  <span className="font-bold text-[#111827]">{selectedFolio.guest}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#9CA3AF] block">ASSIGNED ROOM</span>
                  <span className="font-bold text-[#111827]">Room {selectedFolio.room}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#9CA3AF] block">ISSUED / BILLED BY</span>
                  <span className="font-medium text-[#111827] flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    {selectedFolio.billedBy || "Front Desk Staff"} ({selectedFolio.billedByRole || "receptionist"})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#9CA3AF] block">PAYMENT METHOD</span>
                  <span className="font-semibold text-[#111827]">
                    {selectedFolio.status === "paid" ? (selectedFolio.paymentMethod || "Settled") : "— (Pending Settlement)"}
                  </span>
                </div>
              </div>

              {/* Itemized Folio Table */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-2">Itemized Charges</h4>
                <div className="bg-[#F9FAFB] rounded-lg p-3 space-y-2 border border-[#E5E7EB]">
                  <div className="flex justify-between text-[#374151]">
                    <span>Room Accommodation Stay</span>
                    <span className="font-semibold">₹{Math.round(selectedFolio.amount * 0.82).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-[#374151]">
                    <span>CGST (9%)</span>
                    <span>₹{Math.round(selectedFolio.amount * 0.09).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-[#374151]">
                    <span>SGST (9%)</span>
                    <span>₹{Math.round(selectedFolio.amount * 0.09).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="border-t border-[#E5E7EB] pt-2 flex justify-between font-bold text-[#111827] text-[15px]">
                    <span>Total Amount</span>
                    <span className="text-[#EC3013]">₹{selectedFolio.amount.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {/* Transaction Settlement Reference */}
              {selectedFolio.status === "paid" && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-[12px] text-emerald-900 space-y-0.5">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Payment Settled &amp; Verified</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 font-mono">
                    TXN REF: {selectedFolio.transactionRef || `TXN-SETTLE-${Date.now()}`}
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#374151] text-[12px] font-bold rounded transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>

                <div className="flex items-center gap-2">
                  {(selectedFolio.status === "pending" || selectedFolio.status === "overdue") && (
                    <button
                      type="button"
                      onClick={() => markPaid(selectedFolio.id)}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold rounded transition-colors cursor-pointer"
                    >
                      Mark as Settled
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedFolio(null)}
                    className="px-4 py-1.5 bg-[#111827] hover:bg-[#1F2937] text-white text-[12px] font-bold rounded transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate New Invoice Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#EC3013]" />
                <h3 className="text-[16px] font-bold text-[#111827]">Generate Billing Folio</h3>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-[#9CA3AF] hover:text-[#111827] p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-3.5 text-[13px]">
              {/* Hotel Selector */}
              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                  Property / Hotel *
                </label>
                <select
                  required
                  value={newInvoice.hotelId}
                  onChange={(e) => {
                    const selectedHotelId = e.target.value;
                    const sel = hotels.find((h) => h.id === selectedHotelId);
                    setNewInvoice({
                      ...newInvoice,
                      hotelId: selectedHotelId,
                      hotelName: sel?.name || "",
                      room: "",
                    });
                  }}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded bg-white focus:outline-none focus:border-[#EC3013]"
                >
                  {hotels.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.city})
                    </option>
                  ))}
                </select>
              </div>

              {/* Guest & Available Room */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Guest Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={newInvoice.guest}
                    onChange={(e) => setNewInvoice({ ...newInvoice, guest: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded focus:outline-none focus:border-[#EC3013]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Available Room *
                  </label>
                  {(() => {
                    const activeHotelId = newInvoice.hotelId || (hotels[0]?.id ?? "");
                    const matchingRooms = rooms.filter((r: any) => r.hotelId === activeHotelId);

                    if (matchingRooms.length === 0) {
                      return (
                        <div className="px-2 py-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800">
                          ⚠️ No rooms configured for this property
                        </div>
                      );
                    }

                    return (
                      <select
                        required
                        value={newInvoice.room}
                        onChange={(e) => setNewInvoice({ ...newInvoice, room: e.target.value })}
                        className="w-full px-3 py-2 border border-[#D1D5DB] rounded bg-white focus:outline-none focus:border-[#EC3013]"
                      >
                        <option value="">-- Select an Available Room --</option>
                        {matchingRooms.map((r: any) => {
                          const num = r.number || r.roomNumber;
                          return (
                            <option key={r.id || num} value={num}>
                              Room {num} ({r.type || "Standard"} - Floor {r.floor || 1})
                            </option>
                          );
                        })}
                      </select>
                    );
                  })()}
                </div>
              </div>

              {/* Amount & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Total Amount (₹) *
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
                        paymentMethod: newStatus === "paid" ? (newInvoice.paymentMethod && newInvoice.paymentMethod !== "—" ? newInvoice.paymentMethod : "UPI / Digital") : "—",
                      });
                    }}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded bg-white focus:outline-none focus:border-[#EC3013]"
                  >
                    <option value="pending">Pending Payment (Unpaid)</option>
                    <option value="paid">Paid (Immediate Settlement)</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>

              {/* Staff Issuer & Payment Method (Only if Paid) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Billed By / Staff
                  </label>
                  <input
                    type="text"
                    value={newInvoice.billedBy}
                    onChange={(e) => setNewInvoice({ ...newInvoice, billedBy: e.target.value })}
                    placeholder="Staff name"
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded"
                  />
                </div>
                {newInvoice.status === "paid" ? (
                  <div>
                    <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                      Payment Method *
                    </label>
                    <select
                      value={newInvoice.paymentMethod || "UPI / Digital"}
                      onChange={(e) => setNewInvoice({ ...newInvoice, paymentMethod: e.target.value })}
                      className="w-full px-3 py-2 border border-[#D1D5DB] rounded bg-white focus:outline-none focus:border-[#EC3013]"
                    >
                      <option value="UPI / Digital">UPI / Digital</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Cash">Cash</option>
                      <option value="Room Charge">Room Charge</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-bold text-[#9CA3AF] uppercase mb-1">
                      Payment Method
                    </label>
                    <div className="px-3 py-2 bg-[#F3F4F6] border border-[#E5E7EB] rounded text-[12px] text-[#6B7280] flex items-center justify-between">
                      <span>Unpaid (Settles on collection)</span>
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded uppercase">Pending</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-[#D1D5DB] text-[#374151] hover:bg-[#F3F4F6] rounded text-[13px] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white rounded text-[13px] font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
