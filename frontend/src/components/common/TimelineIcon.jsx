import React from "react";
import {
  CirclePlus,
  RefreshCw,
  ImageIcon,
  Trash2,
  MessageCircle,
  UserCheck,
  BadgeCheck,
  CheckCircle2,
  Edit3,
  AlertTriangle,
} from "lucide-react";

/**
 * Maps a timeline event type to a Lucide icon and color.
 */
const ICON_MAP = {
  COMPLAINT_CREATED: { Icon: CirclePlus, color: "text-emerald-600", bg: "bg-emerald-100" },
  COMPLAINT_UPDATED: { Icon: Edit3, color: "text-blue-600", bg: "bg-blue-100" },
  IMAGES_UPLOADED: { Icon: ImageIcon, color: "text-indigo-600", bg: "bg-indigo-100" },
  IMAGES_DELETED: { Icon: Trash2, color: "text-orange-600", bg: "bg-orange-100" },
  STATUS_CHANGED: { Icon: RefreshCw, color: "text-amber-600", bg: "bg-amber-100" },
  COMPLAINT_ASSIGNED: { Icon: UserCheck, color: "text-violet-600", bg: "bg-violet-100" },
  ADMIN_COMMENT: { Icon: MessageCircle, color: "text-cyan-600", bg: "bg-cyan-100" },
  PRIORITY_CHANGED: { Icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-100" },
  COMPLAINT_RESOLVED: { Icon: BadgeCheck, color: "text-green-600", bg: "bg-green-100" },
  COMPLAINT_CLOSED: { Icon: CheckCircle2, color: "text-gray-600", bg: "bg-gray-200" },
  COMPLAINT_REOPENED: { Icon: RefreshCw, color: "text-purple-600", bg: "bg-purple-100" },
};

const DEFAULT_ICON = { Icon: CirclePlus, color: "text-gray-500", bg: "bg-gray-100" };

/**
 * TimelineIcon — Renders the appropriate Lucide icon for a timeline event type.
 *
 * Props:
 *   type - The timeline event type string (e.g. "COMPLAINT_CREATED")
 *   size - Icon wrapper size class (default "w-9 h-9")
 */
const TimelineIcon = ({ type, size = "w-9 h-9" }) => {
  const { Icon, color, bg } = ICON_MAP[type] || DEFAULT_ICON;

  return (
    <div
      className={`${size} rounded-full ${bg} flex items-center justify-center flex-shrink-0 ring-4 ring-white`}
      aria-hidden="true"
    >
      <Icon className={`w-4 h-4 ${color}`} />
    </div>
  );
};

export default TimelineIcon;
