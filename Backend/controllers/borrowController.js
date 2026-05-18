const BorrowRecord = require("../models/BorrowRecord");
const Book = require("../models/Book");
const Notification = require("../models/Notification");

// @POST /api/borrow/:bookId - Borrow a book
const borrowBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.bookId);

    if (!book) return res.status(404).json({ success: false, message: "Book not found" });
    if (book.availableCopies <= 0) {
      return res.status(400).json({ success: false, message: "No copies available right now" });
    }

    // Check if user already has this book
    const alreadyBorrowed = await BorrowRecord.findOne({
      user: req.user._id,
      book: book._id,
      status: "borrowed",
    });

    if (alreadyBorrowed) {
      return res.status(400).json({ success: false, message: "You already have this book borrowed" });
    }

    // Check if user has more than 3 active borrows
    const activeBorrows = await BorrowRecord.countDocuments({ user: req.user._id, status: "borrowed" });
    if (activeBorrows >= 3) {
      return res.status(400).json({ success: false, message: "You can borrow maximum 3 books at a time" });
    }

    // Due date = 14 days from now
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const record = await BorrowRecord.create({
      user: req.user._id,
      book: book._id,
      dueDate,
    });

    // Reduce available copies
    book.availableCopies -= 1;
    book.borrowCount += 1;
    if (book.availableCopies === 0) book.isAvailable = false;
    await book.save();

    // Create notification
    const notification = await Notification.create({
      user: req.user._id,
      title: "Book Borrowed Successfully!",
      message: `You borrowed "${book.title}". Due date: ${dueDate.toDateString()}. Return on time to avoid fines.`,
      type: "borrow",
      link: `/my-books`,
    });

    // Real-time notification
    const io = req.app.get("io");
    io.to(req.user._id.toString()).emit("notification", notification);

    await record.populate([{ path: "book", select: "title author coverImage" }]);

    res.status(201).json({
      success: true,
      message: "Book borrowed successfully!",
      record,
      dueDate,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @PUT /api/borrow/return/:recordId - Return a book
const returnBook = async (req, res) => {
  try {
    const record = await BorrowRecord.findById(req.params.recordId).populate("book");

    if (!record) return res.status(404).json({ success: false, message: "Borrow record not found" });

    // Check ownership (user or admin can return)
    if (record.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    if (record.status === "returned") {
      return res.status(400).json({ success: false, message: "Book already returned" });
    }

    record.returnDate = new Date();
    record.status = "returned";

    // Calculate fine if overdue
    const fine = record.calculateFine();

    await record.save();

    // Increase available copies back
    await Book.findByIdAndUpdate(record.book._id, {
      $inc: { availableCopies: 1 },
      isAvailable: true,
    });

    // Notification
    let notifMsg = `You returned "${record.book.title}" successfully.`;
    if (fine > 0) notifMsg += ` Fine: ₹${fine} (${Math.ceil((record.returnDate - record.dueDate) / (1000 * 60 * 60 * 24))} days late)`;

    const notification = await Notification.create({
      user: record.user,
      title: fine > 0 ? "Book Returned - Fine Applied" : "Book Returned Successfully!",
      message: notifMsg,
      type: fine > 0 ? "fine" : "return",
    });

    const io = req.app.get("io");
    io.to(record.user.toString()).emit("notification", notification);

    res.json({
      success: true,
      message: fine > 0 ? `Book returned! Fine: ₹${fine}` : "Book returned successfully!",
      fine,
      record,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/borrow/my-history - User's borrow history
const getMyBorrowHistory = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    let query = { user: req.user._id };
    if (status) query.status = status;

    const total = await BorrowRecord.countDocuments(query);
    const records = await BorrowRecord.find(query)
      .populate("book", "title author coverImage category")
      .sort({ borrowDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Update overdue status on the fly
    for (let record of records) {
      if (record.status === "borrowed" && new Date() > record.dueDate) {
        record.status = "overdue";
        record.fine.amount = record.calculateFine();
        await record.save();
      }
    }

    res.json({
      success: true,
      records,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/borrow/all - All borrow records (admin)
const getAllBorrowRecords = async (req, res) => {
  try {
    const { status, page = 1, limit = 15 } = req.query;
    let query = {};
    if (status) query.status = status;

    const total = await BorrowRecord.countDocuments(query);
    const records = await BorrowRecord.find(query)
      .populate("user", "name email avatar")
      .populate("book", "title author coverImage")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      records,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @PUT /api/borrow/pay-fine/:recordId
const payFine = async (req, res) => {
  try {
    const record = await BorrowRecord.findById(req.params.recordId);
    if (!record) return res.status(404).json({ success: false, message: "Record not found" });

    record.fine.paid = true;
    record.fine.paidDate = new Date();
    await record.save();

    res.json({ success: true, message: "Fine marked as paid!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { borrowBook, returnBook, getMyBorrowHistory, getAllBorrowRecords, payFine };
