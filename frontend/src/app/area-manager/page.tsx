"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, ArrowRight, ShieldAlert, Check } from "lucide-react";

export default function AreaManagerDashboardPage() {
  const [stats] = useState([
    {
      title: "ASSIGNED HOTELS",
      value: "2",
      subtext: "North Area",
      link: "/area-manager/comparison",
    },
    {
      title: "OCCUPANCY",
      value: "81%",
      subtext: "regional average",
      link: "/area-manager/comparison",
    },
    {
      title: "TODAY'S ARRIVALS",
      value: "12",
      subtext: "across area properties",
      link: "/operations/front-desk",
    },
    {
      title: "OPEN APPROVALS",
      value: "3",
      subtext: "pending your decision",
      link: "#approvals",
    },
  ]);

  const [approvals, setApprovals] = useState([
    {
      id: "app-1",
      title: "Discount request — 15% off group booking",
      details: "Meridian Downtown · Requested by R. Sharma (Front Desk)",
      status: "pending",
    },
    {
      id: "app-2",
      title: "Refund request — Booking #RES-10311",
      details: "Meridian Airport · $95 refund for early cancellation",
      status: "pending",
    },
    {
      id: "app-3",
      title: "Emergency Linen Stock Purchase",
      details: "Meridian Downtown · Housekeeping ($1,200)",
      status: "pending",
    },
  ]);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleAction = (id: string, action: "Approved" | "Rejected") => {
    setApprovals(
      approvals.map((a) => (a.id === id ? { ...a, status: action } : a))
    );
    setToastMsg(`Request ${id} marked as ${action}`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#111827] tracking-tight">
            Area Manager Dashboard
          </h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            North Area Region — cluster oversight &amp; property approval management
          </p>
        </div>

        <Link
          href="/area-manager/comparison"
          className="flex items-center gap-1.5 px-4 py-2 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#111827] text-[13px] font-bold rounded shadow-xs"
        >
          <span>View Property Comparison</span>
          <ArrowRight className="w-4 h-4 text-[#EC3013]" />
        </Link>
      </div>

      {/* Toast Notice */}
      {toastMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-[13px] px-4 py-2.5 rounded flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <Link
            key={i}
            href={stat.link}
            className="bg-white p-5 rounded-lg border border-[#E5E7EB] hover:border-[#D1D5DB] shadow-xs transition-all hover:shadow-md block group"
          >
            <div className="text-[11px] font-bold text-[#EC3013] uppercase tracking-wider">
              {stat.title}
            </div>
            <div className="text-[30px] font-black text-[#111827] mt-2 tracking-tight">
              {stat.value}
            </div>
            <div className="text-[12px] text-[#6B7280] mt-1">
              {stat.subtext}
            </div>
          </Link>
        ))}
      </div>

      {/* Approval Center Section */}
      <div id="approvals" className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-[#111827]">
            Pending Manager Approvals ({approvals.filter((a) => a.status === "pending").length})
          </h2>
          <span className="text-[12px] text-[#6B7280]">Real-time queue</span>
        </div>

        <div className="space-y-3">
          {approvals.map((item) => {
            const isPending = item.status === "pending";

            return (
              <div
                key={item.id}
                className="bg-white p-5 rounded-lg border border-[#E5E7EB] hover:border-[#D1D5DB] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
              >
                <div>
                  <div className="text-[14px] font-bold text-[#111827]">
                    {item.title}
                  </div>
                  <div className="text-[12px] text-[#6B7280] mt-1">
                    {item.details}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {isPending ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleAction(item.id, "Rejected")}
                        className="px-4 py-1.5 border border-[#D1D5DB] hover:bg-red-50 hover:text-red-700 text-[#374151] text-[12px] font-bold rounded transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction(item.id, "Approved")}
                        className="px-4 py-1.5 bg-[#EC3013] hover:bg-[#D62839] text-white text-[12px] font-bold rounded shadow-xs transition-colors cursor-pointer"
                      >
                        Approve
                      </button>
                    </>
                  ) : item.status === "Approved" ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded border border-emerald-200">
                      <Check className="w-3.5 h-3.5" /> Approved
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-3 py-1 rounded border border-red-200">
                      <XCircle className="w-3.5 h-3.5" /> Rejected
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
