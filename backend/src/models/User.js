const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
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
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: [
        "super_admin",
        "hotel_admin",
        "area_manager",
        "hotel_manager",
        "receptionist",
        "housekeeping",
        "customer",
        "ai_receptionist",
      ],
      required: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      default: "",
    },
    orgId: {
      type: String,
      default: "",
    },
    orgName: {
      type: String,
      default: "",
    },
    hotelId: {
      type: String,
      default: "",
    },
    hotelName: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving if it has been modified or is new
UserSchema.pre("save", async function () {
  if (!this.isModified("passwordHash")) {
    return;
  }

  // Only hash if it is not already hashed (looks like standard bcrypt hash start with $2a$ or $2b$)
  if (this.passwordHash.startsWith("$2a$") || this.passwordHash.startsWith("$2b$")) {
    return;
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  } catch (error) {
    throw error;
  }
});

module.exports = mongoose.model("User", UserSchema);
