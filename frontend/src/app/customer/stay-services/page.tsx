"use client";

import { useState } from "react";
import { posApi, housekeepingApi, maintenanceApi } from "@/lib/api";
import {
  Bell,
  Utensils,
  Sparkles,
  Wrench,
  Coffee,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
} from "lucide-react";

export default function StayServicesPage() {
  const [roomNumber, setRoomNumber] = useState("104");
  const [guestName, setGuestName] = useState("Guest");
  const [activeTab, setActiveTab] = useState<"dining" | "housekeeping" | "maintenance">("dining");
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Dining Menu Selection
  const [selectedItems, setSelectedItems] = useState<Array<{ name: string; price: number; count: number }>>([
    { name: "Club Sandwich with Fries", price: 350, count: 0 },
    { name: "Paneer Butter Masala & Naan", price: 450, count: 0 },
    { name: "Cappuccino / Espresso", price: 180, count: 0 },
    { name: "Fresh Cut Fruit Platter", price: 220, count: 0 },
    { name: "Gourmet Chicken Burger", price: 420, count: 0 },
  ]);

  // Housekeeping request
  const [hkRequestType, setHkRequestType] = useState("Extra Towels");
  const [hkNotes, setHkNotes] = useState("");

  // Maintenance request
  const [maintType, setMaintType] = useState("Air Conditioning");
  const [maintNotes, setMaintNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const notify = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice(null), 5000);
  };

  const handleOrderDining = async (e: React.FormEvent) => {
    e.preventDefault();
    const ordered = selectedItems.filter((i) => i.count > 0);
    if (ordered.length === 0) {
      notify("Please select at least 1 food or beverage item.");
      return;
    }

    const totalAmount = ordered.reduce((sum, i) => sum + i.price * i.count, 0);
    const itemNames = ordered.map((i) => `${i.count}x ${i.name}`).join(", ");

    setIsSubmitting(true);
    try {
      await posApi.chargeToRoom({
        roomNumber: roomNumber.trim(),
        amount: totalAmount,
        description: `Room Dining: ${itemNames}`,
      });

      notify(`🍽️ Dining Order Placed! ₹${totalAmount} charged to Room ${roomNumber}. Kitchen is preparing your meal.`);
      setSelectedItems((prev) => prev.map((item) => ({ ...item, count: 0 })));
    } catch (err: any) {
      notify(err?.message || "Failed to place dining order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHousekeepingRequest = async (e: React.FormEvent) => {
    e.preventDefault();
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

      notify(`🧹 Housekeeping dispatched: "${hkRequestType}" requested for Room ${roomNumber}.`);
      setHkNotes("");
    } catch (err: any) {
      notify("Failed to dispatch housekeeping. Please call front desk.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMaintenanceRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await maintenanceApi.createRequest({
        roomNumber: roomNumber.trim(),
        category: maintType,
        description: maintNotes || `${maintType} issue reported by guest`,
        priority: "urgent",
      });

      notify(`🔧 Maintenance ticket logged for Room ${roomNumber} (${maintType}). Technician notified.`);
      setMaintNotes("");
    } catch (err: any) {
      notify(err?.message || "Failed to log maintenance request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#EC3013]" /> In-Stay Room Services
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Order in-room dining, request extra amenities, or report room issues directly from your mobile device.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200">
          <span className="text-xs font-bold text-gray-700">Your Room:</span>
          <input
            type="text"
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            className="w-16 px-2 py-1 bg-white border border-gray-300 rounded font-mono font-bold text-center text-sm"
          />
        </div>
      </div>

      {statusNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusNotice}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab("dining")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "dining"
              ? "bg-[#111827] text-white shadow-xs"
              : "bg-white text-gray-600 border hover:bg-gray-50"
          }`}
        >
          <Utensils className="w-3.5 h-3.5 text-[#EC3013]" />
          <span>In-Room Dining</span>
        </button>

        <button
          onClick={() => setActiveTab("housekeeping")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "housekeeping"
              ? "bg-[#111827] text-white shadow-xs"
              : "bg-white text-gray-600 border hover:bg-gray-50"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>Housekeeping & Towels</span>
        </button>

        <button
          onClick={() => setActiveTab("maintenance")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "maintenance"
              ? "bg-[#111827] text-white shadow-xs"
              : "bg-white text-gray-600 border hover:bg-gray-50"
          }`}
        >
          <Wrench className="w-3.5 h-3.5 text-amber-500" />
          <span>Report Maintenance</span>
        </button>
      </div>

      {/* TAB 1: IN-ROOM DINING */}
      {activeTab === "dining" && (
        <form onSubmit={handleOrderDining} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="text-sm font-bold text-gray-900">Room Service Express Menu</h3>
            <span className="text-xs text-gray-500">Billed to Room #{roomNumber}</span>
          </div>

          <div className="divide-y divide-gray-100">
            {selectedItems.map((item, idx) => (
              <div key={idx} className="py-3 flex justify-between items-center">
                <div>
                  <span className="font-bold text-gray-900 text-xs">{item.name}</span>
                  <span className="text-xs text-gray-500 block">₹{item.price}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...selectedItems];
                      updated[idx].count = Math.max(0, updated[idx].count - 1);
                      setSelectedItems(updated);
                    }}
                    className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 font-bold text-sm flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-bold text-xs w-5 text-center">{item.count}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...selectedItems];
                      updated[idx].count += 1;
                      setSelectedItems(updated);
                    }}
                    className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 font-bold text-sm flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex justify-between items-center text-xs">
            <span className="font-bold text-gray-700">Total Order Amount:</span>
            <span className="text-base font-black text-[#EC3013]">
              ₹{selectedItems.reduce((acc, i) => acc + i.price * i.count, 0)}
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-[#EC3013] hover:bg-[#D62839] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Place Order & Charge to Room #{roomNumber}</span>
          </button>
        </form>
      )}

      {/* TAB 2: HOUSEKEEPING */}
      {activeTab === "housekeeping" && (
        <form onSubmit={handleHousekeepingRequest} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="border-b pb-3">
            <h3 className="text-sm font-bold text-gray-900">Request Housekeeping & Amenities</h3>
            <p className="text-xs text-gray-500">Delivered to Room #{roomNumber} within 15 minutes</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Service Type</label>
            <select
              value={hkRequestType}
              onChange={(e) => setHkRequestType(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-xl text-xs bg-white"
            >
              <option value="Extra Fresh Towels">Extra Fresh Bath Towels & Face Napkins</option>
              <option value="Room Cleaning / Linen Change">Full Room Sanitization & Linen Change</option>
              <option value="Toiletries & Drinking Water">Restock Toiletries, Soap & Bottled Water</option>
              <option value="Extra Pillows & Blankets">Extra Pillows & Warm Blanket</option>
              <option value="Trash Clearance">Clear Trash Cans</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Specific Instructions</label>
            <textarea
              rows={3}
              placeholder="e.g. Please ring bell twice, need 2 extra bath towels"
              value={hkNotes}
              onChange={(e) => setHkNotes(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-xl text-xs"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Request to Housekeeping</span>
          </button>
        </form>
      )}

      {/* TAB 3: MAINTENANCE */}
      {activeTab === "maintenance" && (
        <form onSubmit={handleMaintenanceRequest} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="border-b pb-3">
            <h3 className="text-sm font-bold text-gray-900">Report In-Room Maintenance Issue</h3>
            <p className="text-xs text-gray-500">Duty technician will be dispatched to Room #{roomNumber}</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Issue Category</label>
            <select
              value={maintType}
              onChange={(e) => setMaintType(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-xl text-xs bg-white"
            >
              <option value="Air Conditioning">Air Conditioning (Not Cooling / Remote issue)</option>
              <option value="Plumbing & Geyser">Bathroom Plumbing / Hot Water Geyser</option>
              <option value="Electrical & Lighting">Lighting / Power Socket Malfunction</option>
              <option value="TV & WiFi">TV / Cable / High-Speed WiFi</option>
              <option value="Door Lock & Key">Door Lock / Electronic Key Card</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Issue Description</label>
            <textarea
              rows={3}
              placeholder="e.g. Water is not hot in the shower, please inspect immediately"
              value={maintNotes}
              onChange={(e) => setMaintNotes(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-xl text-xs"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Dispatch Maintenance Technician</span>
          </button>
        </form>
      )}
    </div>
  );
}
