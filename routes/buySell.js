const express = require("express");
const router = express.Router();
const BuySell = require("../models/BuySell");
const multer = require("multer");
const methodOverride = require("method-override");
const path = require("path");

// Middleware to check login
function isLoggedIn(req, res, next) {
  if (!req.user) {
    return res.redirect("/auth/google");
  }
  next();
}

// Use method override
router.use(methodOverride("_method"));

// Set up Multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage: storage });

// GET /buy-sell - show all listings
router.get("/", async (req, res) => {
  try {
    const listings = await BuySell.find({})
      .populate("user")
      .sort({ createdAt: -1 });

    res.render("buySell/buySell", {
      listings,
      currentUserId: req.user ? req.user._id.toString() : null,
    });
  } catch (err) {
    console.error("Error loading Buy & Sell listings:", err);
    res.status(500).send("Something went wrong.");
  }
});

// GET /buy-sell/new - form to create new listing
router.get("/new", isLoggedIn, (req, res) => {
  res.render("buySell/new");
});

// POST /buy-sell - create listing
router.post("/", isLoggedIn, upload.array("images", 5), async (req, res) => {
  const { title, description, price, category, contact } = req.body;
  const imagePaths = req.files.map((file) => "/uploads/" + file.filename);

  const newListing = new BuySell({
    title,
    description,
    price,
    category,
    contact,
    images: imagePaths,
    user: req.user._id,
  });

  try {
    await newListing.save();
    res.redirect("/buy-sell");
  } catch (err) {
    console.error("Error creating listing:", err);
    res.status(500).send("Something went wrong.");
  }
});

// GET /buy-sell/:id/edit - form to edit listing
router.get("/:id/edit", isLoggedIn, async (req, res) => {
  const { id } = req.params;
  try {
    const listing = await BuySell.findById(id);
    if (!listing) return res.status(404).send("Listing not found");

    if (!listing.user.equals(req.user._id)) {
      return res.status(403).send("Unauthorized");
    }

    res.render("buySell/edit", { listing });
  } catch (err) {
    console.error("Error loading edit form:", err);
    res.status(500).send("Something went wrong.");
  }
});

//PUT /buy-sell/:id - update listing
router.put("/:id", isLoggedIn, upload.array("images", 5), async (req, res) => {
  const { id } = req.params;
  const { title, description, price, category, contact } = req.body;

  try {
    const listing = await BuySell.findById(id);
    if (!listing) return res.status(404).send("Listing not found");

    if (!listing.user.equals(req.user._id)) {
      return res.status(403).send("Unauthorized");
    }

    listing.title = title;
    listing.description = description;
    listing.price = price;
    listing.category = category;
    listing.contact = contact;

    if (req.files && req.files.length > 0) {
      const newImagePaths = req.files.map(
        (file) => "/uploads/" + file.filename
      );
      listing.images = newImagePaths;
    }

    await listing.save();
    res.redirect("/buy-sell");
  } catch (err) {
    console.error("Error updating listing:", err);
    res.status(500).send("Server error");
  }
});

// DELETE /buy-sell/:id - delete listing
router.delete("/:id", isLoggedIn, async (req, res) => {
  const { id } = req.params;

  try {
    const listing = await BuySell.findById(id);
    if (!listing) return res.status(404).send("Listing not found");

    if (listing.user.equals(req.user._id)) {
      await BuySell.findByIdAndDelete(id);
    }

    res.redirect("/buy-sell");
  } catch (err) {
    console.error("Error deleting listing:", err);
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;
