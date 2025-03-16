const mongoose = require("mongoose");

const eventPermsSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true }, // The user's Discord ID
});

module.exports = mongoose.model("EventPerms", eventPermsSchema);
