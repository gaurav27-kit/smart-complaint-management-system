import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import API from "../../api/axios";
import Logo from "@/components/common/Logo";
import { BRAND } from "@/constants/brand";
import { Eye, EyeOff, CheckCircle } from "lucide-react";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const { data } = await API.post(`/auth/reset-password/${token}`, formData);
      toast.success(data.message || "Password reset successfully!");
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (error) {
      const errMsg =
        error.response?.data?.message ||
        (error.code === "ERR_NETWORK" ? "Server unavailable" : "Reset failed.");
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
          Reset Password
        </h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Enter your new password below.
        </p>

        {success ? (
          <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl text-center space-y-3">
            <CheckCircle className="w-10 h-10 text-green-600 mx-auto" />
            <p className="text-sm font-semibold">Password Reset Complete!</p>
            <p className="text-xs text-green-700">
              Redirecting to login in 3 seconds...
            </p>
            <Link
              to="/login"
              className="inline-block mt-2 text-xs font-bold text-green-700 underline"
            >
              Go to Login Now
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="New Password (min. 6 chars)"
                className="w-full border rounded-lg p-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm New Password"
                className="w-full border rounded-lg p-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition duration-250 disabled:bg-gray-400 font-semibold"
            >
              {loading ? "Resetting Password..." : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
