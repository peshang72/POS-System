const express = require("express");
const {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  resetUserPassword,
} = require("../controllers/auth.controller");
const { protect, authorize } = require("../middleware/passport");

const router = express.Router();

// Public routes
router.post("/login", login);

// Protected routes for all authenticated users
router.use(protect);
router.post("/logout", logout);
router.get("/me", getMe);
router.put("/update-profile", updateProfile);
router.put("/change-password", changePassword);

// Admin-only routes
router.use(authorize("admin"));
router.post("/register", register);
router.get("/users", getUsers);
router.get("/users/:id", getUser);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.put("/users/:id/reset-password", resetUserPassword);

module.exports = router;
