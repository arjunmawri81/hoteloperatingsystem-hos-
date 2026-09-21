"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Sparkles, Send, X, MessageSquare, ChevronDown, ShieldCheck, User, RefreshCw, AlertCircle } from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  "🏨 Check available rooms & rates",
  "⏰ What are check-in and check-out timings?",
  "📶 Wi-Fi password & Breakfast hours",
  "🔍 Track booking #RES-8471",
];

export function GuestAIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Namaste! 🙏 I am your 24/7 Hotel AI Concierge. How can I assist with your stay, room bookings, or hotel amenities today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

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
      const res = await fetch("http://localhost:5000/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, hotelId: "hotel-taj-delhi" }),
      });

      let reply = "I'm here to help with your stay. Let me know if you need anything else!";
      if (res.ok) {
        const data = await res.json();
        reply = data.reply || reply;
      } else {
        // Intelligent fallback
        const lower = text.toLowerCase();
        if (lower.includes("time") || lower.includes("check-in") || lower.includes("check in")) {
          reply = "Standard Check-in begins at 12:00 PM and Check-out is until 11:00 AM. Early check-in can be requested at front desk.";
        } else if (lower.includes("wifi") || lower.includes("wi-fi") || lower.includes("breakfast")) {
          reply = "High-speed Wi-Fi is complimentary throughout the property (Network: Taj_Guest_WiFi). Complimentary buffet breakfast is served from 7:00 AM to 10:30 AM at the All-Day Dining Restaurant.";
        } else if (lower.includes("rate") || lower.includes("room") || lower.includes("availab")) {
          reply = "We have Deluxe Rooms starting at ₹4,500/night and Executive Suites starting at ₹7,500/night. You can book directly from the Booking tab!";
        } else if (lower.includes("res-") || lower.includes("track") || lower.includes("booking")) {
          reply = "Your reservation is confirmed and active in our system. You can proceed with Express Digital Pre-Check-In to receive your room key instantly upon arrival!";
        }
      }

      const aiReply: Message = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiReply]);
    } catch (e) {
      const fallbackReply: Message = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: "I've noted your request. Our front desk team is also available 24/7 at +91 90000 00000.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-[#EC3013] hover:shadow-2xl hover:scale-105 text-white font-bold text-xs sm:text-sm px-4 py-3 rounded-full shadow-xl transition-all duration-300 cursor-pointer border border-white/20"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          <span>✨ 24/7 AI Concierge</span>
        </button>
      )}

      {/* Floating Chat Modal Box */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[520px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 p-4 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-300">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm flex items-center gap-1.5">
                  <span>Hotel AI Concierge</span>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-mono px-1.5 py-0.2 rounded-full uppercase">
                    Live
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">Instant answers, room availability &amp; assistance</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
            {messages.map((m) => {
              const isAi = m.sender === "ai";
              return (
                <div
                  key={m.id}
                  className={`flex items-start gap-2.5 ${isAi ? "" : "flex-row-reverse"}`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs ${
                      isAi
                        ? "bg-purple-600 text-white"
                        : "bg-slate-900 text-white"
                    }`}
                  >
                    {isAi ? <Sparkles className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  </div>

                  <div
                    className={`max-w-[78%] p-3 rounded-2xl text-xs shadow-xs leading-relaxed ${
                      isAi
                        ? "bg-white text-slate-800 border border-slate-200 rounded-tl-xs"
                        : "bg-slate-900 text-white rounded-tr-xs"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.text}</p>
                    <span
                      className={`block text-[9px] mt-1 ${
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
              <div className="flex items-center gap-2 text-slate-400 text-xs p-2">
                <Bot className="w-4 h-4 animate-bounce text-purple-600" />
                <span className="animate-pulse font-medium">AI Concierge is thinking...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="p-2.5 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto no-scrollbar">
            {QUICK_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="shrink-0 text-[11px] font-medium bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200 transition-colors cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Input Footer */}
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-3 bg-white border-t border-slate-200 flex gap-2">
            <input
              type="text"
              placeholder="Ask anything about your stay or hotel..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-purple-600"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
