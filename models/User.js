const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  googleId: String,
  name: String,
  email: String,
  photo: String,
  username: {
    type: String,
    unique: true,
    sparse: true, // allows multiple documents with `username: null`
  },
  favourites: [{ type: String, lowercase: true }],
  notificationDates: [String], // e.g., [2025-08-05]
  cabNotificationDates: [String],
});

module.exports = mongoose.model("User", userSchema);
