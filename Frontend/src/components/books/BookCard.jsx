import { useState } from "react";
import { Link } from "react-router-dom";
import { HiHeart, HiStar, HiBookOpen } from "react-icons/hi";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";
import toast from "react-hot-toast";

// Fallback when no cover image
const BookCoverFallback = ({ title, author }) => (
  <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex flex-col items-center justify-center p-4 text-white">
    <span className="text-4xl mb-2">📖</span>
    <p className="text-xs font-semibold text-center line-clamp-2">{title}</p>
    <p className="text-xs text-primary-200 mt-1 text-center">{author}</p>
  </div>
);

export default function BookCard({ book, onWishlistChange }) {
  const { user } = useAuth();
  const [inWishlist, setInWishlist] = useState(user?.wishlist?.includes(book._id));
  const [wishLoading, setWishLoading] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleWishlist = async (e) => {
    e.preventDefault(); // Don't navigate
    if (!user) return toast.error("Please login first");
    if (wishLoading) return;

    setWishLoading(true);
    try {
      const res = await API.post(`/users/wishlist/${book._id}`);
      setInWishlist(res.data.inWishlist);
      toast.success(res.data.message);
      onWishlistChange?.();
    } catch (err) {
      toast.error("Failed to update wishlist");
    } finally {
      setWishLoading(false);
    }
  };

  const isAvailable = book.availableCopies > 0;

  return (
    <Link to={`/books/${book._id}`} className="card overflow-hidden hover:shadow-md transition-all duration-200 group flex flex-col">
      {/* Book cover */}
      <div className="relative h-48 bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0">
        {book.coverImage && !imgError ? (
          <img
            src={book.coverImage}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <BookCoverFallback title={book.title} author={book.author} />
        )}

        {/* Availability badge */}
        <div className={`absolute top-2 left-2 badge text-xs ${isAvailable ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"}`}>
          {isAvailable ? "Available" : "Unavailable"}
        </div>

        {/* Wishlist button */}
        <button
          onClick={handleWishlist}
          disabled={wishLoading}
          className={`absolute top-2 right-2 p-1.5 rounded-lg backdrop-blur-sm transition-all ${
            inWishlist ? "bg-red-500 text-white" : "bg-white/80 dark:bg-gray-800/80 text-gray-500 hover:text-red-500"
          }`}
        >
          <HiHeart className="w-4 h-4" />
        </button>
      </div>

      {/* Book info */}
      <div className="p-4 flex flex-col flex-1">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{book.category?.name || "General"}</p>
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2 mb-1 group-hover:text-primary-500 transition-colors">
          {book.title}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{book.author}</p>

        <div className="mt-auto flex items-center justify-between">
          {/* Rating */}
          <div className="flex items-center gap-1">
            <HiStar className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {book.averageRating > 0 ? book.averageRating.toFixed(1) : "No ratings"}
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs text-gray-400">
            <HiBookOpen className="w-3.5 h-3.5" />
            <span>{book.availableCopies}/{book.totalCopies}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
