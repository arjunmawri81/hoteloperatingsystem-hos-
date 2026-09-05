const PosService = require("../services/pos.service");

class PosController {
  static async getOrders(req, res, next) {
    try {
      const orders = await PosService.listOrders({
        status: req.query.status,
      });
      return res.status(200).json({
        success: true,
        count: orders.length,
        data: orders,
      });
    } catch (err) {
      next(err);
    }
  }

  static async createOrder(req, res, next) {
    try {
      const order = await PosService.createOrder({
        data: req.body,
        user: req.user,
        tenant: req.tenant,
        ipAddress: req.ip || req.connection?.remoteAddress,
      });
      return res.status(201).json({
        success: true,
        message: "POS Order created successfully",
        data: order,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateOrderStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const order = await PosService.updateOrderStatus({
        id,
        status,
        user: req.user,
        tenant: req.tenant,
        ipAddress: req.ip || req.connection?.remoteAddress,
      });
      return res.status(200).json({
        success: true,
        message: `Order ${id} status updated to ${status}`,
        data: order,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = PosController;
