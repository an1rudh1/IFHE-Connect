const express = require("express");
const router = express.Router();
const Sport = require("../models/sport");
const User = require("../models/User");
const sendEmail = require("../utils/sendMail");

// Middleware to check login
function isLoggedIn(req, res, next) {
  if (!req.user) {
    return res.redirect("/auth/google");
  }
  next();
}

// Shows all listings
router.get("/", async (req, res) => {
  const sports = await Sport.find({}).populate("user").sort({ createdAt: -1 });
  res.render("sports/sport", {
    sports,
  });
});

// GET /sports/new - show form to create new sport
router.get("/new", isLoggedIn, (req, res) => {
  res.render("sports/new");
});

// POST /sports - create a new sport listing and notify users
router.post("/", isLoggedIn, async (req, res) => {
  try {
    const { sportType, location, date, time } = req.body;

    const lowerSportType = sportType.toLowerCase().trim();

    const newSport = new Sport({
      sportType: lowerSportType,
      location,
      date, // string
      time, // string
      user: req.user._id,
      postedBy: req.user.name,
    });

    await newSport.save();

    // Find users whose favourites AND date match
    const usersToNotify = await User.find({
      favourites: lowerSportType,
      notificationDates: date,
    });

    // respond immediately
    res.redirect("/sports");

    // send emails in background
    (async () => {
      for (let user of usersToNotify) {
        if (user.email) {
          sendEmail({
            to: user.email,
            username: user.name,
            sportType: newSport.sportType,
            location: newSport.location,
            date,
            time,
            postedBy: newSport.postedBy,
          });
        }
      }

      console.log(
        "Users to notify:",
        usersToNotify.map((u) => u.email),
      );
    })();
  } catch (err) {
    console.error("Error creating sport listing:", err);
    res.status(500).send("Something went wrong.");
  }
});

// SHOW EDIT FORM
router.get("/:id/edit", isLoggedIn, async (req, res) => {
  const { id } = req.params;
  const sport = await Sport.findById(id);

  if (!sport || sport.user.toString() !== req.user._id.toString()) {
    return res.redirect("/sports");
  }

  res.render("sports/edit", { sport });
});

// UPDATE SPORT
router.put("/:id", isLoggedIn, async (req, res) => {
  const { id } = req.params;
  const { sportType, location, time } = req.body;

  const sport = await Sport.findById(id);
  if (!sport || sport.user.toString() !== req.user._id.toString()) {
    return res.redirect("/sports");
  }

  await Sport.findByIdAndUpdate(id, {
    sportType: sportType.toLowerCase(),
    location,
    time,
    // date: new Date(date),
  });

  res.redirect("/sports");
});

// DELETE SPORT
router.delete("/:id", isLoggedIn, async (req, res) => {
  const { id } = req.params;
  const sport = await Sport.findById(id);

  if (!sport || sport.user.toString() !== req.user._id.toString()) {
    return res.redirect("/sports");
  }

  await Sport.findByIdAndDelete(id);
  res.redirect("/sports");
});

module.exports = router;
