import React, { useState, useEffect, useRef } from "react";
import { FiX, FiFileText, FiPlus, FiAlertCircle, FiMessageSquare } from "react-icons/fi";

/**
 * ResolutionNotesModal — Generic reusable modal for viewing and adding internal resolution notes.
 *
 * Props:
 *   isOpen    - Boolean to control modal visibility
 *   onClose   - Callback when closing modal
 *   onSave    - Callback (noteText) when saving a new note
 *   notes     - Array of existing note objects [{ id, author, date, text }]
 *   complaint - Object containing complaint context { id, _id, title }
 */
const ResolutionNotesModal = ({
  isOpen = false,
  onClose,
  onSave,
  notes = [],
  complaint = null,
}) => {
  const [noteText, setNoteText] = useState("");
  const [error, setError] = useState("");
  const maxNoteLength = 500;

  const complaintId = complaint?.id || complaint?._id || "CMP-1089";
  const complaintTitle = complaint?.title || "Complaint";

  useEffect(() => {
    if (isOpen) {
      setNoteText("");
      setError("");
    }
  }, [isOpen]);

  // Accessibility: Close modal on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && onClose) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleTextChange = (e) => {
    const val = e.target.value;
    if (val.length <= maxNoteLength) {
      setNoteText(val);
      if (val.trim().length > 0) {
        setError("");
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!noteText.trim()) {
      setError("Resolution note cannot be empty.");
      return;
    }

    if (onSave) {
      onSave(noteText.trim());
    }

    setNoteText("");
    if (onClose) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Click-outside backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      ></div>

      {/* Modal Container */}
      <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl transition-all transform scale-100 border border-slate-100 z-10 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <FiMessageSquare className="w-5 h-5 text-indigo-600" />
              <h3 className="text-xl font-bold text-gray-900">
                Internal Resolution Notes
              </h3>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Add operational & field inspection notes for <strong className="text-gray-700">{complaintId}</strong>
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Existing Notes Preview List */}
        {notes.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Previous Notes ({notes.length})
            </h4>
            <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
              {notes.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px] text-gray-500 font-semibold">
                    <span className="text-gray-800">{item.author || "Staff Member"}</span>
                    <span>{item.date}</span>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form to Add New Note */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                New Internal Note <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-gray-400 font-medium">
                {noteText.length} / {maxNoteLength}
              </span>
            </div>

            <textarea
              rows={4}
              value={noteText}
              onChange={handleTextChange}
              placeholder="Type internal inspection or action notes..."
              className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-gray-800 transition-all resize-none"
            ></textarea>

            {error && (
              <p className="text-xs text-red-600 font-medium flex items-center gap-1.5 mt-1.5">
                <FiAlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </p>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={!noteText.trim()}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none"
            >
              Save Note
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResolutionNotesModal;
