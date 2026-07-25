import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import Logo from "@/components/common/Logo";
import { BRAND } from "@/constants/brand";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(`[AUTH] Frontend Sending Login Request for email: ${formData.email}`);

    try {
      setLoading(true);
      const { data } = await API.post("/auth/login", formData);
      console.log(`[AUTH] Frontend Received Success for login:`, data);

      login(data.user, data.token);
      toast.success("Login Successful");

      if (data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error(`[AUTH] Frontend Login Error:`, error);
      const errMsg = error.response?.data?.message || (error.code === "ERR_NETWORK" ? "Server unavailable" : "Login Failed");
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
        
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Welcome Back</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            onChange={handleChange}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition duration-250 disabled:bg-gray-400"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center mt-5">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-600 font-semibold hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;