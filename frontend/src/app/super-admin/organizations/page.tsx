"use client";

import { useState, useEffect } from "react";
import { organizationsApi } from "@/lib/api";
import { Organization } from "@/types";
import {
  Plus,
  X,
  Search,
  RefreshCw,
  CheckCircle2,
  Building,
  Users,
  Lock,
  Eye,
  EyeOff,
  Key,
  ShieldCheck,
  FileText,
  Check,
  Ban,
  Clock,
  ExternalLink,
  ZoomIn,
  AlertCircle,
  Phone,
  Mail,
} from "lucide-react";

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending_approval" | "active" | "rejected">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // KYC Inspection Modal State
  const [inspectOrg, setInspectOrg] = useState<Organization | null>(null);
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ title: string; url: string } | null>(null);
  const [approvalRemarks, setApprovalRemarks] = useState("KYC documents verified and approved");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);

  const [newOrg, setNewOrg] = useState<{
    name: string;
    code: string;
    ownerName: string;
    ownerEmail: string;
    ownerPhone: string;
    ownerPassword: string;
    hotelsCount: string | number;
    activeRooms: string | number;
    monthlyRevenue: string | number;
    status: Organization["status"];
  }>({
    name: "",
    code: "",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    ownerPassword: "",
    hotelsCount: "",
    activeRooms: "",
    monthlyRevenue: "",
    status: "active",
  });

  const loadOrgs = async () => {
    setIsLoading(true);
    try {
      const data = await organizationsApi.getAll();
      setOrganizations(data || []);
    } catch (e) {
      console.error("Failed to load organizations:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrgs();
  }, []);

  const notify = (text: string, type: "success" | "error" = "success") => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 5000);
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrg.name || !newOrg.ownerName || !newOrg.ownerEmail) {
      notify("Please enter organization name, owner name, and owner email.", "error");
      return;
    }

    if (!newOrg.ownerPassword.trim() || newOrg.ownerPassword.trim().length < 6) {
      notify("Please set a password (min 6 characters) for this organization owner.", "error");
      return;
    }

    const assignedPassword = newOrg.ownerPassword.trim();
    const assignedEmail = newOrg.ownerEmail.toLowerCase().trim();

    try {
      const created = await organizationsApi.create({
        name: newOrg.name.trim(),
        code: newOrg.code.trim() || newOrg.name.toUpperCase().slice(0, 4),
        ownerName: newOrg.ownerName.trim(),
        ownerEmail: assignedEmail,
        ownerPhone: newOrg.ownerPhone.trim(),
        ownerPassword: assignedPassword,
        hotelsCount: Number(newOrg.hotelsCount) || 1,
        activeRooms: Number(newOrg.activeRooms) || 0,
        monthlyRevenue: Number(newOrg.monthlyRevenue) || 0,
        status: newOrg.status,
      });

      setOrganizations((prev) => [created, ...prev.filter((o) => o.id !== created.id)]);
      setIsModalOpen(false);
      notify(`✅ Organization "${created.name}" created! Owner Login: ${assignedEmail}`);

      setNewOrg({
        name: "",
        code: "",
        ownerName: "",
        ownerEmail: "",
        ownerPhone: "",
        ownerPassword: "",
        hotelsCount: "",
        activeRooms: "",
        monthlyRevenue: "",
        status: "active",
      });
    } catch (err: any) {
      console.error("Failed to create organization:", err);
      notify(err?.message || "Failed to create organization", "error");
    }
  };

  // Open KYC Inspection Modal
  const handleOpenInspect = (org: Organization) => {
    setInspectOrg(org);
    setApprovalRemarks("KYC documents verified and approved");
    setRejectionReason(org.kycDocuments?.rejectionReason || "");
    setIsInspectModalOpen(true);
  };

  // Approve Organization
  const handleApproveOrg = async () => {
    if (!inspectOrg) return;
    setIsProcessingApproval(true);
    try {
      const res = await organizationsApi.approve(inspectOrg.id, approvalRemarks);
      const updated = res?.data || res;
      setOrganizations((prev) =>
        prev.map((o) => (o.id === inspectOrg.id ? { ...o, status: "active", ...updated } : o))
      );
      notify(`✅ Organization "${inspectOrg.name}" has been APPROVED and activated!`);
      setIsInspectModalOpen(false);
      loadOrgs();
    } catch (err: any) {
      notify(err?.message || "Failed to approve organization", "error");
    } finally {
      setIsProcessingApproval(false);
    }
  };

  // Reject Organization
  const handleRejectOrg = async () => {
    if (!inspectOrg) return;
    if (!rejectionReason.trim()) {
      notify("Please provide a reason for rejecting this organization.", "error");
      return;
    }
    setIsProcessingApproval(true);
    try {
      const res = await organizationsApi.reject(inspectOrg.id, rejectionReason.trim());
      const updated = res?.data || res;
      setOrganizations((prev) =>
        prev.map((o) => (o.id === inspectOrg.id ? { ...o, status: "rejected", ...updated } : o))
      );
      notify(`❌ Organization "${inspectOrg.name}" has been rejected.`);
      setIsInspectModalOpen(false);
      loadOrgs();
    } catch (err: any) {
      notify(err?.message || "Failed to reject organization", "error");
    } finally {
      setIsProcessingApproval(false);
    }
  };

  // Filter calculations
  const pendingCount = organizations.filter((o) => o.status === "pending_approval").length;
  const activeCount = organizations.filter((o) => o.status === "active").length;
  const rejectedCount = organizations.filter((o) => o.status === "rejected").length;

  const filtered = organizations.filter((o) => {
    const matchesStatus =
      statusFilter === "all" ? true : o.status === statusFilter;
    const matchesSearch =
      o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.ownerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.ownerEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.kycDocuments?.gstin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.kycDocuments?.panNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Section with Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#0F172A] tracking-[-0.02em]">
            Organizations &amp; KYC Approvals
          </h1>
          <p className="text-[13px] text-[#64748B] mt-1 font-normal">
            Review business registration documents, approve hotel chains, and manage workspace tenant access ({organizations.length})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadOrgs}
            title="Refresh"
            className="p-2 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] rounded text-[#4B5563] cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#EC3013]" : ""}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white text-[13px] font-bold rounded shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Organization</span>
          </button>
        </div>
      </div>

      {/* 4 Key Stat Cards (Matching Sidebar Deep Navy Theme) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Organizations */}
        <div
          onClick={() => setStatusFilter("all")}
          className="relative overflow-hidden bg-[#0B132B] hover:bg-[#0F1A3A] p-5 rounded-xl border border-slate-800/90 shadow-xl hover:border-cyan-500/50 hover:shadow-cyan-950/40 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
        >
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-cyan-500/50 via-cyan-500/20 to-transparent" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg border bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-inner">
                <Building className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400">
                Total Organizations
              </span>
            </div>
          </div>
          <div className="text-[28px] font-black text-white mt-3 tracking-tight drop-shadow-xs">
            {organizations.length}
          </div>
          <div className="text-[12px] text-slate-400 mt-1 font-medium">
            Registered on platform
          </div>
        </div>

        {/* Pending KYC */}
        <div
          onClick={() => setStatusFilter("pending_approval")}
          className="relative overflow-hidden bg-[#0B132B] hover:bg-[#0F1A3A] p-5 rounded-xl border border-slate-800/90 shadow-xl hover:border-amber-500/50 hover:shadow-amber-950/40 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
        >
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-500/60 via-amber-500/20 to-transparent" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg border bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-inner">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                Pending KYC
              </span>
            </div>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 bg-amber-500 text-black text-[10px] font-black rounded-full animate-pulse">
                Action Required
              </span>
            )}
          </div>
          <div className="text-[28px] font-black text-amber-300 mt-3 tracking-tight drop-shadow-xs">
            {pendingCount}
          </div>
          <div className="text-[12px] text-amber-400/80 mt-1 font-semibold">
            Awaiting Super Admin approval
          </div>
        </div>

        {/* Active Chains */}
        <div
          onClick={() => setStatusFilter("active")}
          className="relative overflow-hidden bg-[#0B132B] hover:bg-[#0F1A3A] p-5 rounded-xl border border-slate-800/90 shadow-xl hover:border-emerald-500/50 hover:shadow-emerald-950/40 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
        >
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500/60 via-emerald-500/20 to-transparent" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-inner">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
                Active Chains
              </span>
            </div>
          </div>
          <div className="text-[28px] font-black text-emerald-300 mt-3 tracking-tight drop-shadow-xs">
            {activeCount}
          </div>
          <div className="text-[12px] text-emerald-400/80 mt-1 font-semibold">
            Verified &amp; live workspaces
          </div>
        </div>

        {/* Rejected / Other */}
        <div
          onClick={() => setStatusFilter("rejected")}
          className="relative overflow-hidden bg-[#0B132B] hover:bg-[#0F1A3A] p-5 rounded-xl border border-slate-800/90 shadow-xl hover:border-rose-500/50 hover:shadow-rose-950/40 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
        >
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-rose-500/60 via-rose-500/20 to-transparent" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg border bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-inner">
                <Ban className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider text-rose-400">
                Rejected / Blocked
              </span>
            </div>
          </div>
          <div className="text-[28px] font-black text-rose-300 mt-3 tracking-tight drop-shadow-xs">
            {rejectedCount}
          </div>
          <div className="text-[12px] text-rose-400/80 mt-1 font-semibold">
            Failed KYC verification
          </div>
        </div>
      </div>

      {/* Toast Notice */}
      {toastMsg && (
        <div
          className={`text-[13px] px-4 py-2.5 rounded-lg flex items-center gap-2 animate-in fade-in duration-200 border ${
            toastMsg.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-800"
              : "bg-red-50 border-red-300 text-red-800"
          }`}
        >
          {toastMsg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            statusFilter === "all"
              ? "bg-[#111827] text-white shadow-xs"
              : "bg-white text-gray-600 border hover:bg-gray-50"
          }`}
        >
          <span>All Organizations</span>
          <span className="text-[11px] px-1.5 py-0.2 bg-white/20 rounded font-mono font-normal">
            {organizations.length}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter("pending_approval")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            statusFilter === "pending_approval"
              ? "bg-amber-600 text-white shadow-xs"
              : "bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending KYC Approvals</span>
          {pendingCount > 0 && (
            <span className="text-[11px] px-1.5 py-0.2 bg-amber-800 text-white rounded font-mono font-bold animate-pulse">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setStatusFilter("active")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            statusFilter === "active"
              ? "bg-emerald-700 text-white shadow-xs"
              : "bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Active</span>
          <span className="text-[11px] px-1.5 py-0.2 bg-emerald-800/20 text-emerald-800 rounded font-mono">
            {activeCount}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter("rejected")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            statusFilter === "rejected"
              ? "bg-red-700 text-white shadow-xs"
              : "bg-red-50 text-red-900 border border-red-200 hover:bg-red-100"
          }`}
        >
          <Ban className="w-3.5 h-3.5" />
          <span>Rejected</span>
          <span className="text-[11px] px-1.5 py-0.2 bg-red-800/20 text-red-800 rounded font-mono">
            {rejectedCount}
          </span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-lg border border-[#E5E7EB] flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search name, code, GSTIN, PAN, owner email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#F9FAFB] border border-[#D1D5DB] rounded text-[13px] text-[#111827] focus:outline-none focus:border-[#EC3013]"
          />
        </div>
        <span className="text-[12px] text-[#6B7280]">
          Showing {filtered.length} of {organizations.length}
        </span>
      </div>

      {/* Organizations Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider bg-[#F9FAFB]">
                <th className="py-3 px-4 font-bold">ORGANIZATION</th>
                <th className="py-3 px-4 font-bold">OWNER &amp; CONTACT</th>
                <th className="py-3 px-4 font-bold">KYC DOCUMENTS</th>
                <th className="py-3 px-4 font-bold">HOTELS / ROOMS</th>
                <th className="py-3 px-4 font-bold">STATUS</th>
                <th className="py-3 px-4 text-right font-bold">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#9CA3AF]">
                    No organizations matching filter
                  </td>
                </tr>
              ) : (
                filtered.map((org) => {
                  const isPending = org.status === "pending_approval";
                  const isRejected = org.status === "rejected";
                  const docsCount = [
                    org.kycDocuments?.gstCertificateUrl,
                    org.kycDocuments?.panCardUrl,
                    org.kycDocuments?.businessProofUrl,
                    org.kycDocuments?.ownerIdUrl,
                  ].filter(Boolean).length;

                  return (
                    <tr
                      key={org.id}
                      className={`transition-colors ${
                        isPending ? "bg-amber-50/40 hover:bg-amber-50/70" : "hover:bg-[#F9FAFB]"
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#111827] flex items-center gap-1.5">
                          <span>{org.name}</span>
                          {isPending && (
                            <span className="text-[9px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.2 rounded">
                              Needs Review
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-[#6B7280]">
                          Code: <strong className="text-gray-900">{org.code || "ORG"}</strong> · ID: {org.id}
                        </div>
                        {org.kycDocuments?.gstin && (
                          <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                            GSTIN: {org.kycDocuments.gstin}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#374151]">{org.ownerName}</div>
                        <div className="text-[11px] text-[#6B7280]">{org.ownerEmail}</div>
                        {org.ownerPhone && (
                          <div className="text-[10px] text-gray-400 font-mono">{org.ownerPhone}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {docsCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            <FileText className="w-3 h-3 text-emerald-600" />
                            <span>{docsCount} Docs Attached</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400 italic">No KYC Docs</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#111827]">
                          {org.hotelsCount} {org.hotelsCount === 1 ? "Hotel" : "Hotels"}
                        </div>
                        <div className="text-[11px] text-[#6B7280]">{org.activeRooms} Rooms</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                            org.status === "active"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : org.status === "pending_approval"
                              ? "bg-amber-100 text-amber-900 border border-amber-300 font-bold"
                              : org.status === "trial"
                              ? "bg-blue-50 text-blue-800 border border-blue-200"
                              : "bg-rose-50 text-rose-800 border border-rose-200"
                          }`}
                        >
                          {org.status === "pending_approval" ? "Pending Approval" : org.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenInspect(org)}
                            className={`px-3 py-1 text-xs font-bold rounded shadow-xs transition flex items-center gap-1 cursor-pointer ${
                              isPending
                                ? "bg-amber-600 hover:bg-amber-700 text-white"
                                : "bg-white border border-gray-300 hover:bg-gray-50 text-gray-700"
                            }`}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>{isPending ? "Review KYC & Approve" : "Inspect KYC"}</span>
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

      {/* ----------------- MODAL: KYC INSPECTION & SUPER ADMIN APPROVAL ----------------- */}
      {isInspectModalOpen && inspectOrg && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4">
            <button
              onClick={() => setIsInspectModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 pb-3 border-b border-gray-200">
              <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Verify KYC &amp; Organization Compliance
                </h3>
                <p className="text-xs text-gray-500">
                  Inspect uploaded legal certificates for <strong className="text-gray-900">{inspectOrg.name}</strong>
                </p>
              </div>
            </div>

            {/* Overview Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs">
              <div>
                <span className="text-[10px] text-gray-500 block uppercase font-bold">Org Code</span>
                <span className="font-mono font-bold text-gray-900">{inspectOrg.code || "ORG"}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 block uppercase font-bold">Owner / Admin</span>
                <span className="font-semibold text-gray-900">{inspectOrg.ownerName}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 block uppercase font-bold">Email ID</span>
                <span className="font-mono text-gray-700 truncate block">{inspectOrg.ownerEmail}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 block uppercase font-bold">Current Status</span>
                <span className="font-bold capitalize text-amber-800">{inspectOrg.status}</span>
              </div>
            </div>

            {/* Legal Identification Numbers */}
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Legal &amp; Business Registration Identifiers
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-2.5 bg-white border border-gray-200 rounded-lg">
                  <span className="text-[10px] text-gray-400 block font-semibold">GSTIN NUMBER</span>
                  <span className="font-mono font-bold text-gray-900">
                    {inspectOrg.kycDocuments?.gstin || "Not provided"}
                  </span>
                </div>
                <div className="p-2.5 bg-white border border-gray-200 rounded-lg">
                  <span className="text-[10px] text-gray-400 block font-semibold">COMPANY PAN</span>
                  <span className="font-mono font-bold text-gray-900">
                    {inspectOrg.kycDocuments?.panNumber || "Not provided"}
                  </span>
                </div>
                <div className="p-2.5 bg-white border border-gray-200 rounded-lg">
                  <span className="text-[10px] text-gray-400 block font-semibold">FSSAI / LICENSE</span>
                  <span className="font-mono font-bold text-gray-900">
                    {inspectOrg.kycDocuments?.fssaiNumber || inspectOrg.kycDocuments?.tradeLicenseNumber || "Not provided"}
                  </span>
                </div>
              </div>
            </div>

            {/* Uploaded Document Proofs Gallery */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Uploaded Document Proofs (Click to Enlarge / Inspect)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* 1. GST Certificate */}
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50 flex flex-col justify-between">
                  <div className="p-2 border-b bg-white text-[11px] font-bold text-gray-800 flex items-center justify-between">
                    <span>GST Certificate</span>
                    {inspectOrg.kycDocuments?.gstCertificateUrl && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                  </div>
                  <div className="h-28 w-full flex items-center justify-center p-2 relative group">
                    {inspectOrg.kycDocuments?.gstCertificateUrl ? (
                      <>
                        <img
                          src={inspectOrg.kycDocuments.gstCertificateUrl}
                          alt="GST Certificate"
                          className="w-full h-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewImage({
                              title: "GST Certificate",
                              url: inspectOrg.kycDocuments!.gstCertificateUrl!,
                            })
                          }
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1 cursor-pointer"
                        >
                          <ZoomIn className="w-4 h-4" /> View
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] text-gray-400 italic">Not Uploaded</span>
                    )}
                  </div>
                </div>

                {/* 2. PAN Card */}
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50 flex flex-col justify-between">
                  <div className="p-2 border-b bg-white text-[11px] font-bold text-gray-800 flex items-center justify-between">
                    <span>PAN Card</span>
                    {inspectOrg.kycDocuments?.panCardUrl && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                  </div>
                  <div className="h-28 w-full flex items-center justify-center p-2 relative group">
                    {inspectOrg.kycDocuments?.panCardUrl ? (
                      <>
                        <img
                          src={inspectOrg.kycDocuments.panCardUrl}
                          alt="PAN Card"
                          className="w-full h-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewImage({
                              title: "PAN Card",
                              url: inspectOrg.kycDocuments!.panCardUrl!,
                            })
                          }
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1 cursor-pointer"
                        >
                          <ZoomIn className="w-4 h-4" /> View
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] text-gray-400 italic">Not Uploaded</span>
                    )}
                  </div>
                </div>

                {/* 3. Trade License */}
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50 flex flex-col justify-between">
                  <div className="p-2 border-b bg-white text-[11px] font-bold text-gray-800 flex items-center justify-between">
                    <span>License Copy</span>
                    {inspectOrg.kycDocuments?.businessProofUrl && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                  </div>
                  <div className="h-28 w-full flex items-center justify-center p-2 relative group">
                    {inspectOrg.kycDocuments?.businessProofUrl ? (
                      <>
                        <img
                          src={inspectOrg.kycDocuments.businessProofUrl}
                          alt="License Proof"
                          className="w-full h-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewImage({
                              title: "Trade / Business License",
                              url: inspectOrg.kycDocuments!.businessProofUrl!,
                            })
                          }
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1 cursor-pointer"
                        >
                          <ZoomIn className="w-4 h-4" /> View
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] text-gray-400 italic">Not Uploaded</span>
                    )}
                  </div>
                </div>

                {/* 4. Owner ID */}
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50 flex flex-col justify-between">
                  <div className="p-2 border-b bg-white text-[11px] font-bold text-gray-800 flex items-center justify-between">
                    <span>Owner ID Proof</span>
                    {inspectOrg.kycDocuments?.ownerIdUrl && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                  </div>
                  <div className="h-28 w-full flex items-center justify-center p-2 relative group">
                    {inspectOrg.kycDocuments?.ownerIdUrl ? (
                      <>
                        <img
                          src={inspectOrg.kycDocuments.ownerIdUrl}
                          alt="Owner ID Proof"
                          className="w-full h-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewImage({
                              title: "Owner Government ID",
                              url: inspectOrg.kycDocuments!.ownerIdUrl!,
                            })
                          }
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1 cursor-pointer"
                        >
                          <ZoomIn className="w-4 h-4" /> View
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] text-gray-400 italic">Not Uploaded</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Approval / Rejection Action Box */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Rejection Reason / Verification Remarks
                </label>
                <input
                  type="text"
                  placeholder="e.g. GST Certificate verified successfully OR Rejection reason if denying access..."
                  value={rejectionReason || approvalRemarks}
                  onChange={(e) => {
                    setApprovalRemarks(e.target.value);
                    setRejectionReason(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-xs text-gray-900 outline-none focus:border-[#EC3013]"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  disabled={isProcessingApproval}
                  onClick={handleRejectOrg}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Reject Organization</span>
                </button>

                <button
                  type="button"
                  disabled={isProcessingApproval}
                  onClick={handleApproveOrg}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve &amp; Activate Organization</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- FULL SCREEN IMAGE PREVIEW MODAL ----------------- */}
      {previewImage && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-4 shadow-2xl relative space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <h4 className="font-bold text-sm text-gray-900">{previewImage.title}</h4>
              <button
                onClick={() => setPreviewImage(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto flex items-center justify-center bg-gray-100 rounded-xl p-2">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Create Organization Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <h3 className="text-[16px] font-bold text-[#111827]">Create Organization</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#9CA3AF] hover:text-[#111827] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrg} className="space-y-4 text-[13px]">
              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                  Organization / Chain Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grand Horizon Resorts"
                  value={newOrg.name}
                  onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded focus:outline-none focus:border-[#EC3013]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Org Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. GHR"
                    value={newOrg.code}
                    onChange={(e) => setNewOrg({ ...newOrg, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Initial Properties
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 1"
                    value={newOrg.hotelsCount}
                    onChange={(e) => setNewOrg({ ...newOrg, hotelsCount: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Owner Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. David Mercer"
                    value={newOrg.ownerName}
                    onChange={(e) => setNewOrg({ ...newOrg, ownerName: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded focus:outline-none focus:border-[#EC3013]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Owner Email (Login ID) *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="owner@hotel.com"
                    value={newOrg.ownerEmail}
                    onChange={(e) => setNewOrg({ ...newOrg, ownerEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded focus:outline-none focus:border-[#EC3013]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                  Owner Login Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="Enter new password for owner account (min 6 chars)..."
                    value={newOrg.ownerPassword}
                    onChange={(e) => setNewOrg({ ...newOrg, ownerPassword: e.target.value })}
                    className="w-full pl-3 pr-10 py-2 border border-[#D1D5DB] rounded focus:outline-none focus:border-[#EC3013] text-[13px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#9CA3AF] hover:text-[#4B5563]"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-[#6B7280] mt-1">
                  The Super Admin must set a new password for this hotel organization owner to log in.
                </p>
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
                  Save Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
