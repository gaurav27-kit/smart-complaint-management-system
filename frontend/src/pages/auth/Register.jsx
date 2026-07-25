import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import API from "../../api/axios";
import Logo from "@/components/common/Logo";
import { BRAND } from "@/constants/brand";

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
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
    console.log(`[AUTH] Frontend Sending Register Request for email: ${formData.email}`);

    try {
      setLoading(true);
      const { data } = await API.post("/auth/register", formData);
      console.log(`[AUTH] Frontend Received Success for registration:`, data);

      toast.success(data.message || "Registration Successful");
      navigate("/");
    } catch (error) {
      console.error(`[AUTH] Frontend Register Error:`, error);
      const errMsg = error.response?.data?.message || (error.code === "ERR_NETWORK" ? "Server unavailable" : "Registration Failed");
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md flex flex-col">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6">
          <Logo iconOnly size="h-16" loading="eager" className="mb-3" />
          <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase text-center max-w-[280px] leading-tight">
            {BRAND.appName}
          </h2>
        </div>
        
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Create Account</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            onChange={handleChange}
            required
          />

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
            className="w-full bg-blue-600 text-white rounded-lg p-3 hover:bg-blue-700 transition duration-250 disabled:bg-gray-400"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Register"}
          </button>
        </form>

        <p className="text-center mt-5">
          Already have an account?{" "}
          <Link to="/" className="text-blue-600 font-semibold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;