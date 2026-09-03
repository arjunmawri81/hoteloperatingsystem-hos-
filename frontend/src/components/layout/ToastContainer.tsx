"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useNotifications, ToastAlert } from "@/context/NotificationContext";
import {
  BedDouble,
  Sparkles,
  Utensils,
  Receipt,
  Bot,
  X,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export function ToastContainer() {
  const router = useRouter();
  const { toasts, dismissToast } = useNotifications();

  if (toasts.length === 0) return null;

  const getCategoryIcon = (cat: ToastAlert["category"]) => {
    switch (cat) {
      case "booking":
        return <BedDouble className="w-4 h-4 text-blue-600" />;
      case "housekeeping":
        return <Sparkles className="w-4 h-4 text-amber-600" />;
      case "pos":
        return <Utensils className="w-4 h-4 text-purple-600" />;
      case "billing":
        return <Receipt className="w-4 h-4 text-emerald-600" />;
      case "ai":
        return <Bot className="w-4 h-4 text-[#EC3013]" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-[#111827]" />;
    }
  };

  const handleToastClick = (t: ToastAlert) => {
    dismissToast(t.id);
    if (t.href) {
      router.push(t.href);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none font-sans">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto bg-white border border-[#E5E7EB] rounded-lg shadow-2xl p-3.5 flex items-start gap-3 animate-in slide-in-from-bottom-5 fade-in duration-200 hover:border-[#D1D5DB] transition-all cursor-pointer group"
          onClick={() => handleToastClick(t)}
        >
          <div className="w-8 h-8 rounded-full bg-[#F3F4F6] flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
            {getCategoryIcon(t.category)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-[#111827] group-hover:text-[#EC3013] transition-colors">
                {t.title}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  dismissToast(t.id);
                }}
                className="text-[#9CA3AF] hover:text-[#111827] p-0.5 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-[12px] text-[#4B5563] leading-snug mt-0.5 line-clamp-2">
              {t.description}
            </p>

            <div className="flex items-center gap-1 text-[11px] font-bold text-[#EC3013] mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <span>View details</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
