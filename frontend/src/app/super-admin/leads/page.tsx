"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { leadsApi } from "@/lib/api";
import {
  PhoneCall,
  Mail,
  Building2,
  Calendar,
  Search,
  RefreshCw,
  Plus,
  X,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  Sparkles,
} from "lucide-react";

interface Lead {
  _id?: string;
  id: string;
  name: string;
  phone: string;
  email: string;
  source: string;
  requirement: string;
  budget: number;
  stage: "New" | "Contacted" | "AI Qualified" | "Proposal" | "Converted" | "Lost";
  aiSummary: string;
  nextFollowUp: string;
  hotelId?: string;
  createdAt?: string;
}

export default function SuperAdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [newLead, setNewLead] = useState({
    name: "",
    phone: "",
    email: "",
    source: "Website" as const,
    requirement: "",
    budget: 60000,
    stage: "New" as Lead["stage"],
    aiSummary: "",
    nextFollowUp: "Today, within 2 hours",
    hotelId: "saas-platform",
  });

  const loadLeads = async () => {
    setIsLoading(true);
    try {
      const res = await leadsApi.getAll({ leadType: "saas", hotelId: "saas-platform" });
      if (res && res.data) {
        setLeads(res.data);
      }
    } catch (e) {
      console.error("Failed to load leads:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const handleStageChange = async (leadId: string, newStage: Lead["stage"]) => {
    try {
      await leadsApi.advanceStage(leadId, newStage);
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, stage: newStage } : l))
      );
      setToastMsg(`Status updated to ${newStage}`);
      setTimeout(() => setToastMsg(null), 3000);
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.name || !newLead.phone) return;

    try {
      const created = await leadsApi.create({
        name: newLead.name,
        phone: newLead.phone,
        email: newLead.email || "owner@hotel.com",
        source: newLead.source,
        requirement: newLead.requirement || "LuckNexa SaaS Demo & Tariff Quote",
        budget: Number(newLead.budget),
        stage: newLead.stage,
        aiSummary: newLead.aiSummary || "[Super Admin Manual Entry]: Hotel SaaS lead",
        nextFollowUp: newLead.nextFollowUp,
        hotelId: "saas-platform",
        leadType: "saas",
      });

      setLeads([created, ...leads]);
      setIsModalOpen(false);
      setToastMsg(`Lead "${created.name}" created successfully`);
      setTimeout(() => setToastMsg(null), 3500);

      setNewLead({
        name: "",
        phone: "",
        email: "",
        source: "Website",
        requirement: "",
        budget: 60000,
        stage: "New",
        aiSummary: "",
        nextFollowUp: "Today, within 2 hours",
        hotelId: "saas-platform",
      });
    } catch (err) {
      console.error(err);
      alert("Failed to create lead. Please check inputs.");
    }
  };

  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.phone.includes(searchQuery) ||
      (l.email && l.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (l.requirement && l.requirement.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStage = stageFilter === "all" || l.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  const totalValue = leads.reduce((sum, l) => sum + (l.budget || 0), 0);
  const newCount = leads.filter((l) => l.stage === "New").length;
  const contactedCount = leads.filter((l) => l.stage === "Contacted").length;
  const convertedCount = leads.filter((l) => l.stage === "Converted").length;

  return (
    <div className="space-y-8 font-sans antialiased text-[#111827]">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0B132B] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-cyan-500/40 animate-in fade-in slide-in-from-bottom-4">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-[13px] font-medium">{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#0F172A] tracking-[-0.02em]">
            SaaS Inquiries &amp; Hotel Leads
          </h1>
          <p className="text-[13px] text-[#64748B] mt-1 font-normal">
            Incoming demo requests from hotel owners on the LuckNexa landing page
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadLeads}
            title="Refresh Leads"
            className="p-2.5 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] rounded-lg text-[#4B5563] flex items-center gap-2 text-xs font-semibold shadow-xs transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-cyan-600" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#EC3013] hover:bg-[#D62839] text-white text-[13px] font-bold rounded-lg shadow-sm transition-all hover:scale-[1.01]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Manual Inquiry</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (Vibrant Reference Style - Red, Green, Orange, Cyan) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Inquiries (Red) */}
        <div className="relative overflow-hidden bg-[#E53935] hover:bg-[#D32F2F] p-5 rounded-xl text-white shadow-lg shadow-red-500/20 hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[34px] font-black leading-none tracking-tight">
                {leads.length}
              </div>
              <div className="text-[15px] font-bold text-white/95 mt-2">
                Total Inquiries
              </div>
              <div className="text-[12px] text-white/80 font-medium mt-0.5">
                Across all web forms &amp; chat
              </div>
            </div>
            <div className="w-14 h-14 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10 text-white/90 shrink-0">
              <Building2 className="w-7 h-7 stroke-[2]" />
            </div>
          </div>
        </div>

        {/* Converted / Won (Green) */}
        <div className="relative overflow-hidden bg-[#43A047] hover:bg-[#388E3C] p-5 rounded-xl text-white shadow-lg shadow-green-500/20 hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[34px] font-black leading-none tracking-tight">
                {convertedCount}
              </div>
              <div className="text-[15px] font-bold text-white/95 mt-2">
                Converted / Won
              </div>
              <div className="text-[12px] text-white/80 font-medium mt-0.5">
                Active paid hotel onboarding
              </div>
            </div>
            <div className="w-14 h-14 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10 text-white/90 shrink-0">
              <CheckCircle2 className="w-7 h-7 stroke-[2]" />
            </div>
          </div>
        </div>

        {/* New (Pending Call) (Orange) */}
        <div className="relative overflow-hidden bg-[#FB8C00] hover:bg-[#F57C00] p-5 rounded-xl text-white shadow-lg shadow-orange-500/20 hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[34px] font-black leading-none tracking-tight flex items-center gap-2">
                {newCount}
                {newCount > 0 && (
                  <span className="px-2 py-0.5 bg-white text-orange-600 text-[10px] font-black rounded-full animate-pulse">
                    Hot
                  </span>
                )}
              </div>
              <div className="text-[15px] font-bold text-white/95 mt-2">
                New (Pending Call)
              </div>
              <div className="text-[12px] text-white/80 font-medium mt-0.5">
                Needs consultation within 30m
              </div>
            </div>
            <div className="w-14 h-14 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10 text-white/90 shrink-0">
              <Clock className="w-7 h-7 stroke-[2]" />
            </div>
          </div>
        </div>

        {/* Est. Pipeline Value (Cyan/Teal) */}
        <div className="relative overflow-hidden bg-[#00ACC1] hover:bg-[#0097A7] p-5 rounded-xl text-white shadow-lg shadow-cyan-500/20 hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[34px] font-black leading-none tracking-tight">
                ₹{totalValue.toLocaleString("en-IN")}
              </div>
              <div className="text-[15px] font-bold text-white/95 mt-2">
                Est. Pipeline Value
              </div>
              <div className="text-[12px] text-white/80 font-medium mt-0.5">
                Annual subscription estimate
              </div>
            </div>
            <div className="w-14 h-14 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10 text-white/90 shrink-0">
              <TrendingUp className="w-7 h-7 stroke-[2]" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search hotel, owner, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-[13px] border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {["all", "New", "Contacted", "AI Qualified", "Proposal", "Converted", "Lost"].map((stage) => (
            <button
              key={stage}
              onClick={() => setStageFilter(stage)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors whitespace-nowrap ${
                stageFilter === stage
                  ? "bg-[#0B132B] text-white"
                  : "bg-gray-100 text-[#4B5563] hover:bg-gray-200"
              }`}
            >
              {stage === "all" ? "All Stages" : stage}
            </button>
          ))}
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Hotel Owner / Contact</th>
                <th className="px-5 py-3.5">Property &amp; Requirement</th>
                <th className="px-5 py-3.5">Source &amp; Budget</th>
                <th className="px-5 py-3.5">Pipeline Stage</th>
                <th className="px-5 py-3.5 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    <Building2 className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    No inquiries found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id || lead._id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Owner Contact */}
                    <td className="px-5 py-4">
                      <div className="font-bold text-[#111827]">{lead.name}</div>
                      <div className="text-[12px] text-[#4B5563] flex items-center gap-1.5 mt-0.5">
                        <PhoneCall className="w-3 h-3 text-cyan-600" />
                        <a href={`tel:${lead.phone}`} className="hover:underline">{lead.phone}</a>
                      </div>
                      {lead.email && (
                        <div className="text-[11px] text-[#6B7280] flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <a href={`mailto:${lead.email}`} className="hover:underline">{lead.email}</a>
                        </div>
                      )}
                    </td>

                    {/* Requirement */}
                    <td className="px-5 py-4 max-w-xs">
                      <div className="font-medium text-[#111827] line-clamp-2">
                        {lead.requirement}
                      </div>
                      {lead.aiSummary && (
                        <div className="text-[11px] text-[#6B7280] mt-1 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded text-amber-800 line-clamp-1">
                          {lead.aiSummary}
                        </div>
                      )}
                    </td>

                    {/* Source & Budget */}
                    <td className="px-5 py-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {lead.source}
                      </span>
                      <div className="text-[12px] font-bold text-[#111827] mt-1.5">
                        ₹{(lead.budget || 0).toLocaleString("en-IN")}
                      </div>
                    </td>

                    {/* Stage Dropdown */}
                    <td className="px-5 py-4">
                      <select
                        value={lead.stage}
                        onChange={(e) => handleStageChange(lead.id, e.target.value as Lead["stage"])}
                        className={`text-[12px] font-bold px-2.5 py-1.5 rounded-lg border focus:outline-none cursor-pointer ${
                          lead.stage === "New"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : lead.stage === "Contacted"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : lead.stage === "Converted"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : lead.stage === "Lost"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-purple-50 text-purple-700 border-purple-200"
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

                    {/* Quick Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}?text=Hi%20${encodeURIComponent(lead.name)},%20thank%20you%20for%20inquiring%20about%20LuckNexa%20Hotel%20Operating%20System!`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[12px] font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          WhatsApp
                        </a>
                        <a
                          href={`tel:${lead.phone}`}
                          className="p-1.5 border border-[#D1D5DB] hover:bg-gray-100 rounded-lg text-gray-700 transition-colors"
                          title="Call Lead"
                        >
                          <PhoneCall className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Manual Lead */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-[16px] font-bold text-[#111827] flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-600" />
                Record New Hotel Lead
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="p-6 space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-1">
                  Hotel Owner / General Manager Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Singhania"
                  value={newLead.name}
                  onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-[13px] border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={newLead.phone}
                    onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                    className="w-full px-3.5 py-2 text-[13px] border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="vikram@resort.com"
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                    className="w-full px-3.5 py-2 text-[13px] border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-1">
                  Property Name &amp; Requirement *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Heritage Palace Jaipur (45 rooms) - Needs Front Desk, Banquet & OTA Sync."
                  value={newLead.requirement}
                  onChange={(e) => setNewLead({ ...newLead, requirement: e.target.value })}
                  className="w-full px-3.5 py-2 text-[13px] border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-gray-700 mb-1">
                    Lead Source
                  </label>
                  <select
                    value={newLead.source}
                    onChange={(e) => setNewLead({ ...newLead, source: e.target.value as any })}
                    className="w-full px-3.5 py-2 text-[13px] border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500 bg-white"
                  >
                    <option value="Website">Website Form</option>
                    <option value="AI Phone Call">Inbound Phone Call</option>
                    <option value="Direct Enquiry">Direct Walk-in / Meeting</option>
                    <option value="WhatsApp">WhatsApp Message</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-gray-700 mb-1">
                    Annual Budget / Value (₹)
                  </label>
                  <input
                    type="number"
                    value={newLead.budget}
                    onChange={(e) => setNewLead({ ...newLead, budget: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-[13px] border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-[13px] font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-[13px] font-bold text-white bg-[#0B132B] hover:bg-[#16233B] rounded-lg shadow-sm transition-colors"
                >
                  Save Lead to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
