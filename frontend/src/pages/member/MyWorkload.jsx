import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardCard from "../../components/cards/DashboardCard";
import StatusBadge from "../../components/badges/StatusBadge";
import Loading from "@/components/ui/Loading";
import EmptyState from "@/components/ui/EmptyState";
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
  FiActivity as FiActivityIcon,
} from "react-icons/fi";

const MyWorkload = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // 1. Summary Cards (6 Cards reusing DashboardCard)
  const summaryCards = [
    {
      title: "Total Assigned",
      value: 15,
      icon: FiInbox,
      color: "indigo",
      description: "All assigned tasks",
    },
    {
      title: "Pending",
      value: 3,
      icon: FiClock,
      color: "yellow",
      description: "Awaiting action",
    },
    {
      title: "In Progress",
      value: 5,
      icon: FiActivity,
      color: "blue",
      description: "Active work",
    },
    {
      title: "Resolved",
      value: 5,
      icon: FiCheckCircle,
      color: "green",
      description: "Pending verification",
    },
    {
      title: "Closed",
      value: 2,
      icon: FiCheckSquare,
      color: "indigo",
      description: "Finalized & verified",
    },
    {
      title: "Overdue",
      value: 1,
      icon: FiAlertTriangle,
      color: "red",
      description: "Exceeds SLA target",
    },
  ];

  // 2. Workload Overview (Compact Metric Cards)
  const workloadOverview = [
    { label: "Active Complaints", value: "8", change: "+1 today", color: "text-blue-600 bg-blue-50" },
    { label: "Completed Today", value: "2", change: "On target", color: "text-emerald-600 bg-emerald-50" },
    { label: "Weekly Completed", value: "5", change: "100% of weekly goal", color: "text-indigo-600 bg-indigo-50" },
    { label: "Monthly Completed", value: "17", change: "+15% vs last month", color: "text-purple-600 bg-purple-50" },
  ];

  // 3. Priority Distribution
  const priorityDistribution = [
    { level: "Critical", percentage: 20, count: 3, color: "bg-red-500", text: "text-red-700" },
    { level: "High", percentage: 40, count: 6, color: "bg-orange-500", text: "text-orange-700" },
    { level: "Medium", percentage: 30, count: 4, color: "bg-amber-500", text: "text-amber-700" },
    { level: "Low", percentage: 10, count: 2, color: "bg-green-500", text: "text-green-700" },
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

  // 5. Today's Tasks Mock Assigned Complaints Table
  const todayTasks = [
    {
      id: "CMP-1089",
      title: "Street Light Fault in Block B",
      priority: "High",
      status: "In Progress",
    },
    {
      id: "CMP-1075",
      title: "Water Supply Disruption near Sector 4",
      priority: "Critical",
      status: "Pending",
    },
    {
      id: "CMP-1062",
      title: "Garbage Collection Delay in Zone 2",
      priority: "Medium",
      status: "Resolved",
    },
    {
      id: "CMP-1040",
      title: "Park Bench Repair Request",
      priority: "Low",
      status: "Closed",
    },
  ];

  // 6. Recent Activity Log
  const recentActivities = [
    {
      id: "act-1",
      title: "Proof Uploaded",
      desc: "Uploaded resolution photo for complaint #CMP-1062",
      time: "1 hour ago",
      icon: FiCheckCircle,
      color: "bg-emerald-500",
    },
    {
      id: "act-2",
      title: "Status Updated",
      desc: "Changed status of #CMP-1089 to In Progress",
      time: "3 hours ago",
      icon: FiActivity,
      color: "bg-blue-500",
    },
    {
      id: "act-3",
      title: "Complaint Assigned",
      desc: "Received new complaint assignment #CMP-1075",
      time: "5 hours ago",
      icon: FiInbox,
      color: "bg-indigo-500",
    },
    {
      id: "act-4",
      title: "Complaint Closed",
      desc: "Administrator verified and closed #CMP-1040",
      time: "1 day ago",
      icon: FiCheckSquare,
      color: "bg-purple-500",
    },
  ];

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

  if (loading) {
    return (
      <div className="py-12">
        <Loading message="Loading workload analytics..." />
      </div>
    );
  }

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
                <span className="text-indigo-600">86.6%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: "86.6%" }}></div>
              </div>
            </div>

            {/* Average Resolution Time */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-gray-700">Average Resolution Time</span>
                <span className="text-emerald-600">1.8 Days (Target &lt; 2 Days)</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: "90%" }}></div>
              </div>
            </div>

            {/* On-Time Completion */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-gray-700">On-Time SLA Completion</span>
                <span className="text-blue-600">92.5%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: "92.5%" }}></div>
              </div>
            </div>

            {/* Customer Satisfaction */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-gray-700">Customer Satisfaction (CSAT)</span>
                <span className="text-amber-600">4.8 / 5.0 Stars</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: "96%" }}></div>
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
                {todayTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      {task.id}
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
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => navigate(`/member/complaints/${task.id}`)}
                        className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm"
                      >
                        <FiEye className="w-3.5 h-3.5" />
                        <span>View Complaint</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 7. RECENT ACTIVITY TIMELINE */}
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
    </div>
  );
};

export default MyWorkload;
