const mongoose = require("mongoose");

const warningSchema = new mongoose.Schema({
  warningId: { type: String, required: true, unique: true },  // Unique warning ID
  userId: { type: String, required: true },  // The ID of the user being warned
  reason: { type: String, required: true },  // The reason for the warning
  image: { type: String, default: null },  // Optional image evidence (URL)
  removed: { type: Boolean, default: false },  // Flag to mark if the warning was removed
  removalReason: { type: String, default: null },  // Reason for removal
  date: { type: Date, default: Date.now },  // Date when the warning was issued
});

const Warning = mongoose.model("Warning", warningSchema);

module.exports = Warning;
