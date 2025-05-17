const passport = require("passport");
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const mongoose = require("mongoose");
const User = require("../models/user.model");
const config = require("../config");

// Check if running in Electron environment
const isElectron = process.env.ELECTRON_ENV === "true";

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.jwtSecret,
};

passport.use(
  new JwtStrategy(opts, async (jwt_payload, done) => {
    try {
      // Standard validation with database lookup
      const user = await User.findById(jwt_payload.id).select("-password");

      if (user) {
        return done(null, user);
      }

      return done(null, false);
    } catch (err) {
      return done(err, false);
    }
  })
);

// Auth middleware to protect routes
exports.protect = passport.authenticate("jwt", { session: false });

// Role-based permission middleware
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};
