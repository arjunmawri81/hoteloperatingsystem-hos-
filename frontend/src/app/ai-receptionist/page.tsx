"use client";

import { useState, useEffect, useRef } from "react";
import { aiApi } from "@/lib/api";
import { AIConversation } from "@/types";
import { Send, Bot, User, AlertCircle, RefreshCw, CheckCircle2, ShieldAlert } from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "guest" | "ai" | "agent";
  text: string;
  timestamp: string;
}

export default function AIReceptionistPage() {
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>("conv-1");
  const [isLoading, setIsLoading] = useState(true);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

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

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesMap, activeConvId]);

  const activeMessages = messagesMap[activeConvId] || [
    { id: "m-1", sender: "guest", text: "Hello, I have a question about my stay.", timestamp: "Just now" },
    { id: "m-2", sender: "ai", text: "Hello! I am Aura, your AI Concierge. How may I assist you today?", timestamp: "Just now" },
  ];

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isSending) return;

    const userText = inputMessage.trim();
    setInputMessage("");

    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: "guest",
      text: userText,
      timestamp: nowTime,
    };

    // Append user message immediately
    const updated = [...activeMessages, userMsg];
    setMessagesMap({ ...messagesMap, [activeConvId]: updated });
    setIsSending(true);

    try {
      const res = await aiApi.sendMessage(activeConvId, userText);
      const aiReply: ChatMessage = {
        id: `m-${Date.now() + 1}`,
        sender: "ai",
        text: res.reply || `Aura AI: I have recorded your request "${userText}". Our front desk team has been notified.`,
        timestamp: res.timestamp || nowTime,
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

  const handleEscalate = () => {
    setToastMsg("🚨 Conversation escalated to Hotel Front Desk Manager on duty.");
    setTimeout(() => setToastMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#111827] tracking-tight">
            AI Receptionist Console
          </h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            24/7 autonomous guest concierge, multi-channel messaging &amp; escalations
          </p>
        </div>

        <button
          onClick={loadConversations}
          title="Refresh"
          className="p-2 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] rounded text-[#4B5563] self-start"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#EC3013]" : ""}`} />
        </button>
      </div>

      {/* Toast Notice */}
      {toastMsg && (
        <div className="bg-amber-50 border border-amber-300 text-amber-900 text-[13px] px-4 py-2.5 rounded flex items-center gap-2 animate-in fade-in duration-200">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Chat Container Window */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-xs overflow-hidden grid grid-cols-1 md:grid-cols-12 h-[560px]">
        {/* Left: Conversations List (4 cols) */}
        <div className="md:col-span-4 border-r border-[#E5E7EB] flex flex-col h-full bg-[#FAFAFA]">
          <div className="p-3.5 border-b border-[#E5E7EB] bg-white font-bold text-[13px] text-[#111827]">
            Guest Conversations
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#E5E7EB]">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-[#9CA3AF] text-[12px]">
                No conversations found
              </div>
            ) : (
              conversations.map((c) => {
                const isActive = c.id === activeConvId;
                return (
                  <div
                    key={c.id}
                    onClick={() => setActiveConvId(c.id)}
                    className={`p-3.5 cursor-pointer transition-colors ${
                      isActive ? "bg-white border-l-4 border-[#EC3013]" : "hover:bg-[#F3F4F6]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[13px] text-[#111827]">
                        {c.guestName}
                      </span>
                      <span className="text-[10px] text-[#9CA3AF]">{c.timestamp}</span>
                    </div>

                    <div className="text-[12px] text-[#6B7280] truncate mt-1">
                      {c.lastMessage}
                    </div>

                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-[10px] font-semibold text-[#4B5563] bg-[#E5E7EB] px-1.5 py-0.5 rounded capitalize">
                        {c.channel}
                      </span>
                      {c.status === "escalated" && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                          Escalated
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Active Chat View (8 cols) */}
        <div className="md:col-span-8 flex flex-col h-full bg-white">
          {/* Chat Header */}
          <div className="p-3.5 border-b border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#EC3013] text-white flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[13px] font-bold text-[#111827]">
                  {conversations.find((c) => c.id === activeConvId)?.guestName || "Guest Conversation"}
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Aura AI Assistant Active</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleEscalate}
              className="px-3 py-1.5 border border-[#D1D5DB] hover:bg-amber-50 hover:text-amber-800 text-[#4B5563] text-[12px] font-semibold rounded transition-colors"
            >
              Escalate to Front Desk
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-5 overflow-y-auto space-y-3.5 bg-[#FAFAFA]/50">
            {activeMessages.map((m) => {
              const isGuest = m.sender === "guest";
              return (
                <div
                  key={m.id}
                  className={`flex flex-col max-w-[75%] ${
                    isGuest ? "items-start" : "items-end ml-auto"
                  }`}
                >
                  <div
                    className={`p-3.5 rounded-lg text-[13px] leading-relaxed shadow-2xs ${
                      isGuest
                        ? "bg-white text-[#111827] border border-[#E5E7EB] rounded-bl-xs"
                        : "bg-[#EC3013] text-white rounded-br-xs font-medium"
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[10px] text-[#9CA3AF] mt-1 px-1">{m.timestamp}</span>
                </div>
              );
            })}
            {isSending && (
              <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280] p-2">
                <Bot className="w-3.5 h-3.5 text-[#EC3013] animate-spin" />
                <span>Aura AI is responding...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-[#E5E7EB] bg-white flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask Aura or send guest message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 px-3.5 py-2 border border-[#D1D5DB] rounded text-[13px] text-[#111827] focus:outline-none focus:border-[#EC3013]"
            />
            <button
              type="submit"
              disabled={isSending || !inputMessage.trim()}
              className="px-4 py-2 bg-[#EC3013] hover:bg-[#D62839] disabled:opacity-50 text-white font-bold text-[13px] rounded shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
