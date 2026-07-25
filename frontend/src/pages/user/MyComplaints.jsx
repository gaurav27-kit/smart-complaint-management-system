import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FiPlus, FiSearch } from "react-icons/fi";
import { getComplaints, deleteComplaint } from "../../services/complaintService";
import ComplaintTable from "../../components/tables/ComplaintTable";
import DeleteConfirmation from "../../components/modals/DeleteConfirmation";
import Loading from "../../components/ui/Loading";
import EmptyState from "../../components/ui/EmptyState";

const MyComplaints = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [complaintToDelete, setComplaintToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchComplaintsList();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredComplaints(complaints);
    } else {
      const filtered = complaints.filter((c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredComplaints(filtered);
    }
  }, [searchQuery, complaints]);

  const fetchComplaintsList = async () => {
    try {
      setLoading(true);
      const data = await getComplaints();
      setComplaints(data.complaints || []);
      setFilteredComplaints(data.complaints || []);
    } catch (error) {
      console.error("Failed to load complaints:", error);
      toast.error(
        error.response?.data?.message || "Failed to load complaints. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id) => {
    navigate(`/dashboard/edit-complaint/${id}`);
  };

  const handleDeleteClick = (id) => {
    setComplaintToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!complaintToDelete) return;
    try {
      setDeleting(true);
      await deleteComplaint(complaintToDelete);
      toast.success("Complaint deleted successfully!");
      setDeleteModalOpen(false);
      setComplaintToDelete(null);
      // Refresh list
      fetchComplaintsList();
    } catch (error) {
      console.error("Failed to delete complaint:", error);
      toast.error(
        error.response?.data?.message || "Failed to delete complaint. Please try again."
      );
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12">
        <Loading message="Loading your complaints..." />
      </div>
    );
  }

  return (
    <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Complaints</h1>
          <p className="text-gray-500 mt-1">Track, edit, or manage the status of your submitted complaints.</p>
        </div>
        <button
          onClick={() => navigate("/dashboard/create-complaint")}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg self-start sm:self-auto"
        >
          <FiPlus className="w-5 h-5" />
          <span>New Complaint</span>
        </button>
      </div>

      {complaints.length === 0 ? (
        <EmptyState
          title="No Complaints Submitted"
          message="You haven't registered any complaints in our system yet. Click the button below to lodge your first complaint."
          actionLabel="File a Complaint"
          onAction={() => navigate("/dashboard/create-complaint")}
        />
      ) : (
        <div className="space-y-4">
          {/* Search Box */}
          <div className="relative max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <FiSearch className="w-5 h-5" />
            </span>
            <input
              type="text"
              placeholder="Search complaints by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-gray-900 placeholder-gray-400 border-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {filteredComplaints.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-150 p-12 text-center text-gray-500">
              No complaints match your search query: <span className="font-semibold text-gray-800">"{searchQuery}"</span>
            </div>
          ) : (
            <ComplaintTable
              complaints={filteredComplaints}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        isOpen={deleteModalOpen}
        onClose={() => {
          if (!deleting) {
            setDeleteModalOpen(false);
            setComplaintToDelete(null);
          }
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Complaint"
        message="Are you sure you want to delete this complaint? This will permanently erase it from the system."
      />
    </div>
  );
};

export default MyComplaints;
