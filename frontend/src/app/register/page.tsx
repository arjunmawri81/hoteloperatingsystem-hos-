"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Building,
  Upload,
  FileText,
  ShieldCheck,
  Check,
  Clock,
  ArrowRight,
  ArrowLeft,
  X,
  FileCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Step 1: Organization Details
  const [formData, setFormData] = useState({
    orgName: "",
    orgCode: "",
    adminName: "",
    email: "",
    phone: "",
    password: "",
  });

  // Step 2: Legal KYC Documents
  const [kycData, setKycData] = useState<{
    gstin: string;
    panNumber: string;
    fssaiNumber: string;
    tradeLicenseNumber: string;
    gstCertificateUrl: string;
    panCardUrl: string;
    businessProofUrl: string;
    ownerIdUrl: string;
  }>({
    gstin: "",
    panNumber: "",
    fssaiNumber: "",
    tradeLicenseNumber: "",
    gstCertificateUrl: "",
    panCardUrl: "",
    businessProofUrl: "",
    ownerIdUrl: "",
  });

  const handleOrgNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const code = val.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8);
    setFormData((prev) => ({
      ...prev,
      orgName: val,
      orgCode: code,
    }));
  };

  // Helper for image/document compression
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldKey: "gstCertificateUrl" | "panCardUrl" | "businessProofUrl" | "ownerIdUrl"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 900;
        const MAX_HEIGHT = 700;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
          setKycData((prev) => ({ ...prev, [fieldKey]: compressedDataUrl }));
        }
      };
      if (typeof event.target?.result === "string") {
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.orgName.trim() || !formData.adminName.trim() || !formData.email.trim() || !formData.password.trim()) {
      setError("Please fill in all required organization and admin fields.");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const payload = {
        orgName: formData.orgName.trim(),
        orgCode: formData.orgCode.trim(),
        adminName: formData.adminName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        kycDocuments: kycData,
      };

      await register(payload);
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err?.message || "Failed to submit organization registration. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8 font-sans antialiased text-[#111827]">
      {/* Top Bar */}
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between pb-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm border border-slate-700/30 bg-[#090D16] flex items-center justify-center p-0.5 group-hover:scale-105 transition-transform">
            <img
              src="/lucknexa-icon.png"
              alt="LuckNexa"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="text-[15px] font-black tracking-tight text-[#111827] leading-none">
              Luck<span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Nexa</span>
            </div>
            <p className="text-[10px] text-[#6B7280] font-medium leading-none mt-1">
              Enterprise Organization Workspace
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="text-[12px] font-semibold text-[#4B5563] hover:text-[#111827] px-3 py-1.5 rounded-sm hover:bg-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="text-[12px] font-bold text-[#111827] bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] px-3 py-1.5 rounded-sm transition-colors shadow-2xs"
          >
            Create User Account
          </Link>
        </div>
      </div>

      {/* Main Container */}
      <div className="sm:mx-auto sm:w-full sm:max-w-[620px] my-auto">
        {/* Header Title */}
        <div className="text-center mb-6">
          <h1 className="text-[24px] font-bold text-[#111827] tracking-tight">
            Register Hotel Organization
          </h1>
          <p className="text-[13px] text-[#6B7280] mt-1">
            Provision a multi-property hospitality workspace with verified business KYC
          </p>
        </div>

        {/* Step Indicator */}
        {!isSubmitted && (
          <div className="flex items-center justify-center gap-3 mb-5">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                step === 1
                  ? "bg-[#111827] text-white shadow-xs"
                  : "bg-white border border-gray-300 text-gray-700"
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                1
              </span>
              <span>Organization &amp; Admin</span>
            </div>

            <span className="text-gray-300 font-bold">→</span>

            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                step === 2
                  ? "bg-[#111827] text-white shadow-xs"
                  : "bg-white border border-gray-300 text-gray-700"
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                2
              </span>
              <span>Legal KYC &amp; Documents</span>
            </div>
          </div>
        )}

        <div className="bg-white p-6 sm:p-8 border border-[#E5E7EB] rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          {/* Error Alert */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-[12px] text-red-700 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Notice</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {isSubmitted ? (
            /* SUBMISSION SUCCESS & PENDING REVIEW VIEW */
            <div className="text-center py-4 space-y-5 animate-in fade-in">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-amber-50/50">
                <Clock className="w-8 h-8" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                  Under Super Admin Review
                </span>
                <h2 className="text-xl font-black text-gray-900 mt-3">
                  Registration Submitted Successfully!
                </h2>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed max-w-md mx-auto">
                  Your hotel organization <strong className="text-gray-900">{formData.orgName}</strong> and uploaded KYC verification documents have been routed to the <strong>Super Admin Approvals Desk</strong>.
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-left text-xs space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-gray-500">Organization Code:</span>
                  <span className="font-mono font-bold text-gray-900">{formData.orgCode}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-gray-500">Primary Administrator:</span>
                  <span className="font-semibold text-gray-900">{formData.adminName}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-gray-500">Registered Email:</span>
                  <span className="font-mono text-gray-900">{formData.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">KYC Documents Uploaded:</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {[kycData.gstCertificateUrl, kycData.panCardUrl, kycData.businessProofUrl, kycData.ownerIdUrl].filter(Boolean).length} documents attached
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-gray-500">
                You will be notified once Super Admin verifies your business identity. You can now return to the login page.
              </p>

              <div className="pt-2">
                <Link
                  href="/login"
                  className="w-full py-3 bg-[#EC3013] hover:bg-[#D62839] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2"
                >
                  <span>Go to Login Screen</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : step === 1 ? (
            /* STEP 1: ORGANIZATION & ADMIN FORM */
            <form onSubmit={handleNextStep} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">
                    Organization / Group Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Heritage Hotels &amp; Resorts"
                    value={formData.orgName}
                    onChange={handleOrgNameChange}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg bg-white text-[#111827] focus:ring-2 focus:ring-red-500/20 focus:border-[#EC3013] outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">
                    Org Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="ROYALH"
                    value={formData.orgCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        orgCode: e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase(),
                      })
                    }
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg bg-white text-[#111827] font-mono font-bold uppercase focus:ring-2 focus:ring-red-500/20 focus:border-[#EC3013] outline-none"
                  />
                </div>
              </div>

              {/* Admin Full Name */}
              <div>
                <label className="block text-[11px] font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">
                  Owner / General Manager Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Malhotra"
                  value={formData.adminName}
                  onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg bg-white text-[#111827] focus:ring-2 focus:ring-red-500/20 focus:border-[#EC3013] outline-none font-medium"
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">
                    Work Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="admin@royalheritage.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg bg-white text-[#111827] focus:ring-2 focus:ring-red-500/20 focus:border-[#EC3013] outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg bg-white text-[#111827] focus:ring-2 focus:ring-red-500/20 focus:border-[#EC3013] outline-none font-medium"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">
                  Set Master Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="••••••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-3 pr-10 py-2 border border-[#D1D5DB] rounded-lg bg-white text-[#111827] focus:ring-2 focus:ring-red-500/20 focus:border-[#EC3013] outline-none font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-[#6B7280] mt-1">
                  Must be at least 6 characters. Used for owner access and hotel provisioning.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#111827] hover:bg-black text-white text-[13px] font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continue to KYC &amp; Documents</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            /* STEP 2: LEGAL KYC & DOCUMENT UPLOADS */
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl flex items-start gap-2.5 text-blue-900 text-xs">
                <FileText className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  Please provide legal business numbers and attach certificate copies. These documents will be verified by the Super Admin before workspace activation.
                </p>
              </div>

              {/* 1. GST Registration */}
              <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/90 space-y-2.5">
                <div className="flex justify-between items-center">
                  <label className="block text-[11px] font-bold text-gray-800 uppercase tracking-wider">
                    1. GSTIN Registration Number
                  </label>
                  {kycData.gstCertificateUrl && (
                    <button
                      type="button"
                      onClick={() => setKycData((prev) => ({ ...prev, gstCertificateUrl: "" }))}
                      className="text-[10px] text-red-600 font-semibold hover:underline"
                    >
                      Remove Doc
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    placeholder="e.g. 07AAACH7409R1ZZ"
                    value={kycData.gstin}
                    onChange={(e) => setKycData({ ...kycData, gstin: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-1.5 border border-[#D1D5DB] rounded-lg bg-white font-mono uppercase text-[#111827] font-semibold outline-none focus:border-[#EC3013]"
                  />

                  <div className="flex items-center gap-2">
                    <label className="flex-1 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition">
                      <Upload className="w-3.5 h-3.5 text-[#EC3013]" />
                      <span className="truncate">
                        {kycData.gstCertificateUrl ? "Change GST Certificate" : "Upload GST Certificate"}
                      </span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpload(e, "gstCertificateUrl")}
                        className="hidden"
                      />
                    </label>
                    {kycData.gstCertificateUrl && (
                      <div className="w-8 h-8 rounded border border-emerald-300 bg-emerald-50 shrink-0 overflow-hidden flex items-center justify-center">
                        <img
                          src={kycData.gstCertificateUrl}
                          alt="GST Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Company PAN */}
              <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/90 space-y-2.5">
                <div className="flex justify-between items-center">
                  <label className="block text-[11px] font-bold text-gray-800 uppercase tracking-wider">
                    2. Company / Business PAN Card
                  </label>
                  {kycData.panCardUrl && (
                    <button
                      type="button"
                      onClick={() => setKycData((prev) => ({ ...prev, panCardUrl: "" }))}
                      className="text-[10px] text-red-600 font-semibold hover:underline"
                    >
                      Remove Doc
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="e.g. AAACH7409R"
                    value={kycData.panNumber}
                    onChange={(e) => setKycData({ ...kycData, panNumber: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-1.5 border border-[#D1D5DB] rounded-lg bg-white font-mono uppercase text-[#111827] font-semibold outline-none focus:border-[#EC3013]"
                  />

                  <div className="flex items-center gap-2">
                    <label className="flex-1 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition">
                      <Upload className="w-3.5 h-3.5 text-[#EC3013]" />
                      <span className="truncate">
                        {kycData.panCardUrl ? "Change PAN Card" : "Upload PAN Card"}
                      </span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpload(e, "panCardUrl")}
                        className="hidden"
                      />
                    </label>
                    {kycData.panCardUrl && (
                      <div className="w-8 h-8 rounded border border-emerald-300 bg-emerald-50 shrink-0 overflow-hidden flex items-center justify-center">
                        <img
                          src={kycData.panCardUrl}
                          alt="PAN Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Trade License / FSSAI */}
              <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/90 space-y-2.5">
                <div className="flex justify-between items-center">
                  <label className="block text-[11px] font-bold text-gray-800 uppercase tracking-wider">
                    3. Trade / Municipal / FSSAI License
                  </label>
                  {kycData.businessProofUrl && (
                    <button
                      type="button"
                      onClick={() => setKycData((prev) => ({ ...prev, businessProofUrl: "" }))}
                      className="text-[10px] text-red-600 font-semibold hover:underline"
                    >
                      Remove Doc
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    placeholder="License / Reg Number"
                    value={kycData.fssaiNumber || kycData.tradeLicenseNumber}
                    onChange={(e) =>
                      setKycData({
                        ...kycData,
                        fssaiNumber: e.target.value,
                        tradeLicenseNumber: e.target.value,
                      })
                    }
                    className="w-full px-3 py-1.5 border border-[#D1D5DB] rounded-lg bg-white text-[#111827] outline-none focus:border-[#EC3013]"
                  />

                  <div className="flex items-center gap-2">
                    <label className="flex-1 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition">
                      <Upload className="w-3.5 h-3.5 text-[#EC3013]" />
                      <span className="truncate">
                        {kycData.businessProofUrl ? "Change License Copy" : "Upload License Copy"}
                      </span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpload(e, "businessProofUrl")}
                        className="hidden"
                      />
                    </label>
                    {kycData.businessProofUrl && (
                      <div className="w-8 h-8 rounded border border-emerald-300 bg-emerald-50 shrink-0 overflow-hidden flex items-center justify-center">
                        <img
                          src={kycData.businessProofUrl}
                          alt="License Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 4. Owner Govt ID */}
              <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/90 space-y-2.5">
                <div className="flex justify-between items-center">
                  <label className="block text-[11px] font-bold text-gray-800 uppercase tracking-wider">
                    4. Owner / Signatory ID Proof (Aadhaar / Passport)
                  </label>
                  {kycData.ownerIdUrl && (
                    <button
                      type="button"
                      onClick={() => setKycData((prev) => ({ ...prev, ownerIdUrl: "" }))}
                      className="text-[10px] text-red-600 font-semibold hover:underline"
                    >
                      Remove Doc
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex-1 px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition">
                    <Upload className="w-3.5 h-3.5 text-[#EC3013]" />
                    <span>{kycData.ownerIdUrl ? "Change Owner ID Copy" : "Upload Owner ID Copy (Photo)"}</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload(e, "ownerIdUrl")}
                      className="hidden"
                    />
                  </label>
                  {kycData.ownerIdUrl && (
                    <div className="w-9 h-9 rounded border border-emerald-300 bg-emerald-50 shrink-0 overflow-hidden flex items-center justify-center">
                      <img
                        src={kycData.ownerIdUrl}
                        alt="Owner ID Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Form Navigation Buttons */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2.5 bg-[#EC3013] hover:bg-[#D62839] text-white font-bold rounded-xl shadow-xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Registration...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Submit for Super Admin Review</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-6xl mx-auto w-full text-center text-[11px] text-[#9CA3AF] pt-6">
        LuckNexa Hospitality OS · Multi-Tenant Enterprise Hotel Management Platform
      </div>
    </div>
  );
}
