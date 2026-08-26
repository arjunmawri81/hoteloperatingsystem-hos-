export default function HotelAdminDashboardPage() {
  const stats = [
    {
      title: "ASSIGNED HOTELS",
      value: "4",
      subtext: "2 areas",
    },
    {
      title: "TOTAL ROOMS",
      value: "312",
      subtext: "across all properties",
    },
    {
      title: "OCCUPANCY",
      value: "78%",
      subtext: "org-wide",
    },
    {
      title: "REVENUE",
      value: "$94,200",
      subtext: "MTD",
    },
  ];

  const hotelPerformances = [
    {
      hotel: "Meridian Downtown",
      occupancy: "84%",
      revenue: "$31,200",
    },
    {
      hotel: "Meridian Airport",
      occupancy: "76%",
      revenue: "$22,900",
    },
    {
      hotel: "Meridian Riverside",
      occupancy: "71%",
      revenue: "$19,400",
    },
    {
      hotel: "Meridian Business Bay",
      occupancy: "80%",
      revenue: "$20,700",
    },
  ];

  const pendingApprovals = [
    {
      title: "Refund request — Booking #RES-10293",
      details: "Meridian Downtown · $180",
    },
    {
      title: "Purchase order — Linen supplier",
      details: "Meridian Airport · $2,400",
    },
    {
      title: "Area Manager reassignment",
      details: "Meridian Riverside → North Area",
    },
  ];

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div>
        <h1 className="text-[28px] font-bold text-[#111827] tracking-tight">
          Hotel Admin Dashboard
        </h1>
        <p className="text-[14px] text-[#6B7280] mt-1">
          Meridian Hotels & Resorts — organization overview
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
            <div className="text-[13px] text-[#9CA3AF] mt-2 font-normal">
              {stat.subtext}
            </div>
          </div>
        ))}
      </div>

      {/* Two Column Grid: Hotel Performance & Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
        {/* Left: Hotel Performance (8 cols) */}
        <div className="lg:col-span-8">
          <h2 className="text-[16px] font-bold text-[#111827] mb-4">
            Hotel Performance
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                  <th className="pb-3 pr-6 font-bold">HOTEL</th>
                  <th className="pb-3 pr-6 font-bold">OCCUPANCY</th>
                  <th className="pb-3 text-right font-bold">REVENUE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6] text-[14px]">
                {hotelPerformances.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#F9FAFB]/60 transition-colors">
                    <td className="py-4 pr-6 font-medium text-[#111827]">
                      {row.hotel}
                    </td>
                    <td className="py-4 pr-6 text-[#4B5563]">
                      {row.occupancy}
                    </td>
                    <td className="py-4 text-right text-[#4B5563] font-medium">
                      {row.revenue}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Pending Approvals (4 cols) */}
        <div className="lg:col-span-4">
          <h2 className="text-[16px] font-bold text-[#111827] mb-4">
            Pending Approvals
          </h2>
          <div className="divide-y divide-[#E5E7EB] border-t border-b border-[#E5E7EB]">
            {pendingApprovals.map((item, idx) => (
              <div key={idx} className="py-4 space-y-1">
                <div className="text-[14px] font-medium text-[#111827]">
                  {item.title}
                </div>
                <div className="text-[13px] text-[#6B7280]">
                  {item.details}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
