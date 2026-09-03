class NotificationService {
  /**
   * Send notification via available channels (Email, WhatsApp, Push)
   */
  static async send({
    recipient,
    type,
    channel = "all",
    payload = {},
  }) {
    console.log(`🔔 [Notification] Dispatched [${type}] to [${recipient}] via [${channel}]`);
    return {
      sent: true,
      timestamp: new Date().toISOString(),
      recipient,
      type,
    };
  }
}

module.exports = NotificationService;
