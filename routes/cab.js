const express = require("express");
const router = express.Router();
const CabPool = require("../models/cabpool");
const User = require("../models/User");
const sendEmail = require("../utils/sendMail");

// Middleware for ro check login
function isLoggedIn(req, res, next) {
  if (!req.user) {
    return res.redirect("/auth/google");
  }
  next();
}

// GET /cabs - show all cab listings
router.get("/", async (req, res) => {
  const cabs = await CabPool.find({}).populate("user").sort({ createdAt: -1 });
  res.render("cabs/cab", { cabs });
});

// GET /cabs/new - show form to create cab pool
router.get("/new", (req, res) => {
  res.render("cabs/new");
});

// to send notifications and post requests
router.post("/", isLoggedIn, async (req, res) => {
  try {
    const { from, to, date, time, availableSeats, contactNumber } = req.body;

    // Save listing
    const newCab = new CabPool({
      from,
      to,
      date,
      time,
      availableSeats,
      contactNumber,
      user: req.user._id,
      postedBy: req.user.name,
    });

    await newCab.save();

    // Find users to notify
    const usersToNotify = await User.find({
      cabNotificationDates: date,
    });

    // to RESPOND IMMEDIATELY
    res.redirect("/cabs");

    // to SEND EMAILS IN BACKGROUND
    (async () => {
      for (let user of usersToNotify) {
        if (user.email) {
          sendEmail({
            to: user.email,
            username: user.name,
            sportType: "Cabpool",
            location: `${from} → ${to}`,
            date, // "yyyy-mm-dd"
            time, // "HH:mm"
            postedBy: user.name, // req.user.name
          });
        }
      }

      console.log(
        "Cabpool users notified:",
        usersToNotify.map((u) => u.email),
      );
    })();
  } catch (err) {
    console.error("Error posting cabpool:", err);
    res.status(500).send("Something went wrong.");
  }
});

// GET /cabs/:id/edit - show edit form
router.get("/:id/edit", async (req, res) => {
  const { id } = req.params;
  const cab = await CabPool.findById(id);
  res.render("cabs/edit", { cab });
});

// DELETE /cabs/:id - delete a cab listing
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  await CabPool.findByIdAndDelete(id);
  res.redirect("/cabs");
});

//PUT /cabs/:id
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { from, to, time, availableSeats, contactNumber } = req.body;
  await CabPool.findByIdAndUpdate(id, {
    from,
    to,
    time,
    availableSeats,
    contactNumber,
  });
  res.redirect("/cabs");
});

module.exports = router;
