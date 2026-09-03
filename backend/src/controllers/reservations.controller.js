const ReservationsService = require("../services/reservations.service");

class ReservationsController {
  static async getAll(req, res, next) {
    try {
      const reservations = await ReservationsService.listReservations({
        tenant: req.tenant,
        filters: req.query,
      });
      return res.status(200).json({
        success: true,
        count: reservations.length,
        data: reservations,
      });
    } catch (err) {
      next(err);
    }
  }

  static async create(req, res, next) {
    try {
      const reservation = await ReservationsService.createReservation({
        data: req.body,
        user: req.user,
        tenant: req.tenant,
        ipAddress: req.ip || req.connection?.remoteAddress,
      });
      return res.status(201).json({
        success: true,
        message: "Reservation confirmed successfully",
        data: reservation,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateStatus(req, res, next) {
    try {
      const reservation = await ReservationsService.updateStatus({
        id: req.params.id,
        status: req.body.status,
        user: req.user,
        tenant: req.tenant,
        ipAddress: req.ip || req.connection?.remoteAddress,
      });
      return res.status(200).json({
        success: true,
        message: `Reservation status updated to ${req.body.status}`,
        data: reservation,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ReservationsController;
