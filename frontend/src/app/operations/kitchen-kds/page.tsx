"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { posApi, inventoryApi } from "@/lib/api";
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
  Package,
  AlertTriangle,
  Plus,
  Minus,
  Send,
  X,
} from "lucide-react";
import { RoleGuard } from "@/components/layout/RoleGuard";

interface InventoryItem {
  _id: string;
  sku: string;
  name: string;
  quantity: number;
  unit: string;
  minStock: number;
  status: string;
  category: string;
}

interface StockRequestItem {
  itemId: string;
  sku: string;
  name: string;
  unit: string;
  qty: number;
  available: number;
}

export default function KitchenKDSPage() {
  const [kots, setKots] = useState<KOT[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "new" | "preparing" | "ready" | "all">("active");
  const [currentTime, setCurrentTime] = useState(Date.now());
  const previousKotCountRef = useRef<number>(0);

  // Stock request state
  const [showStockPanel, setShowStockPanel] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [stockSearch, setStockSearch] = useState("");
  const [requestItems, setRequestItems] = useState<StockRequestItem[]>([]);
  const [staffName, setStaffName] = useState("");
  const [purpose, setPurpose] = useState("Kitchen daily usage");
  const [isSubmittingStock, setIsSubmittingStock] = useState(false);
  const [stockSuccess, setStockSuccess] = useState("");

  const playChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch {}
  }, [soundEnabled]);

  const loadKOTs = useCallback(async () => {
    try {
      const data = await posApi.getKOTs();
      if (previousKotCountRef.current > 0 && data.length > previousKotCountRef.current) {
        playChime();
      }
      previousKotCountRef.current = data.length;
      setKots(data);
    } catch {}
    finally { setIsLoading(false); }
  }, [playChime]);

  const loadInventory = useCallback(async () => {
    try {
      const res = await inventoryApi.getAll({ category: "Food & Beverage" });
      setInventoryItems(res.data || []);
    } catch {}
  }, []);

  useEffect(() => {
    loadKOTs();
    const interval = setInterval(loadKOTs, 4000);
    const timerInterval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => { clearInterval(interval); clearInterval(timerInterval); };
  }, [loadKOTs]);

  useEffect(() => {
    if (showStockPanel) loadInventory();
  }, [showStockPanel, loadInventory]);

  const handleUpdateStatus = async (id: string, nextStatus: string) => {
    try {
      await posApi.updateKOTStatus(id, nextStatus);
      setKots((prev) => prev.map((k) => (k._id === id || k.id === id ? { ...k, status: nextStatus } : k)));
      if (nextStatus === "ready") playChime();
    } catch (err: any) {
      alert(err.message || "Failed to update ticket status");
    }
  };

  const getElapsedMinutes = (dateStr: string) => {
    const diffMs = currentTime - new Date(dateStr).getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  const getTimerBadge = (minutes: number) => {
    if (minutes < 10) return { label: `${minutes}m ago`, style: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    if (minutes < 20) return { label: `${minutes}m (Delayed)`, style: "text-amber-700 bg-amber-50 border-amber-200" };
    return { label: `${minutes}m (Urgent)`, style: "text-rose-700 bg-rose-50 border-rose-200" };
  };

  const addToRequest = (item: InventoryItem) => {
    if (requestItems.find((r) => r.itemId === item._id)) return;
    setRequestItems((prev) => [...prev, { itemId: item._id, sku: item.sku, name: item.name, unit: item.unit, qty: 1, available: item.quantity }]);
  };

  const updateQty = (itemId: string, delta: number) => {
    setRequestItems((prev) => prev.map((r) => r.itemId === itemId ? { ...r, qty: Math.max(1, r.qty + delta) } : r));
  };

  const removeFromRequest = (itemId: string) => setRequestItems((prev) => prev.filter((r) => r.itemId !== itemId));

  const handleSubmitStockRequest = async () => {
    if (!staffName.trim()) { alert("Please enter chef/staff name"); return; }
    if (requestItems.length === 0) { alert("Please add at least one item"); return; }
    setIsSubmittingStock(true);
    try {
      await inventoryApi.createIssue({
        department: "Kitchen & F&B",
        issuedToStaff: staffName,
        purpose,
        items: requestItems.map((r) => ({ sku: r.sku, name: r.name, quantity: r.qty, unit: r.unit })),
      });
      setStockSuccess(`✓ Stock updated! ${requestItems.length} item(s) deducted from inventory.`);
      setRequestItems([]);
      setStaffName("");
      loadInventory();
      setTimeout(() => setStockSuccess(""), 5000);
    } catch (err: any) {
      alert(err.message || "Failed to update stock");
    } finally {
      setIsSubmittingStock(false);
    }
  };

  const filteredInventory = inventoryItems.filter((item) =>
    item.name.toLowerCase().includes(stockSearch.toLowerCase()) ||
    item.sku.toLowerCase().includes(stockSearch.toLowerCase())
  );

  const newCount = kots.filter((k) => k.status === "new").length;
  const preparingCount = kots.filter((k) => k.status === "preparing").length;
  const readyCount = kots.filter((k) => k.status === "ready").length;
  const activeCount = newCount + preparingCount;
  const lowStockCount = inventoryItems.filter((i) => i.status === "Low Stock" || i.status === "Critical").length;

  const filteredKots = kots.filter((k) => {
    if (activeTab === "active") return k.status === "new" || k.status === "preparing";
    if (activeTab === "new") return k.status === "new";
    if (activeTab === "preparing") return k.status === "preparing";
    if (activeTab === "ready") return k.status === "ready";
    return true;
  });

  return (
    <RoleGuard
      allowedRoles={["super_admin", "hotel_admin", "hotel_manager", "restaurant_staff", "kitchen_staff"]}
      moduleName="Kitchen Display & KOT Expediting"
    >
      <div className="space-y-6">

        {/* ─── HEADER ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-xs">
          <div>
            <h1 className="text-[22px] font-bold text-[#111827] tracking-tight">
              Kitchen Order Tickets (KOT) &amp; Expediting
            </h1>
            <p className="text-[13px] text-[#6B7280] mt-0.5">
              Live food preparation queue, table orders, and expediting status
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`px-3 py-1.5 rounded text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
                soundEnabled ? "bg-white border-[#D1D5DB] text-[#111827] hover:bg-[#F9FAFB]" : "bg-[#F3F4F6] border-[#E5E7EB] text-[#9CA3AF]"
              }`}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5" />}
              {soundEnabled ? "Audio Alerts On" : "Muted"}
            </button>

            <button
              onClick={() => loadKOTs()}
              disabled={isLoading}
              className="p-2 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] rounded text-[#4B5563] transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#EC3013]" : ""}`} />
            </button>

            {/* Kitchen Stock Button */}
            <button
              onClick={() => setShowStockPanel(!showStockPanel)}
              className={`px-3.5 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                showStockPanel
                  ? "bg-orange-600 border-orange-600 text-white"
                  : "bg-white border-[#D1D5DB] hover:bg-orange-50 hover:border-orange-300 text-[#374151]"
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              Kitchen Stock
              {lowStockCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {lowStockCount}
                </span>
              )}
            </button>

            <Link href="/operations/restaurant-pos"
              className="px-3.5 py-1.5 rounded text-xs font-semibold bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#374151] flex items-center gap-1.5 transition-colors"
            >
              <Utensils className="w-3.5 h-3.5 text-[#6B7280]" /> Restaurant POS
            </Link>

            <Link href="/operations/restaurant-pos/qr-studio"
              className="px-3.5 py-1.5 rounded text-xs font-semibold bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#374151] flex items-center gap-1.5 transition-colors"
            >
              <QrCode className="w-3.5 h-3.5 text-[#6B7280]" /> Table QR Codes
            </Link>
          </div>
        </div>

        {/* ─── KITCHEN STOCK REQUEST PANEL ────────────────────────────── */}
        {showStockPanel && (
          <div className="bg-white rounded-lg border border-orange-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 bg-orange-50 border-b border-orange-200">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-orange-600" />
                <h2 className="text-[14px] font-bold text-orange-900">Kitchen Stock Update</h2>
                <span className="text-[11px] text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full border border-orange-200">
                  F&amp;B Inventory
                </span>
                {lowStockCount > 0 && (
                  <span className="text-[11px] text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {lowStockCount} Low Stock
                  </span>
                )}
              </div>
              <button onClick={() => setShowStockPanel(false)} className="text-orange-400 hover:text-orange-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#F3F4F6]">

              {/* Left — Item List */}
              <div className="p-5">
                <p className="text-[12px] font-semibold text-[#6B7280] mb-3">
                  Select items used / consumed from kitchen today:
                </p>
                <input
                  type="text"
                  placeholder="Search ingredient or SKU..."
                  value={stockSearch}
                  onChange={(e) => setStockSearch(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] border border-[#D1D5DB] rounded-lg mb-3 focus:outline-none focus:border-orange-400"
                />
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {filteredInventory.length === 0 ? (
                    <p className="text-[12px] text-[#9CA3AF] text-center py-6 italic">
                      No F&amp;B items in inventory. Add them from the Inventory module first.
                    </p>
                  ) : filteredInventory.map((item) => {
                    const isLow = item.status === "Low Stock" || item.status === "Critical";
                    const alreadyAdded = !!requestItems.find((r) => r.itemId === item._id);
                    return (
                      <div key={item._id}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all ${
                          isLow ? "border-red-200 bg-red-50" : "border-[#E5E7EB] bg-[#FAFAFA]"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[13px] font-semibold text-[#111827] truncate">{item.name}</span>
                            {isLow && <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[11px] font-medium ${isLow ? "text-red-600" : "text-[#6B7280]"}`}>
                              Stock: {item.quantity} {item.unit}
                            </span>
                            {isLow && (
                              <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                                {item.status}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => addToRequest(item)}
                          disabled={alreadyAdded}
                          className={`ml-3 px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
                            alreadyAdded ? "bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600 text-white"
                          }`}
                        >
                          {alreadyAdded ? "Added" : "+ Add"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right — Submission Form */}
              <div className="p-5 flex flex-col gap-4">
                <div>
                  <label className="block text-[11.5px] font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                    Chef / Staff Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Raju Bhai, Head Chef"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    className="w-full px-3 py-2 text-[13px] border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-orange-400"
                  />
                </div>

                <div>
                  <label className="block text-[11.5px] font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                    Purpose / Reason
                  </label>
                  <input
                    type="text"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full px-3 py-2 text-[13px] border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-orange-400"
                  />
                </div>

                <div>
                  <label className="block text-[11.5px] font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                    Items to Consume ({requestItems.length})
                  </label>
                  {requestItems.length === 0 ? (
                    <div className="border border-dashed border-[#D1D5DB] rounded-lg p-4 text-center text-[12px] text-[#9CA3AF]">
                      ← Select items from the left panel
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {requestItems.map((r) => (
                        <div key={r.itemId} className="flex items-center gap-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2">
                          <span className="flex-1 text-[12px] font-semibold text-[#111827] truncate">{r.name}</span>
                          <div className="flex items-center gap-1">
                            <button onClick={() => updateQty(r.itemId, -1)} className="w-6 h-6 rounded bg-white border border-[#D1D5DB] flex items-center justify-center hover:bg-[#F3F4F6]">
                              <Minus className="w-3 h-3 text-[#374151]" />
                            </button>
                            <span className="text-[13px] font-bold text-[#111827] w-7 text-center">{r.qty}</span>
                            <button onClick={() => updateQty(r.itemId, 1)} className="w-6 h-6 rounded bg-white border border-[#D1D5DB] flex items-center justify-center hover:bg-[#F3F4F6]">
                              <Plus className="w-3 h-3 text-[#374151]" />
                            </button>
                          </div>
                          <span className="text-[11px] text-[#6B7280] w-10 shrink-0">{r.unit}</span>
                          <button onClick={() => removeFromRequest(r.itemId)} className="text-[#9CA3AF] hover:text-red-500">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {stockSuccess && (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[12px] font-semibold px-3 py-2.5 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    {stockSuccess}
                  </div>
                )}

                <button
                  onClick={handleSubmitStockRequest}
                  disabled={isSubmittingStock || requestItems.length === 0}
                  className="w-full py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-[13px] font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  {isSubmittingStock ? "Updating Stock..." : "Update Kitchen Stock"}
                </button>
                <p className="text-[11px] text-[#9CA3AF] text-center -mt-2">
                  Stock deducted from inventory &amp; logged automatically
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ─── METRIC CARDS ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-[#E5E7EB] shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] block">Active in Kitchen</span>
            <span className="text-2xl font-bold text-[#111827] mt-1 block">{activeCount}</span>
          </div>
          <div className="bg-white p-4 rounded-lg border border-[#E5E7EB] shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block">New Unstarted</span>
            <span className="text-2xl font-bold text-amber-900 mt-1 block">{newCount}</span>
          </div>
          <div className="bg-white p-4 rounded-lg border border-[#E5E7EB] shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block">Currently Preparing</span>
            <span className="text-2xl font-bold text-blue-900 mt-1 block">{preparingCount}</span>
          </div>
          <div className="bg-white p-4 rounded-lg border border-[#E5E7EB] shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">Ready for Pickup</span>
            <span className="text-2xl font-bold text-emerald-900 mt-1 block">{readyCount}</span>
          </div>
        </div>

        {/* ─── FILTER TABS ─────────────────────────────────────────── */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-[#E5E7EB] shadow-xs max-w-fit">
          {(["active", "new", "preparing", "ready", "all"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors capitalize ${
                activeTab === tab ? "bg-[#111827] text-white shadow-xs" : "text-[#4B5563] hover:text-[#111827] hover:bg-[#F9FAFB]"
              }`}
            >
              {tab === "active" ? `Active Tickets (${activeCount})`
                : tab === "new" ? `New (${newCount})`
                : tab === "preparing" ? `Preparing (${preparingCount})`
                : tab === "ready" ? `Ready (${readyCount})`
                : `All History (${kots.length})`}
            </button>
          ))}
        </div>

        {/* ─── KOT TICKETS GRID ────────────────────────────────────── */}
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
                    isReady ? "border-emerald-300 ring-1 ring-emerald-200"
                    : isNew ? "border-amber-300 ring-1 ring-amber-200"
                    : "border-[#E5E7EB]"
                  }`}
                >
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
                      <h2 className="text-lg font-bold text-[#111827]">{kot.tableNumber || "Table"}</h2>
                      <span className="text-[11px] text-[#6B7280]">
                        Server: <strong className="text-[#374151]">{kot.serverName || "Staff"}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 flex-1 space-y-2">
                    {kot.items && kot.items.length > 0 ? (
                      kot.items.map((it, idx) => (
                        <div key={idx} className="flex items-start gap-2 py-1 border-b border-[#F9FAFB] last:border-0">
                          <span className="w-5 h-5 rounded bg-[#F3F4F6] text-[#111827] text-xs font-bold flex items-center justify-center shrink-0">
                            {it.quantity}
                          </span>
                          <div>
                            <p className="text-[13px] font-semibold text-[#111827] leading-snug">{it.name}</p>
                            {it.instructions && (
                              <p className="text-[11px] text-amber-700 font-medium italic mt-0.5">{it.instructions}</p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-[#9CA3AF] italic">No items detailed</p>
                    )}
                  </div>

                  <div className="p-3 bg-[#FAFAFA] border-t border-[#F3F4F6] rounded-b-lg flex items-center gap-2">
                    {isNew && (
                      <button
                        onClick={() => handleUpdateStatus(kot._id || kot.id || "", "preparing")}
                        className="w-full py-1.5 rounded text-xs font-bold bg-[#111827] hover:bg-[#1F2937] text-white flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                      >
                        <Flame className="w-3.5 h-3.5 text-amber-400" /> Start Preparing
                      </button>
                    )}
                    {isCooking && (
                      <button
                        onClick={() => handleUpdateStatus(kot._id || kot.id || "", "ready")}
                        className="w-full py-1.5 rounded text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                      >
                        <Bell className="w-3.5 h-3.5" /> Mark Ready for Pickup
                      </button>
                    )}
                    {isReady && (
                      <button
                        onClick={() => handleUpdateStatus(kot._id || kot.id || "", "served")}
                        className="w-full py-1.5 rounded text-xs font-semibold bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#374151] flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Mark Served to Guest
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
