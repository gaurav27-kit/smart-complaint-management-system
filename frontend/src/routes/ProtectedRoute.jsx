import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) return <h1>Loading...</h1>;

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (role) {
    const isAllowed = Array.isArray(role)
      ? role.includes(user.role)
      : user.role === role;

    if (!isAllowed) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;