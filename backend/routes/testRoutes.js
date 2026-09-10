const express = require("express");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// Any logged-in user
router.get("/profile", protect, (req, res) => {
  res.json({
    message: "You can access this protected route",
    user: req.user,
  });
});

// Admin only
router.get("/admin", protect, authorizeRoles("Admin"), (req, res) => {
  res.json({
    message: "Welcome to the Admin API",
    user: req.user,
  });
});

module.exports = router;