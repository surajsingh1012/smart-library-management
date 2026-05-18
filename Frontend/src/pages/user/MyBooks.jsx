import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { HiBookOpen, HiClock, HiExclamation, HiCheckCircle, HiCurrencyRupee } from "react-icons/hi";
import API from "../../api/axios";
import toast from "react-hot-toast";

// How many days until due date
const daysUntilDue = (dueDate) => {
  const diff = new Date(dueDate) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const STATUS_STYLES = {
  borrowed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  returned: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const STATUS_ICONS = {
  borrowed: HiBookOpen,
  returned: HiCheckCircle,
  overdue: HiExclamation,
};

export default function MyBooks() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [returningId, setReturningId] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await API.get("/borrow/my-history?limit=50");
      setRecords(res.data.records);
    } catch (err) {
      toast.error("Failed to load borrow history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleReturn = async (recordId) => {
    if (!window.confirm("Return this book?")) return;
    setReturningId(recordId);
    try {
      const res = await API.put(`/borrow/return/${recordId}`);
      toast.success(res.data.message);
      if (res.data.fine > 0) {
        toast(`Fine applied: ₹${res.data.fine}`, { icon: "⚠️" });
      }
      fetchHistory(); // Refresh
    } catch (err) {
      toast.error(err.response?.data?.message || "Return failed");
    } finally {
      setReturningId(null);
    }
  };

  const filtered = filter === "all" ? records : records.filter((r) => r.status === filter);

  // Summary counts
  const counts = {
    borrowed: records.filter((r) => r.status === "borrowed").length,
    overdue: records.filter((r) => r.status === "overdue").length,
    returned: records.filter((r) => r.status === "returned").length,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">My Books</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Your borrowing history and active books</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active", count: counts.borrowed, icon: "📖", color: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" },
          { label: "Overdue", count: counts.overdue, icon: "⚠️", color: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" },
          { label: "Returned", count: counts.returned, icon: "✅", color: "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400" },
        ].map(({ label, count, icon, color }) => (
          <div key={label} className={`card p-4 text-center ${color}`}>
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-2xl font-display font-bold">{count}</div>
            <div className="text-xs font-medium">{label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {["all", "borrowed", "overdue", "returned"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
              filter === tab
                ? "border-primary-500 text-primary-600 dark:text-primary-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {tab === "all" ? "All" : tab} {tab !== "all" && counts[tab] !== undefined && `(${counts[tab]})`}
          </button>
        ))}
      </div>

      {/* Records list */}
      {loading ? (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="card p-4 flex gap-4">
              <div className="skeleton w-16 h-20 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-1/2" />
                <div className="skeleton h-3 w-1/3" />
                <div className="skeleton h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-3">📚</p>
          <p className="font-semibold text-gray-700 dark:text-gray-300">No records found</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {filter === "all" ? "You haven't borrowed any books yet." : `No ${filter} books.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((record, i) => {
            const StatusIcon = STATUS_ICONS[record.status];
            const days = record.status === "borrowed" ? daysUntilDue(record.dueDate) : null;
            const isUrgent = days !== null && days <= 2 && days >= 0;
            const isOverdue = record.status === "overdue" || (days !== null && days < 0);

            return (
              <motion.div
                key={record._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`card p-4 flex gap-4 ${isOverdue ? "border-red-200 dark:border-red-800" : ""}`}
              >
                {/* Book cover */}
                <div className="w-14 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                  {record.book?.coverImage ? (
                    <img src={record.book.coverImage} alt={record.book.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-2xl">📖</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-1">{record.book?.title}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{record.book?.author}</p>
                    </div>
                    <span className={`badge text-xs flex-shrink-0 ${STATUS_STYLES[record.status]}`}>
                      <StatusIcon className="w-3 h-3" />
                      {record.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <HiClock className="w-3.5 h-3.5" />
                      Borrowed: {new Date(record.borrowDate).toLocaleDateString()}
                    </span>
                    <span className={`text-xs flex items-center gap-1 ${isUrgent ? "text-amber-600 font-medium" : isOverdue ? "text-red-500 font-medium" : "text-gray-500 dark:text-gray-400"}`}>
                      <HiClock className="w-3.5 h-3.5" />
                      Due: {new Date(record.dueDate).toLocaleDateString()}
                      {days !== null && days >= 0 && ` (${days}d left)`}
                      {days !== null && days < 0 && ` (${Math.abs(days)}d overdue)`}
                    </span>
                    {record.returnDate && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Returned: {new Date(record.returnDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Fine info */}
                  {record.fine?.amount > 0 && (
                    <div className="flex items-center gap-1 mt-1 text-xs">
                      <HiCurrencyRupee className="w-3.5 h-3.5 text-red-500" />
                      <span className={record.fine.paid ? "text-green-600" : "text-red-500"}>
                        Fine: ₹{record.fine.amount} {record.fine.paid ? "(Paid ✓)" : "(Unpaid)"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Return button */}
                {(record.status === "borrowed" || record.status === "overdue") && (
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => handleReturn(record._id)}
                      disabled={returningId === record._id}
                      className="btn-outline text-xs py-1.5 px-3"
                    >
                      {returningId === record._id ? "..." : "Return"}
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
