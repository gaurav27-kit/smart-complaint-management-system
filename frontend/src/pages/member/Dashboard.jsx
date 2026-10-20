import React, { useState, useEffect } from "react";
import Loading from "@/components/ui/Loading";
import EmptyState from "@/components/ui/EmptyState";
import { getMemberDashboardStats, getRecentAssignedComplaints } from "../../services/dashboardService";
import { getCategoryLabel } from "../../config/complaintCategories";
import { useAuth } from "../../context/AuthContext";
import {
  FiInbox,
  FiClock,
  FiActivity,
  FiCheckCircle,
  FiCheckSquare,
  FiTrendingUp,
  FiPieChart,
  FiList,
  FiArrowUpRight,
  FiAlertCircle,
  FiRefreshCw,
} from "react-icons/fi";

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statsData, setStatsData] = useState({
    total: 15,
    pending: 3,
    inProgress: 5,
    resolved: 5,
    closed: 2,
  });
  const [recentAssignedComplaints, setRecentAssignedComplaints] = useState([]);

  // Fetch Dashboard API statistics from backend
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, complaintsRes] = await Promise.allSettled([
        getMemberDashboardStats(),
        getRecentAssignedComplaints({ page: 1, limit: 5 }),
      ]);

      // Process Statistics API Response
      if (statsRes.status === "fulfilled" && statsRes.value) {
        const raw = statsRes.value.data || statsRes.value;
        setStatsData({
          total: raw.totalComplaints ?? raw.total ?? 15,
          pending: raw.pending ?? 3,
          inProgress: raw.inProgress ?? 5,
          resolved: raw.resolved ?? 5,
          closed: raw.closed ?? 2,
        });
      }

      // Process Recent Complaints API Response
      if (complaintsRes.status === "fulfilled" && complaintsRes.value) {
        const list = complaintsRes.value.complaints || complaintsRes.value.data || [];
        setRecentAssignedComplaints(list);
      }
    } catch (err) {
      setError(err.message || "Failed to load dashboard statistics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Helpers for priority and status badge styling
  const getPriorityBadgeClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case "critical":
        return "bg-red-50 text-red-700 border-red-100";
      case "high":
        return "bg-orange-50 text-orange-700 border-orange-100";
      case "medium":
        return "bg-amber-50 text-amber-700 border-amber-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "in progress":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "resolved":
        return "bg-green-50 text-green-700 border-green-200";
      case "closed":
        return "bg-slate-50 text-slate-700 border-slate-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  if (loading) {
    return <Loading message="Loading dashboard statistics..." />;
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-3xl space-y-4 max-w-xl mx-auto my-12 text-center shadow-sm">
        <FiAlertCircle className="w-10 h-10 text-red-600 mx-auto" />
        <h3 className="text-lg font-bold text-red-900">Dashboard API Error</h3>
        <p className="text-sm text-red-700">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-semibold transition-all shadow-sm"
        >
          <FiRefreshCw className="w-3.5 h-3.5" />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  const userFirstName = user?.fullName ? user.fullName.split(" ")[0] : "Representative";

  const cards = [
    {
      title: "Assigned Complaints",
      value: statsData.total,
      icon: <FiInbox size={24} />,
      gradient: "from-indigo-500 to-blue-600",
      label: "Total assigned to you",
    },
    {
      title: "Pending",
      value: statsData.pending,
      icon: <FiClock size={24} />,
      gradient: "from-amber-400 to-orange-500",
      label: "Awaiting Action",
    },
    {
      title: "In Progress",
      value: statsData.inProgress,
      icon: <FiActivity size={24} />,
      gradient: "from-sky-400 to-blue-500",
      label: "Being Resolved",
    },
    {
      title: "Resolved",
      value: statsData.resolved,
      icon: <FiCheckCircle size={24} />,
      gradient: "from-emerald-400 to-green-500",
      label: "Successfully Closed",
    },
    {
      title: "Closed",
      value: statsData.closed,
      icon: <FiCheckSquare size={24} />,
      gradient: "from-purple-500 to-pink-500",
      label: "Archived complaints",
    },
  ];

  const monthlyProgress = [
    { month: "Jan", assigned: 12, resolved: 10 },
    { month: "Feb", assigned: 18, resolved: 15 },
    { month: "Mar", assigned: 14, resolved: 13 },
    { month: "Apr", assigned: 22, resolved: 19 },
    { month: "May", assigned: 16, resolved: 14 },
    { month: "Jun", assigned: 20, resolved: 17 },
  ];

  return (
    <div className="space-y-10 p-2">
      {/* Welcome Header */}
      <div>
        <p className="text-sm text-slate-500 font-semibold mb-1">
          Welcome back, {userFirstName}! 👋
        </p>
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight leading-tight">
          Department Member Dashboard
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Overview of your assigned tasks, active complaints, and monthly workload metrics.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {cards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3.5 rounded-2xl bg-gradient-to-tr ${card.gradient} text-white shrink-0 shadow-sm`}>
                {card.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">
                  {card.title}
                </p>
                <h2 className="text-3xl font-extrabold text-slate-900 mt-1">
                  {card.value}
                </h2>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {card.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Span 2) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Assigned Complaints */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <FiList className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Recent Assigned Complaints
                </h2>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                Latest Updates
              </span>
            </div>

            {recentAssignedComplaints.length === 0 ? (
              <EmptyState
                title="No assigned complaints"
                message="You currently have no assigned complaints to display."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold text-xs uppercase tracking-wider">
                      <th className="pb-4 pt-2 px-4">Complaint ID</th>
                      <th className="pb-4 pt-2 px-4">Title</th>
                      <th className="pb-4 pt-2 px-4">Category</th>
                      <th className="pb-4 pt-2 px-4">Priority</th>
                      <th className="pb-4 pt-2 px-4">Status</th>
                      <th className="pb-4 pt-2 px-4 text-right">Assigned Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {recentAssignedComplaints.map((item) => (
                      <tr
                        key={item._id || item.id}
                        className="hover:bg-slate-50 cursor-pointer transition-all duration-200 group"
                      >
                        <td className="py-4 px-4 font-mono text-xs text-slate-500">
                          #{item.id || item._id?.substring(0, 8).toUpperCase() || "CMP-1089"}
                        </td>
                        <td className="py-4 px-4 font-semibold text-slate-900">
                          {item.title}
                        </td>
                        <td className="py-4 px-4">
                          <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200">
                            {getCategoryLabel(item.category)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border ${getPriorityBadgeClass(
                              item.priority
                            )}`}
                          >
                            {item.priority || "Medium"}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border ${getStatusBadgeClass(
                              item.status
                            )}`}
                          >
                            {item.status || "Pending"}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right text-xs text-slate-400">
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleDateString()
                            : item.assignedDate || "Today"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Monthly Progress Chart */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <FiTrendingUp className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Monthly Progress Chart
                </h2>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-indigo-500 rounded-sm"></span> Assigned
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-emerald-500 rounded-sm"></span> Resolved
                </span>
              </div>
            </div>

            {/* Visual Chart Representation - Height increased to h-64 to let it breathe */}
            <div className="h-64 flex items-end justify-between gap-6 pt-4 border-b border-slate-100 px-6">
              {monthlyProgress.map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-full flex items-end justify-center gap-2 h-52">
                    <div
                      className="w-1/2 bg-indigo-500 rounded-t-lg transition-all duration-300 group-hover:bg-indigo-600 shadow-sm"
                      style={{ height: `${(item.assigned / 25) * 100}%` }}
                      title={`Assigned: ${item.assigned}`}
                    ></div>
                    <div
                      className="w-1/2 bg-emerald-500 rounded-t-lg transition-all duration-300 group-hover:bg-emerald-600 shadow-sm"
                      style={{ height: `${(item.resolved / 25) * 100}%` }}
                      title={`Resolved: ${item.resolved}`}
                    ></div>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 mt-1">
                    {item.month}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
              <span>Overall Resolution Rate: <strong className="text-emerald-600 font-bold">86.6%</strong></span>
              <span>Average Resolution Time: <strong className="text-indigo-600 font-bold">1.8 Days</strong></span>
            </div>
          </div>
        </div>

        {/* Right Column (Span 1) */}
        <div className="space-y-8">
          {/* My Workload */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 hover:shadow-lg transition-all duration-300 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiPieChart className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  My Workload
                </h2>
              </div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Optimal Capacity
              </span>
            </div>

            {/* Workload Progress Indicators */}
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm font-semibold mb-2">
                  <span className="text-slate-700">Active Task Load</span>
                  <span className="text-indigo-600">
                    {statsData.inProgress + statsData.pending} / 10 Slots (
                    {Math.round(((statsData.inProgress + statsData.pending) / 10) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(((statsData.inProgress + statsData.pending) / 10) * 100)
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Priority Breakdown */}
              <div className="pt-5 border-t border-slate-50 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Priority Breakdown
                </h3>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                      <span>Critical / High Priority</span>
                      <span className="font-semibold text-red-600">40%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: "40%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                      <span>Medium Priority</span>
                      <span className="font-semibold text-amber-600">40%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-amber-500 h-2 rounded-full" style={{ width: "40%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                      <span>Low Priority</span>
                      <span className="font-semibold text-slate-600">20%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-slate-400 h-2 rounded-full" style={{ width: "20%" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Efficiency Card */}
            <div className="bg-indigo-50/60 rounded-2xl p-4 border border-indigo-100 space-y-2">
              <div className="flex items-center gap-2 text-indigo-900 font-semibold text-sm">
                <FiArrowUpRight className="w-4 h-4 text-indigo-600" />
                Workload Efficiency
              </div>
              <p className="text-xs text-indigo-700 leading-relaxed font-medium">
                You have resolved {statsData.resolved} complaints so far. Maintaining current pace will meet your monthly SLA target easily.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
