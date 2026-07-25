import React, { memo } from "react";
import TimelineIcon from "./TimelineIcon";
import TimelineDate from "./TimelineDate";

/**
 * TimelineItem — A single entry in the timeline.
 * Connected by a vertical line to adjacent items.
 *
 * Props:
 *   event  - Timeline event object { type, title, description, performedByRole, createdAt }
 *   isLast - Whether this is the final item (hides the connecting line)
 */
const TimelineItem = memo(({ event, isLast = false }) => {
  const roleBadge =
    event.performedByRole === "admin" ? (
      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 rounded-full">
        Admin
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 rounded-full">
        User
      </span>
    );

  return (
    <div className="relative flex gap-4" role="listitem" aria-label={event.title}>
      {/* Left column: icon + connecting line */}
      <div className="flex flex-col items-center">
        <TimelineIcon type={event.type} />
        {!isLast && (
          <div className="w-0.5 flex-1 bg-gray-200 mt-2" aria-hidden="true" />
        )}
      </div>

      {/* Right column: content */}
      <div className={`flex-1 pb-8 ${isLast ? "pb-2" : ""}`}>
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-gray-900">
              {event.title}
            </h4>
            {roleBadge}
          </div>
          <TimelineDate date={event.createdAt} />
        </div>

        {/* Description */}
        {event.description && (
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">
            {event.description}
          </p>
        )}
      </div>
    </div>
  );
});

TimelineItem.displayName = "TimelineItem";

export default TimelineItem;
