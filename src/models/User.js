import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },

  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    trim: true,
  },

  password: {
    type: String,
    required: true,
  },

  /* ================= AUTH FLOW FLAGS ================= */

  // Email OTP verified
  isVerified: {
    type: Boolean,
    default: false,
  },

  // Admin approval status
  status: {
    type: String,
    enum: ["PENDING", "ACTIVE", "REJECTED"],
    default: "PENDING",
  },

  approvedByAdmin: {
    type: Boolean,
    default: false,
  },

  /* ================= FUTURE READY ================= */

  authProvider: {
    type: String,
    enum: ["local", "google"],
    default: "local",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("User", userSchema);
