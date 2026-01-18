const mongoose = require("mongoose");

const sportSchema = new mongoose.Schema({
  sportType: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  location: {
    type: String,
    required: true,
  },
  date: {
    type: String, // "yyyy-mm-dd"
    required: true,
  },
  time: {
    type: String, // "HH:mm"
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  postedBy: String,
});

module.exports = mongoose.model("Sport", sportSchema);
