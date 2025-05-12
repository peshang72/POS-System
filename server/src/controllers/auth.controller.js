const User = require("../models/user.model");
const StaffActivity = require("../models/staffActivity.model");
const logger = require("../utils/logger");
const jwt = require("jsonwebtoken");
const config = require("../config");
const asyncHandler = require("express-async-handler");

// Check if running in Electron environment
const isElectron = process.env.ELECTRON_ENV === "true";

// @desc    Register user
// @route   POST /api/auth/register
// @access  Private/Admin
exports.register = async (req, res, next) => {
  try {
    const {
      username,
      password,
      role,
      firstName,
      lastName,
      email,
      phone,
      languagePreference,
    } = req.body;

    // Validate input data
    if (!username || !password || !role || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide username, password, role, firstName, and lastName",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Create user
    const user = await User.create({
      username,
      password,
      role,
      firstName,
      lastName,
      email,
      phone,
      languagePreference,
    });

    // Log activity only if we have a logged-in user (req.user exists)
    if (req.user) {
      await StaffActivity.create({
        staff: req.user._id,
        actionType: "create",
        resourceType: "user",
        resourceId: user._id,
        details: {
          username: user.username,
          role: user.role,
        },
      });
    }

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        active: user.active,
        languagePreference: user.languagePreference,
      },
    });
  } catch (err) {
    logger.error(`Error in register: ${err.message}`);
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { username, password } = req.body;

  // Check if running in Electron offline mode
  if (isElectron) {
    // For Electron, provide a default admin user without database
    console.log("Electron environment: Providing default admin authentication");
    const token = jwt.sign(
      { id: "electron-admin-id", role: "admin" },
      config.jwtSecret,
      { expiresIn: config.jwtExpire }
    );

    return res.status(200).json({
      success: true,
      token,
      data: {
        id: "electron-admin-id",
        name: "Admin User",
        username: "admin",
        role: "admin",
        languagePreference: "en",
      },
    });
  }

  // For standard web app, continue with normal MongoDB authentication
  // Validate input data
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Please provide username and password",
    });
  }

  // Check for user
  const user = await User.findOne({ username }).select("+password");
  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  }

  // Check if account is active
  if (!user.active) {
    return res.status(401).json({
      success: false,
      message:
        "Your account has been deactivated. Please contact an administrator",
    });
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  }

  // Generate token
  const token = user.getSignedJwtToken();

  // Log activity
  await StaffActivity.create({
    staff: user._id,
    actionType: "login",
    details: {
      username: user.username,
      role: user.role,
    },
  });

  res.status(200).json({
    success: true,
    token,
    data: {
      _id: user._id,
      username: user.username,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      languagePreference: user.languagePreference,
    },
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    // Log activity only if we have a logged-in user
    if (req.user) {
      await StaffActivity.create({
        staff: req.user._id,
        actionType: "logout",
        details: {
          username: req.user.username,
          role: req.user.role,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    logger.error(`Error in logout: ${err.message}`);
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    logger.error(`Error in getMe: ${err.message}`);
    next(err);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/update-profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, languagePreference } = req.body;

    // Build update object
    const updateFields = {};
    if (firstName) updateFields.firstName = firstName;
    if (lastName) updateFields.lastName = lastName;
    if (email) updateFields.email = email;
    if (phone) updateFields.phone = phone;
    if (languagePreference)
      updateFields.languagePreference = languagePreference;

    const user = await User.findByIdAndUpdate(req.user._id, updateFields, {
      new: true,
      runValidators: true,
    });

    // Log activity
    if (req.user) {
      await StaffActivity.create({
        staff: req.user._id,
        actionType: "update",
        resourceType: "user",
        resourceId: user._id,
        details: {
          username: user.username,
          updatedFields: Object.keys(updateFields),
        },
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    logger.error(`Error in updateProfile: ${err.message}`);
    next(err);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input data
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide current password and new password",
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select("+password");

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Set new password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (err) {
    logger.error(`Error in changePassword: ${err.message}`);
    next(err);
  }
};

// @desc    Get all users
// @route   GET /api/auth/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Build query
    const query = {};

    // Filter by role if specified
    if (
      req.query.role &&
      ["admin", "manager", "cashier"].includes(req.query.role)
    ) {
      query.role = req.query.role;
    }

    // Filter by active status if specified
    if (req.query.active !== undefined) {
      query.active = req.query.active === "true";
    }

    // Search by name, username, or email
    if (req.query.search) {
      query.$or = [
        { username: { $regex: req.query.search, $options: "i" } },
        { firstName: { $regex: req.query.search, $options: "i" } },
        { lastName: { $regex: req.query.search, $options: "i" } },
        { email: { $regex: req.query.search, $options: "i" } },
      ];
    }

    // Execute query with pagination
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    // Get total count for pagination
    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      data: users,
    });
  } catch (err) {
    logger.error(`Error in getUsers: ${err.message}`);
    next(err);
  }
};

// @desc    Get single user
// @route   GET /api/auth/users/:id
// @access  Private/Admin
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    logger.error(`Error in getUser: ${err.message}`);
    next(err);
  }
};

// @desc    Update user
// @route   PUT /api/auth/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      role,
      active,
      languagePreference,
    } = req.body;

    // Build update object
    const updateFields = {};
    if (firstName !== undefined) updateFields.firstName = firstName;
    if (lastName !== undefined) updateFields.lastName = lastName;
    if (email !== undefined) updateFields.email = email;
    if (phone !== undefined) updateFields.phone = phone;
    if (role !== undefined) updateFields.role = role;
    if (active !== undefined) updateFields.active = active;
    if (languagePreference !== undefined)
      updateFields.languagePreference = languagePreference;

    const user = await User.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Log activity
    if (req.user) {
      await StaffActivity.create({
        staff: req.user._id,
        actionType: "update",
        resourceType: "user",
        resourceId: user._id,
        details: {
          username: user.username,
          updatedFields: Object.keys(updateFields),
        },
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    logger.error(`Error in updateUser: ${err.message}`);
    next(err);
  }
};

// @desc    Delete user
// @route   DELETE /api/auth/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Don't allow deleting self
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    await user.deleteOne();

    // Log activity
    if (req.user) {
      await StaffActivity.create({
        staff: req.user._id,
        actionType: "delete",
        resourceType: "user",
        resourceId: user._id,
        details: {
          username: user.username,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    logger.error(`Error in deleteUser: ${err.message}`);
    next(err);
  }
};

// @desc    Reset user password
// @route   PUT /api/auth/users/:id/reset-password
// @access  Private/Admin
exports.resetUserPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide a new password",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Set new password
    user.password = newPassword;
    await user.save();

    // Log activity
    if (req.user) {
      await StaffActivity.create({
        staff: req.user._id,
        actionType: "update",
        resourceType: "user",
        resourceId: user._id,
        details: {
          username: user.username,
          action: "reset_password",
        },
      });
    }

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (err) {
    logger.error(`Error in resetUserPassword: ${err.message}`);
    next(err);
  }
};
