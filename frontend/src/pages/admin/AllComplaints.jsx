import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, Eye, Edit3, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import ImageGrid from "../../components/common/ImageGrid";
import Timeline from "../../components/common/Timeline";
import {
  getAllComplaints,
  getComplaintById,
  updateComplaintStatus,
  deleteComplaint,
} from "../../services/adminService";

const AllComplaints = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Derive parameters from query string (Single source of truth)
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const priority = searchParams.get("priority") || "";
  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "newest";
  const page = parseInt(searchParams.get("page"), 10) || 1;

  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // View Modal state
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);

  // Update Status Modal state
  const [updateOpen, setUpdateOpen] = useState(false);
  const [complaintToUpdate, setComplaintToUpdate] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);

  // Delete Modal state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [complaintToDelete, setComplaintToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await getAllComplaints({
        search,
        status,
        priority,
        category,
        sort,
        page,
        limit,
      });

      setComplaints(res.complaints || []);
      setTotalPages(res.totalPages || 1);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to load complaints."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [search, status, priority, category, sort, page]);

  // Sync back search parameter updates to URL query string
  const updateSearchParam = (key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      next.set("page", "1"); // Reset pagination on filter change
      return next;
    });
  };

  const handlePageChange = (newPage) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", newPage.toString());
      return next;
    });
  };

  const handleViewComplaint = async (id) => {
    try {
      setViewLoading(true);
      const data = await getComplaintById(id);
      setSelectedComplaint(data.complaint || data);
      setViewOpen(true);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to load complaint details."
      );
    } finally {
      setViewLoading(false);
    }
  };

  const handleOpenUpdateModal = (complaint) => {
    setComplaintToUpdate(complaint);
    setNewStatus(complaint.status);
    setUpdateOpen(true);
  };

  const handleUpdateStatusSubmit = async (e) => {
    e.preventDefault();
    if (!complaintToUpdate || !newStatus) return;

    try {
      setUpdateLoading(true);
      await updateComplaintStatus(complaintToUpdate._id, newStatus);
      toast.success("Complaint status updated successfully!");
      setUpdateOpen(false);
      setComplaintToUpdate(null);
      fetchComplaints();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update status."
      );
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleOpenDeleteModal = (complaint) => {
    setComplaintToDelete(complaint);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!complaintToDelete) return;

    try {
      setDeleteLoading(true);
      await deleteComplaint(complaintToDelete._id);
      toast.success("Complaint deleted successfully!");
      setDeleteOpen(false);
      setComplaintToDelete(null);
      fetchComplaints();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to delete complaint."
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading && complaints.length === 0) {
    return (
      <div className="h-[70vh] flex justify-center items-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Manage Complaints</h1>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => updateSearchParam("search", e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <select
          value={status}
          onChange={(e) => updateSearchParam("status", e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
        </select>

        <select
          value={priority}
          onChange={(e) => updateSearchParam("priority", e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">All Priority</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <select
          value={category}
          onChange={(e) => updateSearchParam("category", e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">All Categories</option>
          <option value="Road">Road</option>
          <option value="Water">Water</option>
          <option value="Electricity">Electricity</option>
          <option value="Garbage">Garbage</option>
          <option value="Street Light">Street Light</option>
          <option value="Drainage">Drainage</option>
          <option value="Other">Other</option>
        </select>

        <select
          value={sort}
          onChange={(e) => updateSearchParam("sort", e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="priority">Priority</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
        <table className="min-w-full text-left text-sm text-gray-600">
          <thead className="bg-slate-100 text-xs font-semibold text-gray-700 uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3">Title</th>
              <th className="px-5 py-3">User</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Priority</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Location</th>
              <th className="px-5 py-3">Created</th>
              <th className="px-5 py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {complaints.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-10 text-gray-500">
                  No complaints found.
                </td>
              </tr>
            ) : (
              complaints.map((complaint) => (
                <tr key={complaint._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 font-medium text-gray-900">{complaint.title}</td>

                  <td className="px-5 py-4">
                    <div className="font-medium text-gray-800">{complaint.createdBy?.fullName || "N/A"}</div>
                    <div className="text-xs text-gray-500">
                      {complaint.createdBy?.email || ""}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-md">
                      {complaint.category}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        complaint.priority === "High"
                          ? "bg-red-100 text-red-700"
                          : complaint.priority === "Medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                      }`}
                    >
                      {complaint.priority || "Medium"}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        complaint.status === "Resolved"
                          ? "bg-green-100 text-green-700"
                          : complaint.status === "In Progress"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {complaint.status || "Pending"}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-gray-600 truncate max-w-[150px]">
                    {complaint.location}
                  </td>

                  <td className="px-5 py-4 text-gray-500">
                    {new Date(complaint.createdAt).toLocaleDateString()}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleViewComplaint(complaint._id)}
                        disabled={viewLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>

                      <button
                        onClick={() => handleOpenUpdateModal(complaint)}
                        className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="Update Status"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Update</span>
                      </button>

                      <button
                        onClick={() => handleOpenDeleteModal(complaint)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="Delete Complaint"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-6">
        <button
          disabled={page === 1}
          onClick={() => handlePageChange(page - 1)}
          className="px-4 py-2 rounded bg-gray-200 text-gray-700 text-sm font-semibold disabled:opacity-50 hover:bg-gray-300 transition-colors"
        >
          Previous
        </button>

        <span className="font-medium text-sm text-gray-700">
          Page {page} of {totalPages}
        </span>

        <button
          disabled={page === totalPages || totalPages === 0}
          onClick={() => handlePageChange(page + 1)}
          className="px-4 py-2 rounded bg-blue-600 text-white text-sm font-semibold disabled:opacity-50 hover:bg-blue-700 transition-colors"
        >
          Next
        </button>
      </div>

      {/* View Modal */}
      {viewOpen && selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-2xl font-bold text-gray-900">Complaint Details</h2>
              <button
                onClick={() => setViewOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 font-medium">Title</p>
                <p className="font-semibold text-gray-900 mt-1">{selectedComplaint.title}</p>
              </div>

              <div>
                <p className="text-gray-500 font-medium">Category</p>
                <p className="font-semibold text-gray-900 mt-1">{selectedComplaint.category}</p>
              </div>

              <div>
                <p className="text-gray-500 font-medium">Priority</p>
                <p className="font-semibold text-gray-900 mt-1">{selectedComplaint.priority}</p>
              </div>

              <div>
                <p className="text-gray-500 font-medium">Status</p>
                <p className="font-semibold text-gray-900 mt-1">{selectedComplaint.status}</p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-gray-500 font-medium">Description</p>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg mt-1 whitespace-pre-wrap">
                  {selectedComplaint.description}
                </p>
              </div>

              <div>
                <p className="text-gray-500 font-medium">Location</p>
                <p className="text-gray-800 mt-1">{selectedComplaint.location}</p>
              </div>

              <div>
                <p className="text-gray-500 font-medium">Created At</p>
                <p className="text-gray-800 mt-1">
                  {new Date(selectedComplaint.createdAt).toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-gray-500 font-medium">User</p>
                <p className="text-gray-800 mt-1">{selectedComplaint.createdBy?.fullName || "N/A"}</p>
              </div>

              <div>
                <p className="text-gray-500 font-medium">Email</p>
                <p className="text-gray-800 mt-1">{selectedComplaint.createdBy?.email || "N/A"}</p>
              </div>
            </div>

            {/* Complaint Images */}
            {selectedComplaint.images && selectedComplaint.images.length > 0 && (
              <div className="mt-5 pt-4 border-t border-gray-100">
                <p className="text-gray-500 font-medium text-sm mb-3">Attached Images ({selectedComplaint.images.length})</p>
                <ImageGrid images={selectedComplaint.images} />
              </div>
            )}

            {/* Timeline Section */}
            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="text-gray-500 font-medium text-sm mb-4">Activity History</p>
              <Timeline 
                events={
                  selectedComplaint.timeline 
                    ? [...selectedComplaint.timeline].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) 
                    : []
                } 
              />
            </div>

            <div className="mt-6 flex justify-end border-t pt-4">
              <button
                onClick={() => setViewOpen(false)}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {updateOpen && complaintToUpdate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-xl font-bold text-gray-900">Update Status</h3>
              <button
                onClick={() => setUpdateOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatusSubmit} className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Complaint: <span className="font-semibold text-gray-900">{complaintToUpdate.title}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setUpdateOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateLoading}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {updateLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Status</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteOpen && complaintToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-xl font-bold text-red-600">Delete Complaint</h3>
              <button
                onClick={() => setDeleteOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-700">
                Are you sure you want to delete the complaint:{" "}
                <span className="font-semibold text-gray-900">"{complaintToDelete.title}"</span>?
              </p>
              <p className="text-xs text-red-500 font-medium">
                This action cannot be undone.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t mt-4">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleteLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllComplaints;
