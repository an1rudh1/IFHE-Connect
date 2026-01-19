require("dotenv").config();
console.log("MONGO_URI =", process.env.MONGO_URI);

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const authRoutes = require("./routes/auth");

const User = require("./models/User");
const BuySell = require("./models/BuySell");

// VIEW ENGINE
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// MIDDLEWARE
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));

// DATABASE (MongoDB ATLAS)
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Atlas Connected"))
  .catch((err) => console.log(" Mongo Error:", err.message));

// SESSION STORE (ATLAS)
const store = MongoStore.create({
  mongoUrl: process.env.MONGO_URI,
  crypto: {
    secret: process.env.SESSION_SECRET,
  },
});
// Temp
console.log("EMAIL_USER =", process.env.EMAIL_USER);
console.log("EMAIL_PASS exists =", !!process.env.EMAIL_PASS);

app.use(
  session({
    store,
    name: "ifhe-connect-session",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
    },
  }),
);

// PASSPORT
app.use(passport.initialize());
app.use(passport.session());

// GOOGLE STRATEGY
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;

        // IF NOT IFHE EMAIL = REJECT
        if (!email.endsWith("@ifheindia.org")) {
          return done(null, false, {
            message: "Only IFHE email IDs are allowed",
          });
        }

        // FINDING USERS BY EMAIL
        let user = await User.findOne({
          $or: [{ googleId: profile.id }, { email }],
        });

        if (user) return done(null, user);

        // CREATION OF NEW USER
        user = new User({
          googleId: profile.id,
          name: profile.displayName,
          email: email,
        });

        await user.save();
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    },
  ),
);

// SESSION HANDLING
passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser((id, done) => {
  User.findById(id).then((user) => done(null, user));
});

// FLASH
app.use(flash());

// GLOBAL VARIABLES
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currentUser = req.user;
  next();
});

// AUTH ROUTES
app.use("/", authRoutes);

//  MODELS
const Sport = require("./models/sport");
const CabPool = require("./models/cabpool");

// ROUTES
const sportRoutes = require("./routes/sports");
const cabRoutes = require("./routes/cab");
const buySellRoutes = require("./routes/buySell");

app.use("/sports", sportRoutes);
app.use("/cabs", cabRoutes);
app.use("/buy-sell", buySellRoutes);

// LOGIN
app.get("/", (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect("/home");
  }
  res.render("login");
});

// HOME
app.get("/home", async (req, res) => {
  const sports = await Sport.find({}).populate("user").sort({ createdAt: -1 });
  const cabs = await CabPool.find({}).populate("user").sort({ createdAt: -1 });
  const buySell = await BuySell.find({})
    .populate("user")
    .sort({ createdAt: -1 });

  res.render("home", {
    sports,
    cabs,
    buySell,
  });
});

// //  SERVER
// app.listen(3000, () => {
//   console.log("IFHE-Connect running on port 3000");
// });

// For deployment
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
