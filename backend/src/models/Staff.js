const mongoose = require("mongoose");

const StaffSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      default: "+91 98000 00000",
    },
    hotel: {
      type: String,
      default: "Meridian Grand Palace",
    },
    department: {
      type: String,
      enum: ["Reception", "Housekeeping", "Restaurant", "Finance", "Management", "Area Operations", "Inventory", "Sales"],
      default: "Reception",
    },
    role: {
      type: String,
      default: "Staff Member",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    orgId: {
      type: String,
      default: "org-1",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Staff", StaffSchema);
