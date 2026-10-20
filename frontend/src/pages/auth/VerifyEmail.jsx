import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../../api/axios";
import Logo from "@/components/common/Logo";
import { BRAND } from "@/constants/brand";
import { CheckCircle, AlertCircle, Loader } from "lucide-react";

const VerifyEmail = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setLoading(false);
        setMessage("Invalid verification link.");
        return;
      }

      try {
        setLoading(true);
        const { data } = await API.get(`/auth/verify-email/${token}`);
        setSuccess(true);
        setMessage(data.message || "Email verified successfully!");
      } catch (error) {
        setSuccess(false);
        setMessage(
          error.response?.data?.message || "Verification link is invalid or expired."
        );
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md flex flex-col items-center text-center">
        <Logo iconOnly size="h-16" loading="eager" className="mb-3" />
        <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase text-center max-w-[280px] leading-tight mb-6">
          {BRAND.appName}
        </h2>

        {loading ? (
          <div className="space-y-4 py-8">
            <Loader className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
            <p className="text-sm font-semibold text-gray-700">Verifying your email address...</p>
          </div>
        ) : success ? (
          <div className="space-y-4 py-4">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <h1 className="text-xl font-bold text-gray-900">Email Verified!</h1>
            <p className="text-sm text-gray-600">{message}</p>
            <Link
              to="/login"
              className="inline-block mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
            >
              Go to Login
            </Link>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h1 className="text-xl font-bold text-gray-900">Verification Failed</h1>
            <p className="text-sm text-gray-600">{message}</p>
            <Link
              to="/login"
              className="inline-block mt-4 px-6 py-2.5 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-900 transition"
            >
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
