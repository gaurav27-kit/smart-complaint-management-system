import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import Logo from "@/components/common/Logo";
import { BRAND } from "@/constants/brand";
import GoogleLoginButton from "../../components/Auth/GoogleLoginButton";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const redirectTo = location.state?.redirectTo;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const { data } = await API.post("/auth/login", formData);

      login(data.user, data.token);
      toast.success("Login Successful");

      if (redirectTo) {
        navigate(redirectTo);
      } else if (data.user.role === "admin") {
        navigate("/admin");
      } else if (data.user.role === "department_member") {
        navigate("/member");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error(`[AUTH] Frontend Login Error:`, error);
      const errMsg =
        error.response?.data?.message ||
        (error.code === "ERR_NETWORK" ? "Server unavailable" : "Login Failed");
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md flex flex-col">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6">
          <Logo iconOnly size="h-16" loading="eager" className="mb-3" />
          <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase text-center max-w-[280px] leading-tight">
            {BRAND.appName}
          </h2>
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Welcome Back
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              placeholder="name@example.com"
              className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-600">
                Password <span className="text-red-500">*</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-blue-600 font-semibold hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                className="w-full border rounded-lg p-3 pr-10 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                onChange={handleChange}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 font-semibold transition duration-250 disabled:bg-gray-400"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="flex items-center my-5">
          <div className="flex-1 border-t border-gray-200"></div>
          <span className="px-3 text-xs text-gray-500 font-medium uppercase">Or</span>
          <div className="flex-1 border-t border-gray-200"></div>
        </div>

        <GoogleLoginButton redirectTo={redirectTo} />

        <p className="text-center mt-5 text-sm text-gray-600">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-blue-600 font-semibold hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;