import React, { useState, useMemo } from "react";
import { Eye, X, Search, Filter } from "lucide-react";
import StatusBadge from "../../components/badges/StatusBadge";
import Loading from "@/components/ui/Loading";
import EmptyState from "@/components/ui/EmptyState";

const AssignedComplaints = () => {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // View Details Modal State
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock Data: Only complaints assigned to logged-in department member
  const mockAssignedComplaints = [
    {
      id: "CMP-1089",
      title: "Street Light Fault in Block B",
      category: "Infrastructure",
      priority: "High",
      status: "In Progress",
      assignedDate: "2026-07-26",
      location: "Main Avenue, Block B",
      description: "Street lights on pole #4 and #5 are completely flicking and non-functional at night.",
    },
    {
      id: "CMP-1075",
      title: "Water Supply Disruption near Sector 4",
      category: "Water Supply",
      priority: "Critical",
      status: "Pending",
      assignedDate: "2026-07-26",
      location: "Sector 4, Residential Complex",
      description: "No water supply since morning 6 AM due to pipeline breakage near valve 3.",
    },
    {
      id: "CMP-1062",
      title: "Garbage Collection Delay in Zone 2",
      category: "Sanitation",
      priority: "Medium",
      status: "Resolved",
      assignedDate: "2026-07-25",
      location: "Zone 2 Commercial Area",
      description: "Waste collection bin overflowing near main market center.",
    },
    {
      id: "CMP-1040",
      title: "Park Bench Repair Request",
      category: "Public Works",
      priority: "Low",
      status: "Closed",
      assignedDate: "2026-07-23",
      location: "Central Community Park",
      description: "Wooden slats on two benches near playground broken.",
    },
    {
      id: "CMP-1035",
      title: "Pothole Repair on Ring Road",
      category: "Road Infrastructure",
      priority: "High",
      status: "In Progress",
      assignedDate: "2026-07-22",
      location: "Ring Road North Junction",
      description: "Large pothole causing traffic slowdown during peak hours.",
    },
    {
      id: "CMP-1022",
      title: "Drainage Overflow during Rainfall",
      category: "Drainage",
      priority: "Critical",
      status: "Pending",
      assignedDate: "2026-07-20",
      location: "East Gate Sub-way",
      description: "Drainage inlet clogged with debris causing localized waterlogging.",
    },
  ];

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
    return mockAssignedComplaints.filter((complaint) => {
      const matchesSearch =
        complaint.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complaint.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complaint.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = selectedStatus
        ? complaint.status.toLowerCase() === selectedStatus.toLowerCase()
        : true;

      const matchesPriority = selectedPriority
        ? complaint.priority.toLowerCase() === selectedPriority.toLowerCase()
        : true;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [searchQuery, selectedStatus, selectedPriority]);

  // Pagination logic
  const totalPages = Math.ceil(filteredComplaints.length / itemsPerPage) || 1;
  const paginatedComplaints = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredComplaints.slice(start, start + itemsPerPage);
  }, [filteredComplaints, currentPage, itemsPerPage]);

  const handleOpenDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setIsModalOpen(true);
  };

  const handleCloseDetails = () => {
    setSelectedComplaint(null);
    setIsModalOpen(false);
  };

  if (loading) {
    return (
      <div className="py-12">
        <Loading message="Loading assigned complaints..." />
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
            <option value="Critical">Critical</option>
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
                    key={complaint.id}
                    className="hover:bg-gray-50/80 transition-colors"
                  >
                    {/* Complaint ID */}
                    <td className="px-5 py-4 font-bold text-gray-900">
                      {complaint.id}
                    </td>

                    {/* Title */}
                    <td className="px-5 py-4 font-medium text-gray-900 max-w-[220px] truncate">
                      {complaint.title}
                    </td>

                    {/* Category */}
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-md">
                        {complaint.category}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-block px-3 py-0.5 rounded-full text-xs font-semibold border ${getPriorityBadgeClass(
                          complaint.priority
                        )}`}
                      >
                        {complaint.priority}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <StatusBadge status={complaint.status} />
                    </td>

                    {/* Assigned Date */}
                    <td className="px-5 py-4 text-gray-500 text-xs">
                      {complaint.assignedDate}
                    </td>

                    {/* Action Column: View Details Button only */}
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => handleOpenDetails(complaint)}
                        className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar Placeholder */}
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
                  {selectedComplaint.id}
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
                    {selectedComplaint.category}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase">Assigned Date</label>
                  <p className="font-medium text-gray-800 mt-0.5">
                    {selectedComplaint.assignedDate}
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
                      {selectedComplaint.priority}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase">Status</label>
                  <div className="mt-1">
                    <StatusBadge status={selectedComplaint.status} />
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
    </div>
  );
};

export default AssignedComplaints;
