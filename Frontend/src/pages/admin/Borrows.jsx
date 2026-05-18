import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { HiSearch, HiCurrencyRupee, HiCheckCircle, HiRefresh } from "react-icons/hi";
import API from "../../api/axios";
import toast from "react-hot-toast";

const STATUS_COLORS = {
  borrowed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  returned: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  overdue:  "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

export default function AdminBorrows() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [processingId, setProcessingId] = useState(null);

  const fetchRecords = async (page = 1) => {
    setLoading(true);
    try {
      const res = await API.get("/borrow/all", { params: { status: filterStatus, page, limit: 15 } });
      setRecords(res.data.records);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error("Failed to load borrow records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords(1);
  }, [filterStatus]);

  const handleReturn = async (recordId) => {
    if (!window.confirm("Mark this book as returned?")) return;
    setProcessingId(recordId);
    try {
      const res = await API.put(`/borrow/return/${recordId}`);
      toast.success(res.data.message);
      fetchRecords(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || "Return failed");
    } finally {
      setProcessingId(null);
    }
  };

  const handlePayFine = async (recordId) => {
    setProcessingId(recordId);
    try {
      await API.put(`/borrow/pay-fine/${recordId}`);
      toast.success("Fine marked as paid!");
      setRecords((prev) =>
        prev.map((r) => (r._id === recordId ? { ...r, fine: { ...r.fine, paid: true } } : r))
      );
    } catch (err) {
      toast.error("Failed to mark fine as paid");
    } finally {
      setProcessingId(null);
    }
  };

  const handleSendReminders = async () => {
    try {
      const res = await API.post("/admin/send-reminders");
      toast.success(res.data.message);
      fetchRecords(1);
    } catch (err) {
      toast.error("Failed");
    }
  };

  const overdueFineTotal = records
    .filter((r) => r.fine?.amount > 0 && !r.fine?.paid)
    .reduce((sum, r) => sum + r.fine.amount, 0);

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Borrow Records</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{pagination.total} total records</p>
        </div>
        <button onClick={handleSendReminders} className="btn-outline flex items-center gap-2 text-sm">
          <HiRefresh className="w-4 h-4" /> Update Overdue Status
        </button>
      </div>

      {/* Fine summary card */}
      {overdueFineTotal > 0 && (
        <div className="card p-4 border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/10 flex items-center gap-3">
          <HiCurrencyRupee className="w-6 h-6 text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-400">Pending Fines</p>
            <p className="text-sm text-amber-700 dark:text-amber-500">₹{overdueFineTotal} in unpaid fines on this page</p>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {[
          { value: "", label: "All" },
          { value: "borrowed", label: "Borrowed" },
          { value: "overdue", label: "Overdue" },
          { value: "returned", label: "Returned" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterStatus(tab.value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filterStatus === tab.value
                ? "border-primary-500 text-primary-600 dark:text-primary-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Records table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Book</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden lg:table-cell">Borrow Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Due Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Fine</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i}>
                    {Array(7).fill(0).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="skeleton h-4 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">No records found</td>
                </tr>
              ) : (
                records.map((record, i) => (
                  <motion.tr
                    key={record._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${record.status === "overdue" ? "bg-red-50/30 dark:bg-red-900/5" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {record.user?.avatar ? (
                            <img src={record.user.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-primary-600 text-xs font-bold">{record.user?.name?.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{record.user?.name}</p>
                          <p className="text-xs text-gray-400 hidden sm:block">{record.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-10 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden flex-shrink-0">
                          {record.book?.coverImage ? (
                            <img src={record.book.coverImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm">📖</div>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-1">{record.book?.title}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="text-sm text-gray-500">{new Date(record.borrowDate).toLocaleDateString()}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className={`text-sm font-medium ${record.status === "overdue" ? "text-red-600" : "text-gray-600 dark:text-gray-400"}`}>
                        {new Date(record.dueDate).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge text-xs ${STATUS_COLORS[record.status]}`}>{record.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      {record.fine?.amount > 0 ? (
                        <div>
                          <p className={`text-sm font-semibold ${record.fine.paid ? "text-green-600" : "text-red-600"}`}>
                            ₹{record.fine.amount}
                          </p>
                          <p className="text-xs text-gray-400">{record.fine.paid ? "Paid ✓" : "Unpaid"}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">-</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {(record.status === "borrowed" || record.status === "overdue") && (
                          <button
                            onClick={() => handleReturn(record._id)}
                            disabled={processingId === record._id}
                            className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                          >
                            <HiCheckCircle className="w-3.5 h-3.5" /> Return
                          </button>
                        )}
                        {record.fine?.amount > 0 && !record.fine?.paid && (
                          <button
                            onClick={() => handlePayFine(record._id)}
                            disabled={processingId === record._id}
                            className="text-xs font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                          >
                            <HiCurrencyRupee className="w-3.5 h-3.5" /> Pay Fine
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-500">Page {pagination.page} of {pagination.pages}</p>
            <div className="flex gap-2">
              <button onClick={() => fetchRecords(pagination.page - 1)} disabled={pagination.page === 1} className="btn-outline px-3 py-1.5 text-sm disabled:opacity-40">← Prev</button>
              <button onClick={() => fetchRecords(pagination.page + 1)} disabled={pagination.page === pagination.pages} className="btn-outline px-3 py-1.5 text-sm disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
