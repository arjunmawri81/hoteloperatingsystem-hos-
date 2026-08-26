"use client";

import { useState } from "react";

export default function AIReceptionistPage() {
  const [activeChat, setActiveChat] = useState("c-1");
  const [inputMessage, setInputMessage] = useState("");
  const [chatHistories, setChatHistories] = useState<Record<string, Array<{ sender: "guest" | "ai"; text: string }>>>({
    "c-1": [
      { sender: "guest", text: "What time is check-in?" },
      {
        sender: "ai",
        text: "Check-in is from 2:00 PM. Would you like an early check-in request added to your reservation?",
      },
      { sender: "guest", text: "Yes please, arriving around noon." },
      {
        sender: "ai",
        text: "Noted — I've flagged your reservation for early check-in. The front desk will confirm on arrival.",
      },
    ],
    "c-2": [
      { sender: "guest", text: "Do you have a Deluxe room tomorrow?" },
      { sender: "ai", text: "Yes, we have 4 Deluxe King rooms available starting at $180/night. Would you like me to reserve one for you?" },
    ],
    "c-3": [
      { sender: "guest", text: "Can I get late checkout?" },
      { sender: "ai", text: "Standard checkout is 11:00 AM. We can offer complimentary late checkout until 1:00 PM subject to room availability." },
    ],
    "c-4": [
      { sender: "guest", text: "Is breakfast included?" },
      { sender: "ai", text: "Buffet breakfast is served daily from 6:30 AM to 10:30 AM at our Main Dining Restaurant on the ground floor." },
    ],
    "c-5": [
      { sender: "guest", text: "Requesting extra towels" },
      { sender: "ai", text: "Certainly! I have notified the housekeeping team. Two extra plush bath towels will be delivered to your room shortly." },
    ],
  });

  const guests = [
    { id: "c-1", name: "E. Thornton", preview: "What time is check-in?" },
    { id: "c-2", name: "M. Al-Farsi", preview: "Do you have a Deluxe room tomorrow?" },
    { id: "c-3", name: "S. Lindqvist", preview: "Can I get late checkout?" },
    { id: "c-4", name: "Guest — Unknown", preview: "Is breakfast included?" },
    { id: "c-5", name: "J. Okafor", preview: "Requesting extra towels" },
  ];

  const currentMessages = chatHistories[activeChat] || [];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMsg = { sender: "ai" as const, text: inputMessage };
    setChatHistories({
      ...chatHistories,
      [activeChat]: [...currentMessages, newMsg],
    });
    setInputMessage("");
  };

  const handleEscalate = () => {
    alert("Ticket escalated to Front Desk Manager!");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-[#111827] tracking-tight">
          AI Receptionist — Conversations
        </h1>
        <p className="text-[14px] text-[#6B7280] mt-1">
          Live guest conversations
        </p>
      </div>

      {/* Main Conversation Split Container */}
      <div className="bg-white rounded-md border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.03)] grid grid-cols-1 lg:grid-cols-12 min-h-[560px] overflow-hidden">
        {/* Left: Guest Conversation List (4 cols) */}
        <div className="lg:col-span-4 border-r border-[#E5E7EB] divide-y divide-[#E5E7EB]">
          {guests.map((g) => {
            const isSelected = activeChat === g.id;
            return (
              <div
                key={g.id}
                onClick={() => setActiveChat(g.id)}
                className={`p-4 transition-colors cursor-pointer ${
                  isSelected ? "bg-white border-l-4 border-l-[#E63946]" : "hover:bg-[#F9FAFB]"
                }`}
              >
                <div className="text-[14px] font-bold text-[#111827]">
                  {g.name}
                </div>
                <div className="text-[12px] text-[#6B7280] mt-0.5 truncate">
                  {g.preview}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Active Chat Window (8 cols) */}
        <div className="lg:col-span-8 flex flex-col justify-between p-6 bg-[#FAFAFA]/50">
          {/* Messages Area */}
          <div className="space-y-6 overflow-y-auto max-h-[420px] pr-2">
            {currentMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === "ai" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "guest" ? (
                  <div className="text-[14px] text-[#111827] max-w-lg">
                    {msg.text}
                  </div>
                ) : (
                  <div className="bg-[#E63946] text-white p-3.5 rounded-md text-[13px] font-medium max-w-lg leading-relaxed shadow-xs">
                    {msg.text}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bottom Input Row */}
          <form onSubmit={handleSendMessage} className="pt-6 border-t border-[#E5E7EB] flex items-center gap-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2.5 bg-white border border-[#D1D5DB] rounded-sm text-[13px] text-[#111827] focus:outline-none focus:border-[#E63946]"
            />
            <button
              type="button"
              onClick={handleEscalate}
              className="px-5 py-2.5 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#111827] text-[13px] font-bold rounded-sm transition-colors cursor-pointer"
            >
              Escalate
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#E63946] hover:bg-[#D62839] text-white text-[13px] font-bold rounded-sm shadow-sm transition-colors cursor-pointer"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
