import React from "react";

/**
 * Formats a relative time string (e.g. "2 hours ago", "Yesterday", "3 days ago").
 */
const getRelativeTime = (dateStr) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? "s" : ""} ago`;
  if (diffHrs < 24) return `${diffHrs} hour${diffHrs !== 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) !== 1 ? "s" : ""} ago`;

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Formats an absolute time string (e.g. "24 Jul 2026, 10:35 AM").
 */
const getAbsoluteTime = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

/**
 * TimelineDate — Displays both relative and absolute timestamps.
 *
 * Props:
 *   date - ISO date string or Date object
 */
const TimelineDate = ({ date }) => {
  if (!date) return null;

  return (
    <div className="flex flex-col items-end sm:flex-row sm:items-center sm:gap-2 text-right sm:text-left">
      <span className="text-xs font-medium text-gray-500">
        {getRelativeTime(date)}
      </span>
      <span className="hidden sm:inline text-gray-300">·</span>
      <time
        dateTime={new Date(date).toISOString()}
        className="text-[11px] text-gray-400"
        aria-label={`Timestamp: ${getAbsoluteTime(date)}`}
      >
        {getAbsoluteTime(date)}
      </time>
    </div>
  );
};

export default TimelineDate;
