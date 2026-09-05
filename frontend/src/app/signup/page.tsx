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
  Mail,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  User as UserIcon,
  Phone,
  Lock,
  Building2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  registerFirebaseUserWithVerification,
  resendFirebaseVerificationEmail,
  checkEmailVerificationStatus,
} from "@/lib/firebase";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Verification stage after user signup
  const [verificationPending, setVerificationPending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!formData.name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!formData.email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Firebase Auth Registration & Email Verification
      let firebaseError: string | null = null;
      try {
        await registerFirebaseUserWithVerification(
          formData.email.trim(),
          formData.password,
          formData.name.trim()
        );
      } catch (fbErr: any) {
        if (fbErr.code === "auth/email-already-in-use") {
          firebaseError = "This email is already registered. Please sign in instead.";
        } else if (fbErr.code === "auth/weak-password") {
          firebaseError = "Password must be at least 6 characters in Firebase Auth.";
        } else {
          console.warn("Firebase Auth Notice:", fbErr.message);
        }
      }

      if (firebaseError) {
        throw new Error(firebaseError);
      }

      // 2. Register Individual User in Backend Database / Auth Context
      await signup({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
      });

      // 3. Move to Verification Pending Screen
      setVerificationPending(true);
      setSuccessMsg(
        `Account created for ${formData.name}! A verification link was dispatched to ${formData.email}.`
      );
    } catch (err: any) {
      setError(err?.message || "Account creation failed. Please check your details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setIsCheckingStatus(true);
    setError(null);

    try {
      const isVerified = await checkEmailVerificationStatus();
      if (isVerified) {
        setSuccessMsg("Email verified successfully! Welcome to HOS.");
        setTimeout(() => {
          router.push("/customer");
        }, 800);
      } else {
        setError(
          "Email is not verified yet. Please check your inbox / spam folder and click the link sent from Firebase."
        );
      }
    } catch (err: any) {
      setError(err?.message || "Unable to check verification status right now.");
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    setIsResending(true);
    setError(null);

    try {
      await resendFirebaseVerificationEmail();
      setSuccessMsg("A fresh verification email has been dispatched!");
      setResendCooldown(30);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setError(err?.message || "Failed to resend verification email.");
    } finally {
      setIsResending(false);
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
              Personal Guest &amp; User Account
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
            href="/register"
            className="text-[12px] font-bold text-[#EC3013] border border-[#EC3013]/30 hover:bg-[#EC3013] hover:text-white px-3 py-1.5 rounded-sm transition-all"
          >
            Register Org
          </Link>
        </div>
      </div>

      {/* Main Card Container */}
      <div className="sm:mx-auto sm:w-full sm:max-w-[460px] my-auto">
        <div className="bg-white p-8 sm:p-9 border border-[#E5E7EB] rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-100 text-[#EC3013] text-[11px] font-bold uppercase tracking-wider mb-2">
              <UserIcon className="w-3.5 h-3.5" />
              <span>User Account</span>
            </div>
            <h1 className="text-[22px] font-bold text-[#111827] tracking-tight">
              {verificationPending ? "Verify Your Email" : "Create Personal Account"}
            </h1>
            <p className="text-[13px] text-[#6B7280] mt-1">
              {verificationPending
                ? "Click the link in your email to complete verification"
                : "Sign up for hotel room bookings, guest services & direct reservations"}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 rounded-md bg-red-50 border border-red-200 flex items-start gap-2.5 text-[12px] text-red-700 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#EC3013]" />
              <div className="flex-1">
                <p className="font-semibold">Notice</p>
                <p className="text-[11px] mt-0.5 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="mb-5 p-3.5 rounded-md bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-[12px] text-emerald-800">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {verificationPending ? (
            /* VERIFICATION PENDING VIEW */
            <div className="text-center py-3 space-y-5">
              <div className="w-14 h-14 bg-red-50 text-[#EC3013] rounded-full flex items-center justify-center mx-auto ring-8 ring-red-50/50">
                <Mail className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-[15px] font-bold text-[#111827]">
                  Check your inbox
                </h3>
                <p className="text-[12px] text-[#4B5563] mt-1.5 leading-relaxed">
                  We have dispatched a verification email via Firebase to:
                  <br />
                  <strong className="text-[#111827] font-semibold">{formData.email}</strong>
                </p>
              </div>

              <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded p-3 text-left text-[12px] text-[#4B5563] space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-[#111827]">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Firebase Email Verification</span>
                </div>
                <p className="text-[11px] text-[#6B7280]">
                  Click the link in the message, then return here to confirm.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  disabled={isCheckingStatus}
                  onClick={handleCheckVerification}
                  className="w-full py-2.5 bg-[#EC3013] hover:bg-[#D62839] disabled:bg-[#F87171] text-white text-[13px] font-bold rounded-md shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  {isCheckingStatus ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Checking Status...</span>
                    </>
                  ) : (
                    <>
                      <span>I Have Verified My Email</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div>
                  <button
                    type="button"
                    disabled={isResending || resendCooldown > 0}
                    onClick={handleResendVerification}
                    className="w-full py-2 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] disabled:opacity-60 text-[12px] font-semibold text-[#374151] rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isResending ? "animate-spin" : ""}`} />
                    <span>
                      {resendCooldown > 0
                        ? `Resend in ${resendCooldown}s`
                        : "Resend Verification Email"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* USER SIGNUP FORM */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9CA3AF]">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    disabled={isLoading}
                    placeholder="e.g. Arjun Verma"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#D1D5DB] rounded-md text-[13px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#EC3013] focus:ring-1 focus:ring-[#EC3013] transition-all disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-[11px] font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                  Email Address (Verification Target)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9CA3AF]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    disabled={isLoading}
                    placeholder="guest@example.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#D1D5DB] rounded-md text-[13px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#EC3013] focus:ring-1 focus:ring-[#EC3013] transition-all disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-[11px] font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9CA3AF]">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    disabled={isLoading}
                    placeholder="+1 555 0192"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#D1D5DB] rounded-md text-[13px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#EC3013] focus:ring-1 focus:ring-[#EC3013] transition-all disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                  Password (min 6 chars)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9CA3AF]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
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

              {/* Terms Checkbox */}
              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  required
                  id="agreeTerms"
                  className="w-4 h-4 mt-0.5 rounded border-[#D1D5DB] text-[#EC3013] focus:ring-[#EC3013] cursor-pointer"
                />
                <label
                  htmlFor="agreeTerms"
                  className="text-[12px] text-[#4B5563] cursor-pointer select-none"
                >
                  I agree to the HOS Guest Terms of Service and Firebase Authentication.
                </label>
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
                    <span>Creating Account &amp; Sending Verification...</span>
                  </>
                ) : (
                  <>
                    <span>Create User Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Separation / Alternate Options */}
          <div className="mt-6 pt-5 border-t border-[#F3F4F6] space-y-3 text-center">
            <p className="text-[13px] text-[#4B5563]">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-bold text-[#EC3013] hover:underline"
              >
                Sign In
              </Link>
            </p>

            {/* Clear separate callout for Register Organization */}
            <div className="p-3 bg-[#F9FAFB] rounded-md border border-[#E5E7EB] text-left">
              <div className="flex items-center gap-2 mb-1 text-[12px] font-bold text-[#111827]">
                <Building2 className="w-4 h-4 text-[#EC3013]" />
                <span>Hotel Owner or Chain Manager?</span>
              </div>
              <p className="text-[11px] text-[#6B7280] leading-relaxed mb-2">
                Need to manage multi-property portfolios, room maps, front desk, and staff?
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#EC3013] hover:underline"
              >
                <span>Register Organization Workspace</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Security badge */}
        <div className="text-center mt-4 text-[11px] text-[#9CA3AF]">
          Protected by Enterprise Role-Based Access Control (RBAC) &amp; Firebase
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full pt-6 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#9CA3AF] gap-2">
        <div>Meridian Hospitality Group · Hotel Operating System (HOS)</div>
        <div className="flex items-center gap-4">
          <Link href="/" className="hover:text-[#4B5563] transition-colors">
            Home
          </Link>
          <Link href="/login" className="hover:text-[#4B5563] transition-colors">
            Sign In
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
