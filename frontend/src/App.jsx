import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Home from "./pages/Home";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import VerifyEmail from "./pages/auth/VerifyEmail";

import UserDashboard from "./pages/user/Dashboard";
import CreateComplaint from "./pages/user/CreateComplaint";
import MyComplaints from "./pages/user/MyComplaints";
import EditComplaint from "./pages/user/EditComplaint";

import AdminDashboard from "./pages/admin/Dashboard";
import AdminAnalytics from "./pages/admin/Analytics";
import DepartmentMembers from "./pages/admin/DepartmentMembers";
import AllComplaints from "./pages/admin/AllComplaints";

import MemberDashboard from "./pages/member/Dashboard";
import AssignedComplaints from "./pages/member/AssignedComplaints";
import ComplaintDetails from "./pages/member/ComplaintDetails";
import MemberNotifications from "./pages/member/Notifications";
import MemberWorkload from "./pages/member/MyWorkload";

import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

import ProtectedRoute from "./routes/ProtectedRoute";
import UserLayout from "./layouts/UserLayout";
import AdminLayout from "./layouts/AdminLayout";
import DepartmentMemberLayout from "./layouts/DepartmentMemberLayout";
import ErrorBoundary from "./components/common/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Toaster position="top-right" />

      <Routes>
        {/* ===========================
            Public Routes
        ============================ */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />

        {/* ===========================
            Citizen Routes
        ============================ */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute role="user">
              <UserLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<UserDashboard />} />
          <Route path="create-complaint" element={<CreateComplaint />} />
          <Route path="my-complaints" element={<MyComplaints />} />
          <Route path="edit-complaint/:id" element={<EditComplaint />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* ===========================
            Department Member Routes
        ============================ */}
        <Route
          path="/member"
          element={
            <ProtectedRoute role="department_member">
              <DepartmentMemberLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<MemberDashboard />} />
          <Route path="assigned-complaints" element={<AssignedComplaints />} />
          <Route path="complaints/:id" element={<ComplaintDetails />} />
          <Route path="notifications" element={<MemberNotifications />} />
          <Route path="workload" element={<MemberWorkload />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* ===========================
            Admin Routes
        ============================ */}
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
          <Route path="members" element={<DepartmentMembers />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Catch-all 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </ErrorBoundary>
  );
}

export default App;
