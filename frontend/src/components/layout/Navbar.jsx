import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { FiBell } from "react-icons/fi";
import { toast } from "react-hot-toast";

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!showDropdown) return;
    const closeDropdown = () => setShowDropdown(false);
    window.addEventListener("click", closeDropdown);
    return () => window.removeEventListener("click", closeDropdown);
  }, [showDropdown]);

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  const getSettingsPath = () => {
    if (user?.role === "admin") return "/admin/settings";
    if (user?.role === "department_member") return "/member/settings";
    return "/dashboard/settings";
  };

  const handleMyProfileClick = () => {
    setShowDropdown(false);
    navigate(getSettingsPath(), { state: { tab: "profile" } });
  };

  const handleSettingsClick = () => {
    setShowDropdown(false);
    navigate(getSettingsPath(), { state: { tab: "security" } });
  };

  const handleLogoutClick = () => {
    setShowDropdown(false);
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  // Determine the title & subtitle dynamically based on path
  let title = "Dashboard";
  let subtitle = "Welcome back! Here's today's overview.";

  if (pathname.includes("/analytics")) {
    title = "Analytics";
    subtitle = "Monitor complaint trends and system performance.";
  } else if (pathname.includes("/members")) {
    title = "Department Members";
    subtitle = "Manage department members and assignments.";
  } else if (pathname.includes("/assigned-complaints")) {
    title = "Assigned Complaints";
    subtitle = "View and manage complaints assigned to your department.";
  } else if (pathname.includes("/complaints/") || pathname.match(/\/complaints\/[a-zA-Z0-9]+/)) {
    title = "Complaint Details";
    subtitle = "View full complaint details, history, and status updates.";
  } else if (pathname.includes("/complaints")) {
    title = "All Complaints";
    subtitle = "Monitor and manage citizen complaints.";
  } else if (pathname.includes("/notifications")) {
    title = "Notifications";
    subtitle = "Stay updated with your latest system notifications.";
  } else if (pathname.includes("/settings")) {
    title = "Settings";
    subtitle = "Manage your account preferences and security.";
  } else if (pathname.includes("/workload")) {
    title = "My Workload";
    subtitle = "Track and update your assigned workload.";
  } else if (pathname.includes("/create-complaint")) {
    title = "Create Complaint";
    subtitle = "Submit a new complaint to the management system.";
  } else if (pathname.includes("/my-complaints")) {
    title = "My Complaints";
    subtitle = "Track and manage your submitted complaints.";
  } else if (pathname.includes("/edit-complaint")) {
    title = "Edit Complaint";
    subtitle = "Update your complaint details.";
  }

  return (
    <header className="bg-white border-b border-slate-200 h-[72px] shrink-0 flex items-center justify-between px-8 z-10 shadow-sm">
      {/* LEFT: Dynamically render page title and subtitle */}
      <div className="flex flex-col text-left">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight leading-none">
          {title}
        </h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">
          {subtitle}
        </p>
      </div>

      {/* RIGHT: Bell, Administrator Dropdown, Avatar */}
      <div className="flex items-center space-x-5">
        {/* Notification Bell (Only visible for roles that have notifications configured) */}
        {(() => {
          const notificationsPaths = {
            department_member: "/member/notifications",
          };
          const path = notificationsPaths[user?.role];
          if (!path) return null;

          return (
            <button
              onClick={() => navigate(path)}
              className="p-2 text-slate-400 hover:text-[#2563EB] relative transition-colors rounded-full hover:bg-slate-50"
              title="Notifications"
            >
              <FiBell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
            </button>
          );
        })()}

        {/* User Dropdown & Avatar */}
        <div className="relative">
          <div
            onClick={toggleDropdown}
            className="flex items-center space-x-3 border-l pl-5 border-slate-200 cursor-pointer select-none group"
          >
            <div className="flex flex-col text-right">
              <span className="text-sm font-semibold text-slate-900 leading-none group-hover:text-[#2563EB] transition-colors">
                {user?.fullName || "Guest User"}
              </span>
              <span className="text-xs text-[#2563EB] font-semibold capitalize mt-1 flex items-center gap-1">
                {user?.role === "admin" ? "Administrator" : user?.role === "department_member" ? "Member" : "Citizen"} ▼
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#2563EB] to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-sm ring-2 ring-white group-hover:ring-[#2563EB] transition-all duration-200">
              {user?.fullName?.charAt(0).toUpperCase() || "U"}
            </div>
          </div>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-lg z-20 py-2 animate-fadeIn"
            >
              <button
                onClick={handleMyProfileClick}
                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 font-medium"
              >
                <span className="text-base" role="img" aria-label="profile">👤</span>
                <span>My Profile</span>
              </button>

              <button
                onClick={handleSettingsClick}
                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 font-medium"
              >
                <span className="text-base" role="img" aria-label="settings">⚙️</span>
                <span>Settings</span>
              </button>

              <div className="border-t border-slate-100 my-1"></div>

              <button
                onClick={handleLogoutClick}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 font-medium"
              >
                <span className="text-base" role="img" aria-label="logout">🚪</span>
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;

