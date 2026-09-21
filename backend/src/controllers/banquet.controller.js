const BanquetHall = require("../models/BanquetHall");
const EventBooking = require("../models/EventBooking");
const CashShift = require("../models/CashShift");
const CashTransaction = require("../models/CashTransaction");

// Get all banquet halls
exports.getHalls = async (req, res) => {
  try {
    let halls = await BanquetHall.find();
    if (halls.length === 0) {
      const defaultHalls = [
        {
          name: "Grand Kohinoor Ballroom",
          code: "GKB-01",
          capacity: 500,
          layout: "Round Table",
          basePricePerDay: 75000,
          areaSqFt: 6500,
          dimension: "100ft x 65ft",
          image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80",
          facilities: ["Stage", "LED Video Wall", "Central AC", "Premium Sound System", "Green Room", "Valet Parking"],
          status: "available",
        },
        {
          name: "Regal Sapphire Hall",
          code: "RSH-02",
          capacity: 200,
          layout: "Theater",
          basePricePerDay: 45000,
          areaSqFt: 3200,
          dimension: "65ft x 50ft",
          image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80",
          facilities: ["Projector", "DJ Lighting", "Central AC", "Surround Sound", "Buffet Area"],
          status: "available",
        },
        {
          name: "Emerald Executive Boardroom",
          code: "EEB-03",
          capacity: 40,
          layout: "U-Shape",
          basePricePerDay: 20000,
          areaSqFt: 1200,
          dimension: "40ft x 30ft",
          image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
          facilities: ["4K Screen", "Video Conferencing", "Hi-Speed Wi-Fi", "Whiteboard", "Tea/Coffee Bar"],
          status: "available",
        },
      ];
      halls = await BanquetHall.insertMany(defaultHalls);
    }
    res.json({ success: true, data: halls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a banquet hall
exports.createHall = async (req, res) => {
  try {
    const hall = await BanquetHall.create(req.body);
    res.status(201).json({ success: true, data: hall });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get all event bookings
exports.getBookings = async (req, res) => {
  try {
    const bookings = await EventBooking.find().sort({ eventDate: 1 });
    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create an event booking
exports.createBooking = async (req, res) => {
  try {
    const count = await EventBooking.countDocuments();
    const bookingId = `EVT-${1000 + count + 1}`;
    const balanceDue = (req.body.totalAmount || 0) - (req.body.advancePaid || 0);

    const booking = await EventBooking.create({
      ...req.body,
      bookingId,
      balanceDue,
    });

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update event booking status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const booking = await EventBooking.findByIdAndUpdate(id, { status }, { new: true });
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Settle / Collect Due payment for event booking
exports.settlePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amountPaid, paymentMode = "Cash" } = req.body;
    
    let booking = null;
    if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
      booking = await EventBooking.findById(id);
    }
    if (!booking) {
      booking = await EventBooking.findOne({ bookingId: id });
    }
    if (!booking) {
      return res.status(404).json({ success: false, message: `Booking ${id} not found` });
    }

    const payAmount = Number(amountPaid) || booking.balanceDue;
    const newAdvance = (booking.advancePaid || 0) + payAmount;
    const newBalanceDue = Math.max(0, (booking.totalAmount || 0) - newAdvance);
    const newStatus = newBalanceDue === 0 ? "completed" : booking.status;

    booking.advancePaid = newAdvance;
    booking.balanceDue = newBalanceDue;
    booking.status = newStatus;
    await booking.save();

    // Auto-record transaction in active Cashier Shift
    try {
      let activeShift = await CashShift.findOne({
        status: "open",
        ...(booking.hotelId && booking.hotelId !== "hotel-101" ? { hotelId: booking.hotelId } : {}),
      }).sort({ createdAt: -1 });

      if (!activeShift) {
        activeShift = await CashShift.findOne({ status: "open" }).sort({ createdAt: -1 });
      }

      if (activeShift) {
        const txId = `CTX-${Date.now().toString().slice(-6)}`;
        await CashTransaction.create({
          transactionId: txId,
          shiftId: activeShift.shiftId,
          hotelId: activeShift.hotelId,
          hotelName: activeShift.hotelName || "Main Property",
          orgId: activeShift.orgId || "org-1",
          type: "cash_in",
          category: "advance_deposit",
          amount: payAmount,
          description: `Banquet Due Settlement for ${booking.bookingId} (${booking.customerName} - ${booking.hallName}) via ${paymentMode}`,
          referenceId: booking.bookingId,
          recordedBy: req.user?.name || "Banquet Desk Cashier",
        });

        // Update shift totals so cash counter immediately reflects the amount
        activeShift.totalCashIn = (activeShift.totalCashIn || 0) + payAmount;
        activeShift.expectedCash = (activeShift.openingFloat || 0) + activeShift.totalCashIn - (activeShift.totalCashOut || 0);
        await activeShift.save();
      }
    } catch (txErr) {
      console.error("Banquet CashTransaction auto-link error:", txErr);
    }

    res.json({ success: true, message: `Payment of ₹${payAmount.toLocaleString()} recorded successfully via ${paymentMode}.`, data: booking });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
