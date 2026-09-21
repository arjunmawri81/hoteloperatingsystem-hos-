"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { posApi } from "@/lib/api";
import { KOT } from "@/types";
import {
  ChefHat,
  Clock,
  CheckCircle2,
  Volume2,
  VolumeX,
  RefreshCw,
  Bell,
  Utensils,
  QrCode,
  Flame,
  Printer,
} from "lucide-react";
import { RoleGuard } from "@/components/layout/RoleGuard";

export default function KitchenKDSPage() {
  const [kots, setKots] = useState<KOT[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "new" | "preparing" | "ready" | "all">("active");
  const [currentTime, setCurrentTime] = useState(Date.now());
  const previousKotCountRef = useRef<number>(0);

  // Gentle audio chime using standard Web Audio API
  const playChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch {
      // AudioContext blocked before interaction
    }
  }, [soundEnabled]);

  const loadKOTs = useCallback(async () => {
    try {
      const data = await posApi.getKOTs();
      if (previousKotCountRef.current > 0 && data.length > previousKotCountRef.current) {
        playChime();
      }
      previousKotCountRef.current = data.length;
      setKots(data);
    } catch {
      // Keep existing data on transient error
    } finally {
      setIsLoading(false);
    }
  }, [playChime]);

  useEffect(() => {
    loadKOTs();
    const interval = setInterval(loadKOTs, 4000); // Poll every 4 seconds
    const timerInterval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => {
      clearInterval(interval);
      clearInterval(timerInterval);
    };
  }, [loadKOTs]);

  const handleUpdateStatus = async (id: string, nextStatus: string) => {
    try {
      await posApi.updateKOTStatus(id, nextStatus);
      setKots((prev) =>
        prev.map((k) => (k._id === id || k.id === id ? { ...k, status: nextStatus } : k))
      );
      if (nextStatus === "ready") {
        playChime();
      }
    } catch (err: any) {
      alert(err.message || "Failed to update ticket status");
    }
  };

  const getElapsedMinutes = (dateStr: string) => {
    const diffMs = currentTime - new Date(dateStr).getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  const getTimerBadge = (minutes: number) => {
    if (minutes < 10) {
      return {
        label: `${minutes}m ago`,
        style: "text-emerald-700 bg-emerald-50 border-emerald-200",
      };
    }
    if (minutes < 20) {
      return {
        label: `${minutes}m (Delayed)`,
        style: "text-amber-700 bg-amber-50 border-amber-200",
      };
    }
    return {
      label: `${minutes}m (Urgent)`,
      style: "text-rose-700 bg-rose-50 border-rose-200",
    };
  };

  const newCount = kots.filter((k) => k.status === "new").length;
  const preparingCount = kots.filter((k) => k.status === "preparing").length;
  const readyCount = kots.filter((k) => k.status === "ready").length;
  const activeCount = newCount + preparingCount;

  const filteredKots = kots.filter((k) => {
    if (activeTab === "active") return k.status === "new" || k.status === "preparing";
    if (activeTab === "new") return k.status === "new";
    if (activeTab === "preparing") return k.status === "preparing";
    if (activeTab === "ready") return k.status === "ready";
    return true; // all
  });

  return (
    <RoleGuard
      allowedRoles={["super_admin", "hotel_admin", "hotel_manager", "restaurant_staff", "kitchen_staff"]}
      moduleName="Kitchen Display & KOT Expediting"
    >
      <div className="space-y-6">
        {/* Top Header - Consistent with LuckNexa Enterprise Standard */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[22px] font-bold text-[#111827] tracking-tight">
                Kitchen Order Tickets (KOT) &amp; Expediting
              </h1>
            </div>
            <p className="text-[13px] text-[#6B7280] mt-0.5">
              Live food preparation queue, table orders, and expediting status
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`px-3 py-1.5 rounded text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
                soundEnabled
                  ? "bg-white border-[#D1D5DB] text-[#111827] hover:bg-[#F9FAFB]"
                  : "bg-[#F3F4F6] border-[#E5E7EB] text-[#9CA3AF]"
              }`}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5" />}
              {soundEnabled ? "Audio Alerts On" : "Muted"}
            </button>

            <button
              onClick={() => loadKOTs()}
              disabled={isLoading}
              title="Refresh Tickets"
              className="p-2 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] rounded text-[#4B5563] transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#EC3013]" : ""}`} />
            </button>

            <Link
              href="/operations/restaurant-pos"
              className="px-3.5 py-1.5 rounded text-xs font-semibold bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#374151] flex items-center gap-1.5 transition-colors"
            >
              <Utensils className="w-3.5 h-3.5 text-[#6B7280]" />
              Restaurant POS
            </Link>

            <Link
              href="/operations/restaurant-pos/qr-studio"
              className="px-3.5 py-1.5 rounded text-xs font-semibold bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#374151] flex items-center gap-1.5 transition-colors"
            >
              <QrCode className="w-3.5 h-3.5 text-[#6B7280]" />
              Table QR Codes
            </Link>
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-[#E5E7EB] shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] block">
              Active in Kitchen
            </span>
            <span className="text-2xl font-bold text-[#111827] mt-1 block">
              {activeCount}
            </span>
          </div>

          <div className="bg-white p-4 rounded-lg border border-[#E5E7EB] shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block">
              New Unstarted
            </span>
            <span className="text-2xl font-bold text-amber-900 mt-1 block">
              {newCount}
            </span>
          </div>

          <div className="bg-white p-4 rounded-lg border border-[#E5E7EB] shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block">
              Currently Preparing
            </span>
            <span className="text-2xl font-bold text-blue-900 mt-1 block">
              {preparingCount}
            </span>
          </div>

          <div className="bg-white p-4 rounded-lg border border-[#E5E7EB] shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
              Ready for Pickup
            </span>
            <span className="text-2xl font-bold text-emerald-900 mt-1 block">
              {readyCount}
            </span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-[#E5E7EB] shadow-xs max-w-fit">
          <button
            onClick={() => setActiveTab("active")}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
              activeTab === "active"
                ? "bg-[#111827] text-white shadow-xs"
                : "text-[#4B5563] hover:text-[#111827] hover:bg-[#F9FAFB]"
            }`}
          >
            Active Tickets ({activeCount})
          </button>

          <button
            onClick={() => setActiveTab("new")}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
              activeTab === "new"
                ? "bg-[#111827] text-white shadow-xs"
                : "text-[#4B5563] hover:text-[#111827] hover:bg-[#F9FAFB]"
            }`}
          >
            New ({newCount})
          </button>

          <button
            onClick={() => setActiveTab("preparing")}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
              activeTab === "preparing"
                ? "bg-[#111827] text-white shadow-xs"
                : "text-[#4B5563] hover:text-[#111827] hover:bg-[#F9FAFB]"
            }`}
          >
            Preparing ({preparingCount})
          </button>

          <button
            onClick={() => setActiveTab("ready")}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
              activeTab === "ready"
                ? "bg-[#111827] text-white shadow-xs"
                : "text-[#4B5563] hover:text-[#111827] hover:bg-[#F9FAFB]"
            }`}
          >
            Ready ({readyCount})
          </button>

          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
              activeTab === "all"
                ? "bg-[#111827] text-white shadow-xs"
                : "text-[#4B5563] hover:text-[#111827] hover:bg-[#F9FAFB]"
            }`}
          >
            All History ({kots.length})
          </button>
        </div>

        {/* Tickets Grid */}
        {filteredKots.length === 0 ? (
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-12 text-center shadow-xs">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3 opacity-90" />
            <h3 className="text-[15px] font-bold text-[#111827]">No active tickets in this view</h3>
            <p className="text-[13px] text-[#6B7280] max-w-sm mx-auto mt-1">
              New orders punched from Restaurant POS or customer table QR codes will appear here in real-time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredKots.map((kot) => {
              const elapsedMins = getElapsedMinutes(kot.createdAt);
              const timer = getTimerBadge(elapsedMins);
              const isReady = kot.status === "ready";
              const isCooking = kot.status === "preparing";
              const isNew = kot.status === "new";

              return (
                <div
                  key={kot._id || kot.id || kot.kotNumber}
                  className={`bg-white rounded-lg border transition-all flex flex-col justify-between shadow-xs ${
                    isReady
                      ? "border-emerald-300 ring-1 ring-emerald-200"
                      : isNew
                      ? "border-amber-300 ring-1 ring-amber-200"
                      : "border-[#E5E7EB]"
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-3.5 border-b border-[#F3F4F6] bg-[#FAFAFA] rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-[#111827] bg-white px-2 py-0.5 rounded border border-[#E5E7EB]">
                          {kot.kotNumber}
                        </span>
                        {kot.roomNumber && (
                          <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                            Room {kot.roomNumber}
                          </span>
                        )}
                      </div>

                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${timer.style}`}>
                        <Clock className="w-3 h-3 inline mr-1 -mt-0.5" />
                        {timer.label}
                      </span>
                    </div>

                    <div className="mt-2 flex items-baseline justify-between">
                      <h2 className="text-lg font-bold text-[#111827]">
                        {kot.tableNumber || "Table"}
                      </h2>
                      <span className="text-[11px] text-[#6B7280]">
                        Server: <strong className="text-[#374151]">{kot.serverName || "Staff"}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Card Body - Food Items */}
                  <div className="p-3.5 flex-1 space-y-2">
                    {kot.items && kot.items.length > 0 ? (
                      kot.items.map((it, idx) => (
                        <div
                          key={idx}
                          className="flex items-start justify-between gap-2 py-1 border-b border-[#F9FAFB] last:border-0"
                        >
                          <div className="flex items-start gap-2">
                            <span className="w-5 h-5 rounded bg-[#F3F4F6] text-[#111827] text-xs font-bold flex items-center justify-center shrink-0">
                              {it.quantity}
                            </span>
                            <div>
                              <p className="text-[13px] font-semibold text-[#111827] leading-snug">
                                {it.name}
                              </p>
                              {it.instructions && (
                                <p className="text-[11px] text-amber-700 font-medium italic mt-0.5">
                                  {it.instructions}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-[#9CA3AF] italic">No items detailed</p>
                    )}
                  </div>

                  {/* Card Footer - Status Workflow */}
                  <div className="p-3 bg-[#FAFAFA] border-t border-[#F3F4F6] rounded-b-lg flex items-center gap-2">
                    {isNew && (
                      <button
                        onClick={() => handleUpdateStatus(kot._id || kot.id || "", "preparing")}
                        className="w-full py-1.5 rounded text-xs font-bold bg-[#111827] hover:bg-[#1F2937] text-white flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                      >
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                        Start Preparing
                      </button>
                    )}

                    {isCooking && (
                      <button
                        onClick={() => handleUpdateStatus(kot._id || kot.id || "", "ready")}
                        className="w-full py-1.5 rounded text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        Mark Ready for Pickup
                      </button>
                    )}

                    {isReady && (
                      <button
                        onClick={() => handleUpdateStatus(kot._id || kot.id || "", "served")}
                        className="w-full py-1.5 rounded text-xs font-semibold bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#374151] flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Mark Served to Guest
                      </button>
                    )}

                    {kot.status === "served" && (
                      <span className="w-full text-center text-[11px] font-semibold text-emerald-700 py-1">
                        ✓ Served to Table
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
