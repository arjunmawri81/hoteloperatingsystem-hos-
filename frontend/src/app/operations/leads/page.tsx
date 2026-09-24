"use client";

import { useState, useEffect } from "react";
import { leadsApi, hotelsApi, reservationsApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  Plus,
  X,
  Search,
  PhoneCall,
  Bot,
  CheckCircle2,
  RefreshCw,
  Building2,
  MessageSquare,
  Sparkles,
  Calendar,
  BedDouble,
  DollarSign,
  ArrowRight,
  TrendingUp,
  Download,
  Trash2,
} from "lucide-react";

interface Lead {
  _id?: string;
  id: string;
  name: string;
  phone: string;
  email: string;
  source: "Website" | "WhatsApp" | "AI Phone Call" | "Social" | "Direct Enquiry" | "OTA" | "Channel Manager";
  requirement: string;
  budget: number;
  stage: "New" | "Contacted" | "AI Qualified" | "Proposal" | "Converted" | "Lost";
  aiSummary: string;
  nextFollowUp: string;
  hotelId?: string;
  createdAt?: string;
}

export default function OperationsLeadManagementPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({ totalPipeline: 0, convertedTotal: 0, aiQualifiedCount: 0, totalEnquiries: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Convert to Reservation Modal State
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null);
  const [convertForm, setConvertForm] = useState({
    roomType: "Deluxe Room",
    roomNumber: "204",
    checkIn: new Date().toISOString().split("T")[0],
    checkOut: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
    amount: 0,
  });
  const [isConverting, setIsConverting] = useState(false);

  const currentHotelId = user?.hotelId || "hotel-taj-delhi";
  const currentHotelName = hotels.find((h) => h.id === currentHotelId)?.name || user?.hotelName || "Hotel Taj Palace New Delhi";

  const [newLead, setNewLead] = useState({
    name: "",
    phone: "",
    email: "",
    source: "AI Phone Call" as Lead["source"],
    requirement: "",
    budget: 35000,
    stage: "New" as Lead["stage"],
    aiSummary: "",
    nextFollowUp: "Today, within 2 hours",
    hotelId: currentHotelId,
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const targetHotel = user?.hotelId || currentHotelId;
      const [leadsRes, hotelsRes] = await Promise.all([
        leadsApi.getAll({ hotelId: targetHotel, leadType: "hotel_guest" }),
        hotelsApi.getAll(user?.orgId ? { orgId: user.orgId } : undefined),
      ]);
      if (leadsRes && leadsRes.data) {
        setLeads(leadsRes.data);
        if (leadsRes.metrics) setMetrics(leadsRes.metrics);
      }
      if (hotelsRes) {
        setHotels(hotelsRes);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.hotelId, user?.orgId]);

  const handleStageChange = async (leadId: string, newStage: Lead["stage"]) => {
    try {
      await leadsApi.advanceStage(leadId, newStage);
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, stage: newStage } : l))
      );
      setToastMsg(`Status updated to "${newStage}" in live database`);
      setTimeout(() => setToastMsg(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.name || !newLead.phone) return;

    try {
      const created = await leadsApi.create({
        name: newLead.name,
        phone: newLead.phone,
        email: newLead.email || "guest@client.com",
        source: newLead.source,
        requirement: newLead.requirement || "Room / Event Inquiry",
        budget: Number(newLead.budget),
        stage: newLead.stage,
        aiSummary: newLead.aiSummary || `Inbound ${newLead.source} logged by front desk.`,
        nextFollowUp: newLead.nextFollowUp,
        hotelId: user?.hotelId || currentHotelId,
        leadType: "hotel_guest",
      });

      setLeads([created, ...leads]);
      setIsModalOpen(false);
      setToastMsg(`✅ Lead "${created.name}" (₹${Number(created.budget).toLocaleString()}) saved`);
      setTimeout(() => setToastMsg(null), 3500);

      setNewLead({
        name: "",
        phone: "",
        email: "",
        source: "AI Phone Call",
        requirement: "",
        budget: 35000,
        stage: "New",
        aiSummary: "",
        nextFollowUp: "Today, within 2 hours",
        hotelId: user?.hotelId || currentHotelId,
      });
    } catch (err) {
      console.error("Failed to create lead:", err);
    }
  };

  const openConvertModal = (lead: Lead) => {
    setConvertingLead(lead);
    setConvertForm({
      roomType: "Deluxe Room",
      roomNumber: "204",
      checkIn: new Date().toISOString().split("T")[0],
      checkOut: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
      amount: lead.budget || 12000,
    });
    setConvertModalOpen(true);
  };

  const handleConfirmReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingLead) return;

    setIsConverting(true);
    try {
      // 1. Create real Reservation in PMS
      const resv = await reservationsApi.create({
        guestName: convertingLead.name,
        guestPhone: convertingLead.phone,
        guestEmail: convertingLead.email || "guest@hotel.com",
        hotelName: currentHotelName,
        hotelId: currentHotelId,
        roomType: convertForm.roomType,
        roomNumber: convertForm.roomNumber,
        checkIn: convertForm.checkIn,
        checkOut: convertForm.checkOut,
        totalAmount: Number(convertForm.amount),
        paidAmount: Math.round(Number(convertForm.amount) * 0.5), // 50% advance
        status: "confirmed",
        source: `Lead (${convertingLead.source})`,
      });

      // 2. Advance Lead to "Converted"
      await leadsApi.advanceStage(convertingLead.id, "Converted");
      setLeads((prev) =>
        prev.map((l) => (l.id === convertingLead.id ? { ...l, stage: "Converted" } : l))
      );

      setConvertModalOpen(false);
      setToastMsg(`🎉 Lead Converted! Reservation #${resv.id || "RES-" + Date.now().toString().slice(-4)} created.`);
      setTimeout(() => setToastMsg(null), 4000);
    } catch (err: any) {
      console.error("Conversion error:", err);
      alert("Failed to convert lead to reservation: " + (err.message || "Unknown error"));
    } finally {
      setIsConverting(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredLeads.length === 0) {
      alert("No leads to export.");
      return;
    }
    const headers = ["ID", "Name", "Phone", "Email", "Source", "Requirement", "Budget", "Stage", "Next Follow Up", "Created At"];
    const rows = filteredLeads.map((l) => [
      l.id || l._id || "",
      `"${(l.name || "").replace(/"/g, '""')}"`,
      `"${l.phone || ""}"`,
      `"${l.email || ""}"`,
      `"${l.source || ""}"`,
      `"${(l.requirement || "").replace(/"/g, '""')}"`,
      l.budget || 0,
      l.stage || "New",
      `"${(l.nextFollowUp || "").replace(/"/g, '""')}"`,
      `"${l.createdAt || new Date().toISOString()}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `hotel_leads_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToastMsg("📥 Exported leads to CSV successfully!");
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleDeleteLead = async (leadId: string, leadName: string) => {
    if (!confirm(`Are you sure you want to delete lead "${leadName}"?`)) return;
    try {
      await leadsApi.delete(leadId);
      setLeads((prev) => prev.filter((l) => l.id !== leadId && (l as any)._id !== leadId));
      setToastMsg(`🗑️ Lead "${leadName}" removed from database`);
      setTimeout(() => setToastMsg(null), 3000);
    } catch (err: any) {
      console.error(err);
      alert("Failed to delete lead: " + (err.message || "Unknown error"));
    }
  };

  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.phone.includes(searchQuery) ||
      (l.requirement && l.requirement.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (l.source && l.source.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStage = stageFilter === "all" || l.stage === stageFilter;
    const matchesSource =
      sourceFilter === "all" ||
      (sourceFilter === "phone" && (l.source === "AI Phone Call" || l.source === "Direct Enquiry")) ||
      (sourceFilter === "whatsapp" && l.source === "WhatsApp") ||
      (sourceFilter === "channel" && (l.source === "Channel Manager" || l.source === "OTA"));

    return matchesSearch && matchesStage && matchesSource;
  });

  const totalPipeline = leads.reduce((acc, l) => (l.stage !== "Lost" ? acc + (l.budget || 0) : acc), 0);
  const convertedTotal = leads.filter((l) => l.stage === "Converted").reduce((acc, l) => acc + (l.budget || 0), 0);
  const aiQualifiedCount = leads.filter((l) => l.stage === "AI Qualified" || l.stage === "Proposal").length;

  return (
    <div className="space-y-6 font-sans antialiased text-[#111827]">
      {/* Toast Notice */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#111827] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-500/40 animate-in fade-in slide-in-from-bottom-4">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="text-[13px] font-medium">{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[26px] font-bold text-[#111827] tracking-tight">
              Property Sales &amp; Leads CRM
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
              Single Property
            </span>
          </div>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            Managing inquiries from Phone Calls, WhatsApp &amp; OTA Channel Manager for this property
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-white border border-[#D1D5DB] px-3 py-1.5 rounded-lg text-[13px] shadow-2xs font-semibold text-[#111827]">
            <Building2 className="w-4 h-4 text-[#EC3013]" />
            <span>{currentHotelName}</span>
          </div>

          <button
            onClick={loadData}
            title="Refresh database records"
            className="p-2 bg-white border border-[#D1D5DB] rounded-lg text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#EC3013]" : ""}`} />
          </button>

          <button
            onClick={handleExportCSV}
            title="Export filtered leads to CSV spreadsheet"
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#D1D5DB] hover:bg-[#F3F4F6] text-[#374151] text-[13px] font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#4B5563]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white text-[13px] font-bold rounded-lg shadow-sm transition-all hover:scale-[1.01] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Capture New Lead</span>
          </button>
        </div>
      </div>

      {/* 4 Pipeline Metrics Cards (Vibrant Reference Style - Red, Green, Orange, Cyan) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="relative overflow-hidden bg-[#E53935] hover:bg-[#D32F2F] p-6 rounded-xl text-white shadow-lg shadow-red-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-1">
              <div className="text-[34px] font-extrabold tracking-tight leading-none text-white drop-shadow-xs">
                ₹{totalPipeline.toLocaleString("en-IN")}
              </div>
              <div className="text-[12px] font-semibold text-white/90 uppercase tracking-wide">
                Total Pipeline Value
              </div>
              <div className="text-[11px] text-white/75 font-medium truncate max-w-[150px]">
                Active hotel revenue pipeline
              </div>
            </div>
            <div className="w-14 h-14 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10 text-white/90 shrink-0 group-hover:scale-105 group-hover:bg-white/20 transition-all">
              <TrendingUp className="w-7 h-7 stroke-[2]" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-[#43A047] hover:bg-[#388E3C] p-6 rounded-xl text-white shadow-lg shadow-green-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-1">
              <div className="text-[34px] font-extrabold tracking-tight leading-none text-white drop-shadow-xs">
                ₹{convertedTotal.toLocaleString("en-IN")}
              </div>
              <div className="text-[12px] font-semibold text-white/90 uppercase tracking-wide">
                Won &amp; Converted
              </div>
              <div className="text-[11px] text-white/75 font-medium truncate max-w-[150px]">
                Converted to front desk bookings
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
                {aiQualifiedCount} Leads
              </div>
              <div className="text-[12px] font-semibold text-white/90 uppercase tracking-wide">
                AI Voice / Chat Qualified
              </div>
              <div className="text-[11px] text-white/75 font-medium truncate max-w-[150px]">
                Ready for quotation / booking
              </div>
            </div>
            <div className="w-14 h-14 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10 text-white/90 shrink-0 group-hover:scale-105 group-hover:bg-white/20 transition-all">
              <Bot className="w-7 h-7 stroke-[2]" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-[#00ACC1] hover:bg-[#0097A7] p-6 rounded-xl text-white shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-1">
              <div className="text-[34px] font-extrabold tracking-tight leading-none text-white drop-shadow-xs">
                {leads.length} Active
              </div>
              <div className="text-[12px] font-semibold text-white/90 uppercase tracking-wide">
                Total Inquiries
              </div>
              <div className="text-[11px] text-white/75 font-medium truncate max-w-[150px]">
                Phone, WhatsApp &amp; Channel
              </div>
            </div>
            <div className="w-14 h-14 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10 text-white/90 shrink-0 group-hover:scale-105 group-hover:bg-white/20 transition-all">
              <PhoneCall className="w-7 h-7 stroke-[2]" />
            </div>
          </div>
        </div>
      </div>

      {/* Source Tabs & Filters Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-[#E5E7EB] shadow-xs space-y-3">
        {/* Source Switcher */}
        <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5 overflow-x-auto">
          <span className="text-[11px] font-bold uppercase text-gray-400 mr-2">Channels:</span>
          {[
            { key: "all", label: "All Channels" },
            { key: "phone", label: "📞 Phone Calls / Walk-in" },
            { key: "whatsapp", label: "💬 WhatsApp Inquiries" },
            { key: "channel", label: "🌐 Channel Manager (OTAs)" },
          ].map((src) => (
            <button
              key={src.key}
              onClick={() => setSourceFilter(src.key)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-colors whitespace-nowrap cursor-pointer ${
                sourceFilter === src.key
                  ? "bg-[#111827] text-white shadow-xs"
                  : "bg-gray-100 text-[#4B5563] hover:bg-gray-200"
              }`}
            >
              {src.label}
            </button>
          ))}
        </div>

        {/* Stages and Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {["all", "New", "Contacted", "AI Qualified", "Proposal", "Converted", "Lost"].map((stg) => (
              <button
                key={stg}
                onClick={() => setStageFilter(stg)}
                className={`px-3 py-1 rounded-md text-[12px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  stageFilter === stg
                    ? "bg-amber-500 text-white font-bold"
                    : "text-[#4B5563] hover:bg-[#F3F4F6]"
                }`}
              >
                {stg === "all" ? "All Stages" : stg}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search by name, phone, requirement..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg text-[13px] text-[#111827] focus:outline-none focus:border-[#EC3013] w-full sm:w-72"
            />
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[10.5px] font-bold text-[#6B7280] uppercase tracking-wider bg-[#F9FAFB]">
                <th className="py-3 px-4">GUEST / INQUIRY SOURCE</th>
                <th className="py-3 px-4">REQUIREMENT</th>
                <th className="py-3 px-4">EST. VALUE</th>
                <th className="py-3 px-4">STAGE</th>
                <th className="py-3 px-4">AI SUMMARY &amp; NEXT ACTION</th>
                <th className="py-3 px-4 text-right">QUICK ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#9CA3AF]">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#EC3013]" />
                      <span>Loading property sales pipeline...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#9CA3AF]">
                    <PhoneCall className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    No inquiries found matching your filters. Click &quot;Capture New Lead&quot; to log a phone call or WhatsApp inquiry.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id || lead._id} className="hover:bg-[#F9FAFB] transition-colors">
                    {/* Guest / Source */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#111827]">{lead.name}</div>
                      <div className="text-[12px] text-[#4B5563] flex items-center gap-1.5 mt-0.5">
                        <PhoneCall className="w-3 h-3 text-emerald-600" />
                        <a href={`tel:${lead.phone}`} className="hover:underline">{lead.phone}</a>
                      </div>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-md ${
                          lead.source === "WhatsApp"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : lead.source === "Channel Manager" || lead.source === "OTA"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {lead.source === "WhatsApp" ? "💬 WhatsApp" : lead.source === "Channel Manager" || lead.source === "OTA" ? "🌐 Channel Manager" : "📞 " + lead.source}
                      </span>
                    </td>

                    {/* Requirement */}
                    <td className="py-3.5 px-4 font-medium text-[#374151] max-w-[200px]">
                      <div className="line-clamp-2">{lead.requirement}</div>
                    </td>

                    {/* Value */}
                    <td className="py-3.5 px-4 font-bold text-[#111827]">
                      ₹{(lead.budget || 0).toLocaleString("en-IN")}
                    </td>

                    {/* Stage Dropdown */}
                    <td className="py-3.5 px-4">
                      <select
                        value={lead.stage}
                        onChange={(e) => handleStageChange(lead.id, e.target.value as Lead["stage"])}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-md border focus:outline-none cursor-pointer ${
                          lead.stage === "Converted"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : lead.stage === "AI Qualified"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : lead.stage === "Proposal"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : lead.stage === "Contacted"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : lead.stage === "Lost"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-gray-100 text-gray-700 border-gray-300"
                        }`}
                      >
                        <option value="New">🟡 New</option>
                        <option value="Contacted">🔵 Contacted</option>
                        <option value="AI Qualified">🟣 AI Qualified</option>
                        <option value="Proposal">🟠 Proposal</option>
                        <option value="Converted">🟢 Converted (Won)</option>
                        <option value="Lost">🔴 Lost</option>
                      </select>
                    </td>

                    {/* Summary */}
                    <td className="py-3.5 px-4 max-w-[240px]">
                      <p className="text-[12px] text-[#374151] line-clamp-2">
                        {lead.aiSummary || "Inquiry recorded in CRM."}
                      </p>
                      <p className="text-[11px] text-[#EC3013] font-semibold mt-1">
                        ⏰ Follow-up: {lead.nextFollowUp}
                      </p>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* WhatsApp Button */}
                        <a
                          href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}?text=Namaste%20${encodeURIComponent(lead.name)}%20ji!%20Greetings%20from%20${encodeURIComponent(currentHotelName)}.%20We%20received%20your%20inquiry%20regarding%20${encodeURIComponent(lead.requirement)}.%20How%20can%20we%20assist%20you%20with%20our%20best%20package%20today?`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 rounded-lg transition-colors"
                          title="Chat on WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </a>

                        {/* Call Button */}
                        <a
                          href={`tel:${lead.phone}`}
                          className="p-1.5 border border-[#D1D5DB] hover:bg-gray-100 rounded-lg text-gray-700 transition-colors"
                          title="Call Lead"
                        >
                          <PhoneCall className="w-4 h-4" />
                        </a>

                        {/* Convert to Booking Button */}
                        {lead.stage !== "Converted" ? (
                          <button
                            type="button"
                            onClick={() => openConvertModal(lead)}
                            className="px-2.5 py-1 bg-[#111] hover:bg-[#222] text-white text-[11.5px] font-bold rounded-lg shadow-2xs cursor-pointer flex items-center gap-1 transition-colors"
                            title="Convert into confirmed PMS Reservation"
                          >
                            <BedDouble className="w-3.5 h-3.5 text-amber-400" />
                            <span>Book Room</span>
                          </button>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                            ✓ Booked
                          </span>
                        )}

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteLead(lead.id || (lead as any)._id, lead.name)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Lead"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Modal 1: Capture New Lead */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-[#EC3013]" />
                <h3 className="text-[16px] font-bold text-[#111827]">
                  Log Inbound Hotel Inquiry
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="p-6 space-y-4 text-[13px]">
              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                  Guest / Caller / Client Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Singhania"
                  value={newLead.name}
                  onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#EC3013]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Mobile Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98200 11223"
                    value={newLead.phone}
                    onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#EC3013]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Inquiry Source *
                  </label>
                  <select
                    value={newLead.source}
                    onChange={(e) => setNewLead({ ...newLead, source: e.target.value as any })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg bg-white focus:outline-none focus:border-[#EC3013] font-semibold"
                  >
                    <option value="AI Phone Call">📞 Inbound Phone Call</option>
                    <option value="WhatsApp">💬 WhatsApp Message</option>
                    <option value="Channel Manager">🌐 Channel Manager / OTA</option>
                    <option value="Direct Enquiry">🚶‍♂️ Walk-In at Front Desk</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                  Stay / Banquet Requirement *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 4 Deluxe Rooms for Weekend Family Stay / Banquet for 150 guests"
                  value={newLead.requirement}
                  onChange={(e) => setNewLead({ ...newLead, requirement: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#EC3013]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Estimated Deal Value (₹)
                  </label>
                  <input
                    type="number"
                    value={newLead.budget}
                    onChange={(e) => setNewLead({ ...newLead, budget: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#EC3013]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Initial Stage
                  </label>
                  <select
                    value={newLead.stage}
                    onChange={(e) => setNewLead({ ...newLead, stage: e.target.value as any })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg bg-white"
                  >
                    <option value="New">🟡 New</option>
                    <option value="Contacted">🔵 Contacted</option>
                    <option value="AI Qualified">🟣 AI Qualified</option>
                    <option value="Proposal">🟠 Proposal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                  Caller Notes &amp; Follow-up Details
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Guest inquired about pool-facing rooms. Offered 10% discount on 3 nights. Call at 4 PM."
                  value={newLead.aiSummary}
                  onChange={(e) => setNewLead({ ...newLead, aiSummary: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#D1D5DB] rounded-lg text-[#374151] font-semibold hover:bg-[#F3F4F6] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white font-bold rounded-lg shadow-xs transition-colors"
                >
                  Save Lead to CRM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Convert Lead to Real Reservation */}
      {convertModalOpen && convertingLead && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-emerald-50">
              <div className="flex items-center gap-2">
                <BedDouble className="w-5 h-5 text-emerald-700" />
                <h3 className="text-[16px] font-bold text-[#111827]">
                  Convert Lead to Front Desk Reservation
                </h3>
              </div>
              <button
                onClick={() => setConvertModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReservation} className="p-6 space-y-4 text-[13px]">
              <div className="bg-gray-50 border border-gray-200 p-3.5 rounded-xl space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#111827] text-[14px]">{convertingLead.name}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                    {convertingLead.source}
                  </span>
                </div>
                <div className="text-[12px] text-gray-600">📞 {convertingLead.phone}</div>
                <div className="text-[12px] text-gray-500 italic mt-1">"{convertingLead.requirement}"</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Room Category *
                  </label>
                  <select
                    value={convertForm.roomType}
                    onChange={(e) => setConvertForm({ ...convertForm, roomType: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg bg-white font-semibold"
                  >
                    <option value="Deluxe Room">Deluxe Room (₹4,500/nt)</option>
                    <option value="Standard Room">Standard Room (₹2,500/nt)</option>
                    <option value="Executive Suite">Executive Suite (₹7,500/nt)</option>
                    <option value="Presidential Suite">Presidential Suite (₹14,000/nt)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Assign Room #
                  </label>
                  <select
                    value={convertForm.roomNumber}
                    onChange={(e) => setConvertForm({ ...convertForm, roomNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg bg-white font-semibold"
                  >
                    <option value="204">Room 204 (Floor 2)</option>
                    <option value="205">Room 205 (Floor 2)</option>
                    <option value="301">Room 301 (Floor 3)</option>
                    <option value="304">Room 304 (Floor 3)</option>
                    <option value="102">Room 102 (Floor 1)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Check-In Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={convertForm.checkIn}
                    onChange={(e) => setConvertForm({ ...convertForm, checkIn: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Check-Out Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={convertForm.checkOut}
                    onChange={(e) => setConvertForm({ ...convertForm, checkOut: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                  Agreed Booking Total (₹) *
                </label>
                <input
                  type="number"
                  required
                  value={convertForm.amount}
                  onChange={(e) => setConvertForm({ ...convertForm, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg font-bold text-[#111827] text-[15px]"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  System will automatically set 50% advance paid and mark lead as Converted.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setConvertModalOpen(false)}
                  className="px-4 py-2 border border-[#D1D5DB] rounded-lg text-[#374151] font-semibold hover:bg-[#F3F4F6] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isConverting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-70 cursor-pointer"
                >
                  {isConverting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Creating Booking...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Confirm &amp; Create Reservation
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
