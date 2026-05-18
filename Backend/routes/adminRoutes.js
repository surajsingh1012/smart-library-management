const express = require("express");
const router = express.Router();
const { getDashboardStats, sendOverdueReminders } = require("../controllers/adminController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.get("/stats", protect, adminOnly, getDashboardStats);
router.post("/send-reminders", protect, adminOnly, sendOverdueReminders);

module.exports = router;
