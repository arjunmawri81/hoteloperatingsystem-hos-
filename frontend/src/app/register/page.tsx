"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { register, apiMode } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    orgName: "",
    orgCode: "",
    adminName: "",
    email: "",
    phone: "",
    password: "",
  });

  const handleOrgNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const code = val.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 10);
    setFormData({
      ...formData,
      orgName: val,
      orgCode: code,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const user = await register(formData);
      setSuccessMsg(`Workspace created for ${user.orgName || formData.orgName}! Redirecting...`);
      setTimeout(() => {
        router.push("/hotel-admin");
      }, 500);
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please check your data.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased text-[#111827]">
      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center">
        <Link href="/" className="inline-block mb-3">
          <div className="text-[20px] font-bold tracking-tight text-[#111827]">
            HOS
          </div>
          <p className="text-[12px] text-[#9CA3AF] tracking-wide">
            Hotel Operating System
          </p>
        </Link>
        <h1 className="text-[24px] font-bold text-[#111827] tracking-tight">
          Register Hotel Organization
        </h1>
        <p className="text-[13px] text-[#6B7280] mt-1">
          Create your multi-property hotel management workspace
        </p>
      </div>

      {/* Form Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white p-8 border border-[#E5E7EB] rounded-md shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          {/* Error Alert */}
          {error && (
            <div className="mb-5 p-3 rounded bg-red-50 border border-red-200 flex items-start gap-2.5 text-[12px] text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Registration Failed</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Success Alert */}
          {successMsg && (
            <div className="mb-5 p-3 rounded bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-[12px] text-emerald-800">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Org Name & Code */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">
                  Organization / Group Name
                </label>
                <input
                  type="text"
                  required
                  disabled={isLoading}
                  value={formData.orgName}
                  onChange={handleOrgNameChange}
                  placeholder="e.g. Meridian Hotels"
                  className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded-sm text-[13px] text-[#111827] focus:outline-none focus:border-[#E63946] disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">
                  Code
                </label>
                <input
                  type="text"
                  required
                  disabled={isLoading}
                  value={formData.orgCode}
                  onChange={(e) =>
                    setFormData({ ...formData, orgCode: e.target.value.toUpperCase() })
                  }
                  placeholder="MERIDIAN"
                  className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded-sm text-[13px] font-mono text-[#111827] uppercase focus:outline-none focus:border-[#E63946] disabled:opacity-60"
                />
              </div>
            </div>

            {/* Admin Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">
                  Admin Name
                </label>
                <input
                  type="text"
                  required
                  disabled={isLoading}
                  value={formData.adminName}
                  onChange={(e) =>
                    setFormData({ ...formData, adminName: e.target.value })
                  }
                  placeholder="e.g. A. Whitfield"
                  className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded-sm text-[13px] text-[#111827] focus:outline-none focus:border-[#E63946] disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">
                  Phone
                </label>
                <input
                  type="tel"
                  required
                  disabled={isLoading}
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+1 555 000 0000"
                  className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded-sm text-[13px] text-[#111827] focus:outline-none focus:border-[#E63946] disabled:opacity-60"
                />
              </div>
            </div>

            {/* Email & Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">
                  Work Email
                </label>
                <input
                  type="email"
                  required
                  disabled={isLoading}
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="admin@company.com"
                  className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded-sm text-[13px] text-[#111827] focus:outline-none focus:border-[#E63946] disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    disabled={isLoading}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="••••••••"
                    className="w-full pl-3 pr-10 py-2 bg-white border border-[#D1D5DB] rounded-sm text-[13px] text-[#111827] focus:outline-none focus:border-[#E63946] disabled:opacity-60"
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
              </div>
            </div>

            {/* Terms checkbox */}
            <div className="flex items-start gap-2 pt-2">
              <input
                type="checkbox"
                required
                className="w-4 h-4 mt-0.5 rounded border-[#D1D5DB] text-[#E63946] focus:ring-[#E63946]"
              />
              <span className="text-[12px] text-[#6B7280]">
                I agree to the HOS SaaS Terms of Service and Master Services Agreement.
              </span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-[#E63946] hover:bg-[#D62839] disabled:bg-[#F87171] text-white text-[13px] font-bold rounded-sm shadow-sm transition-colors cursor-pointer mt-2 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Provisioning Workspace...</span>
                </>
              ) : (
                <span>Create Workspace</span>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-5 border-t border-[#E5E7EB] text-center">
            <p className="text-[13px] text-[#6B7280]">
              Already registered?{" "}
              <Link
                href="/login"
                className="font-semibold text-[#E63946] hover:underline"
              >
                Sign in to portal
              </Link>
            </p>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-5">
          <Link
            href="/"
            className="text-[12px] text-[#6B7280] hover:text-[#111827] transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
