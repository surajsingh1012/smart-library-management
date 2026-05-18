import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { HiStar, HiBookOpen, HiDownload, HiHeart, HiArrowLeft, HiClock } from "react-icons/hi";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

// Star rating component
const StarRating = ({ rating, onRate, interactive = false }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => interactive && onRate?.(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          className={`text-2xl transition-transform ${interactive ? "cursor-pointer hover:scale-110" : "cursor-default"}`}
          disabled={!interactive}
        >
          <HiStar className={`w-6 h-6 ${(interactive ? hover || rating : rating) >= star ? "text-amber-500" : "text-gray-300 dark:text-gray-600"}`} />
        </button>
      ))}
    </div>
  );
};

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [borrowing, setBorrowing] = useState(false);
  const [myReview, setMyReview] = useState({ rating: 0, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const [bookRes, reviewsRes] = await Promise.all([
          API.get(`/books/${id}`),
          API.get(`/reviews/${id}`),
        ]);
        setBook(bookRes.data.book);
        setReviews(reviewsRes.data.reviews);

        // Check wishlist
        if (user?.wishlist?.includes(id)) setInWishlist(true);

        // Check if user already reviewed
        const existing = reviewsRes.data.reviews.find((r) => r.user._id === user?._id);
        if (existing) setMyReview({ rating: existing.rating, comment: existing.comment || "" });
      } catch (err) {
        toast.error("Book not found");
        navigate("/books");
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [id]);

  const handleBorrow = async () => {
    setBorrowing(true);
    try {
      const res = await API.post(`/borrow/${id}`);
      toast.success(res.data.message);
      setBook((prev) => ({ ...prev, availableCopies: prev.availableCopies - 1 }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to borrow");
    } finally {
      setBorrowing(false);
    }
  };

  const handleWishlist = async () => {
    try {
      const res = await API.post(`/users/wishlist/${id}`);
      setInWishlist(res.data.inWishlist);
      toast.success(res.data.message);
    } catch (err) {
      toast.error("Failed to update wishlist");
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!myReview.rating) return toast.error("Please select a rating");
    setSubmittingReview(true);
    try {
      await API.post(`/reviews/${id}`, myReview);
      toast.success("Review submitted!");
      const res = await API.get(`/reviews/${id}`);
      setReviews(res.data.reviews);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="skeleton h-8 w-32 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="skeleton h-96 rounded-2xl" />
          <div className="md:col-span-2 space-y-4">
            {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-6 rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!book) return null;

  const isAvailable = book.availableCopies > 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto space-y-8">
      {/* Back button */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm font-medium">
        <HiArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Main book info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Cover */}
        <div className="md:col-span-1">
          <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg">
            {book.coverImage ? (
              <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <span className="text-8xl">📖</span>
              </div>
            )}
          </div>

          {/* QR Code */}
          {book.qrCode && (
            <div className="mt-4 card p-3 text-center">
              <p className="text-xs text-gray-500 mb-2 font-medium">Book QR Code</p>
              <img src={book.qrCode} alt="QR Code" className="w-24 h-24 mx-auto" />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="md:col-span-2 space-y-4">
          <div>
            <span className="badge bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 mb-3">
              {book.category?.icon} {book.category?.name}
            </span>
            <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white leading-tight">{book.title}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">by <span className="font-medium text-gray-700 dark:text-gray-300">{book.author}</span></p>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-3">
            <StarRating rating={Math.round(book.averageRating)} />
            <span className="text-gray-600 dark:text-gray-400 text-sm">
              {book.averageRating > 0 ? `${book.averageRating} (${book.totalReviews} reviews)` : "No reviews yet"}
            </span>
          </div>

          {/* Book metadata */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Available Copies", value: `${book.availableCopies} / ${book.totalCopies}` },
              { label: "Publisher", value: book.publisher || "N/A" },
              { label: "Year", value: book.publishedYear || "N/A" },
              { label: "Pages", value: book.pages || "N/A" },
              { label: "Language", value: book.language },
              { label: "ISBN", value: book.isbn || "N/A" },
            ].map(({ label, value }) => (
              <div key={label} className="card p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          {book.description && (
            <div>
              <h3 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">About this book</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{book.description}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={handleBorrow}
              disabled={!isAvailable || borrowing}
              className={`btn-primary flex items-center gap-2 py-2.5 px-5 ${!isAvailable ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <HiBookOpen className="w-5 h-5" />
              {borrowing ? "Borrowing..." : isAvailable ? "Borrow Book" : "Not Available"}
            </button>

            <button onClick={handleWishlist} className={`btn-outline flex items-center gap-2 ${inWishlist ? "border-red-400 text-red-500" : ""}`}>
              <HiHeart className={`w-5 h-5 ${inWishlist ? "fill-red-500" : ""}`} />
              {inWishlist ? "In Wishlist" : "Add to Wishlist"}
            </button>

            {book.pdfFile && (
              <a href={book.pdfFile} target="_blank" rel="noopener noreferrer" className="btn-outline flex items-center gap-2">
                <HiDownload className="w-5 h-5" />
                Download PDF
              </a>
            )}
          </div>

          {/* Due date info */}
          {isAvailable && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <HiClock className="w-4 h-4" />
              <span>Borrow period: 14 days. ₹5/day fine for late returns.</span>
            </div>
          )}
        </div>
      </div>

      {/* Reviews section */}
      <div className="space-y-6">
        <h2 className="font-display text-xl font-bold">Reviews</h2>

        {/* Add review form */}
        <div className="card p-5">
          <h3 className="font-semibold mb-3">Write a Review</h3>
          <form onSubmit={handleReviewSubmit} className="space-y-3">
            <StarRating rating={myReview.rating} onRate={(r) => setMyReview((prev) => ({ ...prev, rating: r }))} interactive />
            <textarea
              value={myReview.comment}
              onChange={(e) => setMyReview((prev) => ({ ...prev, comment: e.target.value }))}
              placeholder="Share your thoughts (optional)..."
              rows={3}
              maxLength={500}
              className="input resize-none"
            />
            <button type="submit" disabled={submittingReview || !myReview.rating} className="btn-primary px-5 py-2">
              {submittingReview ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        </div>

        {/* Reviews list */}
        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review._id} className="card p-4 flex gap-4">
                <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {review.user.avatar ? (
                    <img src={review.user.avatar} alt={review.user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-primary-600 font-bold text-sm">{review.user.name?.charAt(0)}</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm">{review.user.name}</p>
                    <div className="flex">
                      {Array(5).fill(0).map((_, i) => (
                        <HiStar key={i} className={`w-4 h-4 ${i < review.rating ? "text-amber-500" : "text-gray-300"}`} />
                      ))}
                    </div>
                  </div>
                  {review.comment && <p className="text-sm text-gray-600 dark:text-gray-400">{review.comment}</p>}
                  <p className="text-xs text-gray-400 mt-1">{new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">No reviews yet. Be the first to review!</p>
        )}
      </div>
    </motion.div>
  );
}
