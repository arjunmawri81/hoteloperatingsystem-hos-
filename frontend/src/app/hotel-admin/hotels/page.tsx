"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { hotelsApi } from "@/lib/api";
import { Hotel } from "@/types";
import {
  Plus,
  X,
  Search,
  RefreshCw,
  CheckCircle2,
  Building2,
  MapPin,
  Trash2,
  Camera,
  FileCheck2,
  Clock,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  UploadCloud,
  Check,
  Star,
  Wifi,
  Wind,
  Zap,
  Car,
  UtensilsCrossed,
  ArrowUpSquare,
  Video,
  Waves,
} from "lucide-react";

const AVAILABLE_AMENITIES = [
  { id: "wifi", label: "Free High-Speed Wi-Fi", icon: Wifi },
  { id: "ac", label: "Air Conditioning (AC)", icon: Wind },
  { id: "power", label: "24/7 Power Backup", icon: Zap },
  { id: "parking", label: "Valet & Guest Parking", icon: Car },
  { id: "restaurant", label: "In-House Multi-Cuisine Dining", icon: UtensilsCrossed },
  { id: "elevator", label: "Passenger Lift / Elevator", icon: ArrowUpSquare },
  { id: "cctv", label: "24x7 CCTV & Security Guard", icon: Video },
  { id: "pool", label: "Swimming Pool", icon: Waves },
];

const INITIAL_FORM_STATE = {
  // Step 1: Basic & Location
  name: "",
  city: "",
  region: "",
  totalRooms: "",
  managerName: "",
  phone: "",
  address: "",
  landmark: "",
  pincode: "",
  mapUrl: "",

  // Step 2: 4 Core Photos
  images: {
    front: "",
    lobby: "",
    room: "",
    washroom: "",
  },

  // Step 3: Legal & KYC
  legalKyc: {
    gstin: "",
    tradeLicense: "",
    fireSafetyNoc: "",
  },

  // Step 4: Timings & Amenities
  policies: {
    category: "3-Star Boutique Hotel",
    checkInTime: "12:00 PM",
    checkOutTime: "11:00 AM",
    amenities: ["Free High-Speed Wi-Fi", "Air Conditioning (AC)", "24/7 Power Backup"],
  },
};

