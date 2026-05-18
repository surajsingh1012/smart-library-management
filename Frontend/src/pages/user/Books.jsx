import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import API from "../../api/axios";
import BookCard from "../../components/books/BookCard";
import { HiSearch, HiFilter, HiX } from "react-icons/hi";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "popular", label: "Most Popular" },
  { value: "rating", label: "Highest Rated" },
  { value: "title", label: "A-Z Title" },
];

const BookSkeleton = () => (
  <div className="card overflow-hidden">
    <div className="skeleton h-48 rounded-none" />
    <div className="p-4 space-y-2">
      <div className="skeleton h-3 w-1/3" />
      <div className="skeleton h-4 w-3/4" />
      <div className="skeleton h-3 w-1/2" />
    </div>
  </div>
);

export default function Books() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters from URL
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "all";
  const sort = searchParams.get("sort") || "newest";
  const available = searchParams.get("available") || "";
  const page = parseInt(searchParams.get("page") || "1");

  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page"); // Reset page on filter change
    setSearchParams(params);
  };

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/books", {
        params: { search, category: category !== "all" ? category : "", sort, available, page, limit: 12 },
      });
      setBooks(res.data.books);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, category, sort, available, page]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  useEffect(() => {
    API.get("/categories").then((res) => setCategories(res.data.categories)).catch(() => {});
  }, []);

  const clearFilters = () => setSearchParams({});
  const hasFilters = search || category !== "all" || available || sort !== "newest";

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Browse Books</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{pagination.total} books available</p>
        </div>
        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600">
            <HiX className="w-4 h-4" /> Clear filters
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search books by title, author, or tag..."
            defaultValue={search}
            onChange={(e) => {
              const val = e.target.value;
              clearTimeout(window._searchTimer);
              window._searchTimer = setTimeout(() => updateParam("search", val), 500);
            }}
            className="input pl-10"
          />
        </div>

        {/* Row filters */}
        <div className="flex flex-wrap gap-3">
          {/* Category filter */}
          <select
            value={category}
            onChange={(e) => updateParam("category", e.target.value)}
            className="input w-auto px-3 py-2 text-sm"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>{cat.icon} {cat.name}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => updateParam("sort", e.target.value)}
            className="input w-auto px-3 py-2 text-sm"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Available only */}
          <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm">
            <input
              type="checkbox"
              checked={available === "true"}
              onChange={(e) => updateParam("available", e.target.checked ? "true" : "")}
              className="rounded text-primary-500"
            />
            Available only
          </label>
        </div>
      </div>

      {/* Books grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array(12).fill(0).map((_, i) => <BookSkeleton key={i} />)}
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">📚</p>
          <p className="font-semibold text-gray-700 dark:text-gray-300">No books found</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {books.map((book, i) => (
              <motion.div
                key={book._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <BookCard book={book} />
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => updateParam("page", page - 1)}
                disabled={page === 1}
                className="btn-outline px-3 py-1.5 text-sm disabled:opacity-40"
              >
                ← Prev
              </button>
              <span className="text-sm text-gray-500">
                Page {page} of {pagination.pages}
              </span>
              <button
                onClick={() => updateParam("page", page + 1)}
                disabled={page === pagination.pages}
                className="btn-outline px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
