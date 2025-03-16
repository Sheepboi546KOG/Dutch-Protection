const mongoose = require("mongoose");

const gBotPermsSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true }, // The user's Discord ID
});

module.exports = mongoose.model("GBotPerms", gBotPermsSchema);
