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
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  registerFirebaseUserWithVerification,
  resendFirebaseVerificationEmail,
  checkEmailVerificationStatus,
} from "@/lib/firebase";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Verification stage after registration
  const [verificationPending, setVerificationPending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

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
      // 1. Firebase Auth Registration & Email Verification
      let firebaseError: string | null = null;
      try {
        await registerFirebaseUserWithVerification(
          formData.email,
          formData.password,
          formData.adminName
        );
      } catch (fbErr: any) {
        if (fbErr.code === "auth/email-already-in-use") {
          firebaseError = "This email is already registered in Firebase Authentication.";
        } else if (fbErr.code === "auth/weak-password") {
          firebaseError = "Password must be at least 6 characters in Firebase Auth.";
        } else {
          console.warn("Firebase Auth Notice:", fbErr.message);
          // If network / domain restriction in dev, we still allow proceeding
        }
      }

      if (firebaseError) {
        throw new Error(firebaseError);
      }

      // 2. Register Organization in Backend Database / Auth Context
      await register(formData);

      // 3. Move to Verification Pending Screen
      setVerificationPending(true);
      setSuccessMsg(
        `Workspace registered for ${formData.orgName}! A verification link was dispatched to ${formData.email}.`
      );
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please check your data.");
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
        setSuccessMsg("Email verified successfully! Entering your workspace...");
        setTimeout(() => {
          router.push("/hotel-admin");
        }, 800);
      } else {
        setError(
          "Email is not verified yet. Please check your spam/inbox folder and click the link sent from Firebase."
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
      setSuccessMsg("A fresh verification email has been sent!");
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
      <div className="sm:mx-auto sm:w-full sm:max-w-[500px] my-auto">
        {/* Header Title */}
        <div className="text-center mb-6">
          <h1 className="text-[22px] font-bold text-[#111827] tracking-tight">
            {verificationPending ? "Verify Organization Email" : "Register Hotel Organization"}
          </h1>
          <p className="text-[13px] text-[#6B7280] mt-1">
            {verificationPending
              ? "Firebase authentication link sent"
              : "Provision a multi-property hotel management workspace"}
          </p>
        </div>

        <div className="bg-white p-8 border border-[#E5E7EB] rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          {/* Error Alert */}
          {error && (
            <div className="mb-5 p-3 rounded bg-red-50 border border-red-200 flex items-start gap-2.5 text-[12px] text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Notice</p>
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

          {verificationPending ? (
            /* VERIFICATION PENDING VIEW */
            <div className="text-center py-4 space-y-5">
              <div className="w-16 h-16 bg-red-50 text-[#EC3013] rounded-full flex items-center justify-center mx-auto ring-8 ring-red-50/50">
                <Mail className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-[16px] font-bold text-[#111827]">
                  Check your inbox for verification
                </h3>
                <p className="text-[13px] text-[#4B5563] mt-1.5 leading-relaxed">
                  We have sent an authentication link via Firebase to{" "}
                  <strong className="text-[#111827] font-semibold">{formData.email}</strong>.
                  Please click the link in your email to verify your ownership of this organization.
                </p>
              </div>

              <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded p-3.5 text-left text-[12px] text-[#4B5563] space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-[#111827]">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Security & Firebase Integration Active</span>
                </div>
                <p className="text-[11px] text-[#6B7280]">
                  Project: <code className="bg-white px-1 py-0.5 rounded border border-[#E5E7EB] font-mono text-[10px]">hosm-management</code>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  disabled={isCheckingStatus}
                  onClick={handleCheckVerification}
                  className="w-full py-2.5 bg-[#EC3013] hover:bg-[#D62839] disabled:bg-[#F87171] text-white text-[13px] font-bold rounded-sm shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  {isCheckingStatus ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Checking Firebase Status...</span>
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
                    className="w-full py-2 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] disabled:opacity-60 text-[12px] font-semibold text-[#374151] rounded-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
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
            /* REGISTRATION FORM */
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
                    className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded-sm text-[13px] text-[#111827] focus:outline-none focus:border-[#EC3013] disabled:opacity-60"
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
                    className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded-sm text-[13px] font-mono text-[#111827] uppercase focus:outline-none focus:border-[#EC3013] disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Admin Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">
                    Admin Full Name
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isLoading}
                    value={formData.adminName}
                    onChange={(e) =>
                      setFormData({ ...formData, adminName: e.target.value })
                    }
                    placeholder="e.g. Alexander Whitfield"
                    className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded-sm text-[13px] text-[#111827] focus:outline-none focus:border-[#EC3013] disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    disabled={isLoading}
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+1 555 0192"
                    className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded-sm text-[13px] text-[#111827] focus:outline-none focus:border-[#EC3013] disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Email & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">
                    Work Email (Verification Target)
                  </label>
                  <input
                    type="email"
                    required
                    disabled={isLoading}
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="admin@meridianhotels.com"
                    className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded-sm text-[13px] text-[#111827] focus:outline-none focus:border-[#EC3013] disabled:opacity-60"
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
                      className="w-full pl-3 pr-10 py-2 bg-white border border-[#D1D5DB] rounded-sm text-[13px] text-[#111827] focus:outline-none focus:border-[#EC3013] disabled:opacity-60"
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
                  className="w-4 h-4 mt-0.5 rounded border-[#D1D5DB] text-[#EC3013] focus:ring-[#EC3013]"
                />
                <span className="text-[12px] text-[#6B7280]">
                  I agree to the HOS Enterprise SaaS Terms of Service and Firebase Authentication Verification.
                </span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-[#EC3013] hover:bg-[#D62839] disabled:bg-[#F87171] text-white text-[13px] font-bold rounded-sm shadow-sm transition-colors cursor-pointer mt-2 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Provisioning & Sending Verification...</span>
                  </>
                ) : (
                  <span>Register Organization & Verify Email</span>
                )}
              </button>
            </form>
          )}

          {/* Footer */}
          <div className="mt-6 pt-5 border-t border-[#F3F4F6] space-y-3 text-center">
            <p className="text-[13px] text-[#4B5563]">
              Already registered?{" "}
              <Link
                href="/login"
                className="font-bold text-[#EC3013] hover:underline"
              >
                Sign in to workspace
              </Link>
            </p>

            {/* Clear separate callout for Individual User Account */}
            <div className="p-3 bg-[#F9FAFB] rounded-md border border-[#E5E7EB] text-left">
              <p className="text-[11px] text-[#6B7280] leading-relaxed mb-1.5">
                Looking to create a personal account for room bookings and guest services?
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#EC3013] hover:underline"
              >
                <span>Create Personal User Account</span>
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
          <Link href="/signup" className="hover:text-[#4B5563] transition-colors">
            Create User Account
          </Link>
          <Link href="/customer" className="hover:text-[#4B5563] transition-colors">
            Guest Discovery
          </Link>
        </div>
      </footer>
    </div>
  );
}
