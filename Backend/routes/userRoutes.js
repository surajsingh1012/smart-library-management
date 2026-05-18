const express = require("express");
const router = express.Router();
const { getProfile, updateProfile, changePassword, toggleWishlist, getWishlist, getAllUsers, toggleUserStatus } = require("../controllers/userController");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { uploadAvatar } = require("../middleware/uploadMiddleware");

router.get("/profile", protect, getProfile);
router.put("/profile", protect, uploadAvatar.single("avatar"), updateProfile);
router.put("/change-password", protect, changePassword);
router.post("/wishlist/:bookId", protect, toggleWishlist);
router.get("/wishlist", protect, getWishlist);

// Admin
router.get("/", protect, adminOnly, getAllUsers);
router.put("/:id/status", protect, adminOnly, toggleUserStatus);

module.exports = router;
