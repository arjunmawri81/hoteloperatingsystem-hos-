"use client";

import { useState, useEffect, useRef } from "react";
import { aiApi } from "@/lib/api";
import { AIConversation } from "@/types";
import {
  Send,
  Bot,
  User,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  ShieldAlert,
  BookOpen,
  Plus,
  Trash2,
  Sparkles,
} from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "guest" | "ai" | "agent";
  text: string;
  timestamp: string;
}

interface AIKnowledgeItem {
  _id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
}

export default function AIReceptionistPage() {
  const [activeTab, setActiveTab] = useState<"chat" | "knowledge">("chat");
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>("conv-1");
  const [isLoading, setIsLoading] = useState(true);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Knowledge Base State
  const [knowledgeList, setKnowledgeList] = useState<AIKnowledgeItem[]>([]);
  const [newKb, setNewKb] = useState({
    category: "Amenities & Facilities",
    question: "",
    answer: "",
    keywords: "",
  });

  // Chat message map
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>({
    "conv-1": [
      { id: "m-1", sender: "guest", text: "Hello, what time is check-in today?", timestamp: "2:00 PM" },
      { id: "m-2", sender: "ai", text: "Check-in begins at 2:00 PM at the front desk. Would you like an early check-in request noted for your reservation?", timestamp: "2:01 PM" },
      { id: "m-3", sender: "guest", text: "Yes please, arriving around noon.", timestamp: "2:04 PM" },
      { id: "m-4", sender: "ai", text: "Noted! I've flagged your reservation (#RES-10293) for early check-in priority. The team will have Room 204 ready on arrival.", timestamp: "2:04 PM" },
    ],
    "conv-2": [
      { id: "m-1", sender: "guest", text: "Do you have a Deluxe room available tomorrow?", timestamp: "1:30 PM" },
      { id: "m-2", sender: "ai", text: "Yes! We have Deluxe King rooms available starting at ₹3,500/night with river view and complimentary breakfast.", timestamp: "1:31 PM" },
    ],
    "conv-3": [
      { id: "m-1", sender: "guest", text: "Can I get late checkout at 2:00 PM?", timestamp: "11:15 AM" },
      { id: "m-2", sender: "ai", text: "Late checkout up to 1:00 PM is complimentary for our guests. 2:00 PM can be arranged with the front desk for a ₹500 fee. Shall I request this for you?", timestamp: "11:16 AM" },
    ],
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const data = await aiApi.getConversations();
      setConversations(data);
      if (data.length > 0 && !data.find((c) => c.id === activeConvId)) {
        setActiveConvId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadKnowledge = async () => {
    try {
      const res = await fetch("/api/ai/knowledge");
      if (res.ok) {
        const json = await res.json();
        setKnowledgeList(json.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadConversations();
    loadKnowledge();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isSending) return;

    const userText = inputMessage.trim();
    setInputMessage("");
    setIsSending(true);

    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: "guest",
      text: userText,
      timestamp: nowTime,
    };

    const currentMessages = messagesMap[activeConvId] || [];
    const updated = [...currentMessages, userMsg];
    setMessagesMap({ ...messagesMap, [activeConvId]: updated });

    try {
      // Query backend AI chat engine with live tool-calling
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, hotelId: "hotel-101" }),
      });

      let replyText = "I have acknowledged your request.";
      if (res.ok) {
        const data = await res.json();
        replyText = data.reply || replyText;
      }

      const aiReply: ChatMessage = {
        id: `m-${Date.now() + 1}`,
        sender: "ai",
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessagesMap({
        ...messagesMap,
        [activeConvId]: [...updated, aiReply],
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const handleEscalate = async () => {
    try {
      const res = await fetch("/api/ai/escalate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: activeConversation?.guestName || "Guest",
          roomNumber: (activeConversation as any)?.roomNumber || "Online AI Chat",
          reason: "Guest requested immediate human assistance from AI Receptionist.",
        }),
      });
      if (res.ok) {
        setToastMsg("🚨 Conversation escalated to Hotel Front Desk Manager on duty (Ticket Created).");
        setTimeout(() => setToastMsg(null), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddKnowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/ai/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newKb,
          keywords: newKb.keywords.split(",").map((s) => s.trim()),
        }),
      });
      if (res.ok) {
        setToastMsg("Knowledge item added to AI database!");
        setNewKb({ category: "Amenities & Facilities", question: "", answer: "", keywords: "" });
        loadKnowledge();
        setTimeout(() => setToastMsg(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteKnowledge = async (id: string) => {
    try {
      await fetch(`/api/ai/knowledge/${id}`, { method: "DELETE" });
      setKnowledgeList(knowledgeList.filter((k) => k._id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const activeConversation = conversations.find((c) => c.id === activeConvId);
  const activeMessages = messagesMap[activeConvId] || [];

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              24/7 Autonomous AI Agent
            </span>
            <h1 className="text-[26px] font-bold text-[#111827] tracking-tight">
              AI Receptionist &amp; Concierge Suite
            </h1>
          </div>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            24/7 autonomous guest concierge, live database tool calling, knowledge base &amp; escalations.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("chat")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              activeTab === "chat" ? "bg-slate-900 text-white" : "bg-white text-slate-600 border"
            }`}
          >
            Live Concierge Console
          </button>
          <button
            onClick={() => setActiveTab("knowledge")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              activeTab === "knowledge" ? "bg-slate-900 text-white" : "bg-white text-slate-600 border"
            }`}
          >
            AI Knowledge Base ({knowledgeList.length})
          </button>
        </div>
      </div>

      {/* Toast Notice */}
      {toastMsg && (
        <div className="bg-amber-50 border border-amber-300 text-amber-900 text-[13px] px-4 py-2.5 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toastMsg}</span>
        </div>
      )}

      {activeTab === "chat" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left: Conversations list */}
          <div className="bg-white border rounded-2xl p-4 shadow-sm space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Guest Channels (WhatsApp / Web)
            </h2>
            {conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => setActiveConvId(c.id)}
                className={`p-3 rounded-xl cursor-pointer border transition-all ${
                  activeConvId === c.id
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-slate-50 text-slate-700 border-slate-100 hover:bg-slate-100"
                }`}
              >
                <div className="flex justify-between items-center text-xs font-bold">
                  <span>{c.guestName}</span>
                  <span className="text-[10px] opacity-70 uppercase">{c.channel}</span>
                </div>
                <p className="text-[11px] truncate mt-1 opacity-80">{c.lastMessage}</p>
              </div>
            ))}
          </div>

          {/* Right: Active Chat Window */}
          <div className="md:col-span-2 bg-white border rounded-2xl p-5 shadow-sm flex flex-col justify-between h-[520px]">
            <div>
              <div className="flex items-center justify-between pb-3 border-b">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {activeConversation?.guestName || "Guest"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Room {(activeConversation as any)?.roomNumber || "Online"} · Tool-Augmented Active AI Agent
                  </p>
                </div>
                <button
                  onClick={handleEscalate}
                  className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Escalate to Human
                </button>
              </div>

              {/* Messages viewport */}
              <div className="overflow-y-auto space-y-3 py-4 max-h-[380px]">
                {activeMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.sender === "guest" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs ${
                        m.sender === "guest"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      <p className="whitespace-pre-line">{m.text}</p>
                      <span className="text-[10px] block mt-1 opacity-60 text-right">
                        {m.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="flex gap-2 pt-3 border-t">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about live availability, booking #RES-10293, or hotel policies..."
                className="flex-1 px-4 py-2 border rounded-xl text-xs"
              />
              <button
                type="submit"
                disabled={isSending}
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Send
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Knowledge Base Management */
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border shadow-sm">
            <h2 className="text-base font-black text-slate-900">Add Knowledge Base Q&amp;A</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              The AI Receptionist automatically references these answers during guest chats and phone calls.
            </p>

            <form onSubmit={handleAddKnowledge} className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Category</label>
                <select
                  value={newKb.category}
                  onChange={(e) => setNewKb({ ...newKb, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                >
                  <option value="Check-in / Check-out">Check-in / Check-out</option>
                  <option value="Amenities & Facilities">Amenities &amp; Facilities</option>
                  <option value="Restaurant & Dining">Restaurant &amp; Dining</option>
                  <option value="Policies & Rules">Policies &amp; Rules</option>
                  <option value="Local Attractions">Local Attractions</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Guest Question</label>
                <input
                  type="text"
                  required
                  value={newKb.question}
                  onChange={(e) => setNewKb({ ...newKb, question: e.target.value })}
                  placeholder="e.g. Is airport shuttle service available?"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">AI Official Answer</label>
                <textarea
                  required
                  rows={2}
                  value={newKb.answer}
                  onChange={(e) => setNewKb({ ...newKb, answer: e.target.value })}
                  placeholder="Provide precise hotel information..."
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Keywords (comma-separated)</label>
                <input
                  type="text"
                  value={newKb.keywords}
                  onChange={(e) => setNewKb({ ...newKb, keywords: e.target.value })}
                  placeholder="airport, shuttle, cab, pickup"
                  className="w-full px-3 py-2 border rounded-xl mb-2"
                />
                <button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Save to AI
                </button>
              </div>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {knowledgeList.map((item) => (
              <div key={item._id} className="bg-white p-5 rounded-2xl border shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="bg-purple-50 text-purple-700 font-bold text-[10px] px-2 py-0.5 rounded-full uppercase">
                      {item.category}
                    </span>
                    <button
                      onClick={() => handleDeleteKnowledge(item._id)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mt-2">{item.question}</h3>
                  <p className="text-xs text-slate-600 mt-1">{item.answer}</p>
                </div>

                <div className="mt-4 pt-3 border-t flex flex-wrap gap-1">
                  {item.keywords.map((kw, idx) => (
                    <span key={idx} className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded">
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
