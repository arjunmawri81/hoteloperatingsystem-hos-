"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { hotelsApi, leadsApi } from "@/lib/api";
import { Hotel } from "@/types";
import { Search, Star, MapPin, Building, ArrowRight, RefreshCw, MessageSquare, Sparkles, X, Send, CheckCircle2 } from "lucide-react";

export default function HotelDiscoveryPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [destination, setDestination] = useState("");
  const [dates, setDates] = useState("Sep 12 — Sep 15");
  const [guests, setGuests] = useState("2 Adults");

  // Group / Event Quote Modal State
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quoteSubmitted, setQuoteSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    name: "",
    phone: "",
    email: "",
    hotelId: "",
    eventType: "Wedding & Celebrations",
    requirement: "",
    budget: 150000,
  });

  const loadHotels = async () => {
    setIsLoading(true);
    try {
      const data = await hotelsApi.getAll();
      setHotels(data);
      if (data && data.length > 0 && !quoteForm.hotelId) {
        setQuoteForm((prev) => ({ ...prev, hotelId: data[0].id }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHotels();
  }, []);

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteForm.name || !quoteForm.phone) return;
    setIsSubmitting(true);
    try {
      const selectedH = hotels.find((h) => h.id === quoteForm.hotelId);
      await leadsApi.create({
        name: quoteForm.name,
        phone: quoteForm.phone,
        email: quoteForm.email || "guest@hotel.com",
        source: "Website",
        leadType: "hotel_guest",
        hotelId: quoteForm.hotelId || (hotels[0]?.id ?? "hotel-taj-delhi"),
        budget: Number(quoteForm.budget),
        requirement: `${quoteForm.eventType}: ${quoteForm.requirement || "Group reservation inquiry from website"}`,
        stage: "New",
        aiSummary: `Web Inquiry received from ${quoteForm.name} for ${quoteForm.eventType} at ${selectedH?.name || "Hotel"}.`,
        nextFollowUp: "Today, priority callback",
      });
      setQuoteSubmitted(true);
      setTimeout(() => {
        setIsQuoteModalOpen(false);
        setQuoteSubmitted(false);
        setQuoteForm({
          name: "",
          phone: "",
          email: "",
          hotelId: hotels[0]?.id || "",
          eventType: "Wedding & Celebrations",
          requirement: "",
          budget: 150000,
        });
      }, 2500);
    } catch (err) {
      console.error("Quote submission error:", err);
      alert("Failed to submit quote inquiry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredHotels = hotels.filter((h) => {
    if (!destination) return true;
    return (
      h.name.toLowerCase().includes(destination.toLowerCase()) ||
      h.city?.toLowerCase().includes(destination.toLowerCase()) ||
      h.region?.toLowerCase().includes(destination.toLowerCase())
    );
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#111827] tracking-tight">
            Hotel Discovery
          </h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            Search and book Meridian Hotels & Resorts properties directly
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsQuoteModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#111827] text-[13px] font-bold rounded shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Group / Event Quote</span>
          </button>

          <Link
            href="/customer/my-bookings"
            className="flex items-center gap-1.5 px-4 py-2 bg-[#111827] hover:bg-black text-white text-[13px] font-bold rounded shadow-xs transition-colors"
          >
            <span>View My Bookings</span>
            <ArrowRight className="w-4 h-4 text-emerald-400" />
          </Link>
        </div>
      </div>

      {/* Search Bar Widget */}
      <div className="bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          <div className="sm:col-span-5">
            <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1.5">
              Destination or Hotel Name
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="City, state, or property name..."
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-[#D1D5DB] rounded text-[13px] text-[#111827] focus:outline-none focus:border-[#EC3013]"
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1.5">
              Dates
            </label>
            <input
              type="text"
              value={dates}
              onChange={(e) => setDates(e.target.value)}
              className="w-full px-3 py-2 border border-[#D1D5DB] rounded text-[13px] text-[#111827] bg-[#F9FAFB]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1.5">
              Guests
            </label>
            <input
              type="text"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="w-full px-3 py-2 border border-[#D1D5DB] rounded text-[13px] text-[#111827] bg-[#F9FAFB]"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              onClick={loadHotels}
              className="w-full py-2 bg-[#EC3013] hover:bg-[#D62839] text-white text-[13px] font-bold rounded shadow-xs transition-colors cursor-pointer"
            >
              Search Hotels
            </button>
          </div>
        </div>
      </div>

      {/* Hotel Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-bold text-[#111827]">
            Available Properties ({filteredHotels.length})
          </h2>
          <button onClick={loadHotels} title="Refresh" className="text-[#6B7280] hover:text-[#111827]">
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#EC3013]" : ""}`} />
          </button>
        </div>

        {filteredHotels.length === 0 ? (
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-12 text-center">
            <Building className="w-12 h-12 text-[#9CA3AF] mx-auto mb-3" />
            <h3 className="text-[16px] font-bold text-[#111827]">No Hotels Found</h3>
            <p className="text-[13px] text-[#6B7280] mt-1 max-w-sm mx-auto">
              There are currently no listed properties matching your destination or search criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
            {filteredHotels.map((h) => {
              const price = h.totalRooms > 80 ? 4500 : 3500;
              const coverImage =
                h.images?.front ||
                h.images?.lobby ||
                h.images?.room ||
                "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80";

              const galleryImages = [
                { label: "Front Facade", src: h.images?.front },
                { label: "Grand Lobby", src: h.images?.lobby },
                { label: "Guest Room", src: h.images?.room },
                { label: "Washroom", src: h.images?.washroom },
              ].filter((img) => img.src);

              return (
                <div
                  key={h.id}
                  className="bg-white rounded-xl border border-[#E5E7EB] hover:border-[#D1D5DB] shadow-xs hover:shadow-lg transition-all overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    {/* Hotel Cover Image */}
                    <div className="h-48 relative overflow-hidden bg-slate-900">
                      <img
                        src={coverImage}
                        alt={h.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-4 flex flex-col justify-between text-white">
                        <div className="flex justify-between items-start">
                          <span className="bg-[#EC3013] text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider shadow-sm">
                            Verified Stay
                          </span>
                          <span className="inline-flex items-center gap-1 bg-black/60 backdrop-blur-xs text-[11px] font-bold px-2 py-0.5 rounded">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            {h.rating || "4.9"}
                          </span>
                        </div>

                        <div>
                          <div className="text-[19px] font-black drop-shadow-sm">{h.name}</div>
                          <div className="text-[12px] opacity-90 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            <span>{h.city || "City Center"}, {h.region || "India"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 4-Photo Thumbnail Strip */}
                    {galleryImages.length > 0 && (
                      <div className="grid grid-cols-4 gap-1.5 p-2 bg-slate-50 border-b border-slate-200/80">
                        {galleryImages.map((img, idx) => (
                          <div key={idx} className="relative h-14 rounded-md overflow-hidden group/thumb border border-slate-200">
                            <img
                              src={img.src}
                              alt={img.label}
                              className="w-full h-full object-cover group-hover/thumb:scale-115 transition-transform duration-300"
                            />
                            <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-white text-center py-0.5 font-bold tracking-tight">
                              {img.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Body Info */}
                    <div className="p-4 space-y-2 text-[13px] text-[#4B5563]">
                      <div className="flex justify-between">
                        <span>Total Rooms:</span>
                        <span className="font-semibold text-[#111827]">{h.totalRooms} Rooms (50 Luxury Units)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>General Manager:</span>
                        <span className="font-medium text-[#111827]">{h.managerName || "Hotel GM"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Phone / Help Desk:</span>
                        <span className="text-[#6B7280]">{h.phone || "+91 90000 00000"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Pricing & CTA */}
                  <div className="p-4 bg-[#F9FAFB] border-t border-[#E5E7EB] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#6B7280] block uppercase font-bold">Starting from</span>
                      <span className="text-[18px] font-black text-[#111827]">₹{price.toLocaleString("en-IN")}</span>
                      <span className="text-[11px] text-[#6B7280]"> / night</span>
                    </div>

                    <Link
                      href={`/customer/booking?hotelId=${h.id}&hotelName=${encodeURIComponent(h.name)}`}
                      className="px-4 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white text-[12px] font-bold rounded shadow-xs transition-colors"
                    >
                      Select &amp; Book Room
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Group / Event Quote Modal */}
      {isQuoteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100">
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-[16px] font-bold">Request Group &amp; Event Quote</h3>
              </div>
              <button
                onClick={() => setIsQuoteModalOpen(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {quoteSubmitted ? (
              <div className="p-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                <h4 className="text-[18px] font-bold text-gray-900">Inquiry Received!</h4>
                <p className="text-[13px] text-gray-600">
                  Our hotel sales executive and AI Concierge have logged your request. We will contact you on WhatsApp / Phone shortly with a tailored package.
                </p>
              </div>
            ) : (
              <form onSubmit={handleQuoteSubmit} className="p-6 space-y-4 text-[13px]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={quoteForm.name}
                      onChange={(e) => setQuoteForm({ ...quoteForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#EC3013]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                      Phone / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={quoteForm.phone}
                      onChange={(e) => setQuoteForm({ ...quoteForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#EC3013]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                      Preferred Hotel
                    </label>
                    <select
                      value={quoteForm.hotelId}
                      onChange={(e) => setQuoteForm({ ...quoteForm, hotelId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#EC3013] bg-white font-medium text-gray-800"
                    >
                      {hotels.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                      Event / Booking Type
                    </label>
                    <select
                      value={quoteForm.eventType}
                      onChange={(e) => setQuoteForm({ ...quoteForm, eventType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#EC3013] bg-white font-medium text-gray-800"
                    >
                      <option value="Wedding & Celebrations">💍 Wedding &amp; Celebrations</option>
                      <option value="Corporate Conference">💼 Corporate Conference / MICE</option>
                      <option value="Bulk Room Booking">🏨 Bulk Room Booking (10+ Rooms)</option>
                      <option value="Birthday / Private Party">🎉 Birthday / Private Party</option>
                      <option value="Extended Long Stay">🏖️ Extended Long Stay</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    Requirements &amp; Expected Dates
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. 25 Deluxe rooms for Nov 14-16, banquet hall required for 150 guests..."
                    value={quoteForm.requirement}
                    onChange={(e) => setQuoteForm({ ...quoteForm, requirement: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#EC3013]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsQuoteModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? "Submitting..." : "Submit Quote Request"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
