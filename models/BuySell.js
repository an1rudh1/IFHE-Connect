const mongoose = require("mongoose");

const buySellSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  category: String,
  contact: String, // email or phone
  images: [String], // Array of image URLs or filenames
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  username: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("BuySell", buySellSchema);
