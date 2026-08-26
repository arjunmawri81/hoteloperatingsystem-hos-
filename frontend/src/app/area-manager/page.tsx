"use client";

import { useState } from "react";

export default function AreaManagerDashboardPage() {
  const [stats, setStats] = useState([
    {
      title: "ASSIGNED HOTELS",
      value: "2",
      subtext: "North Area",
    },
    {
      title: "OCCUPANCY",
      value: "81%",
      subtext: "average",
    },
    {
      title: "TODAY'S ARRIVALS",
      value: "12",
      subtext: "across area",
    },
    {
      title: "OPEN APPROVALS",
      value: "3",
      subtext: "pending your review",
    },
  ]);

  const [approvals, setApprovals] = useState([
    {
      id: "app-1",
      title: "Discount request — 15% off group booking",
      details: "Meridian Downtown · Requested by R. Sharma",
      status: "pending",
    },
    {
      id: "app-2",
      title: "Refund request — Booking #RES-10311",
      details: "Meridian Airport · $95",
      status: "pending",
    },
    {
      id: "app-3",
      title: "Stock adjustment — Linen shortage",
      details: "Meridian Downtown · Housekeeping",
      status: "pending",
    },
  ]);

  const handleAction = (id: string, action: "Approved" | "Rejected") => {
    setApprovals(
      approvals.map((a) => (a.id === id ? { ...a, status: action } : a))
    );
  };

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div>
        <h1 className="text-[28px] font-bold text-[#111827] tracking-tight">
          Area Manager Dashboard
        </h1>
        <p className="text-[14px] text-[#6B7280] mt-1">
          North Area — assigned properties
        </p>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-md border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          >
            <div className="text-[11px] font-bold text-[#E63946] uppercase tracking-wider">
              {stat.title}
            </div>
            <div className="text-[34px] font-bold text-[#111827] mt-3 tracking-tight">
              {stat.value}
            </div>
            <div className="text-[13px] text-[#9CA3AF] mt-2 font-normal">
              {stat.subtext}
            </div>
          </div>
        ))}
      </div>

      {/* Approval Center Section */}
      <div className="space-y-4 pt-2">
        <h2 className="text-[16px] font-bold text-[#111827]">
          Approval Center
        </h2>

        <div className="space-y-3">
          {approvals.map((item) => (
            <div
              key={item.id}
              className="bg-white p-5 rounded-md border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <div className="text-[15px] font-bold text-[#111827]">
                  {item.title}
                </div>
                <div className="text-[13px] text-[#6B7280] mt-0.5">
                  {item.details}
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                {item.status === "pending" ? (
                  <>
                    <button
                      onClick={() => handleAction(item.id, "Rejected")}
                      className="px-5 py-2 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#111827] text-[13px] font-bold rounded-sm transition-colors cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleAction(item.id, "Approved")}
                      className="px-5 py-2 bg-[#E63946] hover:bg-[#D62839] text-white text-[13px] font-bold rounded-sm shadow-sm transition-colors cursor-pointer"
                    >
                      Approve
                    </button>
                  </>
                ) : (
                  <span
                    className={`text-[12px] font-bold px-3 py-1 rounded-sm ${
                      item.status === "Approved"
                        ? "bg-[#DEF7EC] text-[#03543F]"
                        : "bg-[#FDE8E8] text-[#9B1C1C]"
                    }`}
                  >
                    {item.status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
