const express = require("express");
const router = express.Router();
const { borrowBook, returnBook, getMyBorrowHistory, getAllBorrowRecords, payFine } = require("../controllers/borrowController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.post("/:bookId", protect, borrowBook);
router.put("/return/:recordId", protect, returnBook);
router.get("/my-history", protect, getMyBorrowHistory);
router.get("/all", protect, adminOnly, getAllBorrowRecords);
router.put("/pay-fine/:recordId", protect, adminOnly, payFine);

module.exports = router;
