import React from "react";
import { FiAlertTriangle, FiX } from "react-icons/fi";

const DeleteConfirmation = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl transition-all transform scale-100 border border-slate-100 z-10">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-50 transition-colors"
        >
          <FiX className="w-5 h-5" />
        </button>

        {/* Title and Icon */}
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 p-3 bg-red-50 text-red-600 rounded-full">
            <FiAlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mt-1">
              {title || "Confirm Deletion"}
            </h3>
            <p className="text-gray-500 text-sm mt-2 leading-relaxed">
              {message || "Are you sure you want to delete this complaint? This action cannot be undone and the data will be permanently removed."}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-semibold transition-colors duration-200"
          >
            Cancel, Keep it
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmation;
