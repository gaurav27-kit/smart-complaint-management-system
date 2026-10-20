import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import API from "../../api/axios";
import Logo from "@/components/common/Logo";
import { BRAND } from "@/constants/brand";
import { ArrowLeft, Mail } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setLoading(true);
      const { data } = await API.post("/auth/forgot-password", { email });
      toast.success(data.message || "Reset link sent if account exists.");
      setSubmitted(true);
    } catch (error) {
      const errMsg =
        error.response?.data?.message ||
        (error.code === "ERR_NETWORK" ? "Server unavailable" : "Request failed");
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md flex flex-col">
        <div className="flex flex-col items-center mb-6">
          <Logo iconOnly size="h-16" loading="eager" className="mb-3" />
          <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase text-center max-w-[280px] leading-tight">
            {BRAND.appName}
          </h2>
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
          Forgot Password
        </h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Enter your registered email address and we'll send you a password reset link.
        </p>

        {submitted ? (
          <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl text-center space-y-3">
            <Mail className="w-10 h-10 text-green-600 mx-auto" />
            <p className="text-sm font-semibold">Check your inbox!</p>
            <p className="text-xs text-green-700">
              If an account exists for <strong>{email}</strong>, a password reset link has been sent.
            </p>
            <Link
              to="/login"
              className="inline-block mt-2 text-xs font-bold text-green-700 underline"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition duration-250 disabled:bg-gray-400 font-semibold"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            <ArrowLeft size={16} />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
