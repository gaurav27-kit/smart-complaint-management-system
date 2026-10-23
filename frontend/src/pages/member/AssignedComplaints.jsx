import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, X, Search, Filter, UserCheck, Loader2 } from "lucide-react";
import { FiAlertCircle, FiRefreshCw } from "react-icons/fi";
import toast from "react-hot-toast";
import StatusBadge from "../../components/badges/StatusBadge";
import Loading from "@/components/ui/Loading";
import EmptyState from "@/components/ui/EmptyState";
import {
  getRecentAssignedComplaints,
  getDepartmentOfficers,
  assignMemberComplaint,
  getMemberProfile,
} from "../../services/dashboardService";
import { getCategoryLabel } from "../../config/complaintCategories";
import { formatComplaintId } from "../../utils/formatters";

const AssignedComplaints = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [complaintsList, setComplaintsList] = useState([]);
  const [deptRole, setDeptRole] = useState("FIELD_OFFICER");
  const [officers, setOfficers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // View Details Modal State
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Field Officer Assignment Modal State (HEAD only)
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [complaintToAssign, setComplaintToAssign] = useState(null);
  const [selectedOfficerId, setSelectedOfficerId] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);

  // Fetch assigned complaints from backend endpoint: GET /api/member/complaints
  const fetchComplaints = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (selectedStatus) params.status = selectedStatus;
      if (selectedPriority) params.priority = selectedPriority;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const responseData = await getRecentAssignedComplaints(params);
      let currentDeptRole = responseData?.deptRole;

      if (!currentDeptRole) {
        try {
          const profile = await getMemberProfile();
          currentDeptRole = profile?.deptRole || profile?.member?.deptRole;
        } catch {
          currentDeptRole = "FIELD_OFFICER";
        }
      }

      if (currentDeptRole) {
        setDeptRole(currentDeptRole);
      }

      const list = Array.isArray(responseData)
        ? responseData
        : responseData?.complaints || responseData?.data || [];
      setComplaintsList(list);

      // If HEAD, fetch active field officers for assignment dropdown
      if (currentDeptRole === "HEAD") {
        try {
          const officersRes = await getDepartmentOfficers();
          setOfficers(officersRes.officers || []);
        } catch {
          // Ignore silently if field officer fetch fails
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load assigned complaints.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [selectedStatus, selectedPriority, searchQuery]);

  const handleOpenAssignModal = (complaint) => {
    setComplaintToAssign(complaint);
    setSelectedOfficerId(complaint.assignedMember?._id || complaint.assignedMember || "");
    setAssignModalOpen(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!complaintToAssign || !selectedOfficerId) return;

    try {
      setAssignLoading(true);
      await assignMemberComplaint(complaintToAssign._id || complaintToAssign.id, selectedOfficerId);
      toast.success("Complaint assigned to Field Officer successfully!");
      setAssignModalOpen(false);
      setComplaintToAssign(null);
      fetchComplaints();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign field officer.");
    } finally {
      setAssignLoading(false);
    }
  };

  // Helper for priority badge styling matching Admin Dashboard
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

  // Filter complaints based on search query, status, and priority
  const filteredComplaints = useMemo(() => {
    return complaintsList.filter((complaint) => {
      const title = complaint.title || "";
      const id = complaint.id || complaint._id || "";
      const category = complaint.category || "";
      const status = complaint.status || "";
      const priority = complaint.priority || "";

      const matchesSearch =
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = selectedStatus
        ? status.toLowerCase() === selectedStatus.toLowerCase()
        : true;

      const matchesPriority = selectedPriority
        ? priority.toLowerCase() === selectedPriority.toLowerCase()
        : true;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [complaintsList, searchQuery, selectedStatus, selectedPriority]);

  // Pagination logic
  const totalPages = Math.ceil(filteredComplaints.length / itemsPerPage) || 1;
  const paginatedComplaints = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredComplaints.slice(start, start + itemsPerPage);
  }, [filteredComplaints, currentPage, itemsPerPage]);

  const handleOpenDetails = (complaint) => {
    const complaintId = complaint.id || complaint._id;
    navigate(`/member/complaints/${complaintId}`);
  };

  const handleCloseDetails = () => {
    setSelectedComplaint(null);
    setIsModalOpen(false);
  };

  // 1. Loading State (reusing Loading component)
  if (loading) {
    return (
      <div className="py-12">
        <Loading message="Loading assigned complaints..." />
      </div>
    );
  }

  // 2. Error State with Retry Button
  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl space-y-4 max-w-xl mx-auto my-12 text-center">
        <FiAlertCircle className="w-10 h-10 text-red-600 mx-auto" />
        <h3 className="text-lg font-bold text-red-900">Failed to Load Complaints</h3>
        <p className="text-sm text-red-700">{error}</p>
        <button
          onClick={fetchComplaints}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
        >
          <FiRefreshCw className="w-3.5 h-3.5" />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Title Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Assigned Complaints
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Manage and track complaints assigned to you for investigation and resolution.
        </p>
      </div>

      {/* Filter and Search Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search ID, title or category..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        {/* Status Filter Dropdown */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        {/* Priority Filter Dropdown */}
        <div>
          <select
            value={selectedPriority}
            onChange={(e) => {
              setSelectedPriority(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
          >
            <option value="">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* Reset Filters Action */}
        {(searchQuery || selectedStatus || selectedPriority) && (
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedStatus("");
              setSelectedPriority("");
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 font-medium transition-colors"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Complaints Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* 3. Empty State (reusing EmptyState component) */}
        {filteredComplaints.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No assigned complaints found"
              message="No complaints match your current filter or search criteria."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-gray-600">
              <thead className="bg-slate-100 text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5">Complaint ID</th>
                  <th className="px-5 py-3.5">Title</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Priority</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Assigned Date</th>
                  <th className="px-5 py-3.5 text-center">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {paginatedComplaints.map((complaint) => (
                  <tr
                    key={complaint.id || complaint._id}
                    className="hover:bg-gray-50/80 transition-colors"
                  >
                    {/* Complaint ID */}
                    <td className="px-5 py-4 font-bold text-gray-900">
                      {formatComplaintId(complaint._id || complaint.id)}
                    </td>

                    {/* Title */}
                    <td className="px-5 py-4 font-medium text-gray-900 max-w-[220px] truncate">
                      {complaint.title}
                    </td>

                    {/* Category */}
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-md">
                        {getCategoryLabel(complaint.category)}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-block px-3 py-0.5 rounded-full text-xs font-semibold border ${getPriorityBadgeClass(
                          complaint.priority
                        )}`}
                      >
                        {complaint.priority || "Medium"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <StatusBadge status={complaint.status || "Pending"} />
                    </td>

                    {/* Assigned Date */}
                    <td className="px-5 py-4 text-gray-500 text-xs">
                      {complaint.createdAt
                        ? new Date(complaint.createdAt).toLocaleDateString()
                        : complaint.assignedDate || "Today"}
                    </td>

                    {/* Action Column */}
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenDetails(complaint)}
                          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>

                        {deptRole === "HEAD" && (
                          <button
                            onClick={() => handleOpenAssignModal(complaint)}
                            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm"
                            title="Assign / Reassign Field Officer"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>{complaint.assignedMember ? "Reassign" : "Assign Officer"}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {filteredComplaints.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50 flex items-center justify-between text-xs text-gray-600">
            <div>
              Showing <span className="font-semibold text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
              <span className="font-semibold text-gray-900">
                {Math.min(currentPage * itemsPerPage, filteredComplaints.length)}
              </span>{" "}
              of <span className="font-semibold text-gray-900">{filteredComplaints.length}</span> complaints
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-md border border-gray-300 bg-white font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              <span className="px-2 font-medium text-gray-700">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-md border border-gray-300 bg-white font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Details Modal Overlay */}
      {isModalOpen && selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-gray-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  Complaint Details
                </span>
                <h3 className="text-lg font-bold text-gray-900 mt-0.5">
                  {selectedComplaint.id || selectedComplaint._id}
                </h3>
              </div>
              <button
                onClick={handleCloseDetails}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-sm">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Title</label>
                <p className="font-semibold text-gray-900 text-base mt-0.5">
                  {selectedComplaint.title}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase">Category</label>
                  <p className="font-medium text-gray-800 mt-0.5">
                    {getCategoryLabel(selectedComplaint.category)}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase">Assigned Date</label>
                  <p className="font-medium text-gray-800 mt-0.5">
                    {selectedComplaint.createdAt
                      ? new Date(selectedComplaint.createdAt).toLocaleDateString()
                      : selectedComplaint.assignedDate}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase">Priority</label>
                  <div className="mt-1">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getPriorityBadgeClass(
                        selectedComplaint.priority
                      )}`}
                    >
                      {selectedComplaint.priority || "Medium"}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase">Status</label>
                  <div className="mt-1">
                    <StatusBadge status={selectedComplaint.status || "Pending"} />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Location</label>
                <p className="font-medium text-gray-800 mt-0.5">
                  {selectedComplaint.location}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Description</label>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs leading-relaxed mt-1">
                  {selectedComplaint.description}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-right">
              <button
                onClick={handleCloseDetails}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Field Officer Modal (HEAD Only) */}
      {assignModalOpen && complaintToAssign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">Assign Field Officer</h3>
              <button
                onClick={() => setAssignModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <p className="text-xs text-gray-500">Complaint</p>
                <p className="font-semibold text-gray-900 text-sm mt-0.5">{complaintToAssign.title}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Select Field Officer
                </label>
                <select
                  value={selectedOfficerId}
                  onChange={(e) => setSelectedOfficerId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">-- Select Field Officer --</option>
                  {officers.map((officer) => (
                    <option key={officer._id} value={officer._id}>
                      {officer.user?.fullName || "Officer"} ({officer.deptRole || "FIELD_OFFICER"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignLoading || !selectedOfficerId}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {assignLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Assignment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignedComplaints;
