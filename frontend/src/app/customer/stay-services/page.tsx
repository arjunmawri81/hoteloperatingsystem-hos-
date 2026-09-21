"use client";

import { useState, useEffect } from "react";
import { posApi, reservationsApi, housekeepingApi, maintenanceApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { MenuItem, Reservation } from "@/types";
import {
  Bell,
  Utensils,
  Sparkles,
  Wrench,
  CheckCircle2,
  Clock,
  Send,
  Search,
  Plus,
  Minus,
  ChefHat,
  Receipt,
  RotateCcw,
  AlertCircle,
  Building,
} from "lucide-react";

export default function StayServicesPage() {
  const { user } = useAuth();

  // Guest & Room state
  const [roomNumber, setRoomNumber] = useState("104");
  const [guestName, setGuestName] = useState(user?.name || "Guest");
  const [activeReservation, setActiveReservation] = useState<Reservation | null>(null);

  // Tabs & Notifications
  const [activeTab, setActiveTab] = useState<"dining" | "housekeeping" | "maintenance">("dining");
  const [statusNotice, setStatusNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Live Menu Catalog state
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [cartQuantities, setCartQuantities] = useState<{ [itemId: string]: number }>({});
  const [cookingNotes, setCookingNotes] = useState("");
  const [diningOrderPlaced, setDiningOrderPlaced] = useState<{
    orderId: string;
    kotNumber: string;
    items: Array<{ name: string; qty: number; price: number }>;
    total: number;
    roomNumber: string;
    placedAt: string;
  } | null>(null);

  // Housekeeping request state
  const [hkRequestType, setHkRequestType] = useState("Extra Fresh Towels");
  const [hkNotes, setHkNotes] = useState("");

  // Maintenance request state
  const [maintType, setMaintType] = useState("Air Conditioning");
  const [maintNotes, setMaintNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const notify = (message: string, type: "success" | "error" = "success") => {
    setStatusNotice({ message, type });
    setTimeout(() => setStatusNotice(null), 5000);
  };

  // 1. Load Live Menu from Restaurant POS Database
  useEffect(() => {
    async function loadMenu() {
      setIsLoadingMenu(true);
      try {
        const data = await posApi.getMenu();
        setMenuItems(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load restaurant menu:", err);
      } finally {
        setIsLoadingMenu(false);
      }
    }
    loadMenu();
  }, []);

  // 2. Automatically link logged-in guest to their active reservation/room
  useEffect(() => {
    async function loadGuestReservation() {
      if (!user?.email && !user?.name) return;
      try {
        const resList = await reservationsApi.getAll();
        if (Array.isArray(resList) && resList.length > 0) {
          // Look for checked_in or confirmed booking matching guest
          const match = resList.find(
            (r) =>
              (user?.email && r.guestEmail?.toLowerCase() === user.email.toLowerCase()) ||
              (user?.name && r.guestName?.toLowerCase().includes(user.name.toLowerCase()))
          );
          if (match) {
            setActiveReservation(match);
            if (match.roomNumber) {
              setRoomNumber(match.roomNumber.replace(/room\s*/i, "").trim());
            }
            if (match.guestName) {
              setGuestName(match.guestName);
            }
          }
        }
      } catch (e) {
        console.error("Could not fetch active reservation:", e);
      }
    }
    loadGuestReservation();
  }, [user?.email, user?.name]);

  // Derived category list
  const categories = [
    "All",
    ...Array.from(new Set(menuItems.map((m) => m.category).filter(Boolean))),
  ];

  // Filtered menu items
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesCategory =
      selectedCategory === "All" ||
      String(item.category || "").toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      !searchQuery.trim() ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Cart operations
  const updateQuantity = (itemId: string, delta: number) => {
    setCartQuantities((prev) => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: next };
    });
  };

  const selectedItemsList = Object.entries(cartQuantities)
    .map(([id, qty]) => {
      const dish = menuItems.find((m) => (m._id || m.id || m.name) === id);
      return dish ? { dish, qty, subtotal: dish.price * qty } : null;
    })
    .filter(Boolean) as Array<{ dish: MenuItem; qty: number; subtotal: number }>;

  const totalAmount = selectedItemsList.reduce((sum, item) => sum + item.subtotal, 0);
  const totalItemsCount = selectedItemsList.reduce((sum, item) => sum + item.qty, 0);

  // Handle Dining Order submission (Links POS KOT + Room Folio Charge)
  const handleOrderDining = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItemsList.length === 0) {
      notify("Please select at least 1 dish from the menu to place an order.", "error");
      return;
    }

    if (!roomNumber.trim()) {
      notify("Please enter your Room Number.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const itemsPayload = selectedItemsList.map(({ dish, qty }) => ({
        name: dish.name,
        quantity: qty,
        instructions: cookingNotes.trim() || "",
      }));

      // 1. Create live POS Order + Kitchen KOT
      const orderPayload = {
        tableNumber: `Room ${roomNumber.trim()}`,
        roomNumber: roomNumber.trim(),
        guestName: guestName.trim() || user?.name || "In-Stay Guest",
        items: itemsPayload,
        total: totalAmount,
        status: "cooking",
      };

      const orderRes = await posApi.createOrder(orderPayload);
      const generatedOrderId = orderRes?.data?.id || `ORD-${Date.now().toString().slice(-4)}`;
      const generatedKot = orderRes?.kot?.kotNumber || `KOT-${Math.floor(1000 + Math.random() * 9000)}`;

      // 2. Post charge directly to guest's room folio
      try {
        await posApi.chargeToRoom({
          roomNumber: roomNumber.trim(),
          amount: totalAmount,
          description: `In-Room Dining: ${selectedItemsList.map((i) => `${i.qty}x ${i.dish.name}`).join(", ")}`,
        });
      } catch (folioErr) {
        console.warn("Folio posting note:", folioErr);
      }

      setDiningOrderPlaced({
        orderId: generatedOrderId,
        kotNumber: generatedKot,
        items: selectedItemsList.map((i) => ({
          name: i.dish.name,
          qty: i.qty,
          price: i.dish.price,
        })),
        total: totalAmount,
        roomNumber: roomNumber.trim(),
        placedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });

      setCartQuantities({});
      setCookingNotes("");
      notify(`🍽️ Order placed! ₹${totalAmount} posted to Room ${roomNumber}. Kitchen is preparing your meal.`);
    } catch (err: any) {
      notify(err?.message || "Failed to place dining order. Please contact Front Desk.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Housekeeping Request
  const handleHousekeepingRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNumber.trim()) {
      notify("Please provide your room number.", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      await housekeepingApi.createTask({
        roomNumber: roomNumber.trim(),
        priority: "high",
        status: "cleaning",
        floor: Number(roomNumber[0]) || 1,
        assignedTo: "Duty Staff",
        notes: `${hkRequestType}${hkNotes ? `: ${hkNotes}` : ""}`,
      });

      notify(`🧹 Housekeeping dispatched: "${hkRequestType}" for Room ${roomNumber}.`);
      setHkNotes("");
    } catch (err: any) {
      notify("Failed to dispatch housekeeping. Please call front desk.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Maintenance Request
  const handleMaintenanceRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNumber.trim()) {
      notify("Please provide your room number.", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      await maintenanceApi.createRequest({
        roomNumber: roomNumber.trim(),
        category: maintType,
        description: maintNotes || `${maintType} issue reported by guest`,
        priority: "urgent",
      });

      notify(`🔧 Maintenance ticket logged for Room ${roomNumber} (${maintType}). Duty technician notified.`);
      setMaintNotes("");
    } catch (err: any) {
      notify(err?.message || "Failed to log maintenance request.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-50 text-[#EC3013] rounded-xl">
              <Bell className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#111827] tracking-tight">
              In-Stay Room Services
            </h1>
          </div>
          <p className="text-xs text-[#6B7280] mt-1.5">
            Order in-room dining from the hotel restaurant, request extra amenities, or report room issues.
          </p>
          {activeReservation && (
            <div className="mt-2 flex items-center gap-2 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80 inline-flex">
              <Building className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                Active Stay: Room {roomNumber} • {activeReservation.roomType} ({activeReservation.guestName})
              </span>
            </div>
          )}
        </div>

        {/* Room & Guest Details */}
        <div className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-200 shrink-0">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-500 block">Your Room</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-bold text-gray-700">#</span>
              <input
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="104"
                className="w-16 px-2 py-1 bg-white border border-gray-300 rounded-lg font-mono font-bold text-center text-sm text-[#111827] outline-none focus:border-[#EC3013]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Notification */}
      {statusNotice && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 animate-in fade-in ${
            statusNotice.type === "success"
              ? "bg-emerald-50 border border-emerald-300 text-emerald-800"
              : "bg-red-50 border border-red-300 text-red-800"
          }`}
        >
          {statusNotice.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span className="font-medium">{statusNotice.message}</span>
        </div>
      )}

      {/* Segmented Navigation Tabs */}
      <div className="flex gap-2 border-b border-[#E5E7EB] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("dining")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === "dining"
              ? "bg-[#111827] text-white shadow-xs"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <Utensils className="w-3.5 h-3.5 text-[#EC3013]" />
          <span>In-Room Dining</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-500/20 text-red-300 font-normal">
            Live Menu
          </span>
        </button>

        <button
          onClick={() => setActiveTab("housekeeping")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === "housekeeping"
              ? "bg-[#111827] text-white shadow-xs"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>Housekeeping &amp; Amenities</span>
        </button>

        <button
          onClick={() => setActiveTab("maintenance")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === "maintenance"
              ? "bg-[#111827] text-white shadow-xs"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <Wrench className="w-3.5 h-3.5 text-amber-500" />
          <span>Report Maintenance</span>
        </button>
      </div>

      {/* ----------------- TAB 1: IN-ROOM DINING (LIVE RESTAURANT MENU) ----------------- */}
      {activeTab === "dining" && (
        <div className="space-y-6">
          {/* Active Order Tracking Card (If Placed) */}
          {diningOrderPlaced && (
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-700 animate-in fade-in space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/80 pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                    <ChefHat className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                      Order Sent to Kitchen
                    </span>
                    <h3 className="text-base font-black text-white mt-0.5">
                      Preparing Your Meal for Room #{diningOrderPlaced.roomNumber}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setDiningOrderPlaced(null)}
                  className="self-start sm:self-auto text-xs text-slate-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Order More Food</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
                <div>
                  <span className="text-[10px] text-slate-400 block">KOT Ticket</span>
                  <span className="font-mono font-bold text-orange-400">{diningOrderPlaced.kotNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Order ID</span>
                  <span className="font-mono font-bold text-slate-200">#{diningOrderPlaced.orderId}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Placed At</span>
                  <span className="font-semibold text-slate-200">{diningOrderPlaced.placedAt}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Bill Status</span>
                  <span className="font-bold text-emerald-400">Charged to Room Folio</span>
                </div>
              </div>

              {/* Items summary */}
              <div className="space-y-1.5 text-xs text-slate-300 pt-1">
                <span className="font-bold text-[11px] text-slate-400 uppercase tracking-wider block mb-1">
                  Ordered Items:
                </span>
                {diningOrderPlaced.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-800/80">
                    <span className="font-medium text-slate-200">{it.qty}x {it.name}</span>
                    <span className="font-mono text-slate-300">₹{it.price * it.qty}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 font-bold text-sm text-white">
                  <span>Total Amount:</span>
                  <span className="font-mono text-orange-400">₹{diningOrderPlaced.total}</span>
                </div>
              </div>
            </div>
          )}

          {/* Restaurant Menu Selection Form */}
          <form onSubmit={handleOrderDining} className="space-y-5">
            {/* Search and Category Filters */}
            <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search dishes (e.g. Paneer, Biryani, Mojito)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-[#D1D5DB] rounded-xl bg-white text-[#111827] focus:ring-2 focus:ring-red-500/20 focus:border-[#EC3013] outline-none"
                  />
                </div>

                <div className="text-xs text-gray-500 shrink-0 font-medium">
                  {filteredMenuItems.length} dishes available
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                      selectedCategory === cat
                        ? "bg-[#EC3013] text-white shadow-xs"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items Grid */}
            {isLoadingMenu ? (
              <div className="py-16 text-center text-gray-400 text-xs bg-white rounded-2xl border border-gray-200">
                <ChefHat className="w-8 h-8 text-gray-300 animate-bounce mx-auto mb-2" />
                <span>Loading gourmet restaurant menu...</span>
              </div>
            ) : filteredMenuItems.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs bg-white rounded-2xl border border-gray-200">
                No menu items found matching your filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredMenuItems.map((dish) => {
                  const dishId = dish._id || dish.id || dish.name;
                  const count = cartQuantities[dishId] || 0;
                  const isOut = dish.isAvailable === false;

                  return (
                    <div
                      key={dishId}
                      className={`bg-white border rounded-2xl p-3.5 shadow-xs transition-all flex items-center justify-between gap-3 ${
                        isOut
                          ? "border-red-200 bg-red-50/30 opacity-60"
                          : count > 0
                          ? "border-[#EC3013]/50 ring-1 ring-[#EC3013]/20"
                          : "border-[#E5E7EB] hover:border-[#CBD5E1]"
                      }`}
                    >
                      {/* Dish Photo Thumbnail */}
                      <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-gray-100 bg-gray-50 relative">
                        {dish.image ? (
                          <img
                            src={dish.image}
                            alt={dish.name}
                            className={`w-full h-full object-cover ${isOut ? "grayscale" : ""}`}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-100 p-1 text-center">
                            <Utensils className="w-5 h-5 stroke-[1.5] text-gray-300 mb-0.5" />
                            <span className="text-[9px] font-medium text-gray-400">Dining</span>
                          </div>
                        )}
                        {isOut && (
                          <div className="absolute inset-0 bg-red-900/60 backdrop-blur-[1px] flex items-center justify-center">
                            <span className="text-[9px] font-black text-white uppercase tracking-wider">
                              Sold Out
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Dish Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center p-0.5 shrink-0 ${
                              dish.isVeg ? "border-emerald-600" : "border-rose-600"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                dish.isVeg ? "bg-emerald-600" : "bg-rose-600"
                              }`}
                            />
                          </span>
                          <h4 className="font-bold text-xs text-[#111827] truncate" title={dish.name}>
                            {dish.name}
                          </h4>
                        </div>

                        {dish.description && (
                          <p className="text-[11px] text-[#6B7280] line-clamp-1 mb-1.5">
                            {dish.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold text-xs text-[#111827]">
                            ₹{dish.price}
                          </span>
                          <span className="text-[10px] text-gray-400 px-1.5 py-0.5 bg-gray-100 rounded font-medium">
                            {dish.category}
                          </span>
                          {dish.prepTimeMinutes && (
                            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" /> {dish.prepTimeMinutes}m
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="shrink-0 flex flex-col items-end justify-center">
                        {isOut ? (
                          <span className="text-[11px] font-bold text-red-600">86 (Out)</span>
                        ) : count === 0 ? (
                          <button
                            type="button"
                            onClick={() => updateQuantity(dishId, 1)}
                            className="px-3.5 py-1.5 bg-white border border-[#EC3013] text-[#EC3013] hover:bg-red-50 text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                          >
                            + ADD
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-xl p-1">
                            <button
                              type="button"
                              onClick={() => updateQuantity(dishId, -1)}
                              className="w-6 h-6 rounded-lg bg-white border border-red-200 text-red-700 flex items-center justify-center font-bold text-xs hover:bg-red-100 cursor-pointer"
                            >
                              -
                            </button>
                            <span className="font-bold text-xs text-red-900 w-4 text-center font-mono">
                              {count}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(dishId, 1)}
                              className="w-6 h-6 rounded-lg bg-[#EC3013] text-white flex items-center justify-center font-bold text-xs hover:bg-[#D62839] cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Special Instructions & Folio Checkout */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#374151] uppercase tracking-wider mb-1">
                  Special Cooking Instructions &amp; Dietary Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Less spicy, send extra cutlery, deliver hot at 8:15 PM..."
                  value={cookingNotes}
                  onChange={(e) => setCookingNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-xl text-xs text-[#111827] focus:ring-2 focus:ring-red-500/20 focus:border-[#EC3013] outline-none"
                />
              </div>

              {/* Order Summary & Pricing */}
              <div className="p-4 bg-gray-50/90 rounded-xl border border-gray-200 space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-600 font-medium">
                    Selected Items ({totalItemsCount} dishes):
                  </span>
                  <span className="font-semibold text-gray-900">
                    {totalItemsCount === 0 ? "No dishes selected" : `${totalItemsCount} items`}
                  </span>
                </div>

                {selectedItemsList.length > 0 && (
                  <div className="space-y-1 py-2 border-y border-gray-200 max-h-28 overflow-y-auto">
                    {selectedItemsList.map(({ dish, qty, subtotal }) => (
                      <div key={dish._id || dish.id || dish.name} className="flex justify-between text-xs">
                        <span className="text-gray-800 font-medium">
                          {qty}x {dish.name}
                        </span>
                        <span className="font-mono text-gray-700">₹{subtotal}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center pt-1 text-sm font-bold text-[#111827]">
                  <div className="flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-[#EC3013]" />
                    <span>Total Bill (Charged to Room #{roomNumber}):</span>
                  </div>
                  <span className="font-mono text-base text-[#EC3013]">₹{totalAmount}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || totalAmount === 0}
                className="w-full py-3.5 bg-[#EC3013] hover:bg-[#D62839] text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? "Sending to Kitchen..."
                    : `Place Order & Charge ₹${totalAmount} to Room #${roomNumber}`}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ----------------- TAB 2: HOUSEKEEPING & TOWELS ----------------- */}
      {activeTab === "housekeeping" && (
        <form
          onSubmit={handleHousekeepingRequest}
          className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-4"
        >
          <div className="border-b border-[#E5E7EB] pb-3">
            <h3 className="text-sm font-bold text-[#111827]">Request Housekeeping &amp; Amenities</h3>
            <p className="text-xs text-[#6B7280]">
              Dispatched to Room #{roomNumber} within 15 minutes by housekeeping team
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#374151] mb-1">Service Type</label>
            <select
              value={hkRequestType}
              onChange={(e) => setHkRequestType(e.target.value)}
              className="w-full p-2.5 border border-[#D1D5DB] rounded-xl text-xs bg-white text-[#111827] outline-none"
            >
              <option value="Extra Fresh Towels">Extra Fresh Bath Towels &amp; Face Napkins</option>
              <option value="Room Cleaning / Linen Change">Full Room Sanitization &amp; Linen Change</option>
              <option value="Toiletries & Drinking Water">Restock Toiletries, Soap &amp; Bottled Water</option>
              <option value="Extra Pillows & Blankets">Extra Pillows &amp; Warm Blanket</option>
              <option value="Trash Clearance">Clear Trash Cans</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#374151] mb-1">Specific Instructions</label>
            <textarea
              rows={3}
              placeholder="e.g. Please ring bell twice, need 2 extra bath towels"
              value={hkNotes}
              onChange={(e) => setHkNotes(e.target.value)}
              className="w-full p-2.5 border border-[#D1D5DB] rounded-xl text-xs text-[#111827] outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Request to Housekeeping</span>
          </button>
        </form>
      )}

      {/* ----------------- TAB 3: MAINTENANCE ----------------- */}
      {activeTab === "maintenance" && (
        <form
          onSubmit={handleMaintenanceRequest}
          className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-4"
        >
          <div className="border-b border-[#E5E7EB] pb-3">
            <h3 className="text-sm font-bold text-[#111827]">Report In-Room Maintenance Issue</h3>
            <p className="text-xs text-[#6B7280]">
              Duty technician will be dispatched to Room #{roomNumber}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#374151] mb-1">Issue Category</label>
            <select
              value={maintType}
              onChange={(e) => setMaintType(e.target.value)}
              className="w-full p-2.5 border border-[#D1D5DB] rounded-xl text-xs bg-white text-[#111827] outline-none"
            >
              <option value="Air Conditioning">Air Conditioning (Not Cooling / Remote issue)</option>
              <option value="Plumbing & Geyser">Bathroom Plumbing / Hot Water Geyser</option>
              <option value="Electrical & Lighting">Lighting / Power Socket Malfunction</option>
              <option value="TV & WiFi">TV / Cable / High-Speed WiFi</option>
              <option value="Door Lock & Key">Door Lock / Electronic Key Card</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#374151] mb-1">Issue Description</label>
            <textarea
              rows={3}
              placeholder="e.g. Water is not hot in the shower, please inspect immediately"
              value={maintNotes}
              onChange={(e) => setMaintNotes(e.target.value)}
              className="w-full p-2.5 border border-[#D1D5DB] rounded-xl text-xs text-[#111827] outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Dispatch Maintenance Technician</span>
          </button>
        </form>
      )}
    </div>
  );
}
