const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/User");

// Google Login
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

// Google Callback
router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/notAllowed",
  }),
  (req, res) => {
    res.redirect("/home"); // success
  },
);

// Restricted page
router.get("/notAllowed", (req, res) => {
  res.render("notAllowed");
});

// Unauthorised users message
router.get("/unauthorised", (req, res) => {
  res.render("unauthorised", { message: "Only Cse department are allowed" });
});

// Logout
router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success", "Logged out successfully.");
    res.redirect("/");
  });
});

// Middleware to check if user is logged in
function isLoggedIn(req, res, next) {
  // if (!req.isAuthenticated || !req.isAuthenticated()) {
  if (!req.user) {
    return res.redirect("/auth/google");
  }
  next();
}

// Show favourites form
router.get("/favourites", isLoggedIn, (req, res) => {
  res.render("users/favourites", { user: req.user });
});

// Handle favourite sports submission
router.post("/favourites", isLoggedIn, async (req, res) => {
  try {
    let favourites = req.body.favourites || [];
    if (!Array.isArray(favourites)) favourites = [favourites];
    favourites = favourites.map((sport) => sport.toLowerCase());

    await User.findByIdAndUpdate(req.user._id, { favourites });
    res.redirect("/sports");
  } catch (err) {
    console.error("Error updating favourites:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Save notification date for sports
router.post("/notify-date", isLoggedIn, async (req, res) => {
  const selectedDate = req.body.date;

  if (!selectedDate) {
    return res.status(400).send("No date selected.");
  }

  try {
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { notificationDates: selectedDate },
    });

    console.log(
      `Notification date ${selectedDate} saved for user ${req.user.name}`,
    );
    res.redirect("/sports");
  } catch (err) {
    console.error("Error saving notification date:", err.message);
    res.status(500).send("Error saving notification date");
  }
});

// Save notification date for cabpools
router.post("/notify-cab-date", isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const selectedDate = req.body.date;

    if (!selectedDate) {
      return res.status(400).send("No date provided.");
    }

    if (!user.cabNotificationDates.includes(selectedDate)) {
      user.cabNotificationDates.push(selectedDate);
      await user.save();
    }

    res.redirect("/cabs");
  } catch (err) {
    console.error("Error saving cab notification date:", err);
    res.status(500).send("Something went wrong.");
  }
});

// POST /cab-notify-date (/users no, remove users)

router.post("/cab-notify-date", isLoggedIn, async (req, res) => {
  const { date } = req.body;

  if (!date) {
    return res.status(400).send("No date provided.");
  }

  try {
    const user = await User.findById(req.user._id);

    if (!user.cabNotificationDates.includes(date)) {
      user.cabNotificationDates.push(date);
      await user.save();
    }

    res.redirect("/cabs");
  } catch (err) {
    console.error("Error saving cab notification date:", err);
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;
