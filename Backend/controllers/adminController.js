const User = require("../models/User");
const Book = require("../models/Book");
const BorrowRecord = require("../models/BorrowRecord");
const Category = require("../models/Category");

// @GET /api/admin/stats - Dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalBooks,
      totalBorrowed,
      overdueCount,
      totalReturned,
      recentUsers,
      recentBorrows,
      popularBooks,
      categoryStats,
      monthlyBorrows,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      Book.countDocuments(),
      BorrowRecord.countDocuments({ status: "borrowed" }),
      BorrowRecord.countDocuments({ status: "overdue" }),
      BorrowRecord.countDocuments({ status: "returned" }),

      // Recent 5 users
      User.find({ role: "user" }).sort({ createdAt: -1 }).limit(5).select("name email avatar createdAt"),

      // Recent 5 borrows
      BorrowRecord.find()
        .populate("user", "name avatar")
        .populate("book", "title coverImage")
        .sort({ createdAt: -1 })
        .limit(5),

      // Top 5 popular books
      Book.find().sort({ borrowCount: -1 }).limit(5).select("title author borrowCount coverImage"),

      // Books per category
      Category.find().select("name bookCount icon color"),

      // Monthly borrows for chart (last 6 months)
      BorrowRecord.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
    ]);

    // Calculate total fines collected
    const fineData = await BorrowRecord.aggregate([
      { $match: { "fine.amount": { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: "$fine.amount" }, paid: { $sum: { $cond: ["$fine.paid", "$fine.amount", 0] } } } },
    ]);

    const totalFines = fineData[0]?.total || 0;
    const paidFines = fineData[0]?.paid || 0;

    // Format monthly data for chart
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const chartData = monthlyBorrows.map((item) => ({
      month: monthNames[item._id.month - 1],
      borrows: item.count,
    }));

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalBooks,
        totalBorrowed,
        overdueCount,
        totalReturned,
        totalFines,
        paidFines,
        availableBooks: await Book.countDocuments({ availableCopies: { $gt: 0 } }),
      },
      recentUsers,
      recentBorrows,
      popularBooks,
      categoryStats,
      chartData,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/admin/send-overdue-reminders
const sendOverdueReminders = async (req, res) => {
  try {
    const overdueRecords = await BorrowRecord.find({ status: "borrowed", dueDate: { $lt: new Date() } })
      .populate("user", "name email")
      .populate("book", "title");

    // Update their status to overdue
    for (let record of overdueRecords) {
      record.status = "overdue";
      record.fine.amount = record.calculateFine();
      await record.save();
    }

    res.json({
      success: true,
      message: `Updated ${overdueRecords.length} overdue records`,
      count: overdueRecords.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboardStats, sendOverdueReminders };
