const mongoose = require("mongoose");

const swbPermsSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true }, // The user's Discord ID
});

module.exports = mongoose.model("SWBPerms", swbPermsSchema);
