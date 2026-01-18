const mongoose = require("mongoose");

const cabpoolSchema = new mongoose.Schema({
  from: String,
  to: String,
  date: {
    type: String,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  availableSeats: Number,
  contactNumber: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  username: String,
});

module.exports = mongoose.model("CabPool", cabpoolSchema);
