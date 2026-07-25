import React from "react";
import { Sparkles } from "lucide-react";

/**
 * AIConfidenceBadge - Displays the AI's confidence score with color-coding.
 *
 * @param {number} score - Confidence score from 0 to 100
 */
const AIConfidenceBadge = ({ score }) => {
  if (score === undefined || score === null) return null;

  // Determine color based on score
  let colorClass = "bg-gray-100 text-gray-700 border-gray-200";
  let iconColor = "text-gray-500";
  let label = "Low Confidence";

  if (score >= 85) {
    colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
    iconColor = "text-emerald-500";
    label = "High Confidence";
  } else if (score >= 60) {
    colorClass = "bg-amber-50 text-amber-700 border-amber-200";
    iconColor = "text-amber-500";
    label = "Medium Confidence";
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colorClass}`}
      title={`${label} (${score}%)`}
    >
      <Sparkles className={`w-3.5 h-3.5 ${iconColor}`} />
      <span>{score}% Confidence</span>
    </div>
  );
};

export default AIConfidenceBadge;
