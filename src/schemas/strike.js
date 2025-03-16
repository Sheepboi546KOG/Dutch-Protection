const mongoose = require('mongoose');
const strike = require('../commands/moderation/strike');

const strikeSchema = new mongoose.Schema({
  strikeId: {
    type: String,
    required: true, // Ensures that strikeId is always present
    unique: true, // Ensures that strikeId is unique
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
    type: String, // Stores the image URL if there's an image
    default: null, // Allows for no image to be attached
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
    default: Date.now, // Stores the creation date of the strike
  },
});

module.exports = mongoose.model('Strike', strikeSchema);

