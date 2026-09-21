"use client";

import { useState, useEffect } from "react";
import { RoleGuard } from "@/components/layout/RoleGuard";
import {
  Globe,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Ban,
  Plus,
  Trash2,
  X,
  Layers,
  Radio,
  ExternalLink,
} from "lucide-react";

interface ChannelManager {
  _id: string;
  provider: string;
  hotelCode: string;
  status: string;
  lastSyncTime: string;
  twoWaySyncEnabled: boolean;
}

interface ChannelMapping {
  _id: string;
  provider: string;
  hosRoomType: string;
  channelRoomCode: string;
  otaRoomName: string;
  baseRate: number;
  channelRateMultiplier: number;
  stopSell: boolean;
  minStay: number;
  maxStay: number;
}

interface SyncLog {
  _id: string;
  provider: string;
  syncType: string;
  direction: string;
  status: string;
  recordsAffected: number;
  payloadSnippet: string;
  createdAt: string;
}

const POPULAR_PROVIDERS = [
  { name: "MakeMyTrip", icon: "🌐", codePrefix: "MMT-IND", color: "from-red-500 to-rose-600" },
  { name: "Booking.com", icon: "🏨", codePrefix: "BKG-OTA", color: "from-blue-600 to-indigo-700" },
  { name: "Agoda", icon: "✈️", codePrefix: "AGD-ASIA", color: "from-emerald-500 to-teal-600" },
  { name: "Airbnb", icon: "🏡", codePrefix: "ABNB-LST", color: "from-pink-500 to-rose-500" },
  { name: "Expedia", icon: "🟡", codePrefix: "EXPD-GLB", color: "from-amber-500 to-yellow-600" },
  { name: "STAAH", icon: "⚡", codePrefix: "STAAH-HOS", color: "from-sky-500 to-blue-600" },
  { name: "SiteMinder", icon: "🔗", codePrefix: "SM-HOTEL", color: "from-cyan-600 to-blue-700" },
  { name: "eZee", icon: "⚙️", codePrefix: "EZEE-CHN", color: "from-violet-600 to-purple-700" },
];

