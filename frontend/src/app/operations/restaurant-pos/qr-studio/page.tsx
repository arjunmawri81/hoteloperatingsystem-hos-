"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { posApi } from "@/lib/api";
import { generateQrSvg } from "@/lib/qrHelper";
import {
  ArrowLeft,
  Printer,
  QrCode,
  Smartphone,
  Plus,
  CheckCircle2,
  ExternalLink,
  ChefHat,
  Sparkles,
  Download,
  Building2,
  Copy,
} from "lucide-react";
import { RoleGuard } from "@/components/layout/RoleGuard";

interface TableItem {
  id: string;
  tableNumber: string;
  section: string;
  badgeLabel: string;
}

const DEFAULT_TABLES: TableItem[] = [
  { id: "1", tableNumber: "T-01", section: "Main Dining Hall", badgeLabel: "Table 01 – Main Hall" },
  { id: "2", tableNumber: "T-02", section: "Main Dining Hall", badgeLabel: "Table 02 – Main Hall" },
  { id: "3", tableNumber: "T-03", section: "Terrace Garden", badgeLabel: "Table 03 – Terrace Garden" },
  { id: "4", tableNumber: "T-04", section: "Terrace Garden", badgeLabel: "Table 04 – Terrace Garden" },
  { id: "5", tableNumber: "T-05", section: "Royal Alcove", badgeLabel: "Table 05 – Royal Alcove" },
  { id: "6", tableNumber: "T-06", section: "Royal Alcove", badgeLabel: "Table 06 – Royal Alcove" },
  { id: "7", tableNumber: "T-07", section: "Poolside Deck", badgeLabel: "Table 07 – Poolside Deck" },
  { id: "8", tableNumber: "T-08", section: "Poolside Deck", badgeLabel: "Table 08 – Poolside Deck" },
  { id: "9", tableNumber: "T-09", section: "Lounge Bar", badgeLabel: "Table 09 – Lounge Bar" },
  { id: "10", tableNumber: "T-10", section: "Private Dining (PDR)", badgeLabel: "Table 10 – Private Dining" },
];

