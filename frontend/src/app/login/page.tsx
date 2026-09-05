"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Building2,
  HelpCircle,
  UserPlus,
} from "lucide-react";
import { useAuth, ROLE_ROUTE_MAP } from "@/context/AuthContext";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isVerifiedNotice, setIsVerifiedNotice] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  useEffect(() => {
    if (searchParams?.get("verified") === "true") {
      setIsVerifiedNotice(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setError("Please enter your work email address.");
      return;
    }
    if (!password) {
      setError("Please enter your account password.");
      return;
    }

    setIsLoading(true);

    try {
      const user = await login({
        email: email.trim(),
        password: password,
      });

      setSuccessMsg(`Welcome back, ${user.name}!`);
      const targetPath = ROLE_ROUTE_MAP[user.role] || "/hotel-admin";

      setTimeout(() => {
        router.push(targetPath);
      }, 350);
    } catch (err: any) {
      setError(
        err?.message ||
          "Authentication failed. Please verify your email and password."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8 font-sans antialiased text-[#111827]">
      {/* Top Bar */}
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between pb-6">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-[#EC3013] text-white flex items-center justify-center font-black text-xs rounded tracking-tighter shadow-sm group-hover:bg-[#D62839] transition-colors">
            HOS
          </div>
          <div>
            <div className="text-[14px] font-bold tracking-tight text-[#111827] leading-none">
              Hotel Operating System
            </div>
            <p className="text-[11px] text-[#9CA3AF] leading-none mt-0.5">
              Enterprise Hospitality Platform
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/customer"
            className="hidden sm:inline-flex text-[12px] font-semibold text-[#4B5563] hover:text-[#111827] px-3 py-1.5 rounded-sm hover:bg-white transition-colors"
          >
            Guest Portal
          </Link>
          <Link
            href="/signup"
            className="text-[12px] font-bold text-[#111827] bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] px-3 py-1.5 rounded-sm transition-colors shadow-2xs"
          >
            Create Account
          </Link>
          <Link
            href="/register"
            className="text-[12px] font-bold text-white bg-[#EC3013] hover:bg-[#D62839] px-3.5 py-1.5 rounded-sm transition-colors shadow-xs"
          >
            Register Org
          </Link>
        </div>
      </div>

      {/* Main Login Card Container */}
      <div className="sm:mx-auto sm:w-full sm:max-w-[440px] my-auto">
        <div className="bg-white p-8 sm:p-9 border border-[#E5E7EB] rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-[22px] font-bold text-[#111827] tracking-tight">
              Sign In to Your Workspace
            </h1>
            <p className="text-[13px] text-[#6B7280] mt-1">
              Enter your credentials to access your management panel
            </p>
          </div>

          {/* Firebase Email Verification Success Alert */}
          {isVerifiedNotice && (
            <div className="mb-5 p-3.5 rounded-md bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-[12px] text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Email Verified Successfully!</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Your organization account is active. Please sign in below.
                </p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 rounded-md bg-red-50 border border-red-200 flex items-start gap-2.5 text-[12px] text-red-700 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#EC3013]" />
              <div className="flex-1">
                <p className="font-semibold">Sign In Failed</p>
                <p className="text-[11px] mt-0.5 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="mb-5 p-3.5 rounded-md bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-[12px] text-emerald-800">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-semibold">{successMsg} Redirecting...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Address */}
            <div>
              <label className="block text-[11px] font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9CA3AF]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  placeholder="admin@meridianhotels.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#D1D5DB] rounded-md text-[13px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#EC3013] focus:ring-1 focus:ring-[#EC3013] transition-all disabled:opacity-60"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold text-[#374151] uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] font-semibold text-[#EC3013] hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9CA3AF]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-white border border-[#D1D5DB] rounded-md text-[13px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#EC3013] focus:ring-1 focus:ring-[#EC3013] transition-all disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#9CA3AF] hover:text-[#4B5563] cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[#D1D5DB] text-[#EC3013] focus:ring-[#EC3013] cursor-pointer"
                />
                <span className="text-[12px] text-[#4B5563]">
                  Remember this device
                </span>
              </label>

              <div className="flex items-center gap-1 text-[11px] text-[#9CA3AF]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>SSL Encrypted</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-[#EC3013] hover:bg-[#D62839] active:scale-[0.99] disabled:bg-[#F87171] text-white text-[13px] font-bold rounded-md shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E5E7EB]" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                <span className="bg-white px-3 text-[#9CA3AF] font-medium">
                  or get started
                </span>
              </div>
            </div>

            {/* Two Distinct Account Actions: User Account vs Organization */}
            <div className="space-y-2.5">
              {/* Option 1: Create User Account */}
              <Link
                href="/signup"
                className="w-full p-2.5 bg-[#F9FAFB] hover:bg-white border border-[#D1D5DB] hover:border-[#EC3013]/50 rounded-md transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded bg-red-50 text-[#EC3013] flex items-center justify-center shrink-0 group-hover:bg-[#EC3013] group-hover:text-white transition-colors">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-[12px] font-bold text-[#111827] group-hover:text-[#EC3013] transition-colors leading-tight">
                      Create User Account
                    </div>
                    <div className="text-[10px] text-[#6B7280]">
                      For personal room booking &amp; guest access
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#EC3013] group-hover:translate-x-0.5 transition-all" />
              </Link>

              {/* Option 2: Register Organization */}
              <Link
                href="/register"
                className="w-full p-2.5 bg-[#F9FAFB] hover:bg-white border border-[#D1D5DB] hover:border-[#111827]/50 rounded-md transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded bg-gray-100 text-[#374151] flex items-center justify-center shrink-0 group-hover:bg-[#111827] group-hover:text-white transition-colors">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-[12px] font-bold text-[#111827] leading-tight">
                      Register Organization
                    </div>
                    <div className="text-[10px] text-[#6B7280]">
                      For hotel chains, property owners &amp; managers
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#111827] group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-5 border-t border-[#F3F4F6] text-center space-y-2">
            <div className="flex items-center justify-center gap-3 text-[12px] text-[#4B5563]">
              <span>New user?</span>
              <Link
                href="/signup"
                className="font-bold text-[#EC3013] hover:underline"
              >
                Create Account
              </Link>
              <span className="text-[#D1D5DB]">·</span>
              <Link
                href="/register"
                className="font-semibold text-[#111827] hover:underline"
              >
                Register Org
              </Link>
            </div>

            <p className="text-[11px] text-[#9CA3AF]">
              Looking to book a hotel room directly?{" "}
              <Link
                href="/customer"
                className="font-semibold text-[#4B5563] hover:text-[#111827] underline"
              >
                Open Guest Portal
              </Link>
            </p>
          </div>
        </div>

        {/* Security & Organization Support Note */}
        <div className="text-center mt-5 text-[11px] text-[#9CA3AF]">
          Protected by Enterprise Role-Based Access Control (RBAC) &amp; Firebase
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-100">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full border border-[#E5E7EB] shadow-xl text-left space-y-4">
            <div className="flex items-center gap-2 text-[#111827]">
              <HelpCircle className="w-5 h-5 text-[#EC3013]" />
              <h3 className="text-[15px] font-bold">Password Assistance</h3>
            </div>
            <p className="text-[12px] text-[#4B5563] leading-relaxed">
              If you forgot your password or need account recovery, please contact your hotel system administrator or check the password reset link sent to your registered work email.
            </p>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="px-4 py-1.5 bg-[#111827] hover:bg-black text-white text-[12px] font-bold rounded-sm cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Bottom Footer */}
      <footer className="max-w-6xl mx-auto w-full pt-6 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#9CA3AF] gap-2">
        <div>Meridian Hospitality Group · Hotel Operating System (HOS)</div>
        <div className="flex items-center gap-4">
          <Link href="/" className="hover:text-[#4B5563] transition-colors">
            Home
          </Link>
          <Link href="/signup" className="hover:text-[#4B5563] transition-colors">
            Create Account
          </Link>
          <Link href="/register" className="hover:text-[#4B5563] transition-colors">
            Register Org
          </Link>
          <Link href="/customer" className="hover:text-[#4B5563] transition-colors">
            Guest Discovery
          </Link>
        </div>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#EC3013]" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
