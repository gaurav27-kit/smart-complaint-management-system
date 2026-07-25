import React from "react";
import { Sparkles, Check, X, Clock, AlertTriangle, Building2, Tag } from "lucide-react";
import AIConfidenceBadge from "./AIConfidenceBadge";

const AIAnalysisCard = ({ analysis, onApply, onDiscard }) => {
  if (!analysis) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-xl p-5 shadow-sm relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">AI Suggestions</h3>
            <p className="text-xs text-gray-500">Based on your description</p>
          </div>
        </div>
        <AIConfidenceBadge score={analysis.confidence} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5 relative z-10">
        {/* Category */}
        <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg">
          <Tag className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Category</p>
            <p className="text-sm font-semibold text-gray-800">{analysis.category}</p>
          </div>
        </div>

        {/* Priority */}
        <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Priority</p>
            <p className="text-sm font-semibold text-gray-800">{analysis.priority}</p>
          </div>
        </div>

        {/* Department */}
        <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg">
          <Building2 className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Department</p>
            <p className="text-sm font-semibold text-gray-800">{analysis.department}</p>
          </div>
        </div>

        {/* Resolution Time */}
        <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg">
          <Clock className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Est. Resolution</p>
            <p className="text-sm font-semibold text-gray-800">{analysis.estimatedResolution}</p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-5 p-3 bg-white border border-gray-100 rounded-lg relative z-10">
        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1">Generated Summary</p>
        <p className="text-sm text-gray-700 italic">"{analysis.summary}"</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 relative z-10">
        <button
          type="button"
          onClick={onApply}
          className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-colors"
        >
          <Check className="w-4 h-4" />
          Apply Suggestions
        </button>
        <button
          type="button"
          onClick={onDiscard}
          className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 py-2 px-4 rounded-lg text-sm font-semibold transition-colors"
        >
          <X className="w-4 h-4" />
          Discard
        </button>
      </div>
    </div>
  );
};

export default AIAnalysisCard;
