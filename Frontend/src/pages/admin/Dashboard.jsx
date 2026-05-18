import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { HiUsers, HiBookOpen, HiClock, HiExclamation, HiCurrencyRupee, HiCheckCircle } from "react-icons/hi";
import API from "../../api/axios";

// Single stat card
const StatCard = ({ label, value, icon: Icon, color, subtext }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="card p-5"
  >
    <div className="flex items-center justify-between mb-3">
      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</p>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
    <p className="text-3xl font-display font-bold text-gray-900 dark:text-white">{value}</p>
    {subtext && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtext}</p>}
  </motion.div>
);

const PIE_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/admin/stats")
      .then((res) => {
        setStats(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-48 rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="skeleton h-64 rounded-2xl" />
          <div className="skeleton h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  const { stats: s, recentBorrows, recentUsers, popularBooks, categoryStats, chartData } = stats || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Library overview at a glance</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total Users"       value={s?.totalUsers}       icon={HiUsers}          color="bg-indigo-500"  subtext="Registered members" />
        <StatCard label="Total Books"       value={s?.totalBooks}       icon={HiBookOpen}        color="bg-amber-500"   subtext={`${s?.availableBooks} available`} />
        <StatCard label="Currently Borrowed" value={s?.totalBorrowed}    icon={HiClock}          color="bg-blue-500"    subtext="Active borrows" />
        <StatCard label="Overdue Books"     value={s?.overdueCount}     icon={HiExclamation}     color="bg-red-500"     subtext="Needs attention" />
        <StatCard label="Total Returned"    value={s?.totalReturned}    icon={HiCheckCircle}     color="bg-green-500"   subtext="All time" />
        <StatCard label="Fines Collected"   value={`₹${s?.paidFines}`} icon={HiCurrencyRupee}  color="bg-purple-500"  subtext={`₹${s?.totalFines} total imposed`} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly borrow chart */}
        <div className="card p-5">
          <h2 className="font-semibold mb-4">Monthly Borrows (Last 6 Months)</h2>
          {chartData?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
                />
                <Bar dataKey="borrows" fill="#6366f1" radius={[6, 6, 0, 0]} name="Borrows" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
          )}
        </div>

        {/* Category pie chart */}
        <div className="card p-5">
          <h2 className="font-semibold mb-4">Books by Category</h2>
          {categoryStats?.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie data={categoryStats} dataKey="bookCount" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                    {categoryStats.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ borderRadius: "10px" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5">
                {categoryStats.slice(0, 6).map((cat, idx) => (
                  <div key={cat._id} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                    <span className="text-gray-600 dark:text-gray-400 truncate flex-1">{cat.icon} {cat.name}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{cat.bookCount}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No categories yet</div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent borrows */}
        <div className="card p-5">
          <h2 className="font-semibold mb-4">Recent Borrows</h2>
          {recentBorrows?.length > 0 ? (
            <div className="space-y-3">
              {recentBorrows.map((record) => (
                <div key={record._id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
                    {record.user?.avatar ? (
                      <img src={record.user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-primary-600 font-bold text-xs">{record.user?.name?.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{record.user?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{record.book?.title}</p>
                  </div>
                  <span className={`badge text-xs ${record.status === "overdue" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"}`}>
                    {record.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">No borrows yet</p>
          )}
        </div>

        {/* Popular books */}
        <div className="card p-5">
          <h2 className="font-semibold mb-4">Most Borrowed Books</h2>
          {popularBooks?.length > 0 ? (
            <div className="space-y-3">
              {popularBooks.map((book, i) => (
                <div key={book._id} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    i === 0 ? "bg-amber-100 text-amber-700" :
                    i === 1 ? "bg-gray-100 text-gray-700" :
                    i === 2 ? "bg-orange-100 text-orange-700" :
                    "bg-gray-50 text-gray-500"
                  }`}>
                    {i + 1}
                  </span>
                  <div className="w-8 h-10 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden flex-shrink-0">
                    {book.coverImage ? (
                      <img src={book.coverImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm">📖</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{book.title}</p>
                    <p className="text-xs text-gray-500">{book.author}</p>
                  </div>
                  <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 flex-shrink-0">
                    {book.borrowCount}x
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">No borrow data yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
