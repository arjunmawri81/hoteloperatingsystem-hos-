"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { CheckCircle2, XCircle, ArrowRight, ShieldAlert, Check, ShieldCheck, Plus, X, AlertTriangle, Building2, BedDouble, TrendingUp, ClipboardCheck } from "lucide-react";

import { api } from "@/lib/api";

export default function AreaManagerDashboardPage() {
  const { user } = useAuth();
  const [hotels, setHotels] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({
    title: "Special 15% Group Booking Discount",
    details: "Discount requested for booking 4 Deluxe rooms for wedding guests.",
    type: "discount",
    amount: 3000,
    requestedBy: "Front Desk Staff",
  });

  const loadData = async () => {
    try {
      const [apprRes, hotelsRes, roomsRes, resRes] = await Promise.all([
        api.get<any>("/approvals").catch(() => ({ data: [] })),
        api.get<any>("/hotels").catch(() => ({ data: [] })),
        api.get<any>("/rooms").catch(() => ({ data: [] })),
        api.get<any>("/reservations").catch(() => ({ data: [] })),
      ]);

      setApprovals(apprRes?.data || (Array.isArray(apprRes) ? apprRes : []));
      setHotels(hotelsRes?.data || (Array.isArray(hotelsRes) ? hotelsRes : []));
      setRooms(roomsRes?.data || (Array.isArray(roomsRes) ? roomsRes : []));
      setReservations(resRes?.data || (Array.isArray(resRes) ? resRes : []));
    } catch (e) {
      console.error("Failed to load area manager data:", e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Isolate hotels: strictly show only the hotels assigned to this Area Manager
  const userAssignedNames = (user as any)?.assignedHotelNames;
  const assignedHotels = (Array.isArray(userAssignedNames) && userAssignedNames.length > 0)
    ? hotels.filter((h) => userAssignedNames.includes(h.name))
    : user?.hotelName
    ? hotels.filter(
        (h) =>
          h.name.toLowerCase() === (user.hotelName || "").toLowerCase() ||
          h.id === user.hotelId
      )
    : user?.role === "area_manager"
    ? [] // Area Manager with no assigned hotel sees 0 properties
    : hotels;

  const currentHotel = assignedHotels[0] || null;
  const hotelNamesSummary = assignedHotels.map((h) => h.name).join(", ") || "No Assigned Property";
  const hotelName = hotelNamesSummary;
  const regionName = currentHotel?.region ? currentHotel.region.toUpperCase() : "CLUSTER";

  // Cluster-scoped rooms, occupancy & reservations
  const clusterRooms = rooms.filter((r: any) =>
    assignedHotels.some(
      (h) =>
        (r.hotelName && r.hotelName.toLowerCase() === h.name.toLowerCase()) ||
        (r.hotelId && (r.hotelId === h.id || r.hotelId === h._id))
    )
  );
  const clusterOccupied = clusterRooms.filter((r: any) => r.status === "occupied").length;
  const clusterOccupancyRate = clusterRooms.length > 0
    ? ((clusterOccupied / clusterRooms.length) * 100).toFixed(1) + "%"
    : "0.0%";

  const clusterReservations = reservations.filter((r: any) =>
    assignedHotels.some(
      (h) =>
        (r.hotelName && r.hotelName.toLowerCase() === h.name.toLowerCase()) ||
        (r.hotelId && (r.hotelId === h.id || r.hotelId === h._id))
    )
  );
  const clusterArrivalsCount = clusterReservations.length;

  const openApprovalsCount = assignedHotels.length > 0
    ? approvals.filter((a) => a.status === "pending" && assignedHotels.some((h) => a.hotelId === h.id || a.hotelName === h.name)).length
    : 0;

  const stats = [
    {
      title: "ASSIGNED HOTELS",
      value: String(assignedHotels.length),
      subtext: assignedHotels.length > 0 ? hotelNamesSummary : "No property assigned yet",
      link: "/area-manager/comparison",
      icon: Building2,
      cardBg: "bg-[#E53935] hover:bg-[#D32F2F]",
      shadow: "shadow-red-500/20",
    },
    {
      title: "OCCUPANCY",
      value: clusterOccupancyRate,
      subtext: assignedHotels.length > 0 ? "cluster occupancy" : "No active property",
      link: "/area-manager/comparison",
      icon: TrendingUp,
      cardBg: "bg-[#43A047] hover:bg-[#388E3C]",
      shadow: "shadow-green-500/20",
    },
    {
      title: "PROPERTY RESERVATIONS",
      value: String(clusterArrivalsCount),
      subtext: "across assigned cluster",
      link: "/operations/reservations",
      icon: BedDouble,
      cardBg: "bg-[#FB8C00] hover:bg-[#F57C00]",
      shadow: "shadow-orange-500/20",
    },
    {
      title: "OPEN APPROVALS",
      value: String(openApprovalsCount),
      subtext: "pending your decision",
      link: "#approvals",
      icon: ClipboardCheck,
      cardBg: "bg-[#00ACC1] hover:bg-[#0097A7]",
      shadow: "shadow-cyan-500/20",
    },
  ];

  const handleAction = async (id: string, action: "Approved" | "Rejected") => {
    try {
      await fetch(`/api/approvals/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: action.toLowerCase(), decisionBy: "Area Manager (Arjun)" }),
      });
      setApprovals(
        approvals.map((a) => (a._id === id || a.id === id ? { ...a, status: action.toLowerCase() } : a))
      );
      setToastMsg(`Request successfully marked as ${action}`);
      setTimeout(() => setToastMsg(null), 3500);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#0F172A] tracking-[-0.02em]">
            Area Manager Dashboard
          </h1>
          <p className="text-[13px] text-[#64748B] mt-1 font-normal">
            {hotelName} ({regionName}) — cluster oversight &amp; property approval management
          </p>
        </div>

        <Link
          href="/area-manager/comparison"
          className="flex items-center gap-1.5 px-4 py-2 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#111827] text-[13px] font-bold rounded shadow-xs"
        >
          <span>View Property Comparison</span>
          <ArrowRight className="w-4 h-4 text-[#EC3013]" />
        </Link>
      </div>

      {/* Toast Notice */}
      {toastMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-[13px] px-4 py-2.5 rounded flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 4 Key Stat Cards (Vibrant Reference Style - Red, Green, Orange, Cyan) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Link
              key={i}
              href={stat.link}
              className={`relative overflow-hidden ${stat.cardBg} p-6 rounded-xl text-white shadow-lg ${stat.shadow} hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 group block cursor-pointer`}
            >
              <div className="flex items-center justify-between relative z-10">
                <div className="space-y-1">
                  <div className="text-[34px] font-extrabold tracking-tight leading-none text-white drop-shadow-xs">
                    {stat.value}
                  </div>
                  <div className="text-[12px] font-semibold text-white/90 uppercase tracking-wide">
                    {stat.title}
                  </div>
                  <div className="text-[11px] text-white/75 font-medium truncate max-w-[150px]">
                    {stat.subtext}
                  </div>
                </div>

                {/* Circular Watermark Ghost Icon */}
                <div className="w-14 h-14 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10 text-white/90 shrink-0 group-hover:scale-105 group-hover:bg-white/20 transition-all">
                  <Icon className="w-7 h-7 stroke-[2]" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Approval Center Section */}
      <div id="approvals" className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-bold text-[#111827]">
              Pending Approvals for {hotelName} ({approvals.filter((a) => a.status === "pending").length})
            </h2>
            <span className="text-[12px] text-[#6B7280]">Real-time operational queue</span>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#EC3013] hover:bg-[#D62839] text-white text-[12px] font-bold rounded shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Submit Approval Request</span>
          </button>
        </div>

        <div className="space-y-3">
          {approvals.length === 0 ? (
            <div className="bg-white p-8 rounded-lg border border-[#E5E7EB] text-center">
              <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <div className="text-[15px] font-bold text-[#111827]">No Pending Approvals for {hotelName}</div>
              <div className="text-[13px] text-[#6B7280] max-w-md mx-auto mt-1">
                All operational requests for your assigned property are resolved. Click "Submit Approval Request" to log a real discount or maintenance authorization.
              </div>
            </div>
          ) : (
            approvals.map((item) => {
              const isPending = item.status === "pending";

              return (
                <div
                  key={item._id || item.id}
                  className="bg-white p-5 rounded-lg border border-[#E5E7EB] hover:border-[#D1D5DB] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                >
                  <div>
                    <div className="text-[14px] font-bold text-[#111827]">
                      {item.title}
                    </div>
                    <div className="text-[12px] text-[#6B7280] mt-1">
                      {item.details} {item.amount ? `· Value: ₹${item.amount.toLocaleString()}` : ""}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {isPending ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleAction(item._id || item.id, "Rejected")}
                          className="px-4 py-1.5 border border-[#D1D5DB] hover:bg-red-50 hover:text-red-700 text-[#374151] text-[12px] font-bold rounded transition-colors cursor-pointer"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAction(item._id || item.id, "Approved")}
                          className="px-4 py-1.5 bg-[#EC3013] hover:bg-[#D62839] text-white text-[12px] font-bold rounded shadow-xs transition-colors cursor-pointer"
                        >
                          Approve
                        </button>
                      </>
                    ) : item.status?.toLowerCase() === "approved" ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded border border-emerald-200">
                        <Check className="w-3.5 h-3.5" /> Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded border border-rose-200">
                        <XCircle className="w-3.5 h-3.5" /> Rejected
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* New Approval Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div>
                <h3 className="text-[16px] font-bold text-[#111827]">New Operational Approval</h3>
                <p className="text-[12px] text-[#6B7280]">For assigned property: {hotelName}</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-[#9CA3AF] hover:text-[#111827] rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await fetch("/api/approvals", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      ...newRequest,
                      hotelId: currentHotel?.id || "hotel-1788857668065",
                      hotelName,
                      amount: Number(newRequest.amount) || 0,
                    }),
                  });
                  if (res.ok) {
                    const json = await res.json();
                    setApprovals([json.data, ...approvals]);
                    setIsModalOpen(false);
                    setToastMsg(`✅ Real approval request submitted for ${hotelName}!`);
                    setTimeout(() => setToastMsg(null), 3500);
                  }
                } catch (err) {
                  console.error(err);
                }
              }}
              className="space-y-3 text-[13px]"
            >
              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">Request Title</label>
                <input
                  type="text"
                  required
                  value={newRequest.title}
                  onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">Request Type</label>
                <select
                  value={newRequest.type}
                  onChange={(e) => setNewRequest({ ...newRequest, type: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded bg-white"
                >
                  <option value="discount">Discount Authorization</option>
                  <option value="refund">Guest Refund Authorization</option>
                  <option value="maintenance">Emergency Maintenance Repair</option>
                  <option value="purchase_order">Bulk Purchase Order PO</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">Value Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={newRequest.amount}
                  onChange={(e) => setNewRequest({ ...newRequest, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">Justification Details</label>
                <textarea
                  rows={2}
                  required
                  value={newRequest.details}
                  onChange={(e) => setNewRequest({ ...newRequest, details: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
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
                  Submit for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
