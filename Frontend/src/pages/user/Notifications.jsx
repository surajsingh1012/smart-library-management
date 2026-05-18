import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { HiBell, HiCheckCircle, HiBookOpen, HiExclamation, HiCurrencyRupee, HiSparkles } from "react-icons/hi";
import API from "../../api/axios";
import toast from "react-hot-toast";

const TYPE_CONFIG = {
  borrow:  { icon: HiBookOpen,       color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
  return:  { icon: HiCheckCircle,    color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" },
  overdue: { icon: HiExclamation,    color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
  fine:    { icon: HiCurrencyRupee,  color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" },
  welcome: { icon: HiSparkles,       color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" },
  general: { icon: HiBell,           color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await API.get("/notifications");
      setNotifications(res.data.notifications);
    } catch (err) {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await API.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("All marked as read");
    } catch (err) {
      toast.error("Failed");
    }
  };

  const markRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch (err) {}
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unread = notifications.filter((n) => !n.isRead).length;

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date);
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Notifications</h1>
          {unread > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{unread} unread</p>
          )}
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="text-sm text-primary-500 hover:text-primary-600 font-medium">
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="card p-4 flex gap-3">
              <div className="skeleton w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-2/3" />
                <div className="skeleton h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-3">🔔</p>
          <p className="font-semibold text-gray-700 dark:text-gray-300">No notifications yet</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">We'll let you know about borrows, returns, and due dates.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif, i) => {
            const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.general;
            const Icon = config.icon;
            return (
              <motion.div
                key={notif._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => !notif.isRead && markRead(notif._id)}
                className={`card p-4 flex gap-3 cursor-pointer transition-all hover:shadow-sm ${
                  !notif.isRead ? "border-primary-200 dark:border-primary-700 bg-primary-50/30 dark:bg-primary-900/10" : ""
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${!notif.isRead ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                      {notif.title}
                    </p>
                    {!notif.isRead && (
                      <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{notif.message}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{timeAgo(notif.createdAt)}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
