const mongoose = require("mongoose");

const warningSchema = new mongoose.Schema({
  warningId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  reason: { type: String, required: true },
  image: { type: String, default: null },
  removed: { type: Boolean, default: false },
  removalReason: { type: String, default: null },
  date: { type: Date, default: Date.now },
});

const Warning = mongoose.model("Warning", warningSchema);

module.exports = Warning;
