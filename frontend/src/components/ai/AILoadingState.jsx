import React from "react";
import { Sparkles } from "lucide-react";

const AILoadingState = () => {
  return (
    <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-6 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <Sparkles className="w-5 h-5 text-indigo-500 animate-spin-slow" />
        <div className="h-4 bg-indigo-200 rounded w-1/3"></div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="h-3 bg-indigo-100 rounded w-1/4"></div>
          <div className="h-10 bg-white border border-indigo-50 rounded-xl"></div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-indigo-100 rounded w-1/4"></div>
          <div className="h-10 bg-white border border-indigo-50 rounded-xl"></div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-indigo-100 rounded w-1/4"></div>
          <div className="h-10 bg-white border border-indigo-50 rounded-xl"></div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-indigo-100 rounded w-1/4"></div>
          <div className="h-10 bg-white border border-indigo-50 rounded-xl"></div>
        </div>
      </div>
      
      <div className="mt-4 space-y-2">
        <div className="h-3 bg-indigo-100 rounded w-1/6"></div>
        <div className="h-8 bg-white border border-indigo-50 rounded-xl w-full"></div>
      </div>
    </div>
  );
};

export default AILoadingState;
