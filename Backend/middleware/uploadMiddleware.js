const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Make sure uploads folder exists
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// Storage config for book covers
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/images/";
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `book-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// Storage config for PDFs
const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/pdfs/";
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `pdf-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// Storage for avatars
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/avatars/";
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `avatar-${req.user._id}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// File filter - only images
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const isValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  if (isValid) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

// File filter - only PDFs
const pdfFilter = (req, file, cb) => {
  if (path.extname(file.originalname).toLowerCase() === ".pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed!"), false);
  }
};

const uploadImage = multer({ storage: imageStorage, fileFilter: imageFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB
const uploadPDF = multer({ storage: pdfStorage, fileFilter: pdfFilter, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB
const uploadAvatar = multer({ storage: avatarStorage, fileFilter: imageFilter, limits: { fileSize: 2 * 1024 * 1024 } }); // 2MB

module.exports = { uploadImage, uploadPDF, uploadAvatar };
