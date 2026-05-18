/**
 * SEED SCRIPT — Run once to add sample data
 * Usage: node seed.js
 * Delete this file after seeding if you want
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");
const Category = require("./models/Category");
const Book = require("./models/Book");

const categories = [
  { name: "Fiction", icon: "📖", color: "#6366f1" },
  { name: "Science", icon: "🔬", color: "#10b981" },
  { name: "Technology", icon: "💻", color: "#3b82f6" },
  { name: "History", icon: "🏛️", color: "#f59e0b" },
  { name: "Biography", icon: "👤", color: "#8b5cf6" },
  { name: "Self Help", icon: "🧠", color: "#ec4899" },
];

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  // Create admin
  const existing = await User.findOne({ email: "admin@library.com" });
  if (!existing) {
    await User.create({ name: "Admin", email: "admin@library.com", password: "admin123", role: "admin" });
    console.log("✅ Admin created: admin@library.com / admin123");
  }

  // Create categories
  const cats = [];
  for (const cat of categories) {
    const existing = await Category.findOne({ name: cat.name });
    if (!existing) {
      const created = await Category.create(cat);
      cats.push(created);
    } else {
      cats.push(existing);
    }
  }
  console.log(`✅ ${cats.length} categories ready`);

  // Create sample books
  const sampleBooks = [
    { title: "The Great Gatsby", author: "F. Scott Fitzgerald", totalCopies: 5, availableCopies: 5, description: "A story of the fabulously wealthy Jay Gatsby.", publishedYear: 1925, pages: 180, category: cats[0]._id },
    { title: "Clean Code", author: "Robert C. Martin", totalCopies: 3, availableCopies: 3, description: "A handbook of agile software craftsmanship.", publishedYear: 2008, pages: 464, category: cats[2]._id },
    { title: "A Brief History of Time", author: "Stephen Hawking", totalCopies: 4, availableCopies: 4, description: "From the Big Bang to black holes.", publishedYear: 1988, pages: 212, category: cats[1]._id },
    { title: "Sapiens", author: "Yuval Noah Harari", totalCopies: 6, availableCopies: 6, description: "A brief history of humankind.", publishedYear: 2011, pages: 443, category: cats[3]._id },
    { title: "Steve Jobs", author: "Walter Isaacson", totalCopies: 2, availableCopies: 2, description: "The biography of Apple's visionary co-founder.", publishedYear: 2011, pages: 656, category: cats[4]._id },
    { title: "Atomic Habits", author: "James Clear", totalCopies: 8, availableCopies: 8, description: "Tiny changes, remarkable results.", publishedYear: 2018, pages: 320, category: cats[5]._id },
  ];

  let bookCount = 0;
  for (const book of sampleBooks) {
    const existing = await Book.findOne({ title: book.title });
    if (!existing) {
      await Book.create(book);
      await Category.findByIdAndUpdate(book.category, { $inc: { bookCount: 1 } });
      bookCount++;
    }
  }
  console.log(`✅ ${bookCount} sample books created`);
  console.log("\n🎉 Seeding complete! You can now login at http://localhost:5173/login");
  console.log("   Admin: admin@library.com / admin123");

  process.exit(0);
};

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
