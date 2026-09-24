"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  DollarSign,
  BedDouble,
  Users,
  Download,
  Calendar,
  Layers,
  PieChart,
  FileSpreadsheet,
} from "lucide-react";

interface KPIData {
  kpis: {
    totalRooms: number;
    occupiedRooms: number;
    availableRooms: number;
    dirtyRooms: number;
    maintenanceRooms: number;
    occupancyRate: string;
    adr: string;
    revPar: string;
    totalRevenue: string;
    leadConversionRate: string;
  };
  departmentRevenue: {
    rooms: number;
    restaurant: number;
    banquet: number;
    total: number;
  };
}

export default function ReportsAndKPIsPage() {
  const [data, setData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchKPIs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/reports/kpis?hotelId=hotel-101");
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKPIs();
  }, []);

  const handleExportCSV = () => {
    window.open("/api/reports/export/reservations", "_blank");
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Executive Reports &amp; Analytics Hub
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Real-time hotel performance metrics: Occupancy, ADR, RevPAR, and departmental revenues.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition-transform hover:scale-105"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Export Reservations (CSV)
        </button>
      </div>

      {/* Primary KPI Grid (Vibrant Reference Style - Red, Green, Orange, Cyan) */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="relative overflow-hidden bg-[#E53935] hover:bg-[#D32F2F] p-6 rounded-xl text-white shadow-lg shadow-red-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 group">
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <div className="text-[34px] font-extrabold tracking-tight leading-none text-white drop-shadow-xs">
                  {data.kpis.occupancyRate}
                </div>
                <div className="text-[12px] font-semibold text-white/90 uppercase tracking-wide">
                  Occupancy Rate
                </div>
                <div className="text-[11px] text-white/75 font-medium truncate max-w-[150px]">
                  {data.kpis.occupiedRooms} Occupied / {data.kpis.totalRooms} Total
                </div>
              </div>
              <div className="w-14 h-14 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10 text-white/90 shrink-0 group-hover:scale-105 group-hover:bg-white/20 transition-all">
                <BedDouble className="w-7 h-7 stroke-[2]" />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden bg-[#43A047] hover:bg-[#388E3C] p-6 rounded-xl text-white shadow-lg shadow-green-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 group">
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <div className="text-[34px] font-extrabold tracking-tight leading-none text-white drop-shadow-xs">
                  {data.kpis.adr}
                </div>
                <div className="text-[12px] font-semibold text-white/90 uppercase tracking-wide">
                  Average Daily Rate (ADR)
                </div>
                <div className="text-[11px] text-white/75 font-medium truncate max-w-[150px]">
                  Avg revenue per sold room
                </div>
              </div>
              <div className="w-14 h-14 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10 text-white/90 shrink-0 group-hover:scale-105 group-hover:bg-white/20 transition-all">
                <DollarSign className="w-7 h-7 stroke-[2]" />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden bg-[#FB8C00] hover:bg-[#F57C00] p-6 rounded-xl text-white shadow-lg shadow-orange-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 group">
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <div className="text-[34px] font-extrabold tracking-tight leading-none text-white drop-shadow-xs">
                  {data.kpis.revPar}
                </div>
                <div className="text-[12px] font-semibold text-white/90 uppercase tracking-wide">
                  RevPAR Performance
                </div>
                <div className="text-[11px] text-white/75 font-medium truncate max-w-[150px]">
                  Revenue per available room
                </div>
              </div>
              <div className="w-14 h-14 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10 text-white/90 shrink-0 group-hover:scale-105 group-hover:bg-white/20 transition-all">
                <TrendingUp className="w-7 h-7 stroke-[2]" />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden bg-[#00ACC1] hover:bg-[#0097A7] p-6 rounded-xl text-white shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 group">
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <div className="text-[34px] font-extrabold tracking-tight leading-none text-white drop-shadow-xs">
                  {data.kpis.totalRevenue}
                </div>
                <div className="text-[12px] font-semibold text-white/90 uppercase tracking-wide">
                  Gross Hotel Revenue
                </div>
                <div className="text-[11px] text-white/75 font-medium truncate max-w-[150px]">
                  Conversion: {data.kpis.leadConversionRate}
                </div>
              </div>
              <div className="w-14 h-14 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10 text-white/90 shrink-0 group-hover:scale-105 group-hover:bg-white/20 transition-all">
                <PieChart className="w-7 h-7 stroke-[2]" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Departmental Revenue Breakdown */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm lg:col-span-2">
            <h2 className="text-base font-black text-slate-900">Departmental Revenue Split</h2>
            <p className="text-xs text-slate-500 mt-0.5">Realized income from Rooms, Dining POS, and Banquets.</p>

            <div className="mt-6 space-y-4 text-xs">
              <div>
                <div className="flex justify-between font-bold mb-1.5">
                  <span className="text-slate-700">Room Accommodation</span>
                  <span className="text-slate-900">₹{data.departmentRevenue.rooms.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full"
                    style={{
                      width: `${
                        data.departmentRevenue.total > 0
                          ? ((data.departmentRevenue.rooms / data.departmentRevenue.total) * 100).toFixed(0)
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold mb-1.5">
                  <span className="text-slate-700">Restaurant &amp; Bar POS</span>
                  <span className="text-slate-900">₹{data.departmentRevenue.restaurant.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full"
                    style={{
                      width: `${
                        data.departmentRevenue.total > 0
                          ? ((data.departmentRevenue.restaurant / data.departmentRevenue.total) * 100).toFixed(0)
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold mb-1.5">
                  <span className="text-slate-700">Banquet &amp; Event Halls</span>
                  <span className="text-slate-900">₹{data.departmentRevenue.banquet.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-600 h-full rounded-full"
                    style={{
                      width: `${
                        data.departmentRevenue.total > 0
                          ? ((data.departmentRevenue.banquet / data.departmentRevenue.total) * 100).toFixed(0)
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900">Room Status Distribution</h2>
              <p className="text-xs text-slate-500 mt-0.5">Live inventory split across house.</p>

              <div className="mt-4 space-y-3 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-xl">
                  <span className="font-bold text-emerald-800">Available For Sale</span>
                  <span className="font-mono font-black text-emerald-900">{data.kpis.availableRooms}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-blue-50 rounded-xl">
                  <span className="font-bold text-blue-800">Occupied by Guests</span>
                  <span className="font-mono font-black text-blue-900">{data.kpis.occupiedRooms}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-amber-50 rounded-xl">
                  <span className="font-bold text-amber-800">Dirty / Cleaning in Progress</span>
                  <span className="font-mono font-black text-amber-900">{data.kpis.dirtyRooms}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-rose-50 rounded-xl">
                  <span className="font-bold text-rose-800">Maintenance / Out of Order</span>
                  <span className="font-mono font-black text-rose-900">{data.kpis.maintenanceRooms}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t text-center text-xs text-slate-400">
              Audit compliant data feed
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
