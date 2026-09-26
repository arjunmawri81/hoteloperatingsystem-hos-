"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { hotelsApi } from "@/lib/api";
import { Hotel } from "@/types";
import {
  Bot,
  Sparkles,
  Send,
  User,
  BedDouble,
  ArrowRight,
  Building2,
  Globe,
  MapPin,
} from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  actionHref?: string;
  actionText?: string;
}

const QUICK_PROMPTS = [
  { label: "🏨 Explore Rooms & Rates", text: "What rooms and rates are available today?" },
  { label: "📍 Properties in Delhi & Mumbai", text: "Which luxury hotels are available in Delhi and Mumbai?" },
  { label: "🔍 Track Booking #RES-101", text: "Can you lookup my reservation RES-101?" },
  { label: "⏰ Check-in & Policies", text: "What are the standard check-in and check-out policies?" },
  { label: "🍽️ Dining & Amenities", text: "What dining and amenities are available for guests?" },
];

export default function GuestAIConciergePage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<string>("");
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      sender: "ai",
      text: "Namaste & Welcome to LuckNexa Hotels & Resorts! 🙏\n\nI am your 24/7 AI Concierge. I can help you discover luxury properties across India, check live room availability, book stays, or lookup an existing reservation (e.g. RES-101). How can I assist you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load platform hotels
  useEffect(() => {
    async function fetchHotels() {
      try {
        const data = await hotelsApi.getAll();
        if (data && Array.isArray(data)) {
          setHotels(data);
        }
      } catch (err) {
        console.error("Failed to load hotels:", err);
      }
    }
    fetchHotels();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const selectedHotel = hotels.find((h) => h.id === selectedHotelId);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isTyping) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const historyPayload = messages.slice(-5).map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          hotelId: selectedHotelId || undefined,
          history: historyPayload,
        }),
      });

      let reply = "I have noted your request. Let me know if you need anything else!";
      let actionHref: string | undefined;
      let actionText: string | undefined;

      if (res.ok) {
        const data = await res.json();
        reply = data.reply || reply;

        // Auto-switch chat context pill if AI identifies or recommends a specific hotel
        if (data.hotelId && !selectedHotelId) {
          setSelectedHotelId(data.hotelId);
        }

        if (data.toolUsed === "checkAvailability") {
          actionHref = "/customer/booking";
          actionText = `Book Room Now →`;
        } else if (data.toolUsed === "lookupBooking") {
          actionHref = "/customer/my-bookings";
          actionText = "View Reservation Folio & Pre-Check-in →";
        }
      } else {
        const lower = text.toLowerCase();
        if (lower.includes("time") || lower.includes("check-in") || lower.includes("check in") || lower.includes("check out")) {
          reply = "Standard Check-in begins at 02:00 PM and Check-out is until 11:00 AM across LuckNexa properties. Early check-in can be requested via digital pre-check-in.";
          actionHref = "/customer/pre-checkin";
          actionText = "Go to Digital Pre-Check-In →";
        } else if (lower.includes("wifi") || lower.includes("wi-fi") || lower.includes("breakfast")) {
          reply = "High-speed Wi-Fi and complimentary breakfast buffets (07:00 AM - 10:30 AM) are available across all partner properties for registered guests.";
        } else if (lower.includes("rate") || lower.includes("room") || lower.includes("availab") || lower.includes("book")) {
          reply = "We have luxury rooms starting from ₹2,500/night to ₹8,500/night across Delhi, Mumbai, Udaipur, and Kolkata.";
          actionHref = "/customer/booking";
          actionText = "Browse & Book Rooms →";
        } else if (lower.includes("res-") || lower.includes("track") || lower.includes("booking")) {
          reply = "Your reservation is confirmed in our hotel management system. You can view booking details and initiate 1-click digital check-in directly from My Bookings.";
          actionHref = "/customer/my-bookings";
          actionText = "View My Bookings →";
        }
      }

      const aiReply: Message = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actionHref,
        actionText,
      };

      setMessages((prev) => [...prev, aiReply]);
    } catch (e) {
      const fallbackReply: Message = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: "I am ready to assist with your stay across all LuckNexa hotels. You can also reach our 24/7 central desk directly at +91 90000 00000.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 p-6 sm:p-7 rounded-2xl text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-purple-500/30 border border-purple-400/40 text-purple-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {selectedHotel ? `${selectedHotel.name} Concierge` : "LuckNexa Platform AI"}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Assistant
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-2 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-300" /> 24/7 AI Concierge Desk
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            {selectedHotel
              ? `Chatting directly with ${selectedHotel.name} (${selectedHotel.city}) front desk concierge.`
              : "Discover hotels across India, check live rates, or lookup your stay."}
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/customer/booking"
            className="px-4 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <BedDouble className="w-4 h-4" />
            <span>Book Room</span>
          </Link>
        </div>
      </div>

      {/* Property Selector Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 pl-1">
          Chat Context:
        </span>
        <button
          onClick={() => setSelectedHotelId("")}
          className={`shrink-0 px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
            selectedHotelId === ""
              ? "bg-purple-600 text-white shadow-xs font-bold"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>🌐 All Properties (LuckNexa)</span>
        </button>

        {hotels.map((h) => (
          <button
            key={h.id}
            onClick={() => setSelectedHotelId(h.id)}
            className={`shrink-0 px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedHotelId === h.id
                ? "bg-purple-600 text-white shadow-xs font-bold"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{h.name}</span>
            <span className="text-[10px] opacity-70">({h.city})</span>
          </button>
        ))}
      </div>

      {/* Main Chat Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[540px] overflow-hidden">
        {/* Messages List */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50">
          {messages.map((m) => {
            const isAi = m.sender === "ai";
            return (
              <div
                key={m.id}
                className={`flex items-start gap-3 ${isAi ? "" : "flex-row-reverse"}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs shadow-xs ${
                    isAi
                      ? "bg-gradient-to-br from-purple-600 to-indigo-600 text-white"
                      : "bg-slate-900 text-white"
                  }`}
                >
                  {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[80%] sm:max-w-[70%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                    isAi
                      ? "bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs"
                      : "bg-slate-900 text-white rounded-tr-xs"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>

                  {m.actionHref && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100">
                      <Link
                        href={m.actionHref}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-700 hover:underline"
                      >
                        <span>{m.actionText || "View Details"}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}

                  <span
                    className={`block text-[10px] mt-1.5 ${
                      isAi ? "text-slate-400" : "text-slate-400 text-right"
                    }`}
                  >
                    {m.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-2 text-slate-400 text-xs p-3">
              <Bot className="w-4 h-4 animate-bounce text-purple-600" />
              <span className="animate-pulse font-medium">AI Concierge is processing your answer...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-3 bg-white border-t border-slate-100 flex gap-2 overflow-x-auto no-scrollbar">
          {QUICK_PROMPTS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q.text)}
              className="shrink-0 text-xs font-medium bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-700 px-3 py-1.5 rounded-full border border-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>{q.label}</span>
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-4 bg-white border-t border-slate-200 flex gap-3"
        >
          <input
            type="text"
            placeholder={
              selectedHotel
                ? `Ask about ${selectedHotel.name} (e.g. 'Available rooms', 'Wi-Fi', 'Dining')...`
                : "Ask about hotels, cities (Delhi, Mumbai), rates, or enter Booking ID (e.g. RES-101)..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-purple-600 shadow-xs"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline text-xs">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
