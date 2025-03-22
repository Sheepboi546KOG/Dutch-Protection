const mongoose = require('mongoose');
const strike = require('../commands/moderation/strike');

const strikeSchema = new mongoose.Schema({
  strikeId: {
    type: String,
    required: true,
    unique: true, 
  },
  userId: {
    type: String,
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    default: null,
  },
  removed: {
    type: Boolean,
    default: false,
  },
  removalReason: {
    type: String,
    default: null,
  },
  date: {
    type: Date,
    default: Date.now, 
  },
});

module.exports = mongoose.model('Strike', strikeSchema);

