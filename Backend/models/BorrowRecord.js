const mongoose = require("mongoose");

const borrowRecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    borrowDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    returnDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["borrowed", "returned", "overdue"],
      default: "borrowed",
    },
    fine: {
      amount: { type: Number, default: 0 },
      paid: { type: Boolean, default: false },
      paidDate: { type: Date, default: null },
    },
    // Admin notes
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Auto-calculate fine: Rs 5 per day after due date
borrowRecordSchema.methods.calculateFine = function () {
  if (this.status === "returned" && this.returnDate) {
    if (this.returnDate > this.dueDate) {
      const daysLate = Math.ceil((this.returnDate - this.dueDate) / (1000 * 60 * 60 * 24));
      this.fine.amount = daysLate * 5; // Rs 5 per day
    }
  } else if (this.status !== "returned") {
    const today = new Date();
    if (today > this.dueDate) {
      const daysLate = Math.ceil((today - this.dueDate) / (1000 * 60 * 60 * 24));
      this.fine.amount = daysLate * 5;
    }
  }
  return this.fine.amount;
};

module.exports = mongoose.model("BorrowRecord", borrowRecordSchema);
