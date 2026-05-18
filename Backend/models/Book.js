const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Book title is required"],
      trim: true,
    },
    author: {
      type: String,
      required: [true, "Author name is required"],
      trim: true,
    },
    isbn: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    coverImage: {
      type: String,
      default: "",
    },
    pdfFile: {
      type: String,
      default: "", // path to uploaded PDF
    },
    totalCopies: {
      type: Number,
      required: true,
      default: 1,
      min: 0,
    },
    availableCopies: {
      type: Number,
      default: 1,
      min: 0,
    },
    publisher: {
      type: String,
      default: "",
    },
    publishedYear: {
      type: Number,
    },
    pages: {
      type: Number,
      default: 0,
    },
    language: {
      type: String,
      default: "English",
    },
    tags: [String],
    // Average rating (calculated from reviews)
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    // QR code data URL
    qrCode: {
      type: String,
      default: "",
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    borrowCount: {
      type: Number,
      default: 0, // Track how many times borrowed (for popular books)
    },
  },
  { timestamps: true }
);

// Text search index
bookSchema.index({ title: "text", author: "text", description: "text", tags: "text" });

module.exports = mongoose.model("Book", bookSchema);
