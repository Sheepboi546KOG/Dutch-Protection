const mongoose = require('mongoose');

const roundup = new mongoose.Schema({
  eventsHosted: { type: Number, default: 0 },
  OfficerAdded: { type: Number, default: 0 },
  OfficerUpdated: { type: Number, default: 0 },
  OfficerRemoved: { type: Number, default: 0 },
  Bans: { type: Number, default: 0 },
  Strikes: { type: Number, default: 0 },
  Warnings: { type: Number, default: 0 },
});

module.exports = mongoose.model('RoundUp', roundup);
