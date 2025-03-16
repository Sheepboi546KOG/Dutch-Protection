const mongoose = require('mongoose');

const officerSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  rank: { type: String, required: true },
  joined: { type: Date, default: Date.now() },
  rankUpdate: { type: Date, default: Date.now() },
  eventsHosted: { type: Number, default: 0 },
  eventsTotal: { type: Number, default: 0 },
  quotasFailed: { type: Number, default: 0 },
  loa: {
    status: { type: Boolean, default: false }, // Whether the officer is on LOA
    reason: { type: String, default: '' }, // Reason for LOA
  },
  rallyLOA: { type: Boolean, default: false }, // Rally-specific LOA status
});

module.exports = mongoose.model('Officer', officerSchema);
