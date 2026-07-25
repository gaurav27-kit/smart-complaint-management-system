import React from "react";
import StatusBadge from "../badges/StatusBadge";
import ActionButtons from "../buttons/ActionButtons";

const ComplaintTable = ({ complaints = [], onEdit, onDelete }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getPriorityStyle = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "text-red-700 bg-red-50 border-red-100";
      case "medium":
        return "text-yellow-700 bg-yellow-50 border-yellow-100";
      case "low":
      default:
        return "text-green-700 bg-green-50 border-green-100";
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse text-left text-sm text-gray-500">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
            <tr>
              <th scope="col" className="px-6 py-4">Title</th>
              <th scope="col" className="px-6 py-4">Category</th>
              <th scope="col" className="px-6 py-4">Location</th>
              <th scope="col" className="px-6 py-4">Priority</th>
              <th scope="col" className="px-6 py-4">Status</th>
              <th scope="col" className="px-6 py-4">Created Date</th>
              <th scope="col" className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-150 border-t border-gray-100 bg-white">
            {complaints.map((complaint) => (
              <tr key={complaint._id} className="hover:bg-gray-50/50 transition-colors duration-150">
                {/* Title */}
                <td className="px-6 py-4 font-semibold text-gray-900 max-w-[200px] truncate">
                  {complaint.title}
                </td>
                {/* Category */}
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
                    {complaint.category}
                  </span>
                </td>
                {/* Location */}
                <td className="px-6 py-4 text-gray-600 truncate max-w-[150px]">
                  {complaint.location}
                </td>
                {/* Priority */}
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${getPriorityStyle(complaint.priority)}`}>
                    {complaint.priority || "Medium"}
                  </span>
                </td>
                {/* Status */}
                <td className="px-6 py-4">
                  <StatusBadge status={complaint.status} />
                </td>
                {/* Created Date */}
                <td className="px-6 py-4">
                  {formatDate(complaint.createdAt)}
                </td>
                {/* Actions */}
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end">
                    <ActionButtons
                      onEdit={() => onEdit(complaint._id)}
                      onDelete={() => onDelete(complaint._id)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComplaintTable;