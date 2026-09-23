"use client";

import { useState, useEffect } from "react";
import { leadsApi, hotelsApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  Building2,
  TrendingUp,
  Plus,
  X,
  Search,
  Bot,
  CheckCircle2,
  RefreshCw,
  PhoneCall,
  BarChart3,
  Check,
  MapPin,
  ArrowUpRight,
  Download,
  Trash2,
  MessageSquare,
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

export default function HotelAdminLeadsOverviewPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<string>("all");
  const [metrics, setMetrics] = useState<any>({ totalPipeline: 0, convertedTotal: 0, aiQualifiedCount: 0, totalEnquiries: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [newLead, setNewLead] = useState({
    name: "",
    phone: "",
    email: "",
    source: "AI Phone Call" as Lead["source"],
    requirement: "",
    budget: 100000,
    stage: "New" as Lead["stage"],
    aiSummary: "",
    nextFollowUp: "Tomorrow, 10:00 AM",
    hotelId: "",
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [leadsRes, hotelsRes] = await Promise.all([
        leadsApi.getAll({
          hotelId: selectedHotelId !== "all" ? selectedHotelId : undefined,
          orgId: user?.orgId || undefined,
          leadType: "hotel_guest",
        }),
        hotelsApi.getAll(user?.orgId ? { orgId: user.orgId } : undefined),
      ]);
      if (leadsRes && leadsRes.data) {
        setLeads(leadsRes.data);
        if (leadsRes.metrics) setMetrics(leadsRes.metrics);
      }
      if (hotelsRes) {
        setHotels(hotelsRes);
        if (hotelsRes.length > 0 && !newLead.hotelId) {
          setNewLead((prev) => ({ ...prev, hotelId: hotelsRes[0].id }));
        }
      }
    } catch (e) {
      console.error("Failed to fetch chain leads data", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedHotelId, user?.orgId]);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.name || !newLead.phone) return;

    try {
      const created = await leadsApi.create({
        name: newLead.name,
        phone: newLead.phone,
        email: newLead.email || "lead@client.com",
        source: newLead.source,
        requirement: newLead.requirement || "General Inquiry",
        budget: Number(newLead.budget),
        stage: newLead.stage,
        aiSummary: newLead.aiSummary || "Captured via Hotel Admin CRM",
        nextFollowUp: newLead.nextFollowUp,
        hotelId: newLead.hotelId || (hotels[0]?.id ?? "hotel-101"),
      });

      setLeads([created, ...leads]);
      setIsModalOpen(false);
      setToastMsg(`✅ Lead "${created.name}" (₹${Number(created.budget).toLocaleString()}) saved to MongoDB database`);
      setTimeout(() => setToastMsg(null), 3500);

      setNewLead({
        name: "",
        phone: "",
        email: "",
        source: "AI Phone Call",
        requirement: "",
        budget: 100000,
        stage: "New",
        aiSummary: "",
        nextFollowUp: "Tomorrow, 10:00 AM",
        hotelId: hotels[0]?.id || "",
      });
    } catch (err) {
      console.error("Failed to create lead:", err);
    }
  };

  const advanceStage = async (leadId: string) => {
    const stageFlow: Record<Lead["stage"], Lead["stage"]> = {
      New: "Contacted",
      Contacted: "AI Qualified",
      "AI Qualified": "Proposal",
      Proposal: "Converted",
      Converted: "Converted",
      Lost: "Lost",
    };

    const targetLead = leads.find((l) => l.id === leadId || (l as any)._id === leadId);
    if (!targetLead) return;

    const nextStage = stageFlow[targetLead.stage] || "Converted";

    try {
      const updated = await leadsApi.advanceStage(leadId, nextStage);
      setLeads(leads.map((l) => (l.id === leadId || (l as any)._id === leadId ? updated : l)));
      setToastMsg(`Lead ${leadId} advanced to "${nextStage}" in database`);
      setTimeout(() => setToastMsg(null), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCSV = () => {
    if (filteredLeads.length === 0) {
      alert("No leads to export.");
      return;
    }
    const headers = ["ID", "Name", "Phone", "Email", "Hotel", "Source", "Requirement", "Budget", "Stage", "Next Action", "Created At"];
    const rows = filteredLeads.map((l) => {
      const hName = hotels.find((h) => h.id === l.hotelId || h._id === l.hotelId)?.name || l.hotelId || "Default Property";
      return [
        l.id || l._id || "",
        `"${(l.name || "").replace(/"/g, '""')}"`,
        `"${l.phone || ""}"`,
        `"${l.email || ""}"`,
        `"${hName.replace(/"/g, '""')}"`,
        `"${l.source || ""}"`,
        `"${(l.requirement || "").replace(/"/g, '""')}"`,
        l.budget || 0,
        l.stage || "New",
        `"${(l.nextFollowUp || "").replace(/"/g, '""')}"`,
        `"${l.createdAt || new Date().toISOString()}"`,
      ];
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `chain_leads_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToastMsg("📥 Exported chain leads to CSV successfully!");
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleDeleteLead = async (leadId: string, leadName: string) => {
    if (!confirm(`Are you sure you want to delete lead "${leadName}"?`)) return;
    try {
      await leadsApi.delete(leadId);
      setLeads((prev) => prev.filter((l) => l.id !== leadId && (l as any)._id !== leadId));
      setToastMsg(`🗑️ Lead "${leadName}" deleted from database`);
      setTimeout(() => setToastMsg(null), 3000);
    } catch (err: any) {
      console.error(err);
      alert("Failed to delete lead: " + (err.message || "Unknown error"));
    }
  };

  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.requirement.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.source.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStage = stageFilter === "all" || l.stage.toLowerCase() === stageFilter.toLowerCase();
    return matchesSearch && matchesStage;
  });

  const totalPipeline = leads.reduce((acc, l) => (l.stage !== "Lost" ? acc + (l.budget || 0) : acc), 0);
  const convertedTotal = leads.filter((l) => l.stage === "Converted").reduce((acc, l) => acc + (l.budget || 0), 0);
  const aiQualifiedCount = leads.filter((l) => l.stage === "AI Qualified" || l.stage === "Proposal").length;

  const stages = ["all", "New", "Contacted", "AI Qualified", "Proposal", "Converted"];

  // Compute hotel-wise performance breakdown
  const hotelPerformance = hotels.map((h) => {
    const hotelLeads = leads.filter((l) => l.hotelId === h.id || l.hotelId === h._id);
    const hPipeline = hotelLeads.reduce((acc, l) => (l.stage !== "Lost" ? acc + (l.budget || 0) : acc), 0);
    const hWon = hotelLeads.filter((l) => l.stage === "Converted").reduce((acc, l) => acc + (l.budget || 0), 0);
    const convRate = hotelLeads.length > 0 ? Math.round((hotelLeads.filter((l) => l.stage === "Converted").length / hotelLeads.length) * 100) : 0;
    return {
      hotel: h,
      leadsCount: hotelLeads.length,
      pipelineValue: hPipeline,
      wonValue: hWon,
      convRate,
    };
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#0F172A] tracking-[-0.02em]">
            Chain Sales &amp; Lead Performance
          </h1>
          <p className="text-[13px] text-[#64748B] mt-1 font-normal">
            Cross-property pipeline analytics, AI voice qualification &amp; revenue conversion by hotel
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Multi-Hotel Selector */}
          {hotels.length > 1 && (
            <div className="flex items-center gap-1.5 bg-white border border-[#D1D5DB] px-3 py-1.5 rounded text-[13px] shadow-xs">
              <Building2 className="w-4 h-4 text-[#EC3013]" />
              <select
                value={selectedHotelId}
                onChange={(e) => setSelectedHotelId(e.target.value)}
                className="bg-transparent text-[#111827] font-semibold text-[13px] focus:outline-none cursor-pointer"
              >
                <option value="all">All Properties ({hotels.length})</option>
                {hotels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={loadData}
            title="Refresh database records"
            className="p-2 border border-[#D1D5DB] rounded text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#EC3013]" : ""}`} />
          </button>

          <button
            onClick={handleExportCSV}
            title="Export chain leads to CSV"
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#D1D5DB] hover:bg-[#F3F4F6] text-[#374151] text-[13px] font-bold rounded shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#4B5563]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white text-[13px] font-bold rounded shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Capture Lead</span>
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

      {/* Chain Level Financial Metric Cards (Matching Sidebar Deep Navy Theme) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Chain Pipeline */}
        <div className="relative overflow-hidden bg-[#0B132B] hover:bg-[#0F1A3A] p-5 rounded-xl border border-slate-800/90 shadow-xl hover:border-cyan-500/50 hover:shadow-cyan-950/40 hover:-translate-y-0.5 transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-cyan-500/50 via-cyan-500/20 to-transparent" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg border bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-inner">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400">
                Total Chain Pipeline
              </span>
            </div>
          </div>
          <div className="text-[28px] font-black text-white mt-3 tracking-tight drop-shadow-xs">
            ₹{totalPipeline.toLocaleString()}
          </div>
          <div className="text-[12px] text-slate-400 mt-1 font-medium">
            Across all properties
          </div>
        </div>

        {/* Won & Converted */}
        <div className="relative overflow-hidden bg-[#0B132B] hover:bg-[#0F1A3A] p-5 rounded-xl border border-slate-800/90 shadow-xl hover:border-emerald-500/50 hover:shadow-emerald-950/40 hover:-translate-y-0.5 transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500/60 via-emerald-500/20 to-transparent" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-inner">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
                Won &amp; Converted
              </span>
            </div>
          </div>
          <div className="text-[28px] font-black text-emerald-300 mt-3 tracking-tight drop-shadow-xs">
            ₹{convertedTotal.toLocaleString()}
          </div>
          <div className="text-[12px] text-emerald-400/80 mt-1 font-semibold">
            Direct bookings realized
          </div>
        </div>

        {/* AI Voice Qualified */}
        <div className="relative overflow-hidden bg-[#0B132B] hover:bg-[#0F1A3A] p-5 rounded-xl border border-slate-800/90 shadow-xl hover:border-purple-500/50 hover:shadow-purple-950/40 hover:-translate-y-0.5 transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-purple-500/60 via-purple-500/20 to-transparent" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg border bg-purple-500/10 border-purple-500/30 text-purple-400 shadow-inner">
                <Bot className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider text-purple-400">
                AI Voice Qualified
              </span>
            </div>
          </div>
          <div className="text-[28px] font-black text-purple-300 mt-3 tracking-tight drop-shadow-xs">
            {aiQualifiedCount} Deals
          </div>
          <div className="text-[12px] text-purple-400/80 mt-1 font-semibold">
            High conversion probability
          </div>
        </div>

        {/* Active Inquiries */}
        <div className="relative overflow-hidden bg-[#0B132B] hover:bg-[#0F1A3A] p-5 rounded-xl border border-slate-800/90 shadow-xl hover:border-blue-500/50 hover:shadow-blue-950/40 hover:-translate-y-0.5 transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500/60 via-blue-500/20 to-transparent" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg border bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-inner">
                <PhoneCall className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-400">
                Active Inquiries
              </span>
            </div>
          </div>
          <div className="text-[28px] font-black text-blue-300 mt-3 tracking-tight drop-shadow-xs">
            {leads.length} Total
          </div>
          <div className="text-[12px] text-blue-400/80 mt-1 font-semibold">
            Calls, Web &amp; WhatsApp
          </div>
        </div>
      </div>

      {/* Hotel-wise Performance Comparison Matrix */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#EC3013]" />
            <h2 className="text-[14px] font-bold text-[#111827]">Property-Wise Performance Breakdown</h2>
          </div>
          <span className="text-[11px] font-semibold text-[#6B7280]">{hotels.length} Properties in Chain</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider bg-white">
                <th className="py-3 px-4 font-bold">PROPERTY NAME</th>
                <th className="py-3 px-4 font-bold">LOCATION / AREA</th>
                <th className="py-3 px-4 font-bold">ACTIVE LEADS</th>
                <th className="py-3 px-4 font-bold">PIPELINE VALUE</th>
                <th className="py-3 px-4 font-bold">CONVERTED (WON)</th>
                <th className="py-3 px-4 font-bold">CONVERSION RATE</th>
                <th className="py-3 px-4 text-right font-bold">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {hotelPerformance.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#9CA3AF]">
                    No hotel properties registered.
                  </td>
                </tr>
              ) : (
                hotelPerformance.map((hp) => (
                  <tr key={hp.hotel.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#111827]">{hp.hotel.name}</div>
                      <div className="text-[11px] text-[#6B7280]">{hp.hotel.id}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[#374151] font-medium">
                      {hp.hotel.location || hp.hotel.city || "New Delhi, India"}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#111827]">
                      {hp.leadsCount} Leads
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#111827]">
                      ₹{hp.pipelineValue.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">
                      ₹{hp.wonValue.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${Math.min(hp.convRate, 100)}%` }}
                          />
                        </div>
                        <span className="text-[12px] font-bold text-[#111827]">{hp.convRate}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Active ✓
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Leads Pipeline Section */}
      <div className="space-y-4">
        {/* Filters Bar */}
        <div className="bg-white p-3.5 rounded-lg border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {stages.map((stg) => (
              <button
                key={stg}
                onClick={() => setStageFilter(stg)}
                className={`px-3 py-1.5 rounded text-[12px] font-semibold capitalize transition-colors ${
                  stageFilter === stg
                    ? "bg-[#111827] text-white"
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
              placeholder="Search lead, requirement, source..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-[#F9FAFB] border border-[#D1D5DB] rounded text-[13px] text-[#111827] focus:outline-none focus:border-[#EC3013] w-full sm:w-64"
            />
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider bg-[#F9FAFB]">
                  <th className="py-3 px-4 font-bold">CLIENT / SOURCE</th>
                  <th className="py-3 px-4 font-bold">HOTEL PROPERTY</th>
                  <th className="py-3 px-4 font-bold">REQUIREMENT</th>
                  <th className="py-3 px-4 font-bold">EST. VALUE</th>
                  <th className="py-3 px-4 font-bold">STAGE</th>
                  <th className="py-3 px-4 font-bold">AI CALL SUMMARY &amp; NEXT ACTION</th>
                  <th className="py-3 px-4 text-right font-bold">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#9CA3AF]">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-[#EC3013]" />
                        <span>Loading sales pipeline from database...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-[#9CA3AF]">
                      No sales leads in database for this selection.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => {
                    const hotelMatch = hotels.find((h) => h.id === lead.hotelId || h._id === lead.hotelId);
                    return (
                      <tr key={lead.id || lead._id} className="hover:bg-[#F9FAFB] transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#111827]">{lead.name}</div>
                          <div className="text-[11px] text-[#6B7280]">{lead.phone}</div>
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-[#F3F4F6] text-[#4B5563] text-[10px] font-semibold rounded">
                            {lead.source}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-[12px] font-semibold text-[#111827]">
                            {hotelMatch?.name || lead.hotelId || "Taj Palace New Delhi"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-[#374151] max-w-[200px]">
                          {lead.requirement}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#111827]">
                          ₹{(lead.budget || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                              lead.stage === "Converted"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : lead.stage === "AI Qualified"
                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                : lead.stage === "Proposal"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : lead.stage === "Contacted"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {lead.stage}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-[280px]">
                          <p className="text-[12px] text-[#374151] line-clamp-2">
                            🤖 {lead.aiSummary}
                          </p>
                          <p className="text-[11px] text-[#EC3013] font-semibold mt-1">
                            ⏰ Next: {lead.nextFollowUp}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}?text=Namaste%20${encodeURIComponent(lead.name)}%20ji!%20Greetings%20from%20${encodeURIComponent(hotelMatch?.name || "our Hotel")}.%20We%20received%20your%20inquiry%20regarding%20${encodeURIComponent(lead.requirement)}.%20How%20can%20we%20assist%20you%20with%20our%20best%20package?`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 rounded transition-colors"
                              title="WhatsApp Guest"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>

                            <a
                              href={`tel:${lead.phone}`}
                              className="p-1.5 border border-[#D1D5DB] hover:bg-gray-100 rounded text-gray-700 transition-colors"
                              title="Call Guest"
                            >
                              <PhoneCall className="w-3.5 h-3.5" />
                            </a>

                            {lead.stage !== "Converted" && lead.stage !== "Lost" ? (
                              <button
                                type="button"
                                onClick={() => advanceStage(lead.id || (lead as any)._id)}
                                className="px-2.5 py-1 bg-[#111827] hover:bg-black text-white text-[11px] font-bold rounded shadow-xs cursor-pointer active:scale-95 transition-transform"
                              >
                                Advance →
                              </button>
                            ) : lead.stage === "Converted" ? (
                              <span className="text-[11px] text-emerald-700 font-bold px-1.5 py-0.5 bg-emerald-50 rounded">Won ✓</span>
                            ) : (
                              <span className="text-[11px] text-rose-600 font-bold px-1.5 py-0.5 bg-rose-50 rounded">Closed</span>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteLead(lead.id || (lead as any)._id, lead.name)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="Delete Lead"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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

      {/* Capture Lead Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 space-y-4 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-[#EC3013]" />
                <h3 className="text-[16px] font-bold text-[#111827]">Capture Sales Lead</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#9CA3AF] hover:text-[#111827] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-4 text-[13px]">
              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                  Target Hotel Property *
                </label>
                <select
                  value={newLead.hotelId}
                  onChange={(e) => setNewLead({ ...newLead, hotelId: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded bg-white font-medium"
                >
                  {hotels.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.location || h.city || "Primary"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                  Client / Company Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tata Consultancy Services"
                  value={newLead.name}
                  onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
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
                    placeholder="+91 98200 11223"
                    value={newLead.phone}
                    onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Lead Source
                  </label>
                  <select
                    value={newLead.source}
                    onChange={(e) => setNewLead({ ...newLead, source: e.target.value as any })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded bg-white"
                  >
                    <option value="AI Phone Call">AI Phone Call</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Website">Website</option>
                    <option value="OTA">OTA (Booking.com / Agoda)</option>
                    <option value="Channel Manager">Channel Manager</option>
                    <option value="Social">Social</option>
                    <option value="Direct Enquiry">Direct Enquiry</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                  Stay / Event Requirement *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Summit · 30 Rooms for 4 Nights"
                  value={newLead.requirement}
                  onChange={(e) => setNewLead({ ...newLead, requirement: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Estimated Budget (₹)
                  </label>
                  <input
                    type="number"
                    value={newLead.budget}
                    onChange={(e) => setNewLead({ ...newLead, budget: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Initial Stage
                  </label>
                  <select
                    value={newLead.stage}
                    onChange={(e) => setNewLead({ ...newLead, stage: e.target.value as any })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded bg-white"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="AI Qualified">AI Qualified</option>
                    <option value="Proposal">Proposal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                  AI Call Summary / Requirement Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. AI Calling Agent qualified dates & budget."
                  value={newLead.aiSummary}
                  onChange={(e) => setNewLead({ ...newLead, aiSummary: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded resize-none"
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
