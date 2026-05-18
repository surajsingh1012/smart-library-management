const Review = require("../models/Review");
const Book = require("../models/Book");
const BorrowRecord = require("../models/BorrowRecord");

// @POST /api/reviews/:bookId
const addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const bookId = req.params.bookId;

    // Check if user has borrowed this book before reviewing
    const hasBorrowed = await BorrowRecord.findOne({ user: req.user._id, book: bookId });
    if (!hasBorrowed) {
      return res.status(403).json({ success: false, message: "You can only review books you've borrowed" });
    }

    // Check for existing review
    const existing = await Review.findOne({ user: req.user._id, book: bookId });
    if (existing) {
      existing.rating = rating;
      existing.comment = comment;
      await existing.save();
    } else {
      await Review.create({ user: req.user._id, book: bookId, rating, comment });
    }

    // Recalculate average rating
    const stats = await Review.aggregate([
      { $match: { book: require("mongoose").Types.ObjectId.createFromHexString(bookId) } },
      { $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);

    if (stats.length > 0) {
      await Book.findByIdAndUpdate(bookId, {
        averageRating: Math.round(stats[0].avgRating * 10) / 10,
        totalReviews: stats[0].count,
      });
    }

    res.json({ success: true, message: existing ? "Review updated!" : "Review added!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/reviews/:bookId
const getBookReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ book: req.params.bookId })
      .populate("user", "name avatar")
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { addReview, getBookReviews };
