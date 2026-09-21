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
      const res = await fetch("http://localhost:5000/api/reports/kpis?hotelId=hotel-101");
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
    window.open("http://localhost:5000/api/reports/export/reservations", "_blank");
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

      {/* Primary KPI Grid */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Occupancy Rate</span>
              <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <BedDouble className="w-4 h-4" />
              </span>
            </div>
            <p className="text-3xl font-black text-slate-900 mt-3">{data.kpis.occupancyRate}</p>
            <p className="text-xs text-slate-500 mt-1">
              {data.kpis.occupiedRooms} Occupied / {data.kpis.totalRooms} Total Rooms
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">ADR (Avg Daily Rate)</span>
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <DollarSign className="w-4 h-4" />
              </span>
            </div>
            <p className="text-3xl font-black text-slate-900 mt-3">{data.kpis.adr}</p>
            <p className="text-xs text-slate-500 mt-1">Average revenue per sold room</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">RevPAR</span>
              <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <p className="text-3xl font-black text-slate-900 mt-3">{data.kpis.revPar}</p>
            <p className="text-xs text-slate-500 mt-1">Revenue per available room</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Platform Rev</span>
              <span className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                <PieChart className="w-4 h-4" />
              </span>
            </div>
            <p className="text-3xl font-black text-slate-900 mt-3">{data.kpis.totalRevenue}</p>
            <p className="text-xs text-slate-500 mt-1">Lead Conversion: {data.kpis.leadConversionRate}</p>
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
