export default function BillingPage() {
  const stats = [
    {
      title: "TOTAL INVOICED",
      value: "$68,420",
    },
    {
      title: "PAID",
      value: "$54,110",
    },
    {
      title: "PENDING",
      value: "$9,840",
    },
    {
      title: "OVERDUE",
      value: "$4,470",
    },
  ];

  const invoices = [
    {
      id: "INV-8821",
      guest: "E. Thornton",
      room: "204",
      amount: "$612.00",
      status: "Paid",
      date: "Aug 19",
    },
    {
      id: "INV-8822",
      guest: "M. Al-Farsi",
      room: "311",
      amount: "$940.00",
      status: "Pending",
      date: "Aug 20",
    },
    {
      id: "INV-8823",
      guest: "C. Duval",
      room: "215",
      amount: "$318.00",
      status: "Paid",
      date: "Aug 18",
    },
    {
      id: "INV-8824",
      guest: "R. Petrov",
      room: "306",
      amount: "$205.00",
      status: "Overdue",
      date: "Aug 12",
    },
    {
      id: "INV-8825",
      guest: "H. Yamada",
      room: "119",
      amount: "$444.00",
      status: "Paid",
      date: "Aug 18",
    },
  ];

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-[#111827] tracking-tight">
          Billing & Invoices
        </h1>
        <p className="text-[14px] text-[#6B7280] mt-1">
          Guest folios and payment status
        </p>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-md border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          >
            <div className="text-[11px] font-bold text-[#E63946] uppercase tracking-wider">
              {stat.title}
            </div>
            <div className="text-[34px] font-bold text-[#111827] mt-3 tracking-tight">
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Invoices Table */}
      <div className="overflow-x-auto pt-2">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#E5E7EB] text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
              <th className="pb-3 pr-6 font-bold">INVOICE</th>
              <th className="pb-3 pr-6 font-bold">GUEST</th>
              <th className="pb-3 pr-6 font-bold">ROOM</th>
              <th className="pb-3 pr-6 font-bold">AMOUNT</th>
              <th className="pb-3 pr-6 font-bold">STATUS</th>
              <th className="pb-3 text-right font-bold">DATE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3F4F6] text-[14px]">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-[#F9FAFB]/80 transition-colors">
                <td className="py-4 pr-6 font-medium text-[#111827]">
                  {inv.id}
                </td>
                <td className="py-4 pr-6 font-medium text-[#111827]">
                  {inv.guest}
                </td>
                <td className="py-4 pr-6 text-[#4B5563]">{inv.room}</td>
                <td className="py-4 pr-6 text-[#4B5563]">{inv.amount}</td>
                <td className="py-4 pr-6">
                  {inv.status === "Paid" && (
                    <span className="text-[12px] text-[#4B5563]">Paid</span>
                  )}
                  {inv.status === "Pending" && (
                    <span className="text-[12px] text-[#E63946] bg-[#FDE8E8] px-2.5 py-1 rounded-sm font-medium">
                      Pending
                    </span>
                  )}
                  {inv.status === "Overdue" && (
                    <span className="text-[12px] text-[#E63946] bg-[#FDE8E8] px-2.5 py-1 rounded-sm font-medium">
                      Overdue
                    </span>
                  )}
                </td>
                <td className="py-4 text-right text-[#6B7280]">{inv.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