export default function ChannelManagerPage() {
  const [channels, setChannels] = useState<ChannelManager[]>([]);
  const [mappings, setMappings] = useState<ChannelMapping[]>([]);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Modals
  const [isAddChannelOpen, setIsAddChannelOpen] = useState(false);
  const [isAddMappingOpen, setIsAddMappingOpen] = useState(false);

  // Channel Form State
  const [newChannel, setNewChannel] = useState({
    provider: "MakeMyTrip",
    hotelCode: "",
    apiKey: "",
  });

  // Mapping Form State
  const [newMapping, setNewMapping] = useState({
    provider: "MakeMyTrip",
    hosRoomType: "Deluxe King",
    channelRoomCode: "",
    otaRoomName: "",
    baseRate: 4500,
    channelRateMultiplier: 1.05,
    minStay: 1,
    maxStay: 30,
  });

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = async () => {
    try {
      const [chanRes, mapRes, logRes] = await Promise.all([
        fetch("http://localhost:5000/api/channel-manager/channels"),
        fetch("http://localhost:5000/api/channel-manager/mappings"),
        fetch("http://localhost:5000/api/channel-manager/logs"),
      ]);

      if (chanRes.ok) {
        const d = await chanRes.json();
        setChannels(d.data || []);
      }
      if (mapRes.ok) {
        const d = await mapRes.json();
        setMappings(d.data || []);
      }
      if (logRes.ok) {
        const d = await logRes.json();
        setLogs(d.data || []);
      }
    } catch (err) {
      console.error("Error fetching channel data:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTriggerSync = async () => {
    try {
      setSyncing(true);
      const res = await fetch("http://localhost:5000/api/channel-manager/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hotelId: "hotel-101", provider: "STAAH" }),
      });
      if (res.ok) {
        showToast("2-Way OTA Synchronization completed successfully!");
        fetchData();
      }
    } catch (err) {
      console.error(err);
      showToast("Sync failed. Check connection.", "error");
    } finally {
      setSyncing(false);
    }
  };

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannel.provider) return;

    try {
      const res = await fetch("http://localhost:5000/api/channel-manager/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: newChannel.provider,
          hotelCode: newChannel.hotelCode || `${newChannel.provider.toUpperCase().replace(/\s+/g, "")}-${Math.floor(100 + Math.random() * 900)}`,
          apiKey: newChannel.apiKey,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`${newChannel.provider} Channel connected successfully!`);
        setIsAddChannelOpen(false);
        setNewChannel({ provider: "MakeMyTrip", hotelCode: "", apiKey: "" });
        fetchData();
      } else {
        showToast(data.message || "Failed to add channel", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error connecting channel", "error");
    }
  };

  const handleDeleteChannel = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to disconnect and remove "${name}" channel adapter?`)) return;

    try {
      const res = await fetch(`http://localhost:5000/api/channel-manager/channels/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast(`${name} channel disconnected.`);
        fetchData();
      } else {
        showToast("Failed to disconnect channel.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error removing channel.", "error");
    }
  };

  const handleAddMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/channel-manager/mappings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: newMapping.provider,
          hosRoomType: newMapping.hosRoomType,
          channelRoomCode: newMapping.channelRoomCode || `${newMapping.provider.slice(0, 3).toUpperCase()}-${newMapping.hosRoomType.slice(0, 3).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`,
          otaRoomName: newMapping.otaRoomName || `${newMapping.provider} ${newMapping.hosRoomType}`,
          baseRate: Number(newMapping.baseRate),
          channelRateMultiplier: Number(newMapping.channelRateMultiplier),
          minStay: Number(newMapping.minStay),
          maxStay: Number(newMapping.maxStay),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast("Room mapping added successfully!");
        setIsAddMappingOpen(false);
        setNewMapping({
          provider: "MakeMyTrip",
          hosRoomType: "Deluxe King",
          channelRoomCode: "",
          otaRoomName: "",
          baseRate: 4500,
          channelRateMultiplier: 1.05,
          minStay: 1,
          maxStay: 30,
        });
        fetchData();
      } else {
        showToast(data.message || "Failed to add mapping", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error adding room mapping", "error");
    }
  };

  const handleDeleteMapping = async (id: string, roomName: string) => {
    if (!confirm(`Delete mapping for "${roomName}"?`)) return;

    try {
      const res = await fetch(`http://localhost:5000/api/channel-manager/mappings/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("Room mapping removed.");
        fetchData();
      } else {
        showToast("Failed to remove mapping.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error deleting mapping.", "error");
    }
  };

  const handleToggleStopSell = async (mapping: ChannelMapping) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/channel-manager/restrictions/${mapping._id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stopSell: !mapping.stopSell }),
        }
      );
      if (res.ok) {
        showToast(`Stop-Sell for ${mapping.hosRoomType} updated to ${!mapping.stopSell ? "ACTIVE" : "DISABLED"}`);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <RoleGuard
      allowedRoles={["super_admin", "hotel_admin", "hotel_manager", "channel_manager"]}
      moduleName="Channel Manager & Manual Inventory"
    >
      <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
        {toast && (
          <div
            className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-white font-medium text-sm transition-all ${
              toast.type === "success" ? "bg-emerald-600" : "bg-rose-600"
            }`}
          >
            {toast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{toast.msg}</span>
          </div>
        )}

        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Channel Manager &amp; Manual Inventory
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Connect OTAs (MakeMyTrip, Booking.com, Agoda, Airbnb) and control 2-Way Sync, Stop-Sell &amp; Multipliers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddChannelOpen(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition-transform hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              + Connect New Channel / OTA
            </button>

            <button
              onClick={handleTriggerSync}
              disabled={syncing}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition-transform hover:scale-105"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing OTAs..." : "Push 2-Way Sync Now"}
            </button>
          </div>
        </div>

        {/* Provider Status Cards */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Connected Channels &amp; Adapters ({channels.length})
            </h2>
            <button
              onClick={() => setIsAddChannelOpen(true)}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Channel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {channels.map((chan) => (
              <div
                key={chan._id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base">{chan.provider} Adapter</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Code: {chan.hotelCode}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                      {chan.status || "CONNECTED"}
                    </span>
                    <button
                      onClick={() => handleDeleteChannel(chan._id, chan.provider)}
                      title="Disconnect & Remove Channel"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Synced: {new Date(chan.lastSyncTime).toLocaleTimeString()}</span>
                  </div>
                  <span className="font-semibold text-blue-600 flex items-center gap-1">
                    <Radio className="w-3 h-3 animate-pulse text-emerald-500" /> 2-Way Live
                  </span>
                </div>
              </div>
            ))}

            {channels.length === 0 && (
              <div className="col-span-3 bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center">
                <Globe className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <h3 className="font-bold text-slate-800">No Channels Connected</h3>
                <p className="text-xs text-slate-500 mt-1">Connect your first OTA channel adapter to start 2-way sync.</p>
                <button
                  onClick={() => setIsAddChannelOpen(true)}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl"
                >
                  + Connect Channel Now
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Room & Rate Mapping + Restriction Engine */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900">OTA Room Mapping &amp; Inventory Restrictions</h2>
              <p className="text-xs text-slate-500 mt-0.5">Control live Stop-Sell, Min Stay, and Rate Multipliers across OTAs.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsAddMappingOpen(true)}
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Room Mapping
              </button>
              <span className="text-xs font-bold text-slate-500">{mappings.length} Mappings Active</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-bold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Channel / Provider</th>
                  <th className="px-5 py-3">HOS Room Type</th>
                  <th className="px-5 py-3">Channel Code</th>
                  <th className="px-5 py-3">OTA Display Name</th>
                  <th className="px-5 py-3">Base Price</th>
                  <th className="px-5 py-3">OTA Markup</th>
                  <th className="px-5 py-3">Min Stay</th>
                  <th className="px-5 py-3">Stop-Sell Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {mappings.map((m) => (
                  <tr key={m._id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-4 font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      {m.provider || "STAAH"}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-800">{m.hosRoomType}</td>
                    <td className="px-5 py-4 font-mono text-slate-500">{m.channelRoomCode}</td>
                    <td className="px-5 py-4 text-blue-700 font-semibold">{m.otaRoomName}</td>
                    <td className="px-5 py-4 font-bold">₹{m.baseRate?.toLocaleString()}</td>
                    <td className="px-5 py-4 font-semibold text-emerald-700">
                      +{(((m.channelRateMultiplier || 1) - 1) * 100).toFixed(0)}%
                    </td>
                    <td className="px-5 py-4">{m.minStay || 1} Night(s)</td>
                    <td className="px-5 py-4">
                      {m.stopSell ? (
                        <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 px-2.5 py-1 rounded-full font-bold">
                          <Ban className="w-3 h-3" /> STOP-SELL ACTIVE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold">
                          <CheckCircle2 className="w-3 h-3" /> OPEN FOR SALE
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleStopSell(m)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                            m.stopSell
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                              : "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {m.stopSell ? "Resume Sale" : "Apply Stop-Sell"}
                        </button>
                        <button
                          onClick={() => handleDeleteMapping(m._id, m.otaRoomName)}
                          title="Delete Mapping"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sync Logs Audit Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-black text-slate-900">Recent OTA Synchronization Logs</h2>
            <span className="text-xs text-slate-400 font-mono">Real-time OTA Audit</span>
          </div>

          <div className="space-y-3">
            {logs.slice(0, 5).map((log) => (
              <div
                key={log._id}
                className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="bg-emerald-500 w-2 h-2 rounded-full shrink-0" />
                  <div>
                    <p className="font-bold text-slate-900">
                      [{log.provider}] {log.payloadSnippet || "Full 2-Way Sync completed"}
                    </p>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Direction: {log.direction} · Records affected: {log.recordsAffected}
                    </p>
                  </div>
                </div>
                <span className="text-slate-400 font-mono text-[11px]">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Modal: Connect New Channel */}
        {isAddChannelOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 animate-in fade-in zoom-in duration-150">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Connect Channel / OTA</h2>
                    <p className="text-xs text-slate-500">Link external OTA adapter for 2-way live sync.</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddChannelOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddChannel} className="space-y-4 mt-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Select Channel / Provider
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {POPULAR_PROVIDERS.map((prov) => (
                      <button
                        type="button"
                        key={prov.name}
                        onClick={() =>
                          setNewChannel({
                            ...newChannel,
                            provider: prov.name,
                            hotelCode: `${prov.codePrefix}-${Math.floor(100 + Math.random() * 900)}`,
                          })
                        }
                        className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all flex flex-col items-center gap-1 ${
                          newChannel.provider === prov.name
                            ? "bg-blue-50 border-blue-600 text-blue-700 ring-2 ring-blue-500/20 shadow-sm"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <span className="text-lg">{prov.icon}</span>
                        <span className="truncate w-full">{prov.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Channel / OTA Provider Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newChannel.provider}
                    onChange={(e) => setNewChannel({ ...newChannel, provider: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. MakeMyTrip, Agoda, Booking.com, Airbnb"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Property ID / Hotel Code
                  </label>
                  <input
                    type="text"
                    value={newChannel.hotelCode}
                    onChange={(e) => setNewChannel({ ...newChannel, hotelCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. MMT-HOS-501"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    API Key / Channel Secret (Optional)
                  </label>
                  <input
                    type="password"
                    value={newChannel.apiKey}
                    onChange={(e) => setNewChannel({ ...newChannel, apiKey: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••••••••••"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddChannelOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Connect Channel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add Room Mapping */}
        {isAddMappingOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 animate-in fade-in zoom-in duration-150">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Add Room &amp; Rate Mapping</h2>
                    <p className="text-xs text-slate-500">Map internal HOS room types to OTA channel codes.</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddMappingOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddMapping} className="space-y-4 mt-5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Channel Provider
                    </label>
                    <select
                      value={newMapping.provider}
                      onChange={(e) => setNewMapping({ ...newMapping, provider: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {channels.length > 0 ? (
                        channels.map((c) => (
                          <option key={c._id} value={c.provider}>
                            {c.provider}
                          </option>
                        ))
                      ) : (
                        <option value="MakeMyTrip">MakeMyTrip</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      HOS Room Type
                    </label>
                    <input
                      type="text"
                      required
                      value={newMapping.hosRoomType}
                      onChange={(e) => setNewMapping({ ...newMapping, hosRoomType: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. Deluxe King, Executive Suite"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Channel Room Code
                    </label>
                    <input
                      type="text"
                      value={newMapping.channelRoomCode}
                      onChange={(e) => setNewMapping({ ...newMapping, channelRoomCode: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. MMT-DLX-01"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      OTA Display Name
                    </label>
                    <input
                      type="text"
                      value={newMapping.otaRoomName}
                      onChange={(e) => setNewMapping({ ...newMapping, otaRoomName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. MakeMyTrip Deluxe King"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Base Price (₹)
                    </label>
                    <input
                      type="number"
                      required
                      value={newMapping.baseRate}
                      onChange={(e) => setNewMapping({ ...newMapping, baseRate: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Rate Multiplier
                    </label>
                    <select
                      value={newMapping.channelRateMultiplier}
                      onChange={(e) => setNewMapping({ ...newMapping, channelRateMultiplier: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={1.0}>1.00 (0% Markup)</option>
                      <option value={1.05}>1.05 (+5% Markup)</option>
                      <option value={1.08}>1.08 (+8% Markup)</option>
                      <option value={1.10}>1.10 (+10% Markup)</option>
                      <option value={1.15}>1.15 (+15% Markup)</option>
                      <option value={1.20}>1.20 (+20% Markup)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Min Stay (Nights)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newMapping.minStay}
                      onChange={(e) => setNewMapping({ ...newMapping, minStay: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddMappingOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Save Room Mapping
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
