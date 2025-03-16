const mongoose = require("mongoose");

const devSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  isDev: { type: Boolean, default: true }, // Marks if the user is a developer
});

const Dev = mongoose.model("Dev", devSchema);

module.exports = Dev;
