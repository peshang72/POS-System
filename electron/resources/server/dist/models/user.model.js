const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Please add a username"],
      unique: true,
      trim: true,
      maxlength: [50, "Username cannot be more than 50 characters"],
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["admin", "manager", "cashier"],
      required: true,
      default: "cashier",
    },
    firstName: {
      type: String,
      required: [true, "Please add a first name"],
      trim: true,
      maxlength: [50, "First name cannot be more than 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Please add a last name"],
      trim: true,
      maxlength: [50, "Last name cannot be more than 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      match: [
        /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/,
        "Please add a valid email",
      ],
    },
    phone: {
      type: String,
      trim: true,
      match: [
        /^(\+\d{1,3}[- ]?)?\d{10,14}$/,
        "Please add a valid phone number",
      ],
    },
    active: {
      type: Boolean,
      default: true,
    },
    languagePreference: {
      type: String,
      enum: ["en", "ku"],
      default: "en",
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Encrypt password using bcrypt
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, config.jwtSecret, {
    expiresIn: config.jwtExpire,
  });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Virtual for full name
UserSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Update lastLogin timestamp
UserSchema.methods.updateLastLogin = async function () {
  this.lastLogin = Date.now();
  return this.save();
};

// Create indexes for commonly queried fields
// Note: username and email already have indexes due to unique: true
UserSchema.index({ role: 1 });
UserSchema.index({ active: 1 });

module.exports = mongoose.model("User", UserSchema);
