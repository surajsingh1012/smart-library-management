import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../../api/axios";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post("/auth/forgot-password", { email });
      setSent(true);
      toast.success("Reset email sent!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="card p-8">
          {sent ? (
            <div className="text-center">
              <div className="text-5xl mb-4">📧</div>
              <h2 className="font-display text-2xl font-bold mb-2">Check your email</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">We sent a password reset link to <strong>{email}</strong></p>
              <Link to="/login" className="btn-primary inline-block">Back to Login</Link>
            </div>
          ) : (
            <>
              <h1 className="font-display text-2xl font-bold mb-2">Forgot Password?</h1>
              <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Enter your email to receive a reset link</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="input"
                  required
                />
                <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
              <Link to="/login" className="block text-center text-primary-500 mt-4 text-sm font-medium">← Back to Login</Link>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