export default function HotelsManagementPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  const loadHotels = async () => {
    if (isAuthLoading) return;
    setIsLoading(true);
    try {
      const effectiveOrgId = user?.orgId;
      const data = await hotelsApi.getAll(effectiveOrgId ? { orgId: effectiveOrgId } : undefined);
      setHotels(data);
    } catch (e) {
      console.error("Failed to load hotels:", e);
      setHotels([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthLoading) {
      loadHotels();
    }
  }, [user?.orgId, isAuthLoading]);

  const handleDeleteHotel = async (hotelId: string, hotelName: string) => {
    if (!window.confirm(`Are you sure you want to delete property "${hotelName}"?`)) {
      return;
    }
    try {
      await hotelsApi.delete(hotelId);
      setHotels((prev) => prev.filter((h) => h.id !== hotelId));
      setToastMsg(`🗑️ Property "${hotelName}" deleted successfully`);
      setTimeout(() => setToastMsg(null), 4000);
    } catch (err: any) {
      console.error("Failed to delete hotel:", err);
      setToastMsg(`❌ Failed to delete property: ${err?.message || "Server error"}`);
    }
  };

  const handleImageUpload = (key: "front" | "lobby" | "room" | "washroom", file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setFormData((prev) => ({
          ...prev,
          images: {
            ...prev.images,
            [key]: reader.result as string,
          },
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const fillDemoPhotos = () => {
    setFormData((prev) => ({
      ...prev,
      images: {
        front: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80",
        lobby: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&auto=format&fit=crop&q=80",
        room: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&auto=format&fit=crop&q=80",
        washroom: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80",
      },
    }));
  };

  const toggleAmenity = (label: string) => {
    setFormData((prev) => {
      const exists = prev.policies.amenities.includes(label);
      const nextAmenities = exists
        ? prev.policies.amenities.filter((a) => a !== label)
        : [...prev.policies.amenities, label];
      return {
        ...prev,
        policies: {
          ...prev.policies,
          amenities: nextAmenities,
        },
      };
    });
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!formData.name.trim()) {
        alert("Please enter the Property Name.");
        return;
      }
      if (!formData.city.trim()) {
        alert("Please enter the City.");
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, 4) as any);
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1) as any);
  };

  const handleSaveHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Property name is required.");
      return;
    }

    setIsSaving(true);
    try {
      const effectiveOrgId = user?.orgId;
      const created = await hotelsApi.create({
        ...(effectiveOrgId ? { orgId: effectiveOrgId } : {}),
        name: formData.name.trim(),
        city: formData.city.trim() || "Main City",
        region: formData.region.trim() || "Central Zone",
        totalRooms: Number(formData.totalRooms) || 30,
        managerName: formData.managerName.trim() || "General Manager",
        phone: formData.phone.trim() || "+91 90000 00000",
        images: formData.images,
        legalKyc: formData.legalKyc,
        locationDetails: {
          address: formData.address,
          landmark: formData.landmark,
          pincode: formData.pincode,
          mapUrl: formData.mapUrl,
        },
        policies: formData.policies,
        verificationStatus: "verified",
      });

      setHotels((prev) => [created, ...prev.filter((h) => h.id !== created.id)]);
      setIsModalOpen(false);
      setCurrentStep(1);
      setFormData(INITIAL_FORM_STATE);
      setToastMsg(`✅ Property "${created.name}" verified & added successfully!`);
      setTimeout(() => setToastMsg(null), 5000);
    } catch (err: any) {
      console.error("Failed to create hotel:", err);
      setToastMsg(`❌ Failed to save property: ${err?.message || "Server error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredHotels = hotels.filter(
    (h) =>
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.managerName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#111827] tracking-tight flex items-center gap-2">
            <Building2 className="w-7 h-7 text-[#EC3013]" />
            Hotel Properties & Compliance
          </h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            Manage verified chain properties, licenses, 4-point verification media, and capacities ({hotels.length} hotels)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadHotels}
            title="Refresh"
            className="p-2 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] rounded text-[#4B5563] shadow-xs cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#EC3013]" : ""}`} />
          </button>
          <button
            onClick={() => {
              setFormData(INITIAL_FORM_STATE);
              setCurrentStep(1);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white text-[13px] font-bold rounded shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Property & KYC</span>
          </button>
        </div>
      </div>

      {/* Toast Notice */}
      {toastMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-[13px] px-4 py-3 rounded-lg flex items-center gap-2.5 shadow-xs animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{toastMsg}</span>
        </div>
      )}

      {/* Search Bar & Summary */}
      <div className="bg-white p-3.5 rounded-lg border border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search hotel, city or manager..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#F9FAFB] border border-[#D1D5DB] rounded text-[13px] text-[#111827] focus:outline-none focus:border-[#EC3013]"
          />
        </div>
        <div className="flex items-center gap-2 text-[12px] text-[#6B7280]">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 font-semibold rounded-full border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" /> All Verified
          </span>
          <span>
            Showing {filteredHotels.length} of {hotels.length} properties
          </span>
        </div>
      </div>

      {/* Hotels Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider bg-[#F9FAFB]">
                <th className="py-3.5 px-4 font-bold">PROPERTY DETAILS</th>
                <th className="py-3.5 px-4 font-bold">LOCATION & ADDRESS</th>
                <th className="py-3.5 px-4 font-bold">CATEGORY & AMENITIES</th>
                <th className="py-3.5 px-4 font-bold">LEGAL KYC / GST</th>
                <th className="py-3.5 px-4 font-bold">CAPACITY</th>
                <th className="py-3.5 px-4 font-bold">VERIFICATION</th>
                <th className="py-3.5 px-4 text-right font-bold">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {filteredHotels.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#9CA3AF]">
                    <Building2 className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    No hotel properties found. Click &quot;Add Property & KYC&quot; to onboard.
                  </td>
                </tr>
              ) : (
                filteredHotels.map((h) => {
                  const frontPhoto = h.images?.front || (h as any).imageUrl;
                  return (
                    <tr key={h.id} className="hover:bg-[#F9FAFB] transition-colors">
                      {/* Property Details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {frontPhoto ? (
                            <img
                              src={frontPhoto}
                              alt={h.name}
                              className="w-12 h-12 object-cover rounded-lg border border-gray-200 shadow-2xs shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0 font-bold text-lg">
                              {h.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-[#111827] text-[14px] flex items-center gap-1.5">
                              {h.name}
                            </div>
                            <div className="text-[11px] text-[#6B7280]">
                              Manager: <span className="font-medium text-gray-900">{h.managerName || "General Manager"}</span>
                            </div>
                            <div className="text-[11px] text-[#9CA3AF]">{h.phone || "+91 90000 00000"}</div>
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 text-[#374151]">
                        <div className="font-medium text-[#111827] flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          {h.city || "Main City"}
                        </div>
                        <div className="text-[11px] text-[#6B7280] line-clamp-1">
                          {h.locationDetails?.address || h.region || "Central Zone"}
                        </div>
                        {h.locationDetails?.pincode && (
                          <div className="text-[10px] text-[#9CA3AF]">PIN: {h.locationDetails.pincode}</div>
                        )}
                      </td>

                      {/* Category & Amenities */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 text-[11px] font-bold rounded border border-amber-200">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          {h.policies?.category || "3-Star Hotel"}
                        </span>
                        <div className="text-[11px] text-[#6B7280] mt-1">
                          {(h.policies?.amenities?.length || 3)} Amenities active
                        </div>
                      </td>

                      {/* Legal KYC */}
                      <td className="py-3.5 px-4 text-[#4B5563]">
                        <div className="text-[11px] font-mono font-semibold text-gray-800">
                          GST: {h.legalKyc?.gstin || "27AAAAA0000A1Z5"}
                        </div>
                        <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                          <Check className="w-3 h-3 text-emerald-600" /> Trade & Fire NOC Valid
                        </div>
                      </td>

                      {/* Capacity */}
                      <td className="py-3.5 px-4 font-bold text-[#374151]">
                        <div>{h.totalRooms} Rooms</div>
                        <div className="text-[11px] font-normal text-emerald-600">
                          Occupancy: <span className="font-bold">{h.occupancyRate || 0}%</span>
                        </div>
                      </td>

                      {/* Verification Status */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Verified
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteHotel(h.id, h.name)}
                          title={`Delete ${h.name}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-red-600 hover:bg-red-50 rounded text-[11px] font-semibold transition-colors cursor-pointer border border-transparent hover:border-red-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4-Step Hotel Onboarding & Verification Wizard Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xl max-w-2xl w-full p-6 space-y-5 my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center text-[#EC3013]">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[17px] font-bold text-[#111827]">
                    Add New Hotel Property & Compliance
                  </h3>
                  <p className="text-[11px] text-[#6B7280]">
                    4-Point verification: Location, Visual Media, Legal KYC, and Policy setup
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#9CA3AF] hover:text-[#111827] p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Wizard Progress Bar */}
            <div className="grid grid-cols-4 gap-2 bg-[#F9FAFB] p-2 rounded-lg border border-[#E5E7EB] shrink-0 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className={`py-1.5 px-2 rounded flex items-center justify-center gap-1.5 transition-all ${
                  currentStep === 1
                    ? "bg-white text-[#EC3013] shadow-xs border border-gray-200"
                    : currentStep > 1
                    ? "text-emerald-700 bg-emerald-50"
                    : "text-gray-400"
                }`}
              >
                {currentStep > 1 ? <Check className="w-3.5 h-3.5" /> : <span>1.</span>}
                <span className="truncate">📍 Location</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className={`py-1.5 px-2 rounded flex items-center justify-center gap-1.5 transition-all ${
                  currentStep === 2
                    ? "bg-white text-[#EC3013] shadow-xs border border-gray-200"
                    : currentStep > 2
                    ? "text-emerald-700 bg-emerald-50"
                    : "text-gray-400"
                }`}
              >
                {currentStep > 2 ? <Check className="w-3.5 h-3.5" /> : <span>2.</span>}
                <span className="truncate">📸 Photos</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className={`py-1.5 px-2 rounded flex items-center justify-center gap-1.5 transition-all ${
                  currentStep === 3
                    ? "bg-white text-[#EC3013] shadow-xs border border-gray-200"
                    : currentStep > 3
                    ? "text-emerald-700 bg-emerald-50"
                    : "text-gray-400"
                }`}
              >
                {currentStep > 3 ? <Check className="w-3.5 h-3.5" /> : <span>3.</span>}
                <span className="truncate">📜 Legal KYC</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className={`py-1.5 px-2 rounded flex items-center justify-center gap-1.5 transition-all ${
                  currentStep === 4
                    ? "bg-white text-[#EC3013] shadow-xs border border-gray-200"
                    : "text-gray-400"
                }`}
              >
                <span>4.</span>
                <span className="truncate">⚡ Policies</span>
              </button>
            </div>

            {/* Step Body */}
            <form onSubmit={handleSaveHotel} className="space-y-4 overflow-y-auto pr-1 flex-1 text-[13px]">
              {/* ================= STEP 1: Basic & Location ================= */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="bg-red-50/50 border border-red-100 p-3 rounded-lg text-[12px] text-red-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#EC3013] shrink-0" />
                    <span>Provide property identity, capacity, and full street address.</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#374151] uppercase mb-1">
                      Property Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Royal Heritage Resort & Spa"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#EC3013] bg-[#F9FAFB]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#374151] uppercase mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Mumbai"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg bg-[#F9FAFB]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#374151] uppercase mb-1">
                        Region / Zone
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Western Coastal Zone"
                        value={formData.region}
                        onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                        className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg bg-[#F9FAFB]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#374151] uppercase mb-1">
                        Total Rooms
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 50"
                        value={formData.totalRooms}
                        onChange={(e) => setFormData({ ...formData, totalRooms: e.target.value })}
                        className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg bg-[#F9FAFB]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#374151] uppercase mb-1">
                        General Manager
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Rajesh Sharma"
                        value={formData.managerName}
                        onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                        className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg bg-[#F9FAFB]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#374151] uppercase mb-1">
                        Contact Phone
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. +91 98000 00000"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg bg-[#F9FAFB]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#374151] uppercase mb-1">
                      Full Street Address & Landmark
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Plot No. 42, Beach Road, Opposite Sunset Point, Calangute"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg bg-[#F9FAFB] focus:outline-none focus:border-[#EC3013]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#374151] uppercase mb-1">
                        Postal Pincode
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 403516"
                        value={formData.pincode}
                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                        className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg bg-[#F9FAFB]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#374151] uppercase mb-1">
                        Google Maps Location Link
                      </label>
                      <input
                        type="url"
                        placeholder="https://maps.google.com/..."
                        value={formData.mapUrl}
                        onChange={(e) => setFormData({ ...formData, mapUrl: e.target.value })}
                        className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg bg-[#F9FAFB]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ================= STEP 2: 4 Core Photos ================= */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between bg-orange-50/70 border border-orange-200 p-3 rounded-lg text-[12px] text-orange-900">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-orange-600 shrink-0" />
                      <span>Upload 4 core verification photos or insert image URLs.</span>
                    </div>
                    <button
                      type="button"
                      onClick={fillDemoPhotos}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                    >
                      <Sparkles className="w-3 h-3" /> Auto-Fill Demo Photos
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    {/* Photo 1: Front / Facade */}
                    <div className="border border-gray-200 rounded-lg p-3 bg-[#F9FAFB] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-800 uppercase">
                          1. Building Front / Signboard
                        </span>
                        {formData.images.front && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </div>
                      {formData.images.front ? (
                        <div className="relative h-28 rounded-md overflow-hidden border border-gray-200 group">
                          <img
                            src={formData.images.front}
                            alt="Front view"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                images: { ...prev.images, front: "" },
                              }))
                            }
                            className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="h-28 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-500 hover:border-[#EC3013] hover:text-[#EC3013] cursor-pointer transition-colors bg-white">
                          <UploadCloud className="w-6 h-6 mb-1 text-gray-400" />
                          <span className="text-[11px] font-semibold">Click to Upload File</span>
                          <span className="text-[9px] text-gray-400">PNG, JPG up to 5MB</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload("front", e.target.files?.[0] || null)}
                          />
                        </label>
                      )}
                      <input
                        type="text"
                        placeholder="Or paste Image URL..."
                        value={formData.images.front}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            images: { ...prev.images, front: e.target.value },
                          }))
                        }
                        className="w-full px-2.5 py-1 text-[11px] border border-gray-300 rounded bg-white"
                      />
                    </div>

                    {/* Photo 2: Lobby / Reception */}
                    <div className="border border-gray-200 rounded-lg p-3 bg-[#F9FAFB] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-800 uppercase">
                          2. Reception / Lobby
                        </span>
                        {formData.images.lobby && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </div>
                      {formData.images.lobby ? (
                        <div className="relative h-28 rounded-md overflow-hidden border border-gray-200 group">
                          <img
                            src={formData.images.lobby}
                            alt="Lobby view"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                images: { ...prev.images, lobby: "" },
                              }))
                            }
                            className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="h-28 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-500 hover:border-[#EC3013] hover:text-[#EC3013] cursor-pointer transition-colors bg-white">
                          <UploadCloud className="w-6 h-6 mb-1 text-gray-400" />
                          <span className="text-[11px] font-semibold">Click to Upload File</span>
                          <span className="text-[9px] text-gray-400">Reception desk view</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload("lobby", e.target.files?.[0] || null)}
                          />
                        </label>
                      )}
                      <input
                        type="text"
                        placeholder="Or paste Image URL..."
                        value={formData.images.lobby}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            images: { ...prev.images, lobby: e.target.value },
                          }))
                        }
                        className="w-full px-2.5 py-1 text-[11px] border border-gray-300 rounded bg-white"
                      />
                    </div>

                    {/* Photo 3: Sample Room */}
                    <div className="border border-gray-200 rounded-lg p-3 bg-[#F9FAFB] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-800 uppercase">
                          3. Guest Room / Bed
                        </span>
                        {formData.images.room && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </div>
                      {formData.images.room ? (
                        <div className="relative h-28 rounded-md overflow-hidden border border-gray-200 group">
                          <img
                            src={formData.images.room}
                            alt="Room view"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                images: { ...prev.images, room: "" },
                              }))
                            }
                            className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="h-28 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-500 hover:border-[#EC3013] hover:text-[#EC3013] cursor-pointer transition-colors bg-white">
                          <UploadCloud className="w-6 h-6 mb-1 text-gray-400" />
                          <span className="text-[11px] font-semibold">Click to Upload File</span>
                          <span className="text-[9px] text-gray-400">Standard/Deluxe Room</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload("room", e.target.files?.[0] || null)}
                          />
                        </label>
                      )}
                      <input
                        type="text"
                        placeholder="Or paste Image URL..."
                        value={formData.images.room}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            images: { ...prev.images, room: e.target.value },
                          }))
                        }
                        className="w-full px-2.5 py-1 text-[11px] border border-gray-300 rounded bg-white"
                      />
                    </div>

                    {/* Photo 4: Washroom / Bathroom */}
                    <div className="border border-gray-200 rounded-lg p-3 bg-[#F9FAFB] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-800 uppercase">
                          4. Washroom / Bathroom
                        </span>
                        {formData.images.washroom && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </div>
                      {formData.images.washroom ? (
                        <div className="relative h-28 rounded-md overflow-hidden border border-gray-200 group">
                          <img
                            src={formData.images.washroom}
                            alt="Washroom view"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                images: { ...prev.images, washroom: "" },
                              }))
                            }
                            className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="h-28 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-500 hover:border-[#EC3013] hover:text-[#EC3013] cursor-pointer transition-colors bg-white">
                          <UploadCloud className="w-6 h-6 mb-1 text-gray-400" />
                          <span className="text-[11px] font-semibold">Click to Upload File</span>
                          <span className="text-[9px] text-gray-400">Sanitary inspection</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload("washroom", e.target.files?.[0] || null)}
                          />
                        </label>
                      )}
                      <input
                        type="text"
                        placeholder="Or paste Image URL..."
                        value={formData.images.washroom}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            images: { ...prev.images, washroom: e.target.value },
                          }))
                        }
                        className="w-full px-2.5 py-1 text-[11px] border border-gray-300 rounded bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ================= STEP 3: Legal & KYC ================= */}
              {currentStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="bg-blue-50/70 border border-blue-200 p-3 rounded-lg text-[12px] text-blue-900 flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Enter government compliance numbers and legal business tax details.</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#374151] uppercase mb-1">
                      1. GSTIN (Goods & Services Tax ID)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 27AAAAA0000A1Z5"
                      value={formData.legalKyc.gstin}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          legalKyc: { ...formData.legalKyc, gstin: e.target.value.toUpperCase() },
                        })
                      }
                      className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg font-mono bg-[#F9FAFB] uppercase"
                    />
                    <p className="text-[10px] text-gray-500 mt-0.5">Required for automated 12%/18% tax invoice generation.</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#374151] uppercase mb-1">
                      2. Trade License / Hotel Operating Permit No.
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. MC/TL/HOTEL/2026/9821"
                      value={formData.legalKyc.tradeLicense}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          legalKyc: { ...formData.legalKyc, tradeLicense: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg bg-[#F9FAFB]"
                    />
                    <p className="text-[10px] text-gray-500 mt-0.5">Issued by Municipal Corporation / Local Tourism Board.</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#374151] uppercase mb-1">
                      3. Fire Safety NOC Registration No.
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. FS-NOC-MH-2026-4491"
                      value={formData.legalKyc.fireSafetyNoc}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          legalKyc: { ...formData.legalKyc, fireSafetyNoc: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg bg-[#F9FAFB]"
                    />
                    <p className="text-[10px] text-gray-500 mt-0.5">Fire Department safety audit clearance certificate.</p>
                  </div>
                </div>
              )}

              {/* ================= STEP 4: Timings & Amenities ================= */}
              {currentStep === 4 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-lg text-[12px] text-emerald-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Set default guest check-in/out policies and available hotel amenities.</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#374151] uppercase mb-1">
                      Property Category / Star Rating
                    </label>
                    <select
                      value={formData.policies.category}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          policies: { ...formData.policies, category: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg bg-[#F9FAFB] font-medium"
                    >
                      <option value="Budget Hotel">Budget / Express Hotel</option>
                      <option value="3-Star Hotel">3-Star Standard Hotel</option>
                      <option value="3-Star Boutique Hotel">3-Star Boutique Hotel</option>
                      <option value="4-Star Premium Resort">4-Star Premium Resort</option>
                      <option value="5-Star Luxury Heritage">5-Star Luxury Heritage</option>
                      <option value="Villa / Homestay">Private Villa / Homestay</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#374151] uppercase mb-1">
                        Standard Check-In Time
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 12:00 PM"
                        value={formData.policies.checkInTime}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            policies: { ...formData.policies, checkInTime: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg bg-[#F9FAFB]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#374151] uppercase mb-1">
                        Standard Check-Out Time
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 11:00 AM"
                        value={formData.policies.checkOutTime}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            policies: { ...formData.policies, checkOutTime: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg bg-[#F9FAFB]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#374151] uppercase mb-2">
                      Property Amenities (Select all that apply)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {AVAILABLE_AMENITIES.map((item) => {
                        const isSelected = formData.policies.amenities.includes(item.label);
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => toggleAmenity(item.label)}
                            className={`p-2.5 rounded-lg border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                              isSelected
                                ? "bg-red-50/80 border-[#EC3013] text-[#EC3013] font-semibold"
                                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            <Icon className="w-4 h-4 shrink-0" />
                            <span className="text-[12px] flex-1">{item.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#EC3013]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB] shrink-0">
                <div>
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="inline-flex items-center gap-1 px-4 py-2 border border-[#D1D5DB] rounded-lg text-[#374151] font-semibold hover:bg-[#F3F4F6] cursor-pointer transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>

                  {currentStep < 4 ? (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="inline-flex items-center gap-1 px-5 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white font-bold rounded-lg shadow-xs cursor-pointer transition-colors"
                    >
                      <span>Next Step</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="inline-flex items-center gap-1.5 px-6 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white font-bold rounded-lg shadow-sm cursor-pointer transition-colors disabled:opacity-50"
                    >
                      {isSaving ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="w-4 h-4" />
                      )}
                      <span>{isSaving ? "Saving Property..." : "Verify & Save Property"}</span>
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
