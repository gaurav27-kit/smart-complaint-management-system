import React from "react";

const StatusBadge = ({ status }) => {
  let badgeStyles = "bg-gray-100 text-gray-800";
  const normalizedStatus = status ? status.toLowerCase() : "pending";

  switch (normalizedStatus) {
    case "resolved":
      badgeStyles = "bg-green-100 text-green-800 border-green-200";
      break;
    case "in progress":
      badgeStyles = "bg-blue-100 text-blue-800 border-blue-200";
      break;
    case "pending":
    default:
      badgeStyles = "bg-yellow-100 text-yellow-800 border-yellow-200";
      break;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyles}`}>
      {status || "Pending"}
    </span>
  );
};

export default StatusBadge;