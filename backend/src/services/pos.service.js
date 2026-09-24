const RestaurantOrder = require("../models/RestaurantOrder");
const AuditService = require("./audit.service");
const NotificationService = require("./notification.service");

class PosService {
  static async listOrders({ status }) {
    const filter = {};
    if (status) filter.status = status;
    return await RestaurantOrder.find(filter).sort({ createdAt: -1 });
  }

  static async createOrder({ data, user, tenant, ipAddress }) {
    const { tableNumber, roomNumber, items, total, status, guestName } = data;

    const newOrder = new RestaurantOrder({
      id: `POS-${Math.floor(400 + Math.random() * 600)}`,
      tableNumber: tableNumber || "T-01",
      roomNumber: roomNumber || undefined,
      guestName: guestName || user?.name || "Dine-in Guest",
      items: items || ["Kitchen Order"],
      total: Number(total) || 1000,
      status: status || "cooking",
      orgId: tenant?.orgId || "",
      hotelId: tenant?.hotelId || "",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });

    await newOrder.save();

    await AuditService.log({
      userId: user?.id || "system",
      userRole: user?.role || "hotel_manager",
      orgId: tenant?.orgId || "org-1",
      hotelId: tenant?.hotelId || "",
      action: "CREATE_POS_ORDER",
      resource: "pos",
      resourceId: newOrder.id,
      details: { tableNumber, roomNumber, items, total: newOrder.total },
      ipAddress,
    });

    await NotificationService.send({
      recipient: "KITCHEN_DISPLAY",
      type: "POS_KITCHEN_ORDER",
      payload: newOrder,
    });

    return newOrder;
  }

  static async updateOrderStatus({ id, status, user, tenant, ipAddress }) {
    const order = await RestaurantOrder.findOne({ id });
    if (!order) {
      const error = new Error(`Order ${id} not found.`);
      error.status = 404;
      throw error;
    }

    order.status = status;
    await order.save();

    await AuditService.log({
      userId: user?.id || "system",
      userRole: user?.role || "hotel_manager",
      orgId: tenant?.orgId || "org-1",
      hotelId: tenant?.hotelId || "",
      action: "UPDATE_POS_ORDER_STATUS",
      resource: "pos",
      resourceId: order.id,
      details: { status },
      ipAddress,
    });

    return order;
  }
}

module.exports = PosService;
