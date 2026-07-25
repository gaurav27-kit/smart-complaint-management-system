import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import UserDashboard from "./pages/user/Dashboard";
import CreateComplaint from "./pages/user/CreateComplaint";
import MyComplaints from "./pages/user/MyComplaints";
import EditComplaint from "./pages/user/EditComplaint";

import AdminDashboard from "./pages/admin/Dashboard";

import AdminAnalytics from "./pages/admin/Analytics";
import AdminChangePassword from "./pages/admin/ChangePassword";

import ProtectedRoute from "./routes/ProtectedRoute";
import UserLayout from "./layouts/UserLayout";
import AdminLayout from "./layouts/AdminLayout";
import AllComplaints from "./pages/admin/AllComplaints";
function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* User Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <UserLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<UserDashboard />} />
          <Route path="create-complaint" element={<CreateComplaint />} />
          <Route path="my-complaints" element={<MyComplaints />} />
          <Route path="edit-complaint/:id" element={<EditComplaint />} />
        </Route>

        {/* Admin Protected Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="complaints" element={<AllComplaints />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="change-password" element={<AdminChangePassword />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
