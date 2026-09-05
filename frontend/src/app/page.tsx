"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { UserMenu } from "@/components/layout/UserMenu";
import { UserRole } from "@/types";
import { ArrowRight, ShieldCheck, Lock } from "lucide-react";

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const currentRole = user?.role || "customer";

  const panels: {
    title: string;
    role: string;
    path: string;
    desc: string;
    allowedRoles?: UserRole[];
  }[] = [
    {
      title: "Super Admin",
      role: "Platform Owner",
      path: "/super-admin",
      desc: "Multi-tenant overview & organization management",
      allowedRoles: ["super_admin"],
    },
    {
      title: "Hotel Admin",
      role: "Company / Chain Owner",
      path: "/hotel-admin",
      desc: "Portfolio metrics, billing ledger & property management",
      allowedRoles: ["super_admin", "hotel_admin"],
    },
    {
      title: "Area Manager",
      role: "Regional Manager",
      path: "/area-manager",
      desc: "Regional cluster oversight & hotel comparison",
      allowedRoles: ["super_admin", "hotel_admin", "area_manager"],
    },
    {
      title: "Hotel Operations",
      role: "Front Desk & Staff PMS",
      path: "/operations",
      desc: "Arrivals, Room map, Housekeeping, POS, Billing",
      allowedRoles: ["super_admin", "hotel_admin", "hotel_manager", "receptionist", "housekeeping", "restaurant_staff", "finance"],
    },
    {
      title: "Customer Portal",
      role: "Guest Booking",
      path: "/customer",
      desc: "Hotel discovery & direct room reservation",
    },
    {
      title: "AI Receptionist",
      role: "Guest Care",
      path: "/ai-receptionist",
      desc: "24/7 AI guest conversations & lead pipeline",
      allowedRoles: ["super_admin", "hotel_admin", "ai_receptionist", "hotel_manager", "receptionist"],
    },
  ];

  return (
    <main className="min-h-screen bg-[#FAFAFA] text-[#111827] flex flex-col justify-between p-8 sm:p-12 font-sans antialiased">
      {/* Top Header */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between pb-8 border-b border-[#E5E7EB]">
        <div>
          <div className="text-[22px] font-bold tracking-tight text-[#111827]">
            HOS
          </div>
          <p className="text-[12px] text-[#9CA3AF] tracking-wide mt-0.5">
            Hotel Operating System
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <UserMenu />
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3.5 py-1.5 sm:px-4 sm:py-2 text-[12px] sm:text-[13px] font-bold text-[#111827] bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] rounded-sm transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-3.5 py-1.5 sm:px-4 sm:py-2 text-[12px] sm:text-[13px] font-bold text-[#111827] bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-[#D1D5DB] rounded-sm transition-colors"
              >
                Create Account
              </Link>
              <Link
                href="/register"
                className="px-3.5 py-1.5 sm:px-4 sm:py-2 text-[12px] sm:text-[13px] font-bold text-white bg-[#EC3013] hover:bg-[#D62839] rounded-sm transition-colors shadow-xs"
              >
                Register Org
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Main Grid of Panels */}
      <div className="max-w-5xl mx-auto w-full py-12">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-bold text-[#111827] tracking-tight">
              Hotel Management Portals
            </h1>
            <p className="text-[14px] text-[#6B7280] mt-1">
              Select a dedicated workspace to manage your hotel operations
            </p>
          </div>

          {user && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-lg shadow-2xs text-[12px]">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-[#6B7280]">Logged in as:</span>
              <span className="font-bold text-[#111827] uppercase">{currentRole.replace("_", " ")}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {panels.map((p) => {
            const hasAccess =
              currentRole === "super_admin" ||
              !p.allowedRoles ||
              p.allowedRoles.includes(currentRole as UserRole);

            return (
              <Link
                key={p.path}
                href={p.path}
                className={`bg-white p-6 rounded-md border shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all flex flex-col justify-between group ${
                  hasAccess
                    ? "border-[#E5E7EB] hover:border-[#D1D5DB] hover:shadow-md"
                    : "border-[#E5E7EB] opacity-75 hover:border-rose-200"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-bold text-[#EC3013] uppercase tracking-wider">
                      {p.role}
                    </div>
                    {!hasAccess && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                        <Lock className="w-3 h-3" />
                        <span>Restricted</span>
                      </span>
                    )}
                  </div>
                  <h2 className="text-[18px] font-bold text-[#111827] mt-2 group-hover:text-[#EC3013] transition-colors">
                    {p.title}
                  </h2>
                  <p className="text-[13px] text-[#6B7280] mt-2 leading-relaxed">
                    {p.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#F3F4F6] flex items-center justify-between text-[12px] font-bold text-[#111827]">
                  <span>{hasAccess ? "Open Panel" : "View Permission Info"}</span>
                  <ArrowRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#EC3013] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-5xl mx-auto w-full pt-8 border-t border-[#E5E7EB] text-center text-[12px] text-[#9CA3AF]">
        Meridian Hotels & Resorts · Hotel Operating System
      </div>
    </main>
  );
}
