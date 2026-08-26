"use client";

import { useState } from "react";

export default function RestaurantPOSPage() {
  const [tables, setTables] = useState([
    { id: "T1", status: "Available" },
    { id: "T2", status: "Occupied" },
    { id: "T3", status: "Reserved" },
    { id: "T4", status: "Occupied" },
    { id: "T5", status: "Available" },
    { id: "T6", status: "Occupied" },
    { id: "T7", status: "Cleaning" },
    { id: "T8", status: "Available" },
    { id: "T9", status: "Occupied" },
  ]);

  const [orders, setOrders] = useState([
    {
      id: "ORD-3312",
      table: "T2",
      items: "2 items",
      status: "Preparing",
      amount: "$42.00",
    },
    {
      id: "ORD-3313",
      table: "T4",
      items: "4 items",
      status: "Ready",
      amount: "$78.50",
    },
    {
      id: "ORD-3314",
      table: "T6",
      items: "1 item",
      status: "Served",
      amount: "$16.00",
    },
    {
      id: "ORD-3315",
      table: "T9",
      items: "3 items",
      status: "New",
      amount: "$55.00",
    },
  ]);

  const getTableStripe = (status: string) => {
    switch (status) {
      case "Occupied":
        return "border-l-4 border-l-[#E63946]";
      case "Reserved":
        return "border-l-4 border-l-[#8B0000]";
      case "Cleaning":
        return "border-l-4 border-l-[#1F2937]";
      case "Available":
      default:
        return "border-l-4 border-l-[#9CA3AF]";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-[#111827] tracking-tight">
          Restaurant POS
        </h1>
        <p className="text-[14px] text-[#6B7280] mt-1">
          Tables and active orders
        </p>
      </div>

      {/* Two Columns: Tables Grid & Active Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Tables Grid (6 cols) */}
        <div className="lg:col-span-6">
          <h2 className="text-[16px] font-bold text-[#111827] mb-4">
            Tables
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {tables.map((t) => (
              <div
                key={t.id}
                className={`bg-white p-5 rounded-md border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.03)] text-center ${getTableStripe(
                  t.status
                )}`}
              >
                <div className="text-[16px] font-bold text-[#111827]">{t.id}</div>
                <div className="text-[12px] text-[#6B7280] mt-1">{t.status}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Active Orders Table (6 cols) */}
        <div className="lg:col-span-6">
          <h2 className="text-[16px] font-bold text-[#111827] mb-4">
            Active Orders
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                  <th className="pb-3 pr-4 font-bold">ORDER</th>
                  <th className="pb-3 pr-4 font-bold">TABLE</th>
                  <th className="pb-3 pr-4 font-bold">ITEMS</th>
                  <th className="pb-3 pr-4 font-bold">STATUS</th>
                  <th className="pb-3 text-right font-bold">AMOUNT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6] text-[14px]">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#F9FAFB]/60 transition-colors">
                    <td className="py-4 pr-4 font-medium text-[#111827]">
                      {ord.id}
                    </td>
                    <td className="py-4 pr-4 text-[#4B5563]">{ord.table}</td>
                    <td className="py-4 pr-4 text-[#4B5563]">{ord.items}</td>
                    <td className="py-4 pr-4">
                      {ord.status === "Preparing" && (
                        <span className="text-[12px] text-[#E63946] bg-[#FDE8E8] px-2.5 py-1 rounded-sm font-medium">
                          Preparing
                        </span>
                      )}
                      {ord.status === "Ready" && (
                        <span className="text-[12px] text-[#4B5563]">
                          Ready
                        </span>
                      )}
                      {ord.status === "Served" && (
                        <span className="text-[12px] text-[#E63946] border border-[#E63946]/50 bg-[#FFF5F5] px-2.5 py-0.5 rounded-sm font-medium">
                          Served
                        </span>
                      )}
                      {ord.status === "New" && (
                        <span className="text-[12px] text-[#E63946] font-medium">
                          New
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-right font-medium text-[#111827]">
                      {ord.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
