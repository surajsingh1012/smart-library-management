import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";
import BookCard from "../../components/books/BookCard";
import { HiArrowRight, HiBookOpen, HiClock, HiSparkles } from "react-icons/hi";

// Simple stat card
const StatCard = ({ label, value, icon, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="card p-5 flex items-center gap-4"
  >
    <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center text-xl flex-shrink-0`}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-display font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  </motion.div>
);

// Loading skeleton for book cards
const BookSkeleton = () => (
  <div className="card overflow-hidden">
    <div className="skeleton h-48 rounded-none" />
    <div className="p-4 space-y-2">
      <div className="skeleton h-4 w-3/4" />
      <div className="skeleton h-3 w-1/2" />
      <div className="skeleton h-3 w-1/3 mt-3" />
    </div>
  </div>
);

export default function Home() {
  const { user } = useAuth();
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [myStats, setMyStats] = useState({ borrowed: 0, returned: 0, wishlist: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [booksRes, catsRes, historyRes] = await Promise.all([
          API.get("/books/featured"),
          API.get("/categories"),
          API.get("/borrow/my-history?limit=100"),
        ]);
        setFeaturedBooks(booksRes.data.books);
        setCategories(catsRes.data.categories.slice(0, 6));

        const records = historyRes.data.records;
        setMyStats({
          borrowed: records.filter((r) => r.status === "borrowed" || r.status === "overdue").length,
          returned: records.filter((r) => r.status === "returned").length,
          wishlist: user?.wishlist?.length || 0,
        });
      } catch (err) {
        console.error("Failed to load home data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const timeOfDay = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-500 to-primary-700 p-6 lg:p-8 text-white"
      >
        <div className="relative z-10">
          <p className="text-primary-200 font-medium mb-1">{timeOfDay()},</p>
          <h1 className="font-display text-2xl lg:text-3xl font-bold mb-2">{user?.name}! 👋</h1>
          <p className="text-primary-100 mb-5 max-w-md">
            Ready to explore? Browse our collection and find your next great read.
          </p>
          <Link to="/books" className="inline-flex items-center gap-2 bg-white text-primary-600 font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-50 transition-colors">
            Browse Books <HiArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Decorative circles */}
        <div className="absolute right-0 top-0 w-48 h-48 bg-white/5 rounded-full -translate-y-12 translate-x-12" />
        <div className="absolute right-12 bottom-0 w-32 h-32 bg-white/5 rounded-full translate-y-8" />
        <div className="absolute right-6 top-6 text-6xl opacity-20">📚</div>
      </motion.div>

      {/* My Stats */}
      <div>
        <h2 className="font-display font-semibold text-lg mb-4">My Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Currently Borrowed" value={myStats.borrowed} icon="📖" color="bg-blue-50 dark:bg-blue-900/20" />
          <StatCard label="Books Returned" value={myStats.returned} icon="✅" color="bg-green-50 dark:bg-green-900/20" />
          <StatCard label="In Wishlist" value={myStats.wishlist} icon="❤️" color="bg-red-50 dark:bg-red-900/20" />
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-lg">Browse by Category</h2>
            <Link to="/books" className="text-sm text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1">
              See all <HiArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {categories.map((cat, i) => (
              <motion.div
                key={cat._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/books?category=${cat._id}`}
                  className="card p-4 flex flex-col items-center gap-2 hover:border-primary-200 dark:hover:border-primary-700 hover:shadow-md transition-all duration-200 text-center group"
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform duration-200">{cat.icon}</span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{cat.name}</span>
                  <span className="text-xs text-gray-400">{cat.bookCount} books</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Featured / Popular Books */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-lg flex items-center gap-2">
            <HiSparkles className="text-amber-500 w-5 h-5" />
            Popular Books
          </h2>
          <Link to="/books?sort=popular" className="text-sm text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1">
            View all <HiArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array(8).fill(0).map((_, i) => <BookSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {featuredBooks.map((book, i) => (
              <motion.div
                key={book._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <BookCard book={book} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
