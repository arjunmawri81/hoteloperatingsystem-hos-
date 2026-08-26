export default function HotelComparisonPage() {
  const comparisonData = [
    {
      hotel: "Meridian Downtown",
      occupancy: "84%",
      adr: "$142",
      revpar: "$119",
      reservations: 214,
      cancellations: 9,
    },
    {
      hotel: "Meridian Airport",
      occupancy: "76%",
      adr: "$118",
      revpar: "$90",
      reservations: 176,
      cancellations: 14,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-[#111827] tracking-tight">
          Hotel Comparison
        </h1>
        <p className="text-[14px] text-[#6B7280] mt-1">
          Performance across assigned hotels
        </p>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#E5E7EB] text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
              <th className="pb-3 pr-6 font-bold">HOTEL</th>
              <th className="pb-3 pr-6 font-bold">OCCUPANCY</th>
              <th className="pb-3 pr-6 font-bold">ADR</th>
              <th className="pb-3 pr-6 font-bold">REVPAR</th>
              <th className="pb-3 pr-6 font-bold">RESERVATIONS</th>
              <th className="pb-3 text-right font-bold">CANCELLATIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3F4F6] text-[14px]">
            {comparisonData.map((row, idx) => (
              <tr key={idx} className="hover:bg-[#F9FAFB]/80 transition-colors">
                <td className="py-4 pr-6 font-medium text-[#111827]">
                  {row.hotel}
                </td>
                <td className="py-4 pr-6 text-[#4B5563]">{row.occupancy}</td>
                <td className="py-4 pr-6 text-[#4B5563]">{row.adr}</td>
                <td className="py-4 pr-6 text-[#4B5563]">{row.revpar}</td>
                <td className="py-4 pr-6 text-[#4B5563]">{row.reservations}</td>
                <td className="py-4 text-right text-[#4B5563]">
                  {row.cancellations}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
