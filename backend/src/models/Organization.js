const mongoose = require("mongoose");

const OrganizationSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    ownerName: {
      type: String,
      default: "",
    },
    ownerEmail: {
      type: String,
      default: "",
    },
    ownerPhone: {
      type: String,
      default: "",
    },
    hotelsCount: {
      type: Number,
      default: 1,
    },
    activeRooms: {
      type: Number,
      default: 0,
    },
    monthlyRevenue: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending_approval", "active", "rejected", "trial", "suspended"],
      default: "pending_approval",
    },
    kycDocuments: {
      gstin: { type: String, default: "" },
      panNumber: { type: String, default: "" },
      fssaiNumber: { type: String, default: "" },
      tradeLicenseNumber: { type: String, default: "" },
      gstCertificateUrl: { type: String, default: "" },
      panCardUrl: { type: String, default: "" },
      businessProofUrl: { type: String, default: "" },
      ownerIdUrl: { type: String, default: "" },
      approvalRemarks: { type: String, default: "" },
      approvedBy: { type: String, default: "" },
      approvedAt: { type: Date, default: null },
      rejectionReason: { type: String, default: "" },
    },
    createdAt: {
      type: String,
      default: () => new Date().toISOString().split("T")[0],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Organization", OrganizationSchema);
