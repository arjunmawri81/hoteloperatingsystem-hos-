"use client";

import { useState, useEffect } from "react";
import { guestsApi } from "@/lib/api";
import { Plus, X, Search, CheckCircle2, User, Star, Award, Heart, MessageSquare, History, RefreshCw } from "lucide-react";

interface GuestProfile {
  _id?: string;
  id: string;
  name: string;
  email: string;
  phone: string;
  stays: number;
  totalSpend: number;
  segment: "VIP" | "Corporate" | "Repeat" | "New";
  preferences: string;
  notes: string;
}

export default function GuestCRMPage() {
  const [guests, setGuests] = useState<GuestProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [newGuest, setNewGuest] = useState({
    name: "",
    email: "",
    phone: "",
    segment: "New" as GuestProfile["segment"],
    preferences: "High floor",
    notes: "",
  });

  const loadGuests = async () => {
    setIsLoading(true);
    try {
      const res = await guestsApi.getAll();
      setGuests(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGuests();
  }, []);

  const handleCreateGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuest.name || !newGuest.phone) return;

    try {
      const created = await guestsApi.create({
        name: newGuest.name,
        email: newGuest.email || "guest@example.com",
        phone: newGuest.phone,
        stays: 1,
        totalSpend: 0,
        segment: newGuest.segment,
        preferences: newGuest.preferences,
        notes: newGuest.notes || "Profile registered in database",
      });

      setGuests([created, ...guests]);
      setIsModalOpen(false);
      setToastMsg(`✅ Guest profile for "${created.name}" saved to MongoDB database`);
      setTimeout(() => setToastMsg(null), 3500);

      setNewGuest({
        name: "",
        email: "",
        phone: "",
        segment: "New",
        preferences: "High floor",
        notes: "",
      });
    } catch (err) {
      console.error("Failed to create guest:", err);
    }
  };

  const filteredGuests = guests.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.preferences.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSegment = segmentFilter === "all" || g.segment.toLowerCase() === segmentFilter.toLowerCase();
    return matchesSearch && matchesSegment;
  });

  const getSegmentBadge = (seg: GuestProfile["segment"]) => {
    switch (seg) {
      case "VIP":
        return <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded border border-amber-300 flex items-center gap-1"><Star className="w-3 h-3 fill-amber-500 text-amber-500" /> VIP</span>;
      case "Corporate":
        return <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200 flex items-center gap-1"><Award className="w-3 h-3" /> Corporate</span>;
      case "Repeat":
        return <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1"><Heart className="w-3 h-3" /> Repeat Guest</span>;
      default:
        return <span className="text-[11px] font-bold text-[#6B7280] bg-[#F3F4F6] px-2.5 py-0.5 rounded">New Guest</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#111827] tracking-tight">
            Guest CRM &amp; Profiles
          </h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            VIP preferences, stay history, and guest recognition directory (Database Persisted)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadGuests}
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
            <span>New Guest Profile</span>
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
        <div className="flex items-center gap-1.5">
          {["all", "VIP", "Corporate", "Repeat", "New"].map((tab) => (
            <button
              key={tab}
              onClick={() => setSegmentFilter(tab)}
              className={`px-3 py-1.5 rounded text-[12px] font-semibold capitalize transition-colors ${
                segmentFilter === tab
                  ? "bg-[#111827] text-white"
                  : "text-[#4B5563] hover:bg-[#F3F4F6]"
              }`}
            >
              {tab === "all" ? "All Profiles" : tab}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search guest, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-1.5 bg-[#F9FAFB] border border-[#D1D5DB] rounded text-[13px] text-[#111827] focus:outline-none focus:border-[#EC3013] w-full sm:w-64"
          />
        </div>
      </div>

      {/* Guest Cards Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-[#9CA3AF] bg-white border border-[#E5E7EB] rounded-lg">
          <div className="flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#EC3013]" />
            <span>Loading guest profiles from database...</span>
          </div>
        </div>
      ) : filteredGuests.length === 0 ? (
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-12 text-center text-[#9CA3AF]">
          <User className="w-10 h-10 mx-auto text-[#D1D5DB] mb-2" />
          <p className="font-semibold text-[#111827]">No guest profiles found</p>
          <p className="text-[12px] mt-1">Create a new guest profile or search with different filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGuests.map((guest) => (
            <div
              key={guest.id || guest._id}
              className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-xs hover:border-[#D1D5DB] transition-colors space-y-3.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center font-bold text-[#374151]">
                    {guest.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-[15px] text-[#111827]">{guest.name}</h3>
                    <p className="text-[12px] text-[#6B7280]">{guest.email} · {guest.phone}</p>
                  </div>
                </div>
                {getSegmentBadge(guest.segment)}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 bg-[#F9FAFB] p-2.5 rounded border border-[#F3F4F6] text-[12px]">
                <div>
                  <span className="text-[#9CA3AF] block text-[10px] uppercase font-bold">Total Stays</span>
                  <span className="font-bold text-[#111827]">{guest.stays || 1} Visits</span>
                </div>
                <div>
                  <span className="text-[#9CA3AF] block text-[10px] uppercase font-bold">Total Spend</span>
                  <span className="font-bold text-[#111827]">${(guest.totalSpend || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Preferences */}
              <div className="text-[12px] space-y-1">
                <div className="font-bold text-[#6B7280] uppercase text-[10px] flex items-center gap-1">
                  <Heart className="w-3 h-3 text-[#EC3013]" /> VIP Preferences:
                </div>
                <p className="text-[#374151] bg-[#FFFBFB] p-2 rounded border border-[#FEE2E2]">
                  {guest.preferences || "Standard stay preferences"}
                </p>
              </div>

              {/* Notes */}
              <div className="text-[11px] text-[#9CA3AF] flex items-center gap-1.5 pt-1 border-t border-[#F3F4F6]">
                <MessageSquare className="w-3 h-3" />
                <span>{guest.notes}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Guest Profile Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 space-y-4 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-[#EC3013]" />
                <h3 className="text-[16px] font-bold text-[#111827]">New Guest Profile</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#9CA3AF] hover:text-[#111827] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGuest} className="space-y-4 text-[13px]">
              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                  Guest Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lady Sarah Vance"
                  value={newGuest.name}
                  onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded focus:outline-none focus:border-[#EC3013]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Phone *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+1 555 0192"
                    value={newGuest.phone}
                    onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Segment
                  </label>
                  <select
                    value={newGuest.segment}
                    onChange={(e) => setNewGuest({ ...newGuest, segment: e.target.value as any })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded bg-white"
                  >
                    <option value="VIP">VIP Guest</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Repeat">Repeat Guest</option>
                    <option value="New">New Guest</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="guest@example.com"
                  value={newGuest.email}
                  onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                  VIP Preferences &amp; Requests
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. High floor, feather pillows, sparkling water, late checkout"
                  value={newGuest.preferences}
                  onChange={(e) => setNewGuest({ ...newGuest, preferences: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                  Internal Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Account executive at Microsoft"
                  value={newGuest.notes}
                  onChange={(e) => setNewGuest({ ...newGuest, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded"
                />
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
