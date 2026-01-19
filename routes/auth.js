const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/User");

// Temp
console.log("AUTH ROUTES LOADED");
router.get("/test-auth", (req, res) => {
  res.send("Auth route working");
});

//  GOOGLE AUTH

// Google Login
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);

// Google Callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/notAllowed",
  }),
  (req, res) => {
    res.redirect("/home");
  },
);

// AUTH PAGES

router.get("/notAllowed", (req, res) => {
  res.render("notAllowed");
});

router.get("/unauthorised", (req, res) => {
  res.render("unauthorised", {
    message: "Only CSE department users are allowed",
  });
});

// Logout
router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect("/");
  });
});

// AUTH MIDDLEWARE

function isLoggedIn(req, res, next) {
  if (!req.user) {
    return res.redirect("/auth/google");
  }
  next();
}

//  FAVOURITES

router.get("/favourites", isLoggedIn, (req, res) => {
  res.render("users/favourites", { user: req.user });
});

router.post("/favourites", isLoggedIn, async (req, res) => {
  try {
    let favourites = req.body.favourites || [];
    if (!Array.isArray(favourites)) favourites = [favourites];

    favourites = favourites.map((s) => s.toLowerCase());

    await User.findByIdAndUpdate(req.user._id, { favourites });
    res.redirect("/sports");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

// SPORTS NOTIFY DATE

router.post("/notify-date", isLoggedIn, async (req, res) => {
  const { date } = req.body;
  if (!date) return res.status(400).send("No date selected");

  try {
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { notificationDates: date },
    });
    res.redirect("/sports");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving notification date");
  }
});

// CAB NOTIFY DATE

router.post("/cab-notify-date", isLoggedIn, async (req, res) => {
  const { date } = req.body;
  if (!date) return res.status(400).send("No date provided");

  try {
    const user = await User.findById(req.user._id);
    if (!user.cabNotificationDates.includes(date)) {
      user.cabNotificationDates.push(date);
      await user.save();
    }
    res.redirect("/cabs");
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong");
  }
});

module.exports = router;
