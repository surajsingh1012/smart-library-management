const express = require("express");
const router = express.Router();
const { getBooks, getBookById, addBook, updateBook, deleteBook, getFeaturedBooks } = require("../controllers/bookController");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { uploadImage, uploadPDF } = require("../middleware/uploadMiddleware");
const multer = require("multer");

// Multi-file upload for book (cover + pdf)
const bookUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = file.fieldname === "coverImage" ? "uploads/images/" : "uploads/pdfs/";
      require("fs").mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const prefix = file.fieldname === "coverImage" ? "book" : "pdf";
      cb(null, `${prefix}-${Date.now()}${require("path").extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
});

router.get("/featured", getFeaturedBooks);
router.get("/", getBooks);
router.get("/:id", getBookById);

router.post("/", protect, adminOnly, bookUpload.fields([{ name: "coverImage", maxCount: 1 }, { name: "pdfFile", maxCount: 1 }]), addBook);
router.put("/:id", protect, adminOnly, bookUpload.fields([{ name: "coverImage", maxCount: 1 }, { name: "pdfFile", maxCount: 1 }]), updateBook);
router.delete("/:id", protect, adminOnly, deleteBook);

module.exports = router;
