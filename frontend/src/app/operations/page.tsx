export default function OperationsDashboardPage() {
  const stats = [
    {
      title: "OCCUPANCY",
      value: "84%",
      subtext: "98 rooms",
    },
    {
      title: "AVAILABLE ROOMS",
      value: "18",
      subtext: "right now",
    },
    {
      title: "ARRIVALS TODAY",
      value: "14",
      subtext: "6 already checked in",
    },
    {
      title: "REVENUE TODAY",
      value: "$12,480",
      subtext: "room + F&B",
    },
  ];

  const todaysArrivals = [
    {
      guest: "E. Thornton",
      room: "204",
      time: "2:00 PM",
    },
    {
      guest: "M. Al-Farsi",
      room: "311",
      time: "2:30 PM",
    },
    {
      guest: "S. Lindqvist",
      room: "108",
      time: "3:15 PM",
    },
    {
      guest: "J. Okafor",
      room: "412",
      time: "4:00 PM",
    },
  ];

  const roomStatuses = [
    { count: 18, label: "Available" },
    { count: 62, label: "Occupied" },
    { count: 9, label: "Dirty" },
    { count: 3, label: "Out of Order" },
  ];

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div>
        <h1 className="text-[28px] font-bold text-[#111827] tracking-tight">
          Property Dashboard
        </h1>
        <p className="text-[14px] text-[#6B7280] mt-1">
          Meridian Downtown — today at a glance
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

      {/* Two Column Grid: Today's Arrivals & Room Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
        {/* Left: Today's Arrivals (7 cols) */}
        <div className="lg:col-span-7">
          <h2 className="text-[16px] font-bold text-[#111827] mb-4">
            Today&apos;s Arrivals
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                  <th className="pb-3 pr-6 font-bold">GUEST</th>
                  <th className="pb-3 pr-6 font-bold">ROOM</th>
                  <th className="pb-3 text-right font-bold">TIME</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6] text-[14px]">
                {todaysArrivals.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#F9FAFB]/60 transition-colors">
                    <td className="py-4 pr-6 font-medium text-[#111827]">
                      {row.guest}
                    </td>
                    <td className="py-4 pr-6 text-[#4B5563]">{row.room}</td>
                    <td className="py-4 text-right text-[#6B7280]">
                      {row.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Room Status (5 cols) */}
        <div className="lg:col-span-5">
          <h2 className="text-[16px] font-bold text-[#111827] mb-4">
            Room Status
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {roomStatuses.map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-5 rounded-md border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.04)] text-left"
              >
                <div className="text-[28px] font-bold text-[#111827] tracking-tight">
                  {item.count}
                </div>
                <div className="text-[12px] text-[#6B7280] mt-1">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
