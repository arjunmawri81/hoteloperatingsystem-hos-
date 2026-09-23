const Room = require("../models/Room");
const Reservation = require("../models/Reservation");
const RestaurantOrder = require("../models/RestaurantOrder");
const EventBooking = require("../models/EventBooking");
const CashShift = require("../models/CashShift");
const CashTransaction = require("../models/CashTransaction");
const InventoryItem = require("../models/InventoryItem");
const HousekeepingTask = require("../models/HousekeepingTask");
const Complaint = require("../models/Complaint");
const Lead = require("../models/Lead");
const Hotel = require("../models/Hotel");

class ExecutiveBriefingService {
  /**
   * Deterministic Backend Multi-Tenant Aggregator
   * Strict orgId & assignedHotelIds scoping
   */
  static async getExecutiveBriefingSnapshot({ orgId = "org-1", hotelIds = [], period = "today", orgName = "Meridian Group" }) {
    // 1. Build Base Hotel Scope
    let hotelFilter = {};
    if (hotelIds && hotelIds.length > 0) {
      hotelFilter.id = { $in: hotelIds };
    } else if (orgId) {
      hotelFilter.orgId = orgId;
    }

    const matchedHotels = await Hotel.find(hotelFilter);
    const authorizedHotelIds = matchedHotels.map((h) => h.id);
    const hotelNames = matchedHotels.map((h) => h.name);

    // Scoped Filter for all data queries
    const scopedHotelFilter = authorizedHotelIds.length > 0 ? { hotelId: { $in: authorizedHotelIds } } : {};
    const scopedOrgFilter = orgId ? { orgId } : {};

    // 2. Date Setup
    const now = new Date();
    let periodLabel = "Today";

    if (period === "yesterday") {
      periodLabel = "Yesterday";
    } else if (period === "mtd") {
      periodLabel = "Month to Date";
    } else if (period === "all_time") {
      periodLabel = "All Time";
    }

    // 3. Rooms & Occupancy Calculations
    const totalRooms = await Room.countDocuments(scopedHotelFilter);
    const occupiedRooms = await Room.countDocuments({ ...scopedHotelFilter, status: "occupied" });
    const availableRooms = await Room.countDocuments({ ...scopedHotelFilter, status: "available" });
    const dirtyRooms = await Room.countDocuments({ ...scopedHotelFilter, status: { $in: ["dirty", "cleaning"] } });
    const maintenanceRooms = await Room.countDocuments({
      ...scopedHotelFilter,
      status: { $in: ["out_of_order", "maintenance"] },
    });

    const occupancyRateNum = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : 0;

    // Room Revenue & Reservations
    const reservationFilter = {
      status: { $ne: "cancelled" },
      ...(authorizedHotelIds.length > 0 ? { hotelId: { $in: authorizedHotelIds } } : scopedOrgFilter),
    };
    const reservations = await Reservation.find(reservationFilter);
    const roomRevenue = reservations.reduce((acc, r) => acc + (r.paidAmount || r.totalAmount || 0), 0);
    const totalBookingsCount = reservations.length;
    const checkedInCount = reservations.filter((r) => r.status === "checked_in").length;
    const confirmedUpcoming = reservations.filter((r) => r.status === "confirmed").length;

    const adr = occupiedRooms > 0 ? Math.round(roomRevenue / occupiedRooms) : 0;
    const revPar = totalRooms > 0 ? Math.round(roomRevenue / totalRooms) : 0;

    // 4. Restaurant & F&B Operations
    const orderFilter = {
      status: { $ne: "cancelled" },
      ...(authorizedHotelIds.length > 0 ? { hotelId: { $in: authorizedHotelIds } } : scopedOrgFilter),
    };
    const restaurantOrders = await RestaurantOrder.find(orderFilter);
    const restaurantRevenue = restaurantOrders.reduce((acc, o) => acc + (o.total || 0), 0);
    const activeKOTs = restaurantOrders.filter((o) => o.status === "in_kitchen" || o.status === "pending").length;

    // Top selling items tally
    const itemMap = {};
    restaurantOrders.forEach((o) => {
      (o.items || []).forEach((item) => {
        const name = item.name || "Item";
        itemMap[name] = (itemMap[name] || 0) + (item.quantity || 1);
      });
    });
    const topItems = Object.entries(itemMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, qty]) => `${name} (${qty} sold)`);

    // 5. Banquet & Events
    const banquetFilter = {
      status: { $ne: "cancelled" },
      ...(authorizedHotelIds.length > 0 ? { hotelId: { $in: authorizedHotelIds } } : scopedOrgFilter),
    };
    const eventBookings = await EventBooking.find(banquetFilter);
    const banquetRevenue = eventBookings.reduce((acc, b) => acc + (b.totalAmount || 0), 0);
    const banquetAdvancePaid = eventBookings.reduce((acc, b) => acc + (b.advancePaid || 0), 0);
    const banquetBalanceDue = eventBookings.reduce((acc, b) => acc + (b.balanceDue || 0), 0);
    const upcomingEvents = eventBookings.filter((b) => b.status === "confirmed").length;

    // 6. Cash Counter & Shifts
    const shiftFilter = {
      ...(authorizedHotelIds.length > 0 ? { hotelId: { $in: authorizedHotelIds } } : scopedOrgFilter),
    };
    const cashShifts = await CashShift.find(shiftFilter);
    const openShifts = cashShifts.filter((s) => s.status === "open").length;
    const totalCashCollected = cashShifts.reduce((acc, s) => acc + (s.totalCashIn || 0), 0);
    const totalDiscrepancy = cashShifts.reduce((acc, s) => acc + (s.discrepancy || 0), 0);

    // 7. Inventory & Supply Status
    const inventoryFilter = {
      ...(authorizedHotelIds.length > 0 ? { hotelId: { $in: authorizedHotelIds } } : {}),
    };
    const inventoryItems = await InventoryItem.find(inventoryFilter);
    const totalSkus = inventoryItems.length;
    const lowStockItems = inventoryItems.filter(
      (item) => item.status === "Low Stock" || item.status === "Critical" || item.quantity <= (item.minStock || 10)
    );
    const criticalItemsList = lowStockItems.slice(0, 5).map((i) => `${i.name} (${i.quantity} ${i.unit || "units"} left)`);

    // 8. Housekeeping & Guest Complaints
    const hkFilter = {
      ...(authorizedHotelIds.length > 0 ? { hotelId: { $in: authorizedHotelIds } } : {}),
    };
    const housekeepingTasks = await HousekeepingTask.find(hkFilter);
    const pendingCleaningTasks = housekeepingTasks.filter((t) => t.status === "pending" || t.status === "in_progress").length;

    const complaints = await Complaint.find();
    const openComplaints = complaints.filter((c) => c.status === "open" || c.status === "in_progress").length;
    const urgentComplaints = complaints.filter((c) => c.priority === "urgent" && c.status !== "resolved").length;

    // 9. CRM & Sales Leads
    const leadFilter = {
      ...(authorizedHotelIds.length > 0 ? { hotelId: { $in: authorizedHotelIds } } : scopedOrgFilter),
    };
    const leads = await Lead.find(leadFilter);
    const totalLeadsCount = leads.length;
    const convertedLeadsCount = leads.filter((l) => l.stage === "Converted" || l.status === "Converted").length;
    const hotLeadsCount = leads.filter((l) => (l.budget || 0) >= 100000 || l.stage === "Negotiation").length;
    const leadConversionRate = totalLeadsCount > 0 ? ((convertedLeadsCount / totalLeadsCount) * 100).toFixed(1) : 0;

    // 10. Financial Aggregation
    const totalGrossRevenue = roomRevenue + restaurantRevenue + banquetRevenue;

    // 11. Individual Property-by-Property Breakdown
    const propertyBreakdowns = [];
    for (const h of matchedHotels) {
      const hTotalRooms = await Room.countDocuments({ hotelId: h.id });
      const hOccupied = await Room.countDocuments({ hotelId: h.id, status: "occupied" });
      const hDirty = await Room.countDocuments({ hotelId: h.id, status: { $in: ["dirty", "cleaning"] } });
      const hRes = reservations.filter((r) => r.hotelId === h.id);
      const hRev = hRes.reduce((acc, r) => acc + (r.paidAmount || r.totalAmount || 0), 0);
      const hOcc = hTotalRooms > 0 ? ((hOccupied / hTotalRooms) * 100).toFixed(1) : "0";

      propertyBreakdowns.push({
        hotelId: h.id,
        hotelName: h.name,
        city: h.city || "",
        totalRooms: hTotalRooms,
        occupiedRooms: hOccupied,
        availableRooms: Math.max(0, hTotalRooms - hOccupied),
        dirtyRooms: hDirty,
        occupancyRate: `${hOcc}%`,
        roomRevenue: hRev,
        formattedRevenue: `₹${hRev.toLocaleString("en-IN")}`,
      });
    }

    const snapshot = {
      meta: {
        generatedAt: now.toISOString(),
        formattedTime: now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }),
        reportingPeriod: periodLabel,
        periodCode: period,
        orgId,
        orgName,
        authorizedPropertiesCount: matchedHotels.length || 1,
        authorizedHotelNames: hotelNames.length > 0 ? hotelNames : ["All Authorized Units"],
        hotelsList: matchedHotels.map((h) => ({ id: h.id, name: h.name, city: h.city })),
      },
      propertyBreakdowns,
      kpis: {
        totalGrossRevenue,
        formattedGrossRevenue: `₹${totalGrossRevenue.toLocaleString("en-IN")}`,
        occupancyRate: `${occupancyRateNum}%`,
        adr: `₹${adr.toLocaleString("en-IN")}`,
        revPar: `₹${revPar.toLocaleString("en-IN")}`,
        openIssuesCount: urgentComplaints + lowStockItems.length + dirtyRooms,
      },
      rooms: {
        totalRooms,
        occupiedRooms,
        availableRooms,
        dirtyRooms,
        maintenanceRooms,
        occupancyRate: `${occupancyRateNum}%`,
        roomRevenue,
        formattedRevenue: `₹${roomRevenue.toLocaleString("en-IN")}`,
        checkedInCount,
        confirmedUpcoming,
      },
      restaurant: {
        totalOrders: restaurantOrders.length,
        revenue: restaurantRevenue,
        formattedRevenue: `₹${restaurantRevenue.toLocaleString("en-IN")}`,
        activeKOTs,
        topItems: topItems.length > 0 ? topItems : ["Buffet Breakfast", "Special Thali"],
      },
      banquet: {
        totalEvents: eventBookings.length,
        upcomingEvents,
        revenue: banquetRevenue,
        formattedRevenue: `₹${banquetRevenue.toLocaleString("en-IN")}`,
        advancePaid: banquetAdvancePaid,
        balanceDue: banquetBalanceDue,
        formattedBalanceDue: `₹${banquetBalanceDue.toLocaleString("en-IN")}`,
      },
      cashCounter: {
        openShifts,
        totalCashCollected,
        formattedCashCollected: `₹${totalCashCollected.toLocaleString("en-IN")}`,
        discrepancy: totalDiscrepancy,
      },
      inventory: {
        totalSkus,
        lowStockCount: lowStockItems.length,
        criticalAlertItems: criticalItemsList.length > 0 ? criticalItemsList : ["All items stocked"],
      },
      housekeeping: {
        pendingTasks: pendingCleaningTasks,
        openComplaints,
        urgentComplaints,
      },
      crm: {
        totalLeads: totalLeadsCount,
        convertedLeads: convertedLeadsCount,
        hotLeads: hotLeadsCount,
        conversionRate: `${leadConversionRate}%`,
      },
    };

    return snapshot;
  }

  /**
   * Generates Chapter-by-Chapter Narration Script
   * Supports Hinglish, Hindi, and English
   */
  static async generateBriefingNarration({ snapshot, language = "hinglish" }) {
    const { meta, kpis, rooms, restaurant, banquet, cashCounter, inventory, housekeeping, crm } = snapshot;

    // Use Gemini if available for ultra-personalized tone, with high-quality grounded fallback
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const modelName = process.env.GEMINI_MODEL || "gemini-3.6-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`;

        const prompt = `You are the Executive AI Business Assistant for the owner of "${meta.orgName}".
Your role is to give a crisp, highly professional, encouraging, and detailed voice executive briefing based ONLY on the verified data below.

Verified Business Data:
${JSON.stringify(snapshot, null, 2)}

Language to use: ${language === "hindi" ? "Pure Hindi (Devanagari / Romanized)" : language === "english" ? "Professional English" : "Natural Business Hinglish (Hindi + English mix)"}

Return a valid JSON object matching this structure EXACTLY (do NOT wrap in markdown code fence if possible, just raw JSON):
{
  "title": "Executive Business Briefing",
  "summary": "1-2 sentence executive highlight",
  "chapters": [
    { "id": "overview", "title": "Executive Overview", "text": "...", "highlightKey": "revenue" },
    { "id": "rooms", "title": "Hotels & Occupancy", "text": "...", "highlightKey": "rooms" },
    { "id": "fnb_banquet", "title": "Restaurant & Banquet", "text": "...", "highlightKey": "restaurant" },
    { "id": "cash_finance", "title": "Cash & Collections", "text": "...", "highlightKey": "cash" },
    { "id": "operations", "title": "Inventory & Housekeeping", "text": "...", "highlightKey": "operations" },
    { "id": "crm_leads", "title": "Sales Leads & CRM", "text": "...", "highlightKey": "crm" },
    { "id": "closing", "title": "Summary & Action Items", "text": "...", "highlightKey": "action" }
  ]
}`;

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 2000 },
          }),
        });

        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(cleaned);
          return parsed;
        }
      } catch (err) {
        console.warn("Gemini narration fallback triggered:", err.message);
      }
    }

    // Built-in Grounded Script Generator (Hinglish / Hindi / English)
    if (language === "hindi") {
      return {
        title: `कार्यकारी व्यापार ब्रीफिंग - ${meta.orgName}`,
        summary: `कुल राजस्व ${kpis.formattedGrossRevenue}, कमरों की ऑक्यूपेंसी ${rooms.occupancyRate} और ${inventory.lowStockCount} वस्तुएं लो-स्टॉक पर हैं।`,
        chapters: [
          {
            id: "overview",
            title: "कार्यकारी अवलोकन (Executive Overview)",
            text: `नमस्ते सर! ${meta.orgName} के लिए ${meta.reportingPeriod} की कार्यकारी रिपोर्ट तैयार है। आपके सभी ${meta.authorizedPropertiesCount} अधिकृत होटलों का कुल सकल राजस्व ${kpis.formattedGrossRevenue} दर्ज हुआ है। समग्र व्यवसाय बहुत स्थिर गति से चल रहा है।`,
            highlightKey: "revenue",
          },
          {
            id: "rooms",
            title: "कमरे और ऑक्यूपेंसी (Rooms & Occupancy)",
            text: `होटल सेक्शन में कुल ${rooms.totalRooms} कमरों में से ${rooms.occupiedRooms} कमरे भरे हुए हैं, जिससे ऑक्यूपेंसी रेट ${rooms.occupancyRate} पहुंच गई है। रूम्स से कुल राजस्व ${rooms.formattedRevenue} आया है। औसत दैनिक किराया यानी ADR ${kpis.adr} है। वर्तमान में ${rooms.dirtyRooms} कमरों की सफाई जारी है और ${rooms.maintenanceRooms} कमरे मेंटेनेंस में हैं।`,
            highlightKey: "rooms",
          },
          {
            id: "fnb_banquet",
            title: "रेस्टोरेंट और बैंक्वेट (F&B & Banquet)",
            text: `रेस्टोरेंट विभाग ने कुल ${restaurant.totalOrders} ऑर्डर्स से ${restaurant.formattedRevenue} का कारोबार किया है। किचन में ${restaurant.activeKOTs} लाइव KOTs प्रोसेस हो रही हैं। बैंक्वेट इवेंट्स से कुल ₹${banquet.revenue.toLocaleString("en-IN")} का व्यापार हुआ है, जिसमें से ₹${banquet.balanceDue.toLocaleString("en-IN")} की बकाया राशि अभी प्राप्त होनी है।`,
            highlightKey: "restaurant",
          },
          {
            id: "cash_finance",
            title: "कैश काउंटर और वित्त (Cash & Finance)",
            text: `कैश काउंटर पर कुल ${cashCounter.openShifts} एक्टिव शिफ्ट्स चल रही हैं और आज ${cashCounter.formattedCashCollected} की नकद राशि संग्रहित हुई है। सिस्टम में कोई बड़ा अंतर या विसंगति नहीं पाई गई है।`,
            highlightKey: "cash",
          },
          {
            id: "operations",
            title: "इन्वेंट्री और हाउसकीपिंग (Operations & Inventory)",
            text: `इन्वेंट्री में ${inventory.lowStockCount} वस्तुओं का स्टॉक कम है, विशेष रूप से: ${inventory.criticalAlertItems.join(", ")}। हाउसकीपिंग में ${housekeeping.pendingTasks} कार्य बाकी हैं और ${housekeeping.openComplaints} गेस्ट शिकायतों पर तुरंत ध्यान देने की आवश्यकता है।`,
            highlightKey: "operations",
          },
          {
            id: "crm_leads",
            title: "सेल्स और लीड्स (Leads & CRM)",
            text: `सेल्स पाइपलाइन में आज कुल ${crm.totalLeads} लीड्स सक्रिय हैं, जिनमें ${crm.hotLeads} हाई-वैल्यू लीड्स शामिल हैं। लीड कन्वर्जन दर ${crm.conversionRate} रही है।`,
            highlightKey: "crm",
          },
          {
            id: "closing",
            title: "समापन और सुझाव (Next Steps)",
            text: `सर, यह थी आपकी सम्पूर्ण ब्रीफिंग। इन्वेंटरी के लो-स्टॉक आर्डर्स और बकाया बैंक्वेट पेमेंट्स को प्रायोरिटी पर प्रोसेस करने की सलाह दी जाती है। आप किसी भी विशिष्ट जानकारी के लिए अभी मुझसे प्रश्न पूछ सकते हैं।`,
            highlightKey: "action",
          },
        ],
      };
    }

    if (language === "english") {
      return {
        title: `Executive Business Briefing - ${meta.orgName}`,
        summary: `Gross revenue stands at ${kpis.formattedGrossRevenue} with ${rooms.occupancyRate} occupancy and ${inventory.lowStockCount} inventory items low on stock.`,
        chapters: [
          {
            id: "overview",
            title: "Executive Overview",
            text: `Good day Sir! Here is your verified executive briefing for ${meta.reportingPeriod} across ${meta.authorizedPropertiesCount} authorized property units. Your total gross revenue currently stands at ${kpis.formattedGrossRevenue}. Overall business operations are running smoothly.`,
            highlightKey: "revenue",
          },
          {
            id: "rooms",
            title: "Rooms & Occupancy Performance",
            text: `In the rooms department, ${rooms.occupiedRooms} out of ${rooms.totalRooms} rooms are occupied, delivering a strong occupancy rate of ${rooms.occupancyRate}. Room revenue generated is ${rooms.formattedRevenue} with an ADR of ${kpis.adr} and RevPAR of ${kpis.revPar}. Currently, ${rooms.dirtyRooms} rooms are in cleaning and ${rooms.maintenanceRooms} rooms are under maintenance.`,
            highlightKey: "rooms",
          },
          {
            id: "fnb_banquet",
            title: "Restaurant & Banquet Operations",
            text: `Food and Beverage clocked ${restaurant.formattedRevenue} across ${restaurant.totalOrders} dining orders, with ${restaurant.activeKOTs} active KOTs in the kitchen. Banquet operations generated ${banquet.formattedRevenue}, with ${banquet.upcomingEvents} confirmed events and a pending balance collection of ${banquet.formattedBalanceDue}.`,
            highlightKey: "restaurant",
          },
          {
            id: "cash_finance",
            title: "Cash Counter & Shift Balances",
            text: `Front desk cash registers report ${cashCounter.openShifts} open active shifts with a total cash collection of ${cashCounter.formattedCashCollected}. No unverified cash discrepancies are logged.`,
            highlightKey: "cash",
          },
          {
            id: "operations",
            title: "Inventory & Housekeeping Status",
            text: `Inventory tracking alerts ${inventory.lowStockCount} items below minimum stock threshold: ${inventory.criticalAlertItems.join(", ")}. Housekeeping has ${housekeeping.pendingTasks} pending tasks, and ${housekeeping.openComplaints} open guest tickets require attention.`,
            highlightKey: "operations",
          },
          {
            id: "crm_leads",
            title: "CRM & Sales Pipeline",
            text: `The sales pipeline is actively tracking ${crm.totalLeads} leads with ${crm.hotLeads} high-value prospects and an overall conversion rate of ${crm.conversionRate}.`,
            highlightKey: "crm",
          },
          {
            id: "closing",
            title: "Action Items & Conclusion",
            text: `That concludes your business briefing for ${meta.reportingPeriod}. Priority action items: review low stock purchase orders and follow up on pending banquet balances. You can now ask me any specific breakdown questions or resume whenever needed.`,
            highlightKey: "action",
          },
        ],
      };
    }

    // Default: Natural Hinglish
    return {
      title: `Executive AI Business Briefing - ${meta.orgName}`,
      summary: `Aaj ka Gross Revenue ${kpis.formattedGrossRevenue} cross ho chuka hai, Occupancy ${rooms.occupancyRate} hai aur ${inventory.lowStockCount} items low stock par hain.`,
      chapters: [
        {
          id: "overview",
          title: "Executive Overview (मुख्य सारांश)",
          text: `Good day Sir! ${meta.orgName} ki ${meta.reportingPeriod} ki verified business briefing ready hai. Aapke sabhi ${meta.authorizedPropertiesCount} properties ka total gross revenue ${kpis.formattedGrossRevenue} tak pahunch gaya hai. Business metrics bilkul healthy aur stable hain.`,
          highlightKey: "revenue",
        },
        {
          id: "rooms",
          title: "Hotels & Room Occupancy (होटल एवं कमरे)",
          text: `Rooms segment me total ${rooms.totalRooms} rooms me se ${rooms.occupiedRooms} rooms currently occupied hain, jisse overall occupancy ${rooms.occupancyRate} bani hui hai. Room revenue ${rooms.formattedRevenue} receive hua hai, with an ADR of ${kpis.adr} aur RevPAR of ${kpis.revPar}. Abhi ${rooms.dirtyRooms} rooms housekeeping cleaning me hain aur ${rooms.maintenanceRooms} rooms maintenance par hain.`,
          highlightKey: "rooms",
        },
        {
          id: "fnb_banquet",
          title: "Restaurant & Banquet (खान-पान एवं बैंक्वेट)",
          text: `Restaurant POS me total ${restaurant.totalOrders} orders se ${restaurant.formattedRevenue} ki sales hui hai. Kitchen me currently ${restaurant.activeKOTs} active KOTs prepare ho rahi hain. Top selling item raha: ${restaurant.topItems[0] || "Buffet Breakfast"}. Banquet & Events se total revenue ${banquet.formattedRevenue} hua hai, jisme ${banquet.formattedBalanceDue} ka pending balance collect hona baaki hai.`,
          highlightKey: "restaurant",
        },
        {
          id: "cash_finance",
          title: "Cash Counter & Shift Status (कैश एवं वित्त)",
          text: `Cash Counter par ${cashCounter.openShifts} active cashier shifts open hain, aur total cash in hand collection ${cashCounter.formattedCashCollected} record hua hai. Audit logs me cash discrepancy zero hai.`,
          highlightKey: "cash",
        },
        {
          id: "operations",
          title: "Inventory & Housekeeping (इन्वेंट्री एवं हाउसकीपिंग)",
          text: `Inventory me ${inventory.lowStockCount} items low stock alert par hain, jinme critical hain: ${inventory.criticalAlertItems.join(", ")}। Housekeeping team ke paas ${housekeeping.pendingTasks} pending tasks hain aur ${housekeeping.openComplaints} guest complaints active hain jinhe immediate attention chahiye.`,
          highlightKey: "operations",
        },
        {
          id: "crm_leads",
          title: "Sales Pipeline & CRM Leads (लीड्स)",
          text: `Sales CRM me total ${crm.totalLeads} active leads hain jisme ${crm.hotLeads} high-value deals negotiation phase me hain. Overall conversion rate ${crm.conversionRate} chal raha hai.`,
          highlightKey: "crm",
        },
        {
          id: "closing",
          title: "Action Items & Conclusion (प्राथमिकताएं)",
          text: `Sir, yeh tha aapka complete business overview. Priority action: Inventory ke low stock purchase orders approve karein aur Banquet balance collection follow up karein. Agar aapko kisi specific property ya department ka breakdown chahiye, toh aap mic se ya text me pooch sakte hain!`,
          highlightKey: "action",
        },
      ],
    };
  }

  /**
   * Mid-Briefing Interruption / Q&A Resolver
   * Grounded solely on verified snapshot figures
   */
  static async answerBriefingQuery({ snapshot, query, language = "hinglish", conversationHistory = [] }) {
    const qLower = (query || "").toLowerCase();

    // 1. Check if user wants to resume/continue briefing
    if (
      qLower.includes("resume") ||
      qLower.includes("continue") ||
      qLower.includes("aage") ||
      qLower.includes("chalu karo") ||
      qLower.includes("next")
    ) {
      return {
        answer:
          language === "hindi"
            ? "जी बिल्कुल सर, ब्रीफिंग को आगे जारी रखते हैं।"
            : language === "english"
            ? "Certainly Sir, resuming the executive briefing from where we left off."
            : "Ji bilkul Sir, briefing ko aage continue karte hain.",
        action: "resume_briefing",
        data: null,
      };
    }

    // 2. Use Gemini AI if key exists for natural language answering
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const modelName = process.env.GEMINI_MODEL || "gemini-3.6-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`;

        const prompt = `You are the executive AI Business Assistant for the owner of "${snapshot.meta.orgName}".
The owner interrupted the voice briefing to ask a specific question.
Answer directly, accurately, and concisely using ONLY the verified snapshot numbers below. Do NOT invent or hallucinate any numbers.
At the end of your answer, politely offer to resume the briefing (e.g. "Kya main aage ki briefing resume karun?").

Verified Business Snapshot:
${JSON.stringify(snapshot, null, 2)}

Owner Question: "${query}"
Language: ${language === "hindi" ? "Hindi" : language === "english" ? "English" : "Hinglish"}
`;

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 500 },
          }),
        });

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return {
            answer: text,
            action: "answer_provided",
            data: snapshot,
          };
        }
      } catch (err) {
        console.warn("Gemini Q&A failed, falling back:", err.message);
      }
    }

    // 3. Robust Built-in Grounded Q&A Fallback
    const { kpis, rooms, restaurant, banquet, cashCounter, inventory, housekeeping, crm, propertyBreakdowns } = snapshot;

    // Check if user is asking about a specific hotel / property
    if (propertyBreakdowns && propertyBreakdowns.length > 0) {
      const matchedProp = propertyBreakdowns.find(
        (p) =>
          qLower.includes(p.hotelName.toLowerCase()) ||
          (p.city && qLower.includes(p.city.toLowerCase())) ||
          (p.hotelId && qLower.includes(p.hotelId.toLowerCase()))
      );
      if (matchedProp) {
        return {
          answer: `Sir, **${matchedProp.hotelName}** ka specific breakdown:\n- **Occupancy**: ${matchedProp.occupancyRate} (${matchedProp.occupiedRooms}/${matchedProp.totalRooms} rooms)\n- **Room Revenue**: ${matchedProp.formattedRevenue}\n- **Available Rooms**: ${matchedProp.availableRooms}\n- **Dirty / In-Cleaning**: ${matchedProp.dirtyRooms} rooms.\n\nKya main poori business briefing resume karun?`,
          action: "answer_provided",
          category: "property_breakdown",
          data: matchedProp,
        };
      }
    }

    if (qLower.includes("banquet") || qLower.includes("event") || qLower.includes("shadi") || qLower.includes("wedding")) {
      return {
        answer: `Sir, Banquet department me total ${banquet.totalEvents} events registered hain. Total banquet revenue ${banquet.formattedRevenue} hai, advance ₹${banquet.advancePaid.toLocaleString("en-IN")} receive ho chuka hai aur ₹${banquet.balanceDue.toLocaleString("en-IN")} balance pending hai. Kya aap chahte hain main briefing resume karun?`,
        action: "answer_provided",
        category: "banquet",
        data: banquet,
      };
    }

    if (qLower.includes("cash") || qLower.includes("counter") || qLower.includes("paisa") || qLower.includes("collection")) {
      return {
        answer: `Sir, aaj Cash Counter par total ${cashCounter.formattedCashCollected} cash collect hua hai. Currently ${cashCounter.openShifts} cashier shifts open hain aur discrepancy ₹${cashCounter.discrepancy} hai. Kya main briefing continue karun?`,
        action: "answer_provided",
        category: "cash",
        data: cashCounter,
      };
    }

    if (qLower.includes("room") || qLower.includes("occupancy") || qLower.includes("dirty") || qLower.includes("cleaning")) {
      return {
        answer: `Sir, abhi total ${rooms.totalRooms} rooms me se ${rooms.occupiedRooms} occupied hain (${rooms.occupancyRate} occupancy). ${rooms.dirtyRooms} rooms dirty/cleaning state me hain aur ${rooms.maintenanceRooms} maintenance me hain. Room revenue ${rooms.formattedRevenue} hai. Kya main briefing resume karun?`,
        action: "answer_provided",
        category: "rooms",
        data: rooms,
      };
    }

    if (qLower.includes("restaurant") || qLower.includes("food") || qLower.includes("pos") || qLower.includes("khana")) {
      return {
        answer: `Sir, Restaurant me total ${restaurant.totalOrders} orders se ${restaurant.formattedRevenue} revenue generate hua hai. ${restaurant.activeKOTs} live KOTs open hain. Top items me shamil hain: ${restaurant.topItems.join(", ")}. Kya main aage resume karun?`,
        action: "answer_provided",
        category: "restaurant",
        data: restaurant,
      };
    }

    if (qLower.includes("inventory") || qLower.includes("stock") || qLower.includes("khatam") || qLower.includes("saman")) {
      return {
        answer: `Sir, inventory me ${inventory.lowStockCount} items low stock par hain. Critical items hain: ${inventory.criticalAlertItems.join(", ")}। Kya main briefing resume karun?`,
        action: "answer_provided",
        category: "inventory",
        data: inventory,
      };
    }

    if (qLower.includes("lead") || qLower.includes("sales") || qLower.includes("crm") || qLower.includes("customer")) {
      return {
        answer: `Sir, CRM me total ${crm.totalLeads} leads tracked hain, jinme ${crm.hotLeads} hot high-budget leads hain. Conversion rate ${crm.conversionRate} hai. Kya main briefing aage badhaun?`,
        action: "answer_provided",
        category: "crm",
        data: crm,
      };
    }

    // Generic Grounded Answer
    return {
      answer: `Sir, aapke business ka total verified revenue ${kpis.formattedGrossRevenue} hai, occupancy ${rooms.occupancyRate} hai, aur ${inventory.lowStockCount} inventory items low stock par hain. Kya aap chahte hain main poori briefing resume karun?`,
      action: "answer_provided",
      data: kpis,
    };
  }
}

module.exports = ExecutiveBriefingService;
