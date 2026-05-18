import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiPlus, HiPencil, HiTrash, HiSearch, HiX, HiPhotograph } from "react-icons/hi";
import API from "../../api/axios";
import toast from "react-hot-toast";

// Modal for Add/Edit book
function BookModal({ book, categories, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: book?.title || "",
    author: book?.author || "",
    isbn: book?.isbn || "",
    description: book?.description || "",
    category: book?.category?._id || book?.category || "",
    totalCopies: book?.totalCopies || 1,
    publisher: book?.publisher || "",
    publishedYear: book?.publishedYear || "",
    pages: book?.pages || "",
    language: book?.language || "English",
    tags: book?.tags?.join(", ") || "",
  });
  const [coverFile, setCoverFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(book?.coverImage || null);
  const [saving, setSaving] = useState(false);
  const coverRef = useRef();
  const pdfRef = useRef();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCoverChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setCoverFile(f);
      setCoverPreview(URL.createObjectURL(f));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.author || !form.category) {
      return toast.error("Title, author, and category are required");
    }

    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (coverFile) fd.append("coverImage", coverFile);
      if (pdfFile) fd.append("pdfFile", pdfFile);

      if (book?._id) {
        await API.put(`/books/${book._id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success("Book updated!");
      } else {
        await API.post("/books", fd, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success("Book added!");
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save book");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="font-display font-bold text-xl">{book ? "Edit Book" : "Add New Book"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">
            <HiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Cover image upload */}
          <div className="flex gap-4 items-start">
            <div
              onClick={() => coverRef.current?.click()}
              className="w-24 h-32 rounded-xl bg-gray-100 dark:bg-gray-800 cursor-pointer flex flex-col items-center justify-center gap-1 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors overflow-hidden flex-shrink-0 border-2 border-dashed border-gray-300 dark:border-gray-600"
            >
              {coverPreview ? (
                <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <>
                  <HiPhotograph className="w-8 h-8" />
                  <span className="text-xs text-center px-1">Click to add cover</span>
                </>
              )}
            </div>
            <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />

            <div className="flex-1 space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input name="title" value={form.title} onChange={handleChange} className="input" required placeholder="Book title" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Author *</label>
                <input name="author" value={form.author} onChange={handleChange} className="input" required placeholder="Author name" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category *</label>
              <select name="category" value={form.category} onChange={handleChange} className="input" required>
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Total Copies</label>
              <input name="totalCopies" type="number" min="1" value={form.totalCopies} onChange={handleChange} className="input" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} className="input resize-none" placeholder="Brief description..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">ISBN</label>
              <input name="isbn" value={form.isbn} onChange={handleChange} className="input" placeholder="ISBN number" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Publisher</label>
              <input name="publisher" value={form.publisher} onChange={handleChange} className="input" placeholder="Publisher name" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Published Year</label>
              <input name="publishedYear" type="number" min="1000" max={new Date().getFullYear()} value={form.publishedYear} onChange={handleChange} className="input" placeholder="e.g. 2020" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Pages</label>
              <input name="pages" type="number" min="1" value={form.pages} onChange={handleChange} className="input" placeholder="Number of pages" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Language</label>
              <input name="language" value={form.language} onChange={handleChange} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
              <input name="tags" value={form.tags} onChange={handleChange} className="input" placeholder="fiction, classic, drama" />
            </div>
          </div>

          {/* PDF upload */}
          <div>
            <label className="block text-sm font-medium mb-1">PDF Ebook (optional)</label>
            <div
              onClick={() => pdfRef.current?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-3 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <p className="text-sm text-gray-500">
                {pdfFile ? `📄 ${pdfFile.name}` : book?.pdfFile ? "📄 PDF already uploaded (click to replace)" : "Click to upload PDF (max 50MB)"}
              </p>
            </div>
            <input ref={pdfRef} type="file" accept=".pdf" className="hidden" onChange={(e) => setPdfFile(e.target.files[0])} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary min-w-24">
              {saving ? "Saving..." : book ? "Update Book" : "Add Book"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// Main Admin Books Page
export default function AdminBooks() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [showModal, setShowModal] = useState(false);
  const [editBook, setEditBook] = useState(null);

  const fetchBooks = async (page = 1) => {
    setLoading(true);
    try {
      const res = await API.get("/books", { params: { search, page, limit: 15 } });
      setBooks(res.data.books);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error("Failed to load books");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    API.get("/categories").then((r) => setCategories(r.data.categories));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchBooks(1), 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleDelete = async (book) => {
    if (!window.confirm(`Delete "${book.title}"? This cannot be undone.`)) return;
    try {
      await API.delete(`/books/${book._id}`);
      toast.success("Book deleted");
      fetchBooks(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  const openAdd = () => { setEditBook(null); setShowModal(true); };
  const openEdit = (book) => { setEditBook(book); setShowModal(true); };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Manage Books</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{pagination.total} books total</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <HiPlus className="w-5 h-5" /> Add Book
        </button>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search books by title or author..."
            className="input pl-10"
          />
        </div>
      </div>

      {/* Books table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Book</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden lg:table-cell">Copies</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden lg:table-cell">Rating</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i}>
                    {Array(6).fill(0).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="skeleton h-4 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : books.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">No books found</td>
                </tr>
              ) : (
                books.map((book) => (
                  <tr key={book._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                          {book.coverImage ? (
                            <img src={book.coverImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg">📖</div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900 dark:text-white line-clamp-1">{book.title}</p>
                          <p className="text-xs text-gray-500">{book.author}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{book.category?.icon} {book.category?.name}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm">{book.availableCopies}/{book.totalCopies}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm">⭐ {book.averageRating > 0 ? book.averageRating.toFixed(1) : "-"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge text-xs ${book.availableCopies > 0 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"}`}>
                        {book.availableCopies > 0 ? "Available" : "Out"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(book)}
                          className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <HiPencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(book)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <HiTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-500">Page {pagination.page} of {pagination.pages}</p>
            <div className="flex gap-2">
              <button onClick={() => fetchBooks(pagination.page - 1)} disabled={pagination.page === 1} className="btn-outline px-3 py-1.5 text-sm disabled:opacity-40">← Prev</button>
              <button onClick={() => fetchBooks(pagination.page + 1)} disabled={pagination.page === pagination.pages} className="btn-outline px-3 py-1.5 text-sm disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <BookModal
            book={editBook}
            categories={categories}
            onClose={() => setShowModal(false)}
            onSaved={() => fetchBooks(pagination.page)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
