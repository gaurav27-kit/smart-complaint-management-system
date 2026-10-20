import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  User,
  Shield,
  LogOut,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  UserCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { changeAdminPassword } from "../services/adminService";
import { changeMemberPassword } from "../services/dashboardService";

const Settings = () => {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState(location.state?.tab || "profile");
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);

  // Profile Form State
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "+91 98765 43210",
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Security Form State
  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [securityLoading, setSecurityLoading] = useState(false);

  // Profile Edit Handlers
  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setProfileLoading(true);
      // Simulate/Trigger profile update in local storage since backend update is optional/not defined
      const updatedUser = { ...user, fullName: profileData.fullName, email: profileData.email, phone: profileData.phone };
      // Save back to local storage
      localStorage.setItem("user", JSON.stringify(updatedUser));
      // Log in with updated details to update AuthContext state
      login(updatedUser, localStorage.getItem("token"));
      
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error("Failed to update profile details.");
    } finally {
      setProfileLoading(false);
    }
  };

  // Security Edit Handlers
  const handleSecurityChange = (e) => {
    setSecurityData({ ...securityData, [e.target.name]: e.target.value });
  };

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = securityData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      toast.error("New password must be different from current password.");
      return;
    }

    try {
      setSecurityLoading(true);

      if (user?.role === "admin") {
        await changeAdminPassword({ currentPassword, newPassword, confirmPassword });
        toast.success("Admin password changed successfully!");
      } else if (user?.role === "department_member") {
        await changeMemberPassword({ currentPassword, newPassword, confirmPassword });
        toast.success("Member password changed successfully!");
      } else {
        // Citizens have no change password endpoint defined, so we display placeholder success/tip
        toast.success("Password changed successfully! (Demo mode)");
      }

      setSecurityData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      const errMsg = error.response?.data?.message || "Failed to update password. Try again.";
      toast.error(errMsg);
    } finally {
      setSecurityLoading(false);
    }
  };

  // Logout Handlers
  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* LEFT: Tabs navigation */}
        <div className="md:col-span-1 bg-white rounded-3xl border border-slate-100 shadow-sm p-4 h-fit space-y-1">
          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 ${
              activeTab === "profile"
                ? "bg-blue-50 text-blue-600 shadow-sm"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <User className="w-5 h-5 shrink-0" />
            <span>Profile</span>
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 ${
              activeTab === "security"
                ? "bg-blue-50 text-blue-600 shadow-sm"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Shield className="w-5 h-5 shrink-0" />
            <span>Security & Privacy</span>
          </button>

          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span>Logout</span>
          </button>
        </div>

        {/* RIGHT: Tab content */}
        <div className="md:col-span-3 space-y-6">
          {activeTab === "profile" && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 animate-fadeIn">
              <h2 className="text-xl font-bold text-slate-950 flex items-center gap-2 mb-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                Profile Information
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                Update your account details and view your workspace assignments.
              </p>

              <form onSubmit={handleProfileSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={profileData.fullName}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      required
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>

                  {/* Role (Read-only) */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">
                      System Role
                    </label>
                    <input
                      type="text"
                      value={
                        user?.role === "admin"
                          ? "Administrator"
                          : user?.role === "department_member"
                          ? "Department Representative"
                          : "Citizen"
                      }
                      className="w-full px-4 py-3 border border-slate-100 bg-slate-50 text-slate-400 rounded-2xl focus:outline-none select-none capitalize"
                      disabled
                    />
                  </div>

                  {/* Department (Read-only for member/officer) */}
                  {(user?.role === "department_member" || user?.department) && (
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-slate-400 mb-2">
                        Assigned Department
                      </label>
                      <input
                        type="text"
                        value={
                          user?.department?.name ||
                          user?.department ||
                          "Municipal General Administration"
                        }
                        className="w-full px-4 py-3 border border-slate-100 bg-slate-50 text-slate-400 rounded-2xl focus:outline-none select-none"
                        disabled
                      />
                    </div>
                  )}
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full shadow-sm hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
                  >
                    {profileLoading ? "Saving Changes..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              {/* Change Password Card */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 animate-fadeIn">
                <h2 className="text-xl font-bold text-slate-950 flex items-center gap-2 mb-2">
                  <KeyRound className="w-5 h-5 text-blue-600" />
                  Change Password
                </h2>
                <p className="text-sm text-slate-500 mb-6">
                  Update your account password to ensure ongoing system security.
                </p>

                <form onSubmit={handleSecuritySubmit} className="space-y-5">
                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <KeyRound className="w-5 h-5" />
                      </div>
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        name="currentPassword"
                        value={securityData.currentPassword}
                        onChange={handleSecurityChange}
                        placeholder="Enter current password"
                        className="w-full pl-11 pr-12 py-3 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input
                        type={showNewPassword ? "text" : "password"}
                        name="newPassword"
                        value={securityData.newPassword}
                        onChange={handleSecurityChange}
                        placeholder="Enter new password (min. 6 characters)"
                        className="w-full pl-11 pr-12 py-3 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={securityData.confirmPassword}
                        onChange={handleSecurityChange}
                        placeholder="Re-enter new password"
                        className="w-full pl-11 pr-12 py-3 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={securityLoading}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full shadow-sm hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
                    >
                      {securityLoading ? "Updating Password..." : "Save Password"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Placeholder Security Policies */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 animate-fadeIn space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Additional Security Policies</h3>
                  <p className="text-sm text-slate-500">Configure secondary auth methods and session parameters.</p>
                </div>

                <div className="divide-y divide-slate-100">
                  {/* 2FA Option */}
                  <div className="py-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Two-Factor Authentication (2FA)</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Secure your login process using SMS or an authenticator token.</p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 border border-slate-100 rounded px-2.5 py-1 select-none">
                      Coming Soon
                    </span>
                  </div>

                  {/* Sessions Option */}
                  <div className="py-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Active Login Sessions</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Monitor and revoke devices currently authorized to your account.</p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 border border-slate-100 rounded px-2.5 py-1 select-none">
                      Coming Soon
                    </span>
                  </div>

                  {/* Privacy Settings */}
                  <div className="py-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Privacy & Visibility Preferences</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Manage details shown to municipal and field staff.</p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 border border-slate-100 rounded px-2.5 py-1 select-none">
                      Coming Soon
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-6 text-center border border-slate-100">
            <LogOut className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">Log Out</h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to log out?
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="w-1/2 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 font-semibold rounded-full transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="w-1/2 py-3 text-white bg-red-600 hover:bg-red-700 font-semibold rounded-full transition-colors duration-200 shadow-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