export default function NativeSmartQRStudioPage() {
  const { user } = useAuth();
  const hotelName = user?.hotelName || "Meridian Grand Palace";

  const [tables, setTables] = useState<TableItem[]>(DEFAULT_TABLES);
  const [selectedTable, setSelectedTable] = useState<TableItem>(DEFAULT_TABLES[4]); // T-05
  const [restaurantName, setRestaurantName] = useState(`${hotelName} Dining & Lounge`);
  const [badgeLabel, setBadgeLabel] = useState(DEFAULT_TABLES[4].badgeLabel);
  const [customOrigin, setCustomOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [newTableNum, setNewTableNum] = useState("");
  const [newTableSec, setNewTableSec] = useState("Main Dining Hall");

  // Determine current origin safely in browser
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCustomOrigin(window.location.origin);
    }
  }, []);

  const handleSelectTable = (tbl: TableItem) => {
    setSelectedTable(tbl);
    setBadgeLabel(tbl.badgeLabel);
  };

  const targetUrl = `${customOrigin || "http://localhost:3000"}/menu?table=${selectedTable.tableNumber}`;
  const qrCodeImgSrc = generateQrSvg(targetUrl, 260);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAddTable = () => {
    if (!newTableNum.trim()) return;
    const cleanNum = newTableNum.trim().toUpperCase();
    const newEntry: TableItem = {
      id: String(Date.now()),
      tableNumber: cleanNum,
      section: newTableSec,
      badgeLabel: `Table ${cleanNum.replace(/^T-?/, "")} – ${newTableSec}`,
    };
    setTables((prev) => [...prev, newEntry]);
    setSelectedTable(newEntry);
    setBadgeLabel(newEntry.badgeLabel);
    setNewTableNum("");
    setIsAddTableOpen(false);
  };

  return (
    <RoleGuard
      allowedRoles={["super_admin", "hotel_admin", "hotel_manager", "restaurant_staff"]}
      moduleName="Table QR Studio"
    >
      <div className="space-y-6">
        {/* Native LuckNexa Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs print:hidden">
          <div className="flex items-center gap-3">
            <Link
              href="/operations/restaurant-pos"
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
              title="Back to POS"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Table QR Standee Studio
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                  Digital Dining
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate, customize and print contact-free digital menu QR cards for your tables
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/operations/kitchen-kds"
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition"
            >
              <ChefHat className="w-4 h-4 text-orange-600" />
              Kitchen KDS
            </Link>

            <Link
              href={targetUrl}
              target="_blank"
              className="px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition"
            >
              <Smartphone className="w-4 h-4 text-emerald-600" />
              Test Guest Menu
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>

            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-[#EC3013] hover:bg-[#D62839] text-white flex items-center gap-1.5 shadow-xs transition"
            >
              <Printer className="w-4 h-4" />
              Print Selected Standee
            </button>
          </div>
        </div>

        {/* Studio Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Panel: Table Selection & Branding Editor (7 cols) */}
          <div className="lg:col-span-7 space-y-5 print:hidden">
            {/* Card 1: Select Table */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    1. Select Dining Table ({tables.length} Configured)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Choose which table&apos;s QR code you wish to view or print
                  </p>
                </div>

                <button
                  onClick={() => setIsAddTableOpen(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5 text-orange-600" />
                  Add Table
                </button>
              </div>

              {/* Tables Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {tables.map((tbl) => {
                  const isSelected = selectedTable.id === tbl.id;
                  return (
                    <div
                      key={tbl.id}
                      onClick={() => handleSelectTable(tbl)}
                      className={`p-3 rounded-xl border-2 text-left cursor-pointer transition ${
                        isSelected
                          ? "border-[#EC3013] bg-red-50/40 shadow-xs ring-1 ring-red-400/30"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">{tbl.tableNumber}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-[#EC3013]" />}
                      </div>
                      <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                        {tbl.section}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Card 2: Customize Standee Label & Branding */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  2. Customize Table Standee Card
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  The text and details below will appear on the printed tent-card
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Restaurant / Hotel Brand Title:
                  </label>
                  <input
                    type="text"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Display Badge Label:
                  </label>
                  <input
                    type="text"
                    value={badgeLabel}
                    onChange={(e) => setBadgeLabel(e.target.value)}
                    placeholder="e.g. Table 05 – Royal Alcove"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Destination QR URL:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={targetUrl}
                      readOnly
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-100 font-mono text-[11px] text-slate-600"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 font-semibold shrink-0 flex items-center gap-1 text-xs"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Standee Preview & Print Mockup (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center">
            {/* Standee Container */}
            <div
              id="printable-standee"
              className="w-full max-w-[370px] bg-white rounded-2xl border-2 border-slate-300 p-6 sm:p-7 shadow-md flex flex-col items-center text-center relative overflow-hidden"
            >
              {/* Hotel Crest & Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-slate-100 text-slate-800 border border-slate-200 mb-3">
                <span>🍽️</span>
                <span>{restaurantName}</span>
              </div>

              <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
                SCAN TO ORDER &amp; PAY
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Point your phone camera to browse digital menu
              </p>

              {/* QR Frame */}
              <div className="my-5 p-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/80 shadow-inner">
                <div className="w-[190px] h-[190px] bg-white rounded-xl flex items-center justify-center p-2 shadow-xs">
                  <img
                    src={qrCodeImgSrc}
                    alt={`QR Code for ${selectedTable.tableNumber}`}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Table Info Badge */}
              <div className="w-full rounded-xl bg-slate-950 text-white p-3.5 shadow-sm flex flex-col items-center">
                <span className="text-[9px] font-bold tracking-widest text-orange-400 uppercase">
                  RESTAURANT TABLE
                </span>
                <span className="text-2xl font-black text-white my-0.5">
                  {selectedTable.tableNumber}
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  {badgeLabel || selectedTable.badgeLabel}
                </span>
              </div>

              <p className="text-[9px] font-bold tracking-wider uppercase text-slate-400 mt-4">
                LUCKNEXA SMART DINING SYSTEM
              </p>
            </div>

            {/* Print & Test Buttons */}
            <div className="w-full max-w-[370px] mt-4 flex items-center gap-2.5 print:hidden">
              <button
                onClick={handlePrint}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-[#EC3013] hover:bg-[#D62839] text-white flex items-center justify-center gap-2 shadow-xs transition"
              >
                <Printer className="w-4 h-4" />
                Print Standee Card
              </button>

              <Link
                href={targetUrl}
                target="_blank"
                className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center gap-1.5 transition"
              >
                <Smartphone className="w-4 h-4 text-emerald-600" />
                Preview Menu
              </Link>
            </div>
          </div>
        </div>

        {/* Add Table Modal */}
        {isAddTableOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-200">
              <h3 className="text-base font-bold text-slate-900 mb-3">Add Restaurant Table</h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Table Code</label>
                  <input
                    type="text"
                    value={newTableNum}
                    onChange={(e) => setNewTableNum(e.target.value)}
                    placeholder="e.g. T-11"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Floor Section</label>
                  <select
                    value={newTableSec}
                    onChange={(e) => setNewTableSec(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  >
                    <option value="Main Dining Hall">Main Dining Hall</option>
                    <option value="Terrace Garden">Terrace Garden</option>
                    <option value="Poolside Deck">Poolside Deck</option>
                    <option value="Royal Alcove">Royal Alcove</option>
                    <option value="Lounge Bar">Lounge Bar</option>
                    <option value="Private Dining (PDR)">Private Dining (PDR)</option>
                  </select>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2">
                <button
                  onClick={() => setIsAddTableOpen(false)}
                  className="flex-1 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTable}
                  className="flex-1 py-2 rounded-lg bg-[#EC3013] hover:bg-[#D62839] text-xs font-bold text-white shadow-xs"
                >
                  Create Table
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
