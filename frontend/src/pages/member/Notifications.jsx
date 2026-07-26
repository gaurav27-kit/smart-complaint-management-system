import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiBell,
  FiInbox,
  FiRefreshCw,
  FiCheckCircle,
  FiMessageSquare,
  FiClock,
  FiSearch,
  FiCheck,
  FiEye,
  FiFilter,
} from "react-icons/fi";
import toast from "react-hot-toast";

// Reused shared components
import Loading from "@/components/ui/Loading";
import EmptyState from "@/components/ui/EmptyState";

const Notifications = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'unread', 'read'
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Initial Mock Notifications Data
  const [notifications, setNotifications] = useState([
    {
      id: "notif-1",
      type: "Complaint Assigned",
      title: "New Complaint Assigned",
      message:
        "Complaint #CMP-1089 (Street Light Fault in Block B) has been assigned to you for investigation.",
      complaintId: "CMP-1089",
      timestamp: "10 minutes ago",
      createdAt: "2026-07-27T00:10:00Z",
      isRead: false,
    },
    {
      id: "notif-2",
      type: "Status Updated",
      title: "Status Update Notice",
      message:
        "Complaint #CMP-1075 status was updated to In Progress by Supervisor.",
      complaintId: "CMP-1075",
      timestamp: "1 hour ago",
      createdAt: "2026-07-26T23:00:00Z",
      isRead: false,
    },
    {
      id: "notif-3",
      type: "Reminder",
      title: "SLA Deadline Warning",
      message:
        "Complaint #CMP-1022 requires initial resolution response within the next 4 hours.",
      complaintId: "CMP-1022",
      timestamp: "2 hours ago",
      createdAt: "2026-07-26T22:00:00Z",
      isRead: false,
    },
    {
      id: "notif-4",
      type: "Complaint Resolved",
      title: "Resolution Verified",
      message:
        "Complaint #CMP-1062 has been officially verified and closed by department administration.",
      complaintId: "CMP-1062",
      timestamp: "1 day ago",
      createdAt: "2026-07-25T14:00:00Z",
      isRead: true,
    },
    {
      id: "notif-5",
      type: "Department Message",
      title: "Department Announcement",
      message:
        "Emergency power maintenance scheduled for Sector 4 zone this coming weekend.",
      complaintId: "CMP-1089",
      timestamp: "2 days ago",
      createdAt: "2026-07-24T09:00:00Z",
      isRead: true,
    },
  ]);

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
          n.complaintId.toLowerCase().includes(q) ||
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

  // Handlers
  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success("All notifications marked as read!");
  };

  const handleToggleReadStatus = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n))
    );
  };

  const handleViewComplaint = (complaintId) => {
    navigate(`/member/complaints/${complaintId}`);
  };

  // Helper for notification type icon and styling
  const getTypeMeta = (type) => {
    switch (type) {
      case "Complaint Assigned":
        return {
          icon: FiInbox,
          bg: "bg-blue-100 text-blue-700 border-blue-200",
          iconBg: "bg-blue-500 text-white",
        };
      case "Status Updated":
        return {
          icon: FiRefreshCw,
          bg: "bg-amber-100 text-amber-800 border-amber-200",
          iconBg: "bg-amber-500 text-white",
        };
      case "Complaint Resolved":
        return {
          icon: FiCheckCircle,
          bg: "bg-emerald-100 text-emerald-800 border-emerald-200",
          iconBg: "bg-emerald-500 text-white",
        };
      case "Department Message":
        return {
          icon: FiMessageSquare,
          bg: "bg-purple-100 text-purple-800 border-purple-200",
          iconBg: "bg-purple-500 text-white",
        };
      case "Reminder":
      default:
        return {
          icon: FiClock,
          bg: "bg-rose-100 text-rose-800 border-rose-200",
          iconBg: "bg-rose-500 text-white",
        };
    }
  };

  if (loading) {
    return (
      <div className="py-12">
        <Loading message="Loading notifications..." />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Notifications
            </h1>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              {unreadCount} Unread / {totalCount} Total
            </span>
          </div>
          <p className="text-gray-500 mt-1 text-sm">
            Stay updated with your assigned complaint tasks, status updates, and department notices.
          </p>
        </div>

        <button
          onClick={handleMarkAllAsRead}
          disabled={unreadCount === 0}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition-all shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed shrink-0"
        >
          <FiCheck className="w-4 h-4" />
          <span>Mark All as Read</span>
        </button>
      </div>

      {/* 2. FILTERS AND SEARCH CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-xl border border-gray-200 w-fit">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === "all"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setActiveTab("unread")}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === "unread"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setActiveTab("read")}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === "read"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Read ({totalCount - unreadCount})
          </button>
        </div>

        {/* Search & Sort Inputs */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <FiSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full sm:w-auto border border-gray-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* 3. NOTIFICATION LIST */}
      {filteredNotifications.length === 0 ? (
        <EmptyState
          title="No notifications found"
          message="No notifications match your current filter or search query."
        />
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map((notif) => {
            const meta = getTypeMeta(notif.type);
            const Icon = meta.icon;

            return (
              <div
                key={notif.id}
                className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                  !notif.isRead
                    ? "bg-indigo-50/50 border-indigo-200 shadow-sm ring-1 ring-indigo-100"
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}
              >
                {/* Left Section: Icon + Details */}
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${meta.iconBg}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-gray-900">
                        {notif.title}
                      </h3>

                      {/* Type Badge */}
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-md border ${meta.bg}`}
                      >
                        {notif.type}
                      </span>

                      {/* Read / Unread Status Badge */}
                      {!notif.isRead ? (
                        <span className="inline-block px-2 py-0.5 text-[10px] font-extrabold uppercase bg-indigo-600 text-white rounded">
                          Unread
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-500 rounded">
                          Read
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-700 leading-relaxed max-w-2xl">
                      {notif.message}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-gray-400 pt-1">
                      <span>
                        Complaint:{" "}
                        <button
                          onClick={() => handleViewComplaint(notif.complaintId)}
                          className="font-bold text-indigo-600 hover:underline"
                        >
                          #{notif.complaintId}
                        </button>
                      </span>
                      <span>•</span>
                      <span>{notif.timestamp}</span>
                    </div>
                  </div>
                </div>

                {/* Right Section: Actions */}
                <div className="flex items-center sm:flex-col justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-200">
                  <button
                    onClick={() => handleViewComplaint(notif.complaintId)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                  >
                    <FiEye className="w-3.5 h-3.5" />
                    <span>View Complaint</span>
                  </button>

                  <button
                    onClick={() => handleToggleReadStatus(notif.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg text-xs font-medium transition-colors"
                  >
                    <FiCheck className="w-3.5 h-3.5" />
                    <span>{notif.isRead ? "Mark Unread" : "Mark Read"}</span>
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
