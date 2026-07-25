import React, { useState } from "react";
import TimelineItem from "./TimelineItem";
import { Activity } from "lucide-react";

/**
 * Timeline — Renders a complete activity history timeline.
 *
 * Props:
 *   events    - Array of timeline event objects (newest first recommended)
 *   isLoading - Whether the timeline is currently fetching
 *   maxItems  - Optional max items to show initially (adds a "View More" button)
 */
const Timeline = ({ events = [], isLoading = false, maxItems = null }) => {
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6 py-4 animate-pulse" role="status" aria-label="Loading timeline">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0" />
            <div className="flex-1 space-y-2 py-1.5">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500 font-medium">No activity history yet.</p>
        <p className="text-xs text-gray-400 mt-1">Actions performed on this complaint will appear here.</p>
      </div>
    );
  }

  const visibleEvents =
    maxItems && !expanded ? events.slice(0, maxItems) : events;
  const hasMore = maxItems && events.length > maxItems;

  return (
    <div className="w-full">
      <div role="list" aria-label="Activity timeline">
        {visibleEvents.map((event, index) => (
          <TimelineItem
            key={event._id || index}
            event={event}
            isLast={index === visibleEvents.length - 1 && !hasMore}
          />
        ))}
      </div>

      {hasMore && (
        <div className="mt-2 text-center relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="relative bg-white px-4 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border border-gray-200 rounded-full transition-colors z-10"
          >
            {expanded ? "Show Less" : `View All Activity (${events.length})`}
          </button>
        </div>
      )}
    </div>
  );
};

export default Timeline;
