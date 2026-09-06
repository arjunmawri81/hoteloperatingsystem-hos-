"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { hotelsApi, invoicesApi, reservationsApi, guestsApi, InvoiceRecord } from "@/lib/api";
import { Hotel, Reservation } from "@/types";
import {
  Building2,
  Plus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Receipt,
  Users,
  CreditCard,
  Calendar,
  Eye,
  X,
  FileText,
  UserCheck,
  Check,
  DollarSign
} from "lucide-react";

export default function HotelAdminDashboardPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [guests, setGuests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tab State: "performance" | "transactions" | "guests"
  const [activeTab, setActiveTab] = useState<"performance" | "transactions" | "guests">("transactions");
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [selectedGuest, setSelectedGuest] = useState<any | null>(null);

  const loadData = async () => {
    if (isAuthLoading) return;
    setIsLoading(true);
    try {
      const effectiveOrgId = user?.orgId || "org-987123-1788542768377";
      const [allHotels, invRes, allReservations, allGuests] = await Promise.all([
        hotelsApi.getAll({ orgId: effectiveOrgId }),
        invoicesApi.getAll({ orgId: effectiveOrgId }),
        reservationsApi.getAll(),
        guestsApi.getAll(),
      ]);
      setHotels(allHotels);
      const invoiceData = invRes?.data ? invRes.data : (Array.isArray(invRes) ? invRes : []);
      setInvoices(invoiceData);
      setReservations(allReservations || []);
      setGuests(allGuests || []);
    } catch (e) {
      console.error("Failed to load dashboard metrics for organization", e);
      setHotels([]);
      setInvoices([]);
      setReservations([]);
      setGuests([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthLoading) {
      loadData();
    }
  }, [user?.orgId, isAuthLoading]);

  // Listen for real-time notifications/updates (e.g. newly created bills or reservations)
  useEffect(() => {
    const handleUpdate = () => {
      loadData();
    };
    window.addEventListener("hos_notification", handleUpdate);
    return () => window.removeEventListener("hos_notification", handleUpdate);
  }, [user?.orgId, isAuthLoading]);

  // Calculate dynamic organization metrics
  const totalRooms = hotels.reduce((sum, h) => sum + (Number(h.totalRooms) || 0), 0);
  const occupiedRooms = hotels.reduce((sum, h) => sum + (Number(h.occupiedRooms) || 0), 0);
  const avgOccupancy =
    totalRooms > 0
      ? Math.round((occupiedRooms / totalRooms) * 100)
      : hotels.length > 0
      ? Math.round(hotels.reduce((s, h) => s + (h.occupancyRate || 0), 0) / hotels.length)
      : 0;

  // Distinct areas count
  const distinctAreas = new Set(hotels.map((h) => h.region || "General Zone")).size;

  // Compute live Revenue from all bills/invoices & reservations
  const invoiceRevenue = invoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
  const reservationRevenue = reservations.reduce((sum, res) => sum + (Number(res.paidAmount || res.totalAmount) || 0), 0);
  const totalRevenue = invoiceRevenue + reservationRevenue;

  // Build aggregated guest history from guests table + invoices + reservations
  const guestHistoryList: any[] = (() => {
    const guestMap = new Map();
    // 1. Seed with registered guest CRM profiles if any
    guests.forEach((g) => {
      guestMap.set(g.name, {
        id: g.id || g._id,
        name: g.name,
        email: g.email || "guest@example.com",
        phone: g.phone || "+91 98765 43210",
        stays: g.stays || 1,
        totalSpend: g.totalSpend || 0,
        segment: g.segment || "Repeat",
        preferences: g.preferences || "Standard stay",
        notes: g.notes || "",
        invoices: [],
        reservations: [],
      });
    });

    // 2. Incorporate invoices
    invoices.forEach((inv) => {
      if (!inv.guest) return;
      const existing = guestMap.get(inv.guest) || {
        id: `guest-${inv.guest.toLowerCase().replace(/\s+/g, "-")}`,
        name: inv.guest,
        email: `${inv.guest.toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
        phone: "+91 98000 12345",
        stays: 0,
        totalSpend: 0,
        segment: "Repeat",
        preferences: "High Floor, City View",
        notes: "Direct billed guest",
        invoices: [],
        reservations: [],
      };
      existing.totalSpend += Number(inv.amount) || 0;
      existing.stays = Math.max(existing.stays, existing.invoices.length + 1);
      existing.lastRoom = inv.room;
      existing.lastDate = inv.date;
      existing.invoices.push(inv);
      guestMap.set(inv.guest, existing);
    });

    // 3. Incorporate reservations
    reservations.forEach((res) => {
      if (!res.guestName) return;
      const existing = guestMap.get(res.guestName) || {
        id: `guest-${res.guestName.toLowerCase().replace(/\s+/g, "-")}`,
        name: res.guestName,
        email: res.guestEmail || "guest@example.com",
        phone: res.guestPhone || "+91 98000 12345",
        stays: 0,
        totalSpend: 0,
        segment: "VIP",
        preferences: "King Bed, Quiet Room",
        notes: "Direct booking customer",
        invoices: [],
        reservations: [],
      };
      existing.totalSpend += Number(res.paidAmount || res.totalAmount) || 0;
      existing.stays += 1;
      existing.lastRoom = res.roomNumber;
      existing.lastDate = res.checkIn;
      existing.reservations.push(res);
      guestMap.set(res.guestName, existing);
    });

    return Array.from(guestMap.values());
  })();

  const stats = [
    {
      title: "ASSIGNED HOTELS",
      value: String(hotels.length),
      subtext: `${distinctAreas} area${distinctAreas !== 1 ? "s" : ""}`,
      href: "/hotel-admin/hotels",
    },
    {
      title: "TOTAL ROOMS",
      value: String(totalRooms),
      subtext: "across all properties",
      href: "/hotel-admin/rooms",
    },
    {
      title: "OCCUPANCY",
      value: `${avgOccupancy}%`,
      subtext: "org-wide",
      href: "/operations/room-map",
    },
    {
      title: "REVENUE",
      value: `₹${totalRevenue.toLocaleString("en-IN")}`,
      subtext: invoices.length > 0 ? `${invoices.length} bill${invoices.length !== 1 ? "s" : ""} / folios` : "MTD",
      href: "/hotel-admin/billing",
    },
  ];

  return (
    <div className="space-y-10 font-sans antialiased text-[#111827]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#111827] tracking-tight">
            Hotel Admin Dashboard
          </h1>
          <p className="text-[14px] text-[#6B7280] mt-1">
            <strong className="text-[#111827] font-semibold">
              {user?.orgName || "Hotel Organization"}
            </strong>{" "}
            — organization overview &amp; revenue control
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadData}
            title="Refresh dashboard"
            className="p-2 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] rounded text-[#4B5563] cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#EC3013]" : ""}`} />
          </button>
          <Link
            href="/hotel-admin/hotels"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white text-[13px] font-bold rounded shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Property</span>
          </Link>
        </div>
      </div>

      {/* 4 Interactive Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Link
            key={i}
            href={stat.href}
            className="bg-white p-6 rounded-md border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.04)] cursor-pointer hover:border-[#D1D5DB] hover:shadow-md transition-all group block"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#EC3013] uppercase tracking-wider">
                {stat.title}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#EC3013] group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="text-[34px] font-bold text-[#111827] mt-3 tracking-tight">
              {stat.value}
            </div>
            <div className="text-[13px] text-[#9CA3AF] mt-2 font-normal">
              {stat.subtext}
            </div>
          </Link>
        ))}
      </div>

      {/* Main Section: Performance, Transactions, and Guest History Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
        {/* Left Column: Tabbed Content (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Tabs Navigation Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-1.5 bg-[#F3F4F6] p-1 rounded-lg border border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => setActiveTab("transactions")}
                className={`px-3 py-1.5 rounded-md text-[13px] font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "transactions"
                    ? "bg-white text-[#111827] shadow-xs"
                    : "text-[#6B7280] hover:text-[#111827]"
                }`}
              >
                <Receipt className="w-3.5 h-3.5 text-[#EC3013]" />
                <span>Transactions &amp; Invoices ({invoices.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("guests")}
                className={`px-3 py-1.5 rounded-md text-[13px] font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "guests"
                    ? "bg-white text-[#111827] shadow-xs"
                    : "text-[#6B7280] hover:text-[#111827]"
                }`}
              >
                <Users className="w-3.5 h-3.5 text-[#EC3013]" />
                <span>Guest History ({guestHistoryList.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("performance")}
                className={`px-3 py-1.5 rounded-md text-[13px] font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "performance"
                    ? "bg-white text-[#111827] shadow-xs"
                    : "text-[#6B7280] hover:text-[#111827]"
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-[#EC3013]" />
                <span>Properties ({hotels.length})</span>
              </button>
            </div>

            {activeTab === "performance" && (
              <Link
                href="/hotel-admin/hotels"
                className="text-[12px] font-semibold text-[#EC3013] hover:underline flex items-center gap-1"
              >
                <span>Manage Properties</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}

            {activeTab === "transactions" && (
              <Link
                href="/hotel-admin/billing"
                className="text-[12px] font-semibold text-[#EC3013] hover:underline flex items-center gap-1"
              >
                <span>View Full Billing &amp; Staff Ledger</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {/* TAB 1: Hotel Performance */}
          {activeTab === "performance" && (
            <div className="bg-white border border-[#E5E7EB] rounded-md shadow-xs overflow-hidden">
              {hotels.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[#E5E7EB] text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider bg-[#F9FAFB]">
                        <th className="py-3 px-4 font-bold">HOTEL PROPERTY</th>
                        <th className="py-3 px-4 font-bold">LOCATION / REGION</th>
                        <th className="py-3 px-4 font-bold">ROOMS</th>
                        <th className="py-3 px-4 font-bold">OCCUPANCY</th>
                        <th className="py-3 px-4 text-right font-bold">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F3F4F6] text-[13px]">
                      {hotels.map((h) => (
                        <tr key={h.id} className="hover:bg-[#F9FAFB]/60 transition-colors">
                          <td className="py-3.5 px-4 font-medium text-[#111827]">
                            {h.name}
                          </td>
                          <td className="py-3.5 px-4 text-[#4B5563]">
                            {h.city} · {h.region}
                          </td>
                          <td className="py-3.5 px-4 text-[#4B5563]">
                            {h.totalRooms} rooms
                          </td>
                          <td className="py-3.5 px-4 text-[#4B5563]">
                            {h.occupancyRate || 0}%
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 capitalize">
                              {h.status || "open"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 px-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-red-50 text-[#EC3013] flex items-center justify-center mx-auto">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-[15px] font-bold text-[#111827]">
                    No Hotel Properties Added Yet
                  </h3>
                  <p className="text-[13px] text-[#6B7280] max-w-sm mx-auto leading-relaxed">
                    You have created your organization workspace. Add your first hotel property to configure rooms, areas, and staff.
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/hotel-admin/hotels"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white text-[12px] font-bold rounded shadow-xs transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add First Property</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Transactions & Invoices History */}
          {activeTab === "transactions" && (
            <div className="bg-white border border-[#E5E7EB] rounded-md shadow-xs overflow-hidden">
              {invoices.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[13px]">
                    <thead>
                      <tr className="border-b border-[#E5E7EB] text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider bg-[#F9FAFB]">
                        <th className="py-3 px-4 font-bold">INVOICE</th>
                        <th className="py-3 px-4 font-bold">GUEST / ROOM</th>
                        <th className="py-3 px-4 font-bold">DATE</th>
                        <th className="py-3 px-4 font-bold">METHOD</th>
                        <th className="py-3 px-4 font-bold">STATUS</th>
                        <th className="py-3 px-4 font-bold">AMOUNT (₹)</th>
                        <th className="py-3 px-4 text-right font-bold">FOLIO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F3F4F6]">
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-[#F9FAFB] transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[#111827]">
                            <div className="flex items-center gap-1.5">
                              <Receipt className="w-3.5 h-3.5 text-[#EC3013]" />
                              <span>{inv.id}</span>
                            </div>
                            {inv.transactionRef && (
                              <div className="text-[10px] font-mono text-[#9CA3AF]">
                                {inv.transactionRef}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-[#111827]">{inv.guest}</div>
                            <div className="text-[11px] text-[#6B7280]">Room {inv.room}</div>
                          </td>
                          <td className="py-3 px-4 text-[#4B5563]">
                            {inv.date}
                          </td>
                          <td className="py-3 px-4 text-[#4B5563]">
                            <span className="inline-flex items-center gap-1 text-[11px] bg-gray-50 border border-gray-200 px-2 py-0.5 rounded font-medium">
                              <CreditCard className="w-3 h-3 text-[#6B7280]" />
                              {inv.paymentMethod || "Credit Card"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {inv.status === "paid" ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1 w-max">
                                <Check className="w-3 h-3" /> Paid
                              </span>
                            ) : inv.status === "pending" ? (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded w-max">
                                Pending
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded w-max">
                                Overdue
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-bold text-[#111827]">
                            ₹{(inv.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedInvoice(inv)}
                              className="px-2.5 py-1 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] hover:border-[#EC3013] text-[#111827] hover:text-[#EC3013] text-[11px] font-bold rounded shadow-xs transition-colors flex items-center gap-1 ml-auto cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Folio</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 px-6 space-y-3">
                  <Receipt className="w-10 h-10 text-[#D1D5DB] mx-auto" />
                  <h3 className="text-[15px] font-bold text-[#111827]">No Invoices or Bills Yet</h3>
                  <p className="text-[13px] text-[#6B7280] max-w-sm mx-auto">
                    Bills created in the Operations Billing section will automatically appear here with real-time revenue tracking.
                  </p>
                  <Link
                    href="/operations/billing"
                    className="inline-block px-4 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white text-[12px] font-bold rounded shadow-xs"
                  >
                    Generate Invoice
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Guest Stay & Folio History */}
          {activeTab === "guests" && (
            <div className="bg-white border border-[#E5E7EB] rounded-md shadow-xs overflow-hidden">
              {guestHistoryList.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[13px]">
                    <thead>
                      <tr className="border-b border-[#E5E7EB] text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider bg-[#F9FAFB]">
                        <th className="py-3 px-4 font-bold">GUEST NAME</th>
                        <th className="py-3 px-4 font-bold">CONTACT INFO</th>
                        <th className="py-3 px-4 font-bold">STAYS / VISITS</th>
                        <th className="py-3 px-4 font-bold">TOTAL BILLED (₹)</th>
                        <th className="py-3 px-4 font-bold">SEGMENT</th>
                        <th className="py-3 px-4 text-right font-bold">GUEST HISTORY</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F3F4F6]">
                      {guestHistoryList.map((g, idx) => (
                        <tr key={idx} className="hover:bg-[#F9FAFB] transition-colors">
                          <td className="py-3.5 px-4 font-medium text-[#111827]">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center font-bold text-[11px] text-[#374151]">
                                {g.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-[#111827]">{g.name}</div>
                                {g.lastRoom && (
                                  <div className="text-[10px] text-[#9CA3AF]">
                                    Last in Room {g.lastRoom}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-[#4B5563]">
                            <div>{g.email}</div>
                            <div className="text-[11px] text-[#9CA3AF]">{g.phone}</div>
                          </td>
                          <td className="py-3.5 px-4 text-[#111827] font-semibold">
                            {g.stays || 1} {g.stays === 1 ? "Stay" : "Stays"}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-emerald-700">
                            ₹{(g.totalSpend || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                              {g.segment || "Repeat"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedGuest(g)}
                              className="px-2.5 py-1 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] hover:border-[#EC3013] text-[#111827] hover:text-[#EC3013] text-[11px] font-bold rounded shadow-xs transition-colors flex items-center gap-1 ml-auto cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>View History</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 px-6 space-y-3">
                  <Users className="w-10 h-10 text-[#D1D5DB] mx-auto" />
                  <h3 className="text-[15px] font-bold text-[#111827]">No Guest History Recorded Yet</h3>
                  <p className="text-[13px] text-[#6B7280] max-w-sm mx-auto">
                    Guests who make reservations or receive billed folios will be cataloged here automatically.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Organization Quick Info & Operations Links (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          <h2 className="text-[16px] font-bold text-[#111827]">
            Organization Status
          </h2>
          <div className="bg-white p-5 rounded-md border border-[#E5E7EB] shadow-xs space-y-4 text-[13px]">
            <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span className="font-semibold text-[12px]">Workspace Active &amp; Verified</span>
            </div>

            <div className="space-y-2 text-[#4B5563]">
              <div className="flex justify-between py-1 border-b border-[#F3F4F6]">
                <span className="text-[#9CA3AF]">Organization</span>
                <span className="font-bold text-[#111827]">{user?.orgName || "—"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F3F4F6]">
                <span className="text-[#9CA3AF]">Owner Account</span>
                <span className="font-semibold text-[#111827]">{user?.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F3F4F6]">
                <span className="text-[#9CA3AF]">Login Email</span>
                <span className="font-mono text-[12px] text-[#111827]">{user?.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F3F4F6]">
                <span className="text-[#9CA3AF]">Total Revenue MTD</span>
                <span className="font-bold text-emerald-700">₹{totalRevenue.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <Link
                href="/hotel-admin/staff"
                className="w-full py-2 bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#D1D5DB] rounded text-[12px] font-bold text-[#111827] flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Manage Staff &amp; Roles</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/operations/billing"
                className="w-full py-2 bg-white hover:bg-[#FFF5F5] border border-[#E5E7EB] hover:border-[#EC3013] rounded text-[12px] font-bold text-[#EC3013] flex items-center justify-center gap-1.5 transition-colors"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Open Operations Billing Desk</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Invoice & Transaction Folio Details */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-2xl max-w-lg w-full p-6 space-y-5 font-sans">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#EC3013]" />
                <div>
                  <h3 className="text-[16px] font-bold text-[#111827]">
                    Invoice Folio · {selectedInvoice.id}
                  </h3>
                  <span className="text-[11px] text-[#6B7280]">
                    Transaction Reference: {selectedInvoice.transactionRef || `TXN-${selectedInvoice.id}`}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-[#9CA3AF] hover:text-[#111827] p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Folio Metadata */}
            <div className="grid grid-cols-2 gap-3 bg-[#F9FAFB] p-3.5 rounded border border-[#E5E7EB] text-[12px]">
              <div>
                <span className="text-[#9CA3AF] uppercase text-[10px] font-bold block">Billed Guest</span>
                <span className="font-bold text-[#111827] text-[14px]">{selectedInvoice.guest}</span>
                <span className="text-[#6B7280] block mt-0.5">Assigned: Room {selectedInvoice.room}</span>
              </div>
              <div className="text-right">
                <span className="text-[#9CA3AF] uppercase text-[10px] font-bold block">Invoice Date</span>
                <span className="font-semibold text-[#111827]">{selectedInvoice.date}</span>
                <div className="mt-1">
                  {selectedInvoice.status === "paid" ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <Check className="w-3 h-3" /> Paid &amp; Settled
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Pending Payment
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Line Items Breakdown */}
            <div className="space-y-2 text-[13px] border-t border-b border-[#E5E7EB] py-3">
              <div className="flex justify-between text-[#4B5563]">
                <span>Room Charges &amp; Stay Services (Room {selectedInvoice.room})</span>
                <span className="font-semibold text-[#111827]">
                  ₹{((selectedInvoice.amount || 0) * 0.88).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-[#4B5563]">
                <span>GST / Tourism Fees (12%)</span>
                <span className="font-semibold text-[#111827]">
                  ₹{((selectedInvoice.amount || 0) * 0.12).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-[15px] text-[#111827] pt-2 border-t border-[#F3F4F6]">
                <span>Total Settled Amount</span>
                <span className="text-[#EC3013]">
                  ₹{(selectedInvoice.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Payment & Audit Info */}
            <div className="space-y-1.5 text-[12px] text-[#6B7280]">
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span className="font-semibold text-[#111827]">{selectedInvoice.paymentMethod || "Credit Card"}</span>
              </div>
              <div className="flex justify-between">
                <span>Settlement Ledger:</span>
                <span className="font-mono text-[11px] text-[#111827]">{selectedInvoice.transactionRef || "TXN-AUTO-SETTLED"}</span>
              </div>
              <div className="flex justify-between">
                <span>Property:</span>
                <span className="font-medium text-[#111827]">{selectedInvoice.hotelName || user?.orgName || "Hotel Property"}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2.5 pt-2 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#111827] text-[12px] font-bold rounded shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Print Folio Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 bg-[#111827] hover:bg-black text-white text-[12px] font-bold rounded shadow-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Guest Stay & Billed History */}
      {selectedGuest && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-2xl max-w-lg w-full p-6 space-y-5 font-sans">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#EC3013]/10 text-[#EC3013] flex items-center justify-center font-bold text-[14px]">
                  {selectedGuest.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#111827]">
                    {selectedGuest.name}
                  </h3>
                  <span className="text-[11px] text-[#6B7280]">
                    {selectedGuest.email} · {selectedGuest.phone}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedGuest(null)}
                className="text-[#9CA3AF] hover:text-[#111827] p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Guest Summary Metrics */}
            <div className="grid grid-cols-3 gap-3 bg-[#F9FAFB] p-3 rounded border border-[#E5E7EB] text-center">
              <div>
                <span className="text-[#9CA3AF] uppercase text-[10px] font-bold block">Total Stays</span>
                <span className="font-bold text-[#111827] text-[15px]">{selectedGuest.stays || 1} Visits</span>
              </div>
              <div>
                <span className="text-[#9CA3AF] uppercase text-[10px] font-bold block">Total Billed</span>
                <span className="font-bold text-emerald-700 text-[15px]">
                  ₹{(selectedGuest.totalSpend || 0).toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="text-[#9CA3AF] uppercase text-[10px] font-bold block">VIP Tier</span>
                <span className="text-[11px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 mt-0.5 inline-block">
                  {selectedGuest.segment || "Repeat"}
                </span>
              </div>
            </div>

            {/* Guest Preferences */}
            <div className="text-[12px] bg-[#FFFBFB] p-3 rounded border border-[#FEE2E2] space-y-1">
              <span className="font-bold text-[#EC3013] text-[11px] uppercase block">Guest Preferences &amp; Stay Notes</span>
              <p className="text-[#374151]">
                {selectedGuest.preferences || "Prefers high floors and quiet rooms. Instant check-in enabled."}
              </p>
            </div>

            {/* Past Invoices & Folio History */}
            <div className="space-y-2">
              <h4 className="text-[13px] font-bold text-[#111827]">Transaction &amp; Folio History</h4>
              <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                {invoices.filter((i) => i.guest === selectedGuest.name).length > 0 ? (
                  invoices
                    .filter((i) => i.guest === selectedGuest.name)
                    .map((inv) => (
                      <div
                        key={inv.id}
                        className="p-2.5 rounded border border-[#E5E7EB] bg-white flex items-center justify-between text-[12px]"
                      >
                        <div>
                          <div className="font-bold text-[#111827]">{inv.id} · Room {inv.room}</div>
                          <div className="text-[11px] text-[#9CA3AF]">{inv.date} · {inv.paymentMethod}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-[#111827]">₹{(inv.amount || 0).toLocaleString("en-IN")}</div>
                          <span className="text-[10px] font-semibold text-emerald-700 capitalize">{inv.status}</span>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="p-3 text-center text-[#9CA3AF] text-[12px] bg-[#F9FAFB] rounded">
                    Direct folio on file for ₹{(selectedGuest.totalSpend || 0).toLocaleString("en-IN")}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2.5 pt-2 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => setSelectedGuest(null)}
                className="px-4 py-2 bg-[#111827] hover:bg-black text-white text-[12px] font-bold rounded shadow-xs cursor-pointer"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


