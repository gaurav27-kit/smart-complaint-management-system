import React from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiInbox } from "react-icons/fi";
import StatusBadge from "../badges/StatusBadge";

const RecentComplaints = ({
  complaints = [],
  viewAllPath = "/dashboard/my-complaints",
}) => {
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-700";
      case "Medium":
        return "bg-yellow-100 text-yellow-700";
      case "Low":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <h2 className="text-lg font-bold text-gray-800">
          Recent Complaints
        </h2>

        <Link
          to={viewAllPath}
          className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
        >
          View All
          <FiArrowRight />
        </Link>
      </div>

      {/* Body */}
      {complaints.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-gray-500">
          <FiInbox className="text-5xl mb-3 text-gray-300" />

          <p className="font-medium">
            No complaints found
          </p>

          <p className="text-sm text-gray-400 mt-1">
            Your recent complaints will appear here.
          </p>
        </div>
      ) : (
        <div className="divide-y">
          {complaints.slice(0, 5).map((complaint) => (
            <div
              key={complaint._id}
              className="flex items-center justify-between p-5 hover:bg-gray-50 transition-all duration-200"
            >
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">
                  {complaint.title}
                </h3>

                <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-gray-500">
                  <span>{complaint.category}</span>

                  <span>•</span>

                  <span>{formatDate(complaint.createdAt)}</span>

                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                      complaint.priority
                    )}`}
                  >
                    {complaint.priority}
                  </span>
                </div>
              </div>

              <StatusBadge status={complaint.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentComplaints;