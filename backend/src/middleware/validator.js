/**
 * Middleware: Request Payload Validation
 */
function validate(schemaFn) {
  return (req, res, next) => {
    const errors = schemaFn(req.body);
    if (errors && errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }
    next();
  };
}

// Built-in validation rules for hotel operations
const schemas = {
  reservation: (data) => {
    const errors = [];
    if (!data.guestName || typeof data.guestName !== "string" || !data.guestName.trim()) {
      errors.push("guestName is required");
    }
    if (!data.checkIn || isNaN(Date.parse(data.checkIn))) {
      errors.push("valid checkIn date is required (YYYY-MM-DD)");
    }
    if (!data.checkOut || isNaN(Date.parse(data.checkOut))) {
      errors.push("valid checkOut date is required (YYYY-MM-DD)");
    }
    if (data.checkIn && data.checkOut && new Date(data.checkIn) >= new Date(data.checkOut)) {
      errors.push("checkIn date must be earlier than checkOut date");
    }
    return errors;
  },

  hotel: (data) => {
    const errors = [];
    if (!data.name || typeof data.name !== "string") errors.push("name is required");
    if (!data.city || typeof data.city !== "string") errors.push("city is required");
    return errors;
  },

  posOrder: (data) => {
    const errors = [];
    if (!data.tableNumber && !data.roomNumber) {
      errors.push("Either tableNumber or roomNumber is required");
    }
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      errors.push("items list must contain at least one item");
    }
    return errors;
  },

  housekeepingStatus: (data) => {
    const validStatuses = ["dirty", "cleaning", "inspection", "inspected", "clean", "out_of_order"];
    const errors = [];
    if (data.status && !validStatuses.includes(data.status)) {
      errors.push(`status must be one of: ${validStatuses.join(", ")}`);
    }
    return errors;
  },

  authLogin: (data) => {
    const errors = [];
    if (!data.email || typeof data.email !== "string") errors.push("email is required");
    return errors;
  },

  authSignup: (data) => {
    const errors = [];
    if (!data.name || typeof data.name !== "string" || !data.name.trim()) {
      errors.push("name is required");
    }
    if (!data.email || typeof data.email !== "string" || !data.email.trim()) {
      errors.push("email is required");
    }
    return errors;
  },

  authRegister: (data) => {
    const errors = [];
    if (!data.orgName) errors.push("orgName is required");
    if (!data.adminName) errors.push("adminName is required");
    if (!data.email) errors.push("email is required");
    return errors;
  },
};

module.exports = {
  validate,
  schemas,
};
