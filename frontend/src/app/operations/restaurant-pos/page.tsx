"use client";

import { useState, useEffect } from "react";
import { posApi } from "@/lib/api";
import { RestaurantOrder } from "@/types";
import { Utensils, Plus, CheckCircle2, X, RefreshCw, Clock, DollarSign } from "lucide-react";

export default function RestaurantPOSPage() {
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Table layout
  const [tables, setTables] = useState([
    { id: "T1", status: "occupied", orderId: "ORD-3312" },
    { id: "T2", status: "occupied", orderId: "ORD-3315" },
    { id: "T3", status: "available" },
    { id: "T4", status: "occupied", orderId: "ORD-3313" },
    { id: "T5", status: "available" },
    { id: "T6", status: "occupied", orderId: "ORD-3314" },
    { id: "T7", status: "available" },
    { id: "T8", status: "reserved" },
    { id: "T9", status: "available" },
  ]);

  const [newOrder, setNewOrder] = useState({
    tableNumber: "T3",
    roomNumber: "204",
    items: "Club Sandwich, Fresh Lime Soda",
    total: 35.0,
  });

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const data = await posApi.getOrders();
      setOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await posApi.createOrder({
        tableNumber: newOrder.tableNumber,
        roomNumber: newOrder.roomNumber,
        items: newOrder.items.split(",").map((s) => s.trim()),
        total: Number(newOrder.total),
        status: "cooking",
      });

      setOrders([created, ...orders]);
      // Mark table occupied
      setTables(
        tables.map((t) =>
          t.id === newOrder.tableNumber ? { ...t, status: "occupied", orderId: created.id } : t
        )
      );

      setIsModalOpen(false);
      setToastMsg(`✅ Order ${created.id} for Table ${created.tableNumber} sent to Kitchen`);
      setTimeout(() => setToastMsg(null), 3500);
    } catch (e) {
      console.error(e);
    }
  };

  const advanceOrderStatus = (orderId: string) => {
    setOrders(
      orders.map((o) => {
        if (o.id !== orderId) return o;
        if (o.status === "cooking" || o.status === "preparing") return { ...o, status: "ready" };
        if (o.status === "ready") return { ...o, status: "served" };
        if (o.status === "served") return { ...o, status: "paid" };
        return o;
      })
    );
    setToastMsg(`Order ${orderId} status advanced`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case "cooking":
      case "preparing":
        return <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Preparing</span>;
      case "ready":
        return <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">Ready for Pickup</span>;
      case "served":
        return <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">Served</span>;
      case "paid":
        return <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Paid</span>;
      default:
        return <span className="text-[11px] font-bold text-gray-700 bg-gray-50 px-2 py-0.5 rounded border">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#111827] tracking-tight">
            Restaurant POS & Dining
          </h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            Table management, active dining orders, and room service folios
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadOrders}
            title="Refresh"
            className="p-2 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] rounded text-[#4B5563] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#EC3013]" : ""}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white text-[13px] font-bold rounded shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Dining Order</span>
          </button>
        </div>
      </div>

      {/* Toast Notice */}
      {toastMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-[13px] px-4 py-2.5 rounded flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Grid: Tables & Active Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Table Map (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-bold text-[#111827]">
              Dining Floor Tables
            </h2>
            <span className="text-[11px] font-semibold text-[#6B7280]">
              {tables.filter((t) => t.status === "occupied").length} / {tables.length} Seated
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-1">
            {tables.map((tb) => {
              const isOccupied = tb.status === "occupied";
              const isReserved = tb.status === "reserved";

              return (
                <div
                  key={tb.id}
                  className={`p-3.5 rounded-md border-2 text-center transition-all ${
                    isOccupied
                      ? "border-blue-500 bg-blue-50 text-blue-900"
                      : isReserved
                      ? "border-amber-500 bg-amber-50 text-amber-900"
                      : "border-emerald-500 bg-emerald-50 text-emerald-900"
                  }`}
                >
                  <div className="text-[15px] font-black">{tb.id}</div>
                  <div className="text-[11px] font-semibold uppercase mt-0.5 opacity-80">
                    {tb.status}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Active Kitchen & Dining Orders (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-lg border border-[#E5E7EB] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between">
            <h2 className="text-[14px] font-bold text-[#111827]">
              Active Kitchen & Dining Orders ({orders.length})
            </h2>
            <span className="text-[11px] text-[#6B7280]">Real-time queue</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider bg-white">
                  <th className="py-2.5 px-4 font-bold">ORDER</th>
                  <th className="py-2.5 px-4 font-bold">TABLE / ROOM</th>
                  <th className="py-2.5 px-4 font-bold">ITEMS</th>
                  <th className="py-2.5 px-4 font-bold">STATUS</th>
                  <th className="py-2.5 px-4 text-right font-bold">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#9CA3AF]">
                      No active restaurant orders
                    </td>
                  </tr>
                ) : (
                  orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#111827]">
                        {ord.id}
                      </td>
                      <td className="py-3 px-4 text-[#374151] font-semibold">
                        <div>{ord.tableNumber}</div>
                        {ord.roomNumber && (
                          <div className="text-[11px] text-[#9CA3AF]">Room {ord.roomNumber}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#4B5563]">
                        <div className="truncate max-w-[180px]">
                          {Array.isArray(ord.items) ? ord.items.join(", ") : ord.items}
                        </div>
                        <div className="text-[11px] font-bold text-[#111827] mt-0.5">
                          ${ord.total}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getOrderStatusBadge(ord.status)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {ord.status !== "paid" ? (
                          <button
                            type="button"
                            onClick={() => advanceOrderStatus(ord.id)}
                            className="px-3 py-1 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#111827] text-[11px] font-bold rounded shadow-xs cursor-pointer transition-colors"
                          >
                            {ord.status === "cooking" || ord.status === "preparing"
                              ? "Mark Ready"
                              : ord.status === "ready"
                              ? "Mark Served"
                              : "Close Bill"}
                          </button>
                        ) : (
                          <span className="text-[11px] font-semibold text-emerald-700">Settled</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* New Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-[#EC3013]" />
                <h3 className="text-[16px] font-bold text-[#111827]">New Restaurant Order</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#9CA3AF] hover:text-[#111827] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4 text-[13px]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Table Number
                  </label>
                  <select
                    value={newOrder.tableNumber}
                    onChange={(e) => setNewOrder({ ...newOrder, tableNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded bg-white"
                  >
                    <option value="T1">Table T1</option>
                    <option value="T2">Table T2</option>
                    <option value="T3">Table T3</option>
                    <option value="T4">Table T4</option>
                    <option value="T5">Table T5</option>
                    <option value="T6">Table T6</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Charge to Room (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 204"
                    value={newOrder.roomNumber}
                    onChange={(e) => setNewOrder({ ...newOrder, roomNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                  Ordered Items (comma-separated) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ribeye Steak, Truffle Fries, Merlot"
                  value={newOrder.items}
                  onChange={(e) => setNewOrder({ ...newOrder, items: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                  Total Amount ($)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={newOrder.total}
                  onChange={(e) => setNewOrder({ ...newOrder, total: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#D1D5DB] rounded text-[#374151] font-semibold hover:bg-[#F3F4F6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white font-bold rounded shadow-xs"
                >
                  Send to Kitchen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
