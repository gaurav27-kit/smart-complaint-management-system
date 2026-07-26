import React, { useState, useEffect, useRef } from "react";
import { FiX, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import StatusBadge from "../badges/StatusBadge";

/**
 * StatusUpdateModal — Generic reusable modal for updating complaint status.
 * Reusable across Admin Portal, Department Dashboard, and Department Member Workspace.
 *
 * Props:
 *   isOpen         - Boolean to control visibility
 *   onClose        - Callback function when modal is closed
 *   onStatusUpdate - Callback function ({ complaintId, newStatus, comment })
 *   complaint      - Object containing { id, _id, title, status, priority }
 *   loading        - Optional boolean indicating async submission loading state
 */
const StatusUpdateModal = ({
  isOpen = false,
  onClose,
  onStatusUpdate,
  complaint = null,
  loading = false,
}) => {
  const currentStatus = complaint?.status || "Pending";
  const complaintId = complaint?.id || complaint?._id || "N/A";
  const complaintTitle = complaint?.title || "Untitled Complaint";
  const complaintPriority = complaint?.priority || "Medium";

  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const maxCommentLength = 500;
  const modalRef = useRef(null);

  // Sync selected status when complaint prop changes
  useEffect(() => {
    if (complaint) {
      setSelectedStatus(complaint.status || "Pending");
      setComment("");
      setError("");
    }
  }, [complaint, isOpen]);

  // Accessibility: Keyboard Navigation (ESC to close)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Validation logic
  const isResolving = selectedStatus.toLowerCase() === "resolved";
  const isStatusUnchanged = selectedStatus.toLowerCase() === currentStatus.toLowerCase();
  const isCommentEmpty = comment.trim().length === 0;

  // Disable button conditions
  const isSubmitDisabled =
    loading ||
    !selectedStatus ||
    isStatusUnchanged ||
    (isResolving && isCommentEmpty);

  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    setSelectedStatus(newStatus);
    if (newStatus.toLowerCase() === "resolved" && isCommentEmpty) {
      setError("Resolution comment is required when resolving a complaint.");
    } else {
      setError("");
    }
  };

  const handleCommentChange = (e) => {
    const val = e.target.value;
    if (val.length <= maxCommentLength) {
      setComment(val);
      if (selectedStatus.toLowerCase() === "resolved" && val.trim().length > 0) {
        setError("");
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isResolving && isCommentEmpty) {
      setError("Resolution comment is required when resolving a complaint.");
      return;
    }

    if (onStatusUpdate) {
      onStatusUpdate({
        complaintId: complaint?._id || complaint?.id,
        newStatus: selectedStatus,
        comment: comment.trim(),
      });
    }
  };

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

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-headline"
    >
      {/* Click-outside backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      ></div>

      {/* Modal Container */}
      <div
        ref={modalRef}
        className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl transition-all transform scale-100 border border-slate-100 z-10 space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h3 id="modal-headline" className="text-xl font-bold text-gray-900">
            Update Complaint Status
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Complaint Summary Card */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-100">
              {complaintId}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getPriorityBadgeClass(
                complaintPriority
              )}`}
            >
              {complaintPriority} Priority
            </span>
          </div>

          <h4 className="text-sm font-bold text-gray-900 truncate">
            {complaintTitle}
          </h4>

          <div className="flex items-center gap-2 text-xs text-gray-500 pt-1">
            <span>Current Status:</span>
            <StatusBadge status={currentStatus} />
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Status Selection Dropdown */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Allowed Statuses <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedStatus}
              onChange={handleStatusChange}
              className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-800 font-medium transition-all"
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Resolution Comment Textarea */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Resolution Comment{" "}
                {isResolving && <span className="text-red-500">*</span>}
              </label>
              <span className="text-xs text-gray-400 font-medium">
                {comment.length} / {maxCommentLength}
              </span>
            </div>

            <textarea
              rows={4}
              value={comment}
              onChange={handleCommentChange}
              placeholder={
                isResolving
                  ? "Describe the resolution actions taken (Required)..."
                  : "Add optional status update notes..."
              }
              className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-800 transition-all resize-none"
            ></textarea>

            {/* Validation Error Message */}
            {error && (
              <p className="text-xs text-red-600 font-medium flex items-center gap-1.5 mt-1.5">
                <FiAlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </p>
            )}
          </div>

          {/* Buttons Footer */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-semibold transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {loading ? "Updating..." : "Update Status"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StatusUpdateModal;
