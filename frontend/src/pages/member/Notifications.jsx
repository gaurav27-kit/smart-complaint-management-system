import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  FiBell,
  FiRefreshCw,
  FiCheckCircle,
  FiShield,
  FiSearch,
  FiCheck,
  FiEye,
  FiAlertTriangle,
  FiClipboard,
  FiVolume2,
  FiCompass,
} from "react-icons/fi";
import toast from "react-hot-toast";

// Reused shared components
import Loading from "@/components/ui/Loading";
import API from "../../api/axios";

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'unread', 'read'
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Fetch notifications from backend endpoint: GET /api/member/notifications
  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await API.get("/member/notifications");
      const list = response.data?.notifications || response.data?.data || response.data || [];

      const normalized = list.map((item) => {
        const isRead = item.isRead === true || item.status === "read";
        const complaintRef =
          item.complaintId ||
          item.complaint?._id ||
          (typeof item.complaint === "string" ? item.complaint : null) ||
          item.metadata?.complaintId ||
          null;

        return {
          id: item._id || item.id,
          type: item.type || "Reminder",
          title: item.title || "Notification Notice",
          message: item.message || item.body || "",
          complaintId: complaintRef,
          createdAt: item.createdAt || new Date().toISOString(),
          isRead,
        };
      });

      setNotifications(normalized);
    } catch (err) {
      setError(err.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Derived counts
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const totalCount = notifications.length;

  // Filter and sort logic
  const filteredNotifications = useMemo(() => {
    let list = [...notifications];

    // Filter by Tab
    if (activeTab === "unread") {
      list = list.filter((n) => !n.isRead);
    } else if (activeTab === "read") {
      list = list.filter((n) => n.isRead);
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.message.toLowerCase().includes(q) ||
          String(n.complaintId).toLowerCase().includes(q) ||
          n.type.toLowerCase().includes(q)
      );
    }

    // Sort by date
    list.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortBy === "newest" ? dateB - dateA : dateA - dateB;
    });

    return list;
  }, [notifications, activeTab, searchQuery, sortBy]);

  // Handlers for marking notifications as read
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      await API.patch("/member/notifications/read-all");
      toast.success("All notifications marked as read!");
      await fetchNotifications();
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || "Failed to mark all notifications as read."
      );
    }
  };

  const handleToggleReadStatus = async (id) => {
    try {
      await API.patch(`/member/notifications/${id}/read`);
      toast.success("Notification marked as read!");
      await fetchNotifications();
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || "Failed to mark notification as read."
      );
    }
  };

  // View complaint navigation handler
  const handleViewComplaint = (complaintId) => {
    navigate(`/member/complaints/${complaintId}`);
  };

  // Helper for notification type icon and styling
  const getTypeMeta = (type) => {
    const t = type?.toLowerCase() || "";
    
    if (t.includes("assigned")) {
      return {
        icon: FiClipboard,
        bg: "bg-blue-50 text-blue-700 border-blue-100",
        iconBg: "bg-blue-100 text-blue-600",
      };
    }
    if (t.includes("update") || t.includes("change")) {
      return {
        icon: FiRefreshCw,
        bg: "bg-indigo-50 text-indigo-700 border-indigo-100",
        iconBg: "bg-indigo-100 text-indigo-600",
      };
    }
    if (t.includes("resolve")) {
      return {
        icon: FiCheckCircle,
        bg: "bg-green-50 text-green-700 border-green-100",
        iconBg: "bg-green-100 text-green-600",
      };
    }
    if (t.includes("close")) {
      return {
        icon: FiShield,
        bg: "bg-emerald-50 text-emerald-700 border-emerald-100",
        iconBg: "bg-emerald-100 text-emerald-600",
      };
    }
    if (t.includes("welcome")) {
      return {
        icon: FiCompass,
        bg: "bg-purple-50 text-purple-700 border-purple-100",
        iconBg: "bg-purple-100 text-purple-600",
      };
    }
    if (t.includes("announcement") || t.includes("system")) {
      return {
        icon: FiVolume2,
        bg: "bg-blue-50 text-blue-700 border-blue-100",
        iconBg: "bg-blue-100 text-blue-600",
      };
    }
    if (t.includes("priority") || t.includes("critical") || t.includes("alert")) {
      return {
        icon: FiAlertTriangle,
        bg: "bg-red-50 text-red-700 border-red-100",
        iconBg: "bg-red-100 text-red-600",
      };
    }

    return {
      icon: FiBell,
      bg: "bg-amber-50 text-amber-700 border-amber-100",
      iconBg: "bg-amber-100 text-amber-600",
    };
  };

  // Helper for computing relative times
  const formatRelativeTime = (dateString) => {
    if (!dateString) return "Recently";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHr = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHr / 24);

      if (diffSec < 60) return "Just now";
      if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
      if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? "s" : ""} ago`;
      if (diffDay === 1) return "Yesterday";
      if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
      
      return date.toLocaleDateString();
    } catch (err) {
      return "Recently";
    }
  };

  // Helper for finding dashboard redirect route
  const getDashboardRoute = () => {
    if (user?.role === "admin") return "/admin";
    if (user?.role === "department_member") return "/member";
    return "/dashboard";
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="py-12">
        <Loading message="Loading notifications..." />
      </div>
    );
  }

  // 2. Error State with Retry Button
  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-3xl space-y-4 max-w-xl mx-auto my-12 text-center shadow-sm">
        <FiAlertTriangle className="w-10 h-10 text-red-600 mx-auto" />
        <h3 className="text-lg font-bold text-red-900">Failed to Load Notifications</h3>
        <p className="text-sm text-red-700">{error}</p>
        <button
          onClick={fetchNotifications}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-semibold transition-all shadow-sm"
        >
          <FiRefreshCw className="w-3.5 h-3.5" />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-2">
      {/* 1. PAGE HEADER (Reduced height by ~35%) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Notification Center
            </h2>
            <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
              {unreadCount} Unread
            </span>
          </div>
          <p className="text-slate-500 mt-1 text-sm font-medium">
            Stay updated with complaint assignments, status updates, and important system announcements.
          </p>
        </div>

        <button
          onClick={handleMarkAllAsRead}
          disabled={unreadCount === 0}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-full transition-all shadow-sm disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed shrink-0"
        >
          <FiCheck className="w-4 h-4" />
          <span>Mark All as Read</span>
        </button>
      </div>

      {/* 2. FILTERS AND SEARCH CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 border border-slate-200/50 rounded-2xl shadow-sm w-fit">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 ${
              activeTab === "all"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setActiveTab("unread")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 ${
              activeTab === "unread"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setActiveTab("read")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 ${
              activeTab === "read"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Read ({totalCount - unreadCount})
          </button>
        </div>

        {/* Search & Sort Inputs */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <FiSearch className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-2xl text-xs shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full sm:w-auto border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* 3. NOTIFICATION LIST */}
      {filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white border border-slate-100 rounded-3xl shadow-sm text-center p-6">
          <span className="text-5xl mb-4" role="img" aria-label="bell">
            🔔
          </span>
          <h3 className="text-slate-900 font-bold text-lg">
            You're all caught up!
          </h3>
          <p className="text-slate-500 text-sm mt-1 max-w-sm">
            There are no new notifications at the moment.
          </p>
          <button
            onClick={() => navigate(getDashboardRoute())}
            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full text-xs font-bold shadow-sm hover:shadow transition-all"
          >
            Go to Dashboard
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map((notif) => {
            const meta = getTypeMeta(notif.type);
            const Icon = meta.icon;

            return (
              <div
                key={notif.id}
                className={`p-6 rounded-3xl border transition-all duration-300 flex flex-col sm:flex-row sm:items-start justify-between gap-5 cursor-pointer shadow-sm hover:shadow-lg hover:bg-slate-50 ${
                  !notif.isRead
                    ? "bg-blue-50/40 border-slate-200 border-l-4 border-l-blue-600"
                    : "bg-white border-slate-200"
                }`}
              >
                {/* Left Section: Icon + Details */}
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${meta.iconBg}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3
                        className={`text-sm text-slate-900 ${
                          !notif.isRead ? "font-extrabold" : "font-semibold"
                        }`}
                      >
                        {notif.title}
                      </h3>

                      {/* Type Badge */}
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[9px] font-bold rounded-full border uppercase tracking-wider ${meta.bg}`}
                      >
                        {notif.type}
                      </span>

                      {/* Read / Unread Status Badge */}
                      {!notif.isRead ? (
                        <span className="inline-block px-2.5 py-0.5 text-[9px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                          Unread
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-0.5 text-[9px] font-bold bg-slate-50 text-slate-500 border border-slate-200 rounded-full">
                          Read
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                      {notif.message}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                      {notif.complaintId && (
                        <>
                          <span>
                            Complaint:{" "}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewComplaint(notif.complaintId);
                              }}
                              className="font-bold text-blue-600 hover:underline"
                            >
                              #{String(notif.complaintId).slice(-6).toUpperCase()}
                            </button>
                          </span>
                          <span>•</span>
                        </>
                      )}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                        <span className="font-semibold text-slate-500">{formatRelativeTime(notif.createdAt)}</span>
                        {notif.timestamp && <span className="text-[10px] text-slate-400">({notif.timestamp})</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Section: Actions (Equal Heights) */}
                <div className="flex items-center sm:flex-col justify-end gap-2.5 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  {notif.complaintId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewComplaint(notif.complaintId);
                      }}
                      className="h-9 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-full text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <FiEye className="w-3.5 h-3.5" />
                      <span>View Complaint</span>
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleReadStatus(notif.id);
                    }}
                    disabled={notif.isRead}
                    className={`h-9 px-4 border rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      notif.isRead
                        ? "border-slate-200 text-slate-400 bg-slate-50 cursor-default"
                        : "border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <FiCheck className="w-3.5 h-3.5" />
                    <span>{notif.isRead ? "Read" : "Mark Read"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
