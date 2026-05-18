import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiPlus, HiPencil, HiTrash, HiX } from "react-icons/hi";
import API from "../../api/axios";
import toast from "react-hot-toast";

const PRESET_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#f97316"];
const PRESET_ICONS = ["📚", "📖", "🔬", "💻", "🎭", "🏛️", "💰", "🌍", "🧠", "🎨", "⚡", "🌱"];

function CategoryModal({ category, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: category?.name || "",
    description: category?.description || "",
    icon: category?.icon || "📚",
    color: category?.color || "#6366f1",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Category name is required");
    setSaving(true);
    try {
      if (category?._id) {
        await API.put(`/categories/${category._id}`, form);
        toast.success("Category updated!");
      } else {
        await API.post("/categories", form);
        toast.success("Category created!");
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save category");
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
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md"
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-display font-bold text-lg">{category ? "Edit Category" : "Add Category"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">
            <HiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Preview */}
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: form.color + "20" }}>
            <span className="text-3xl">{form.icon}</span>
            <div>
              <p className="font-semibold" style={{ color: form.color }}>{form.name || "Category Name"}</p>
              <p className="text-xs text-gray-500">{form.description || "Description here"}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" required placeholder="e.g. Science Fiction" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" placeholder="Brief description" />
          </div>

          {/* Icon picker */}
          <div>
            <label className="block text-sm font-medium mb-2">Icon</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setForm({ ...form, icon })}
                  className={`text-xl w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                    form.icon === icon ? "ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/30" : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {icon}
                </button>
              ))}
              <input
                type="text"
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                className="input w-16 text-center"
                maxLength={2}
                placeholder="✏️"
              />
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-sm font-medium mb-2">Color</label>
            <div className="flex flex-wrap gap-2 items-center">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm({ ...form, color })}
                  className={`w-7 h-7 rounded-full transition-all ${form.color === color ? "ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-900 scale-110" : "hover:scale-110"}`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="w-7 h-7 rounded-full cursor-pointer border-0"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary min-w-24">
              {saving ? "Saving..." : category ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCategory, setEditCategory] = useState(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await API.get("/categories");
      setCategories(res.data.categories);
    } catch (err) {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleDelete = async (cat) => {
    if (cat.bookCount > 0) return toast.error("Cannot delete: has books assigned. Move books first.");
    if (!window.confirm(`Delete "${cat.name}"?`)) return;
    try {
      await API.delete(`/categories/${cat._id}`);
      toast.success("Category deleted");
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Categories</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{categories.length} categories</p>
        </div>
        <button onClick={() => { setEditCategory(null); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <HiPlus className="w-5 h-5" /> Add Category
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 card p-8">
          <p className="text-4xl mb-3">🏷️</p>
          <p className="font-semibold text-gray-700 dark:text-gray-300">No categories yet</p>
          <p className="text-gray-500 text-sm mt-1">Add your first category to organize books.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat, i) => (
            <motion.div
              key={cat._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card p-4 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: cat.color + "20" }}>
                {cat.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white">{cat.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{cat.bookCount} books</p>
                {cat.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{cat.description}</p>}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => { setEditCategory(cat); setShowModal(true); }}
                  className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg"
                >
                  <HiPencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(cat)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  <HiTrash className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <CategoryModal
            category={editCategory}
            onClose={() => setShowModal(false)}
            onSaved={fetchCategories}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
