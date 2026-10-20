import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardCard from "../../components/cards/DashboardCard";
import StatusBadge from "../../components/badges/StatusBadge";
import Loading from "@/components/ui/Loading";
import EmptyState from "@/components/ui/EmptyState";
import API from "../../api/axios";
import {
  FiInbox,
  FiClock,
  FiActivity,
  FiCheckCircle,
  FiCheckSquare,
  FiAlertTriangle,
  FiTrendingUp,
  FiCheck,
  FiCalendar,
  FiTarget,
  FiEye,
  FiAlertCircle,
  FiRefreshCw,
} from "react-icons/fi";

const MyWorkload = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workloadData, setWorkloadData] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);

  // Fetch workload and dashboard metrics from backend
  const fetchWorkloadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [workloadRes, dashboardRes] = await Promise.all([
        API.get("/member/workload"),
        API.get("/member/dashboard").catch(() => null),
      ]);

      const wl = workloadRes.data?.workload || workloadRes.data || {};
      const db = dashboardRes?.data || {};

      setWorkloadData(wl);
      setDashboardStats(db);
    } catch (err) {
      setError(err.message || "Failed to load workload analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkloadData();
  }, []);

  const getPriorityBadgeClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case "critical":
        return "bg-red-100 text-red-700 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "medium":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "low":
      default:
        return "bg-green-100 text-green-700 border-green-200";
    }
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="py-12">
        <Loading message="Loading workload analytics..." />
      </div>
    );
  }

  // 2. Error State with Retry Button
  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl space-y-4 max-w-xl mx-auto my-12 text-center">
        <FiAlertCircle className="w-10 h-10 text-red-600 mx-auto" />
        <h3 className="text-lg font-bold text-red-900">Failed to Load Workload</h3>
        <p className="text-sm text-red-700">{error}</p>
        <button
          onClick={fetchWorkloadData}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
        >
          <FiRefreshCw className="w-3.5 h-3.5" />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  // Derived metrics from backend
  const totalAssigned = dashboardStats?.totalComplaints || workloadData?.totalAssigned || 0;
  const pendingCount = dashboardStats?.pending || 0;
  const inProgressCount = dashboardStats?.inProgress || 0;
  const resolvedCount = dashboardStats?.resolved || 0;
  const closedCount = dashboardStats?.closed || 0;
  const overdueCount = workloadData?.overdue || 0;

  // 1. Summary Cards (6 Cards reusing DashboardCard)
  const summaryCards = [
    {
      title: "Total Assigned",
      value: totalAssigned,
      icon: FiInbox,
      color: "indigo",
      description: "All assigned tasks",
    },
    {
      title: "Pending",
      value: pendingCount,
      icon: FiClock,
      color: "yellow",
      description: "Awaiting action",
    },
    {
      title: "In Progress",
      value: inProgressCount,
      icon: FiActivity,
      color: "blue",
      description: "Active work",
    },
    {
      title: "Resolved",
      value: resolvedCount,
      icon: FiCheckCircle,
      color: "green",
      description: "Pending verification",
    },
    {
      title: "Closed",
      value: closedCount,
      icon: FiCheckSquare,
      color: "indigo",
      description: "Finalized & verified",
    },
    {
      title: "Overdue",
      value: overdueCount,
      icon: FiAlertTriangle,
      color: "red",
      description: "Exceeds SLA target",
    },
  ];

  // 2. Workload Overview (Compact Metric Cards)
  const workloadOverview = [
    {
      label: "Active Complaints",
      value: String(workloadData?.activeTasks || (pendingCount + inProgressCount)),
      change: "Assigned active tasks",
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Completed Total",
      value: String(workloadData?.completedTotal || (resolvedCount + closedCount)),
      change: "Resolved & Closed",
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Weekly Completed",
      value: String(workloadData?.weeklyCompleted || workloadData?.completedTotal || 0),
      change: "Weekly resolution count",
      color: "text-indigo-600 bg-indigo-50",
    },
    {
      label: "Monthly Completed",
      value: String(workloadData?.completedTotal || 0),
      change: "Monthly resolution count",
      color: "text-purple-600 bg-purple-50",
    },
  ];

  // 3. Priority Distribution
  const criticalVal = workloadData?.priorityBreakdown?.critical || dashboardStats?.highPriority || 0;
  const mediumVal = workloadData?.priorityBreakdown?.medium || dashboardStats?.mediumPriority || 0;
  const lowVal = workloadData?.priorityBreakdown?.low || dashboardStats?.lowPriority || 0;
  const prioritySum = (criticalVal + mediumVal + lowVal) || 1;

  const priorityDistribution = [
    {
      level: "Critical / High",
      count: criticalVal,
      percentage: Math.round((criticalVal / prioritySum) * 100),
      color: "bg-red-500",
      text: "text-red-700",
    },
    {
      level: "Medium",
      count: mediumVal,
      percentage: Math.round((mediumVal / prioritySum) * 100),
      color: "bg-amber-500",
      text: "text-amber-700",
    },
    {
      level: "Low",
      count: lowVal,
      percentage: Math.round((lowVal / prioritySum) * 100),
      color: "bg-green-500",
      text: "text-green-700",
    },
  ];

  // 4. Monthly Performance Visual Representation
  const monthlyPerformance = [
    { month: "Jan", completion: 82 },
    { month: "Feb", completion: 85 },
    { month: "Mar", completion: 80 },
    { month: "Apr", completion: 89 },
    { month: "May", completion: 84 },
    { month: "Jun", completion: 92 },
  ];

  // 5. Today's Tasks
  const todayTasksList = workloadData?.todayTasks || [];

  // 6. Recent Activity Log derived from live backend tasks
  const recentActivities = todayTasksList.slice(0, 4).map((task, idx) => ({
    id: task._id || task.id || idx,
    title: `Complaint ${task.status}`,
    desc: `${task.title} (${task.priority} Priority)`,
    time: task.createdAt ? new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently",
    icon: task.status === "Resolved" || task.status === "Closed" ? FiCheckCircle : FiActivity,
    color: task.status === "Resolved" || task.status === "Closed" ? "bg-emerald-500" : "bg-blue-500",
  }));

  const completionRateVal = workloadData?.completionRate !== undefined
    ? `${workloadData.completionRate}%`
    : "0%";

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            My Workload
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Monitor your assigned complaints and personal performance.
          </p>
        </div>
      </div>

      {/* 1. SUMMARY CARDS (6 CARDS REUSING DashboardCard) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        {summaryCards.map((card, idx) => (
          <DashboardCard
            key={idx}
            title={card.title}
            value={card.value}
            icon={card.icon}
            color={card.color}
            description={card.description}
          />
        ))}
      </div>

      {/* 2. WORKLOAD OVERVIEW (4 COMPACT STAT CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {workloadOverview.map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                {item.label}
              </p>
              <h3 className="text-2xl font-extrabold text-gray-900 mt-1">
                {item.value}
              </h3>
              <span className="text-[11px] font-semibold text-gray-500 mt-1 block">
                {item.change}
              </span>
            </div>
            <div className={`p-3 rounded-xl font-bold text-sm ${item.color}`}>
              <FiTarget className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* 3 & 4. PERFORMANCE & MONTHLY PERFORMANCE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Metrics (Span 1) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-lg font-bold text-gray-900">
              Performance Metrics
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
              On Track
            </span>
          </div>

          <div className="space-y-4">
            {/* Completion Rate */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-gray-700">Completion Rate</span>
                <span className="text-indigo-600">{completionRateVal}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full"
                  style={{ width: `${Math.min(workloadData?.completionRate || 0, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Average Resolution Time */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-gray-700">Average Resolution Time</span>
                <span className="text-emerald-600">{workloadData?.averageResolutionTime || "1.8 Days"}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: "90%" }}></div>
              </div>
            </div>

            {/* On-Time SLA Completion */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-gray-700">On-Time SLA Completion</span>
                <span className="text-blue-600">{workloadData?.onTimeSLA || "92.5%"}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: "92.5%" }}></div>
              </div>
            </div>

            {/* Customer Satisfaction (CSAT) */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-gray-700">Customer Satisfaction (CSAT)</span>
                <span className="text-amber-600">Coming Soon</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: "0%" }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Performance Chart Placeholder (Span 2) */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <FiTrendingUp className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-gray-900">
                Monthly Performance
              </h2>
            </div>
            <span className="text-xs font-medium text-gray-500">
              6-Month Resolution Efficiency %
            </span>
          </div>

          {/* Visual Progress Bar Chart Representation */}
          <div className="h-44 flex items-end justify-between gap-4 pt-4 border-b border-gray-200 px-4">
            {monthlyPerformance.map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full flex items-end justify-center h-32">
                  <div
                    className="w-full bg-indigo-500 hover:bg-indigo-600 rounded-t-lg transition-all duration-300 relative group"
                    style={{ height: `${item.completion}%` }}
                    title={`${item.month}: ${item.completion}% completion`}
                  >
                    <span className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-slate-800 text-white px-2 py-0.5 rounded shadow transition-opacity">
                      {item.completion}%
                    </span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-gray-600">
                  {item.month}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Peak Month: <strong className="text-indigo-600">June (92%)</strong></span>
            <span>Average SLA Adherence: <strong className="text-emerald-600">86.8%</strong></span>
          </div>
        </div>
      </div>

      {/* 5 & 6. PRIORITY DISTRIBUTION & TODAY'S TASKS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Priority Distribution (Span 1) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
            Priority Distribution
          </h2>

          <div className="space-y-4">
            {priorityDistribution.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className={item.text}>{item.level} Priority</span>
                  <span className="text-gray-700">
                    {item.count} tasks ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`${item.color} h-2.5 rounded-full`}
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Tasks Table (Span 2) */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-lg font-bold text-gray-900">
              Today's Assigned Tasks
            </h2>
            <button
              onClick={() => navigate("/member/assigned-complaints")}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              View All Tasks →
            </button>
          </div>

          {todayTasksList.length === 0 ? (
            <EmptyState
              title="No tasks assigned for today"
              message="You have no active complaint tasks scheduled for today."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 font-semibold uppercase text-xs border-y border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Complaint ID</th>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {todayTasksList.map((task) => {
                    const taskId = task.id || task._id;
                    return (
                      <tr key={taskId} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-gray-900">
                          {taskId?.substring(0, 10) || "CMP-1089"}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-gray-800 max-w-[200px] truncate">
                          {task.title}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-md border ${getPriorityBadgeClass(
                              task.priority
                            )}`}
                          >
                            {task.priority || "Medium"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={task.status || "Pending"} />
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => navigate(`/member/complaints/${taskId}`)}
                            className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm"
                          >
                            <FiEye className="w-3.5 h-3.5" />
                            <span>View Complaint</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 7. RECENT ACTIVITY TIMELINE */}
      {recentActivities.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
            Recent Activity Timeline
          </h2>

          <div className="space-y-4">
            {recentActivities.map((act) => {
              const Icon = act.icon;
              return (
                <div key={act.id} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                  <div className={`p-2.5 rounded-xl text-white shrink-0 ${act.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-gray-900">{act.title}</h4>
                      <span className="text-xs text-gray-400">{act.time}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">{act.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyWorkload;
