import React from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";

const ActionButtons = ({ onEdit, onDelete }) => {
  return (
    <div className="flex space-x-2">
      <button
        onClick={onEdit}
        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm border border-indigo-100"
      >
        <FiEdit2 className="w-3.5 h-3.5" />
        <span>Edit</span>
      </button>
      <button
        onClick={onDelete}
        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm border border-red-100"
      >
        <FiTrash2 className="w-3.5 h-3.5" />
        <span>Delete</span>
      </button>
    </div>
  );
};

export default ActionButtons;
