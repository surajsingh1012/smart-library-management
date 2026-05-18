const Book = require("../models/Book");
const Category = require("../models/Category");
const QRCode = require("qrcode");

// @GET /api/books - Get all books with search, filter, pagination
const getBooks = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 12, sort = "newest", available } = req.query;

    let query = {};

    // Search by text
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by category
    if (category && category !== "all") {
      query.category = category;
    }

    // Filter available only
    if (available === "true") {
      query.availableCopies = { $gt: 0 };
    }

    // Sort options
    let sortObj = {};
    if (sort === "newest") sortObj = { createdAt: -1 };
    else if (sort === "oldest") sortObj = { createdAt: 1 };
    else if (sort === "popular") sortObj = { borrowCount: -1 };
    else if (sort === "rating") sortObj = { averageRating: -1 };
    else if (sort === "title") sortObj = { title: 1 };

    const skip = (page - 1) * limit;
    const total = await Book.countDocuments(query);

    const books = await Book.find(query)
      .populate("category", "name icon color")
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .select("-qrCode"); // Don't send QR in list (too heavy)

    res.json({
      success: true,
      books,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/books/:id - Single book
const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate("category", "name icon color");

    if (!book) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }

    res.json({ success: true, book });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/books - Add book (admin)
const addBook = async (req, res) => {
  try {
    const bookData = { ...req.body };

    // Handle uploaded cover image
    if (req.files?.coverImage) {
      bookData.coverImage = `/uploads/images/${req.files.coverImage[0].filename}`;
    }
    if (req.files?.pdfFile) {
      bookData.pdfFile = `/uploads/pdfs/${req.files.pdfFile[0].filename}`;
    }

    // Set available copies same as total
    bookData.availableCopies = bookData.totalCopies || 1;

    const book = await Book.create(bookData);

    // Generate QR code for this book
    const qrData = `${process.env.CLIENT_URL}/books/${book._id}`;
    const qrCode = await QRCode.toDataURL(qrData);
    book.qrCode = qrCode;
    await book.save();

    // Update category book count
    await Category.findByIdAndUpdate(book.category, { $inc: { bookCount: 1 } });

    await book.populate("category", "name icon color");

    res.status(201).json({ success: true, message: "Book added successfully!", book });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "ISBN already exists" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @PUT /api/books/:id - Update book (admin)
const updateBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }

    const updates = { ...req.body };

    if (req.files?.coverImage) {
      updates.coverImage = `/uploads/images/${req.files.coverImage[0].filename}`;
    }
    if (req.files?.pdfFile) {
      updates.pdfFile = `/uploads/pdfs/${req.files.pdfFile[0].filename}`;
    }

    // If total copies changed, adjust available copies accordingly
    if (updates.totalCopies) {
      const diff = parseInt(updates.totalCopies) - book.totalCopies;
      updates.availableCopies = Math.max(0, book.availableCopies + diff);
    }

    // Handle category change
    if (updates.category && updates.category !== book.category.toString()) {
      await Category.findByIdAndUpdate(book.category, { $inc: { bookCount: -1 } });
      await Category.findByIdAndUpdate(updates.category, { $inc: { bookCount: 1 } });
    }

    const updatedBook = await Book.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).populate("category", "name icon color");

    res.json({ success: true, message: "Book updated!", book: updatedBook });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @DELETE /api/books/:id - Delete book (admin)
const deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }

    await Category.findByIdAndUpdate(book.category, { $inc: { bookCount: -1 } });
    await Book.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Book deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/books/featured - Popular/featured books
const getFeaturedBooks = async (req, res) => {
  try {
    const books = await Book.find({ availableCopies: { $gt: 0 } })
      .populate("category", "name icon color")
      .sort({ borrowCount: -1, averageRating: -1 })
      .limit(8)
      .select("-qrCode");

    res.json({ success: true, books });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getBooks, getBookById, addBook, updateBook, deleteBook, getFeaturedBooks };
