import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  FileText,
  Clock,
  Loader,
  CheckCircle,
  Eye,
  X,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  getDashboardStats,
  getAllComplaints,
  getComplaintById,
} from "../../services/adminService";
import { getCategoryLabel } from "../../config/complaintCategories";

const Dashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [statsRes, complaintsRes] = await Promise.all([
        getDashboardStats(),
        getAllComplaints({ limit: 5, sort: "newest" }),
      ]);
      setDashboard(statsRes.dashboard);
      setRecentComplaints(complaintsRes.complaints || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleViewComplaint = async (id) => {
    try {
      setViewLoading(true);
      const data = await getComplaintById(id);
      setSelectedComplaint(data.complaint || data);
      setViewOpen(true);
    } catch (error) {
      toast.error("Failed to load complaint details.");
    } finally {
      setViewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader className="animate-spin w-10 h-10 text-blue-600" />
      </div>
    );
  }

  const cards = [
    {
      title: "Total Users",
      value: dashboard.totalUsers,
      icon: <Users size={24} />,
      gradient: "from-blue-500 to-indigo-500",
      label: "Active Users",
      linkTo: null,
    },
    {
      title: "Total Complaints",
      value: dashboard.totalComplaints,
      icon: <FileText size={24} />,
      gradient: "from-purple-500 to-indigo-500",
      label: "Registered Complaints",
      linkTo: "/admin/complaints",
    },
    {
      title: "Pending",
      value: dashboard.pending,
      icon: <Clock size={24} />,
      gradient: "from-amber-400 to-orange-500",
      label: "Awaiting Action",
      linkTo: "/admin/complaints?status=Pending",
    },
    {
      title: "In Progress",
      value: dashboard.inProgress || 0,
      icon: <Loader size={24} className="animate-spin" />,
      gradient: "from-sky-400 to-blue-500",
      label: "Being Resolved",
      linkTo: "/admin/complaints?status=In+Progress",
    },
    {
      title: "Resolved",
      value: dashboard.resolved,
      icon: <CheckCircle size={24} />,
      gradient: "from-emerald-400 to-green-500",
      label: "Successfully Closed",
      linkTo: "/admin/complaints?status=Resolved",
    },
    {
      title: "Unassigned",
      value: dashboard.unassigned ?? 0,
      icon: <AlertTriangle size={24} />,
      gradient: "from-rose-500 to-orange-500",
      label: "No Department – Needs Attention",
      linkTo: "/admin/complaints?unassigned=true",
      highlight: (dashboard.unassigned ?? 0) > 0,
    },
  ];

  return (
    <div className="space-y-8 p-6">
      {/* 3. Dashboard Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Admin Dashboard
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Welcome back! Monitor your complaint system from one place.
        </p>
      </div>

      {/* 4. KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((card, index) => {
          const cardContent = (
            <div
              className={`bg-white rounded-3xl shadow-sm border p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full ${
                card.highlight
                  ? "border-rose-300 ring-1 ring-rose-200"
                  : "border-slate-100"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`p-3.5 rounded-2xl bg-gradient-to-tr ${card.gradient} text-white shrink-0 shadow-sm relative`}
                >
                  {card.icon}
                  {card.highlight && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full animate-ping" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">
                    {card.title}
                  </p>
                  <h2 className={`text-3xl font-extrabold mt-1 ${card.highlight ? "text-rose-600" : "text-slate-900"}`}>
                    {card.value}
                  </h2>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {card.label}
                </span>
                {card.linkTo && (
                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">
                    View →
                  </span>
                )}
              </div>
            </div>
          );

          return card.linkTo ? (
            <Link key={index} to={card.linkTo} className="block">
              {cardContent}
            </Link>
          ) : (
            <div key={index}>{cardContent}</div>
          );
        })}
      </div>

      {/* 5. Recent Complaints Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Recent Complaints
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Monitor the latest complaints submitted by citizens.
            </p>
          </div>
          <Link
            to="/admin/complaints"
            className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 group transition-colors text-sm"
          >
            View All <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        {recentComplaints.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="text-4xl mb-3" role="img" aria-label="document">
              📄
            </span>
            <h3 className="text-slate-800 font-semibold text-base">
              No recent complaints found.
            </h3>
            <Link
              to="/admin/complaints"
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-colors"
            >
              View All Complaints
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm text-slate-600">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold text-xs uppercase tracking-wider">
                  <th className="pb-4 pt-2 px-4">Complaint ID</th>
                  <th className="pb-4 pt-2 px-4">Citizen</th>
                  <th className="pb-4 pt-2 px-4">Category</th>
                  <th className="pb-4 pt-2 px-4">Priority</th>
                  <th className="pb-4 pt-2 px-4">Status</th>
                  <th className="pb-4 pt-2 px-4">Submitted On</th>
                  <th className="pb-4 pt-2 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentComplaints.map((complaint) => {
                  // Badge styling logic
                  let priorityColor = "bg-green-50 text-green-700 border-green-100";
                  if (complaint.priority === "High") {
                    priorityColor = "bg-red-50 text-red-700 border-red-100";
                  } else if (complaint.priority === "Medium") {
                    priorityColor = "bg-yellow-50 text-yellow-700 border-yellow-100";
                  }

                  let statusColor = "bg-slate-50 text-slate-700 border-slate-200";
                  if (complaint.status === "Pending") {
                    statusColor = "bg-orange-50 text-orange-700 border-orange-200";
                  } else if (complaint.status === "In Progress") {
                    statusColor = "bg-blue-50 text-blue-700 border-blue-200";
                  } else if (complaint.status === "Resolved") {
                    statusColor = "bg-green-50 text-green-700 border-green-200";
                  }

                  return (
                    <tr
                      key={complaint._id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="py-4 px-4 font-mono text-xs text-slate-500">
                        #{complaint._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-900">
                          {complaint.createdBy?.fullName || "N/A"}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {complaint.createdBy?.email || ""}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200">
                          {getCategoryLabel(complaint.category)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${priorityColor}`}
                        >
                          {complaint.priority || "Medium"}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColor}`}
                        >
                          {complaint.status || "Pending"}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-500 text-xs">
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleViewComplaint(complaint._id)}
                          disabled={viewLoading}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center justify-center"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
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

      {/* Details View Modal */}
      {viewOpen && selectedComplaint && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto border border-slate-100">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <h2 className="text-2xl font-bold text-slate-900">Complaint Details</h2>
              <button
                onClick={() => setViewOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Title</p>
                <p className="font-bold text-slate-900 mt-1 text-base">{selectedComplaint.title}</p>
              </div>

              <div>
                <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Category</p>
                <p className="font-bold text-slate-900 mt-1 text-base">{getCategoryLabel(selectedComplaint.category)}</p>
              </div>

              <div>
                <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Priority</p>
                <p className="font-bold text-slate-900 mt-1 text-base">{selectedComplaint.priority}</p>
              </div>

              <div>
                <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Status</p>
                <p className="font-bold text-slate-900 mt-1 text-base">{selectedComplaint.status}</p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Description</p>
                <p className="text-slate-700 bg-slate-50/50 border border-slate-100 p-4 rounded-2xl mt-1.5 whitespace-pre-wrap leading-relaxed">
                  {selectedComplaint.description}
                </p>
              </div>

              <div>
                <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Location</p>
                <p className="text-slate-700 mt-1 font-medium">{selectedComplaint.location}</p>
              </div>

              <div>
                <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Created At</p>
                <p className="text-slate-700 mt-1 font-medium">
                  {new Date(selectedComplaint.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;