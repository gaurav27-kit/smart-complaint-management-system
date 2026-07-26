import React, { useState, useEffect } from "react";
import DashboardCard from "../../components/cards/DashboardCard";
import Logo from "@/components/common/Logo";
import Loading from "@/components/ui/Loading";
import EmptyState from "@/components/ui/EmptyState";
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
} from "react-icons/fi";

const Dashboard = () => {
  const [loading, setLoading] = useState(false);

  // Stats Data for Department Member Cards using existing DashboardCard component
  const stats = [
    {
      title: "Assigned Complaints",
      value: 15,
      icon: FiInbox,
      color: "indigo",
      description: "Total assigned to you",
    },
    {
      title: "Pending",
      value: 3,
      icon: FiClock,
      color: "yellow",
      description: "Awaiting initial action",
    },
    {
      title: "In Progress",
      value: 5,
      icon: FiActivity,
      color: "blue",
      description: "Work underway",
    },
    {
      title: "Resolved",
      value: 5,
      icon: FiCheckCircle,
      color: "green",
      description: "Resolution submitted",
    },
    {
      title: "Closed",
      value: 2,
      icon: FiCheckSquare,
      color: "red",
      description: "Verified & completed",
    },
  ];

  // Placeholder Data: Recent Assigned Complaints (UI / Mock data only)
  const recentAssignedComplaints = [
    {
      id: "CMP-1089",
      title: "Street Light Fault in Block B",
      category: "Infrastructure",
      priority: "High",
      status: "In Progress",
      assignedDate: "2 hours ago",
    },
    {
      id: "CMP-1075",
      title: "Water Supply Disruption near Sector 4",
      category: "Water Supply",
      priority: "Critical",
      status: "Pending",
      assignedDate: "5 hours ago",
    },
    {
      id: "CMP-1062",
      title: "Garbage Collection Delay in Zone 2",
      category: "Sanitation",
      priority: "Medium",
      status: "Resolved",
      assignedDate: "1 day ago",
    },
    {
      id: "CMP-1040",
      title: "Park Bench Repair Request",
      category: "Public Works",
      priority: "Low",
      status: "Closed",
      assignedDate: "3 days ago",
    },
  ];

  // Placeholder Data: Monthly Progress Data
  const monthlyProgress = [
    { month: "Jan", assigned: 12, resolved: 10 },
    { month: "Feb", assigned: 18, resolved: 15 },
    { month: "Mar", assigned: 14, resolved: 13 },
    { month: "Apr", assigned: 22, resolved: 19 },
    { month: "May", assigned: 16, resolved: 14 },
    { month: "Jun", assigned: 20, resolved: 17 },
  ];

  // Helper for priority badge styling
  const getPriorityBadgeClass = (priority) => {
    switch (priority.toLowerCase()) {
      case "critical":
        return "bg-red-100 text-red-700 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "medium":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  // Helper for status badge styling
  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "in progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "resolved":
        return "bg-green-100 text-green-800 border-green-200";
      case "closed":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return <Loading message="Loading dashboard stats..." />;
  }

  return (
    <div className="space-y-8">
      {/* Header matching Admin Dashboard design */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo iconOnly size="h-9" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 leading-tight">
              Department Member Dashboard
            </h1>
            <p className="text-gray-500 mt-1">
              Overview of your assigned tasks, active complaints, and monthly workload metrics.
            </p>
          </div>
        </div>
      </div>

      {/* 1. Dashboard Cards Grid (5 Cards using DashboardCard) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {stats.map((stat, idx) => (
          <DashboardCard
            key={idx}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            description={stat.description}
          />
        ))}
      </div>

      {/* 2. Main Content Grid (3 Placeholder Sections) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Span 2): Recent Assigned Complaints & Monthly Progress Chart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Recent Assigned Complaints */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <FiList className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-bold text-gray-900">
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
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-gray-700 font-semibold uppercase text-xs border-y border-gray-200">
                    <tr>
                      <th className="py-3 px-4">Complaint ID</th>
                      <th className="py-3 px-4">Title</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Assigned Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentAssignedComplaints.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50/80 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-bold text-gray-900">
                          {item.id}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-gray-800">
                          {item.title}
                        </td>
                        <td className="py-3.5 px-4 text-gray-500">
                          {item.category}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-md border ${getPriorityBadgeClass(
                              item.priority
                            )}`}
                          >
                            {item.priority}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-md border ${getStatusBadgeClass(
                              item.status
                            )}`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right text-xs text-gray-400">
                          {item.assignedDate}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 2: Monthly Progress Chart (Placeholder Container Only) */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <FiTrendingUp className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  Monthly Progress Chart
                </h2>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-indigo-500 rounded-sm"></span> Assigned
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-emerald-500 rounded-sm"></span> Resolved
                </span>
              </div>
            </div>

            {/* Placeholder Visual Chart Representation (No external chart library) */}
            <div className="h-48 flex items-end justify-between gap-4 pt-4 border-b border-gray-200 px-4">
              {monthlyProgress.map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-full flex items-end justify-center gap-1.5 h-36">
                    <div
                      className="w-1/2 bg-indigo-500 rounded-t-md transition-all duration-300 group-hover:bg-indigo-600"
                      style={{ height: `${(item.assigned / 25) * 100}%` }}
                      title={`Assigned: ${item.assigned}`}
                    ></div>
                    <div
                      className="w-1/2 bg-emerald-500 rounded-t-md transition-all duration-300 group-hover:bg-emerald-600"
                      style={{ height: `${(item.resolved / 25) * 100}%` }}
                      title={`Resolved: ${item.resolved}`}
                    ></div>
                  </div>
                  <span className="text-xs font-semibold text-gray-600">
                    {item.month}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
              <span>Overall Resolution Rate: <strong className="text-emerald-600">86.6%</strong></span>
              <span>Average Resolution Time: <strong className="text-indigo-600">1.8 Days</strong></span>
            </div>
          </div>
        </div>

        {/* Right Column (Span 1): My Workload */}
        <div className="space-y-6">
          {/* Section 3: My Workload Placeholder */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <FiPieChart className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  My Workload
                </h2>
              </div>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Optimal Capacity
              </span>
            </div>

            {/* Workload Progress Indicators */}
            <div className="space-y-4 mb-6">
              <div>
                <div className="flex justify-between text-sm font-semibold mb-1">
                  <span className="text-gray-700">Active Task Load</span>
                  <span className="text-indigo-600">8 / 10 Slots (80%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: "80%" }}
                  ></div>
                </div>
              </div>

              {/* Priority Breakdown */}
              <div className="pt-3 border-t border-gray-100 space-y-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Priority Breakdown
                </h3>

                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Critical / High Priority</span>
                      <span className="font-semibold text-red-600">40%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: "40%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Medium Priority</span>
                      <span className="font-semibold text-amber-600">40%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-amber-500 h-2 rounded-full" style={{ width: "40%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Low Priority</span>
                      <span className="font-semibold text-gray-600">20%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-gray-400 h-2 rounded-full" style={{ width: "20%" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Efficiency Card */}
            <div className="bg-indigo-50/60 rounded-xl p-4 border border-indigo-100 space-y-2">
              <div className="flex items-center gap-2 text-indigo-900 font-semibold text-sm">
                <FiArrowUpRight className="w-4 h-4 text-indigo-600" />
                Workload Efficiency
              </div>
              <p className="text-xs text-indigo-700 leading-relaxed">
                You have resolved 5 complaints this week. Maintaining current pace will meet your monthly SLA target easily.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
