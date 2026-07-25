import { Link } from "react-router-dom";

import AuthLayout from "../components/auth/AuthLayout";
import InputField from "../components/auth/InputField";

const ForgotPassword = () => {
  return (
    <AuthLayout
      title="Forgot Password"
      subtitle="Enter your email to receive a reset link"
    >
      <form>
        <InputField
          label="Email"
          type="email"
          name="email"
          placeholder="Enter your email"
        />

        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold">
          Send Reset Link
        </button>
      </form>

      <p className="text-center mt-6">
        <Link to="/login" className="text-blue-600 hover:underline">
          Back to Login
        </Link>
      </p>
    </AuthLayout>
  );
};

export default ForgotPassword;
