export default function KnowledgeBasePage() {
  const articles = [
    {
      title: "Check-in & Check-out Policies",
      category: "Front Desk Guidelines",
      content:
        "Standard check-in time is 2:00 PM and check-out is 11:00 AM. Early check-in requests before 12:00 PM are subject to room availability and require Front Desk Manager approval.",
    },
    {
      title: "Breakfast & Dining Timings",
      category: "F&B / Restaurant",
      content:
        "Buffet breakfast is open from 6:30 AM to 10:30 AM in the Main Dining Hall. 24/7 Room Service is accessible via the in-room QR code or AI concierge chat.",
    },
    {
      title: "Cancellation & Refund Policies",
      category: "Billing & Reservations",
      content:
        "Free cancellation is allowed up to 48 hours prior to check-in. Same-day cancellations incur a 1-night room charge penalty.",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[28px] font-bold text-[#111827] tracking-tight">
          Knowledge Base
        </h1>
        <p className="text-[14px] text-[#6B7280] mt-1">
          Context and reference documents used by the AI Agent
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        {articles.map((item, idx) => (
          <div
            key={idx}
            className="bg-white p-6 rounded-md border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-3"
          >
            <span className="text-[11px] font-bold text-[#E63946] uppercase tracking-wider">
              {item.category}
            </span>
            <h3 className="text-[16px] font-bold text-[#111827]">
              {item.title}
            </h3>
            <p className="text-[13px] text-[#6B7280] leading-relaxed">
              {item.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
