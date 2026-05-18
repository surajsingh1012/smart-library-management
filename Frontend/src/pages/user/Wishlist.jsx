import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { HiHeart, HiStar, HiBookOpen } from "react-icons/hi";
import API from "../../api/axios";
import toast from "react-hot-toast";

export default function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const res = await API.get("/users/wishlist");
      setWishlist(res.data.wishlist);
    } catch (err) {
      toast.error("Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const removeFromWishlist = async (bookId) => {
    try {
      await API.post(`/users/wishlist/${bookId}`);
      setWishlist((prev) => prev.filter((b) => b._id !== bookId));
      toast.success("Removed from wishlist");
    } catch (err) {
      toast.error("Failed to remove");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <HiHeart className="text-red-500 w-7 h-7" />
          My Wishlist
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          {wishlist.length} {wishlist.length === 1 ? "book" : "books"} saved
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="card p-4 flex gap-4">
              <div className="skeleton w-16 h-20 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : wishlist.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-6xl mb-4">💔</p>
          <p className="font-semibold text-gray-700 dark:text-gray-300 text-lg">Your wishlist is empty</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 mb-6">
            Browse books and click the heart icon to save them here.
          </p>
          <Link to="/books" className="btn-primary inline-flex items-center gap-2">
            <HiBookOpen className="w-4 h-4" /> Browse Books
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AnimatePresence>
            {wishlist.map((book, i) => (
              <motion.div
                key={book._id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, x: -20 }}
                transition={{ delay: i * 0.04 }}
                className="card p-4 flex gap-4"
              >
                {/* Cover */}
                <Link to={`/books/${book._id}`} className="w-16 h-20 flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                  {book.coverImage ? (
                    <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-2xl">📖</div>
                  )}
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link to={`/books/${book._id}`}>
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white hover:text-primary-500 transition-colors line-clamp-2">
                      {book.title}
                    </h3>
                  </Link>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{book.author}</p>

                  <div className="flex items-center gap-1 mt-1">
                    <HiStar className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs text-gray-500">
                      {book.averageRating > 0 ? book.averageRating.toFixed(1) : "Not rated"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <Link to={`/books/${book._id}`} className="text-xs font-medium text-primary-500 hover:text-primary-600">
                      View Book →
                    </Link>
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                    <button
                      onClick={() => removeFromWishlist(book._id)}
                      className="text-xs text-red-400 hover:text-red-600 flex items-center gap-0.5"
                    >
                      <HiHeart className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>

                {/* Availability badge */}
                <div className="flex-shrink-0">
                  <span className={`badge text-xs ${book.availableCopies > 0 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-500 dark:bg-gray-800"}`}>
                    {book.availableCopies > 0 ? "Available" : "Unavailable"}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
