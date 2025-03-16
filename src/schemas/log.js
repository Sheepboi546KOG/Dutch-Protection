const mongoose = require("mongoose");

const logChannelSchema = new mongoose.Schema({
  logChannelId: {
    type: String,
    required: true,
    unique: true, // Ensures only one log channel can be set
  },
});

const LogChannel = mongoose.model("LogChannel", logChannelSchema);

module.exports = LogChannel;
