import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  FiUploadCloud,
  FiFileText,
  FiImage,
  FiX,
  FiTrash2,
  FiCheckCircle,
  FiAlertCircle,
  FiFile,
  FiLoader,
} from "react-icons/fi";
import { toast } from "react-hot-toast";

const DEFAULT_MAX_FILES = 5;
const DEFAULT_MAX_SIZE_MB = 10;
const DEFAULT_MAX_SIZE_BYTES = DEFAULT_MAX_SIZE_MB * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const ACCEPT_STRING = "image/jpeg,image/png,image/webp,application/pdf";

/**
 * ResolutionProofUpload — Reusable drag-and-drop file upload modal/component for resolution proofs.
 * Reusable across Admin Portal, Department Dashboard, and Department Member Workspace.
 *
 * Props:
 *   isOpen          - Boolean controlling modal visibility (default true)
 *   onClose         - Callback function when closing the modal
 *   onUpload        - Callback function (files) when upload button is clicked
 *   onRemove        - Callback function (file) when a file is removed
 *   existingFiles   - Array of pre-existing uploaded files passed from parent at start
 *   initialFiles    - Alias array of initial File objects
 *   maxFiles        - Max number of files allowed (default 5)
 *   maxSizeMB       - Max file size limit in MB (default 10)
 *   disabled        - Disables interaction if true
 */
const ResolutionProofUpload = ({
  isOpen = true,
  onClose,
  onUpload,
  onRemove,
  existingFiles = [],
  initialFiles = [],
  maxFiles = DEFAULT_MAX_FILES,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  disabled = false,
}) => {
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  // Initialize selected files with existing/initial files
  useEffect(() => {
    const combined = [...existingFiles, ...initialFiles].map((item) => {
      if (item instanceof File) {
        return {
          file: item,
          id: `${item.name}_${item.size}`,
          name: item.name,
          size: item.size,
          type: item.type,
          previewUrl: item.type.startsWith("image/")
            ? URL.createObjectURL(item)
            : null,
          status: item.status || "Ready",
          isExisting: false,
        };
      }
      // Meta object from backend or existing props
      return {
        file: null,
        id: item.id || item.publicId || item.url || item.name,
        name: item.name || item.fileName || "Uploaded Proof Document",
        size: item.size || 0,
        type: item.type || (item.url?.endsWith(".pdf") ? "application/pdf" : "image/jpeg"),
        previewUrl: item.url || item.previewUrl || null,
        status: item.status || "Uploaded",
        isExisting: true,
      };
    });

    setSelectedFiles(combined);
  }, [existingFiles, initialFiles, isOpen]);

  // Accessibility: Close on ESC keypress
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

  // Helper to format file size
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "Unknown size";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Validate and add incoming files
  const processIncomingFiles = (incomingFileList) => {
    const newFiles = Array.from(incomingFileList);
    const validAdditions = [];
    const currentKeys = new Set(selectedFiles.map((f) => `${f.name}_${f.size}`));

    for (const file of newFiles) {
      const fileKey = `${file.name}_${file.size}`;

      // Duplicate check
      if (currentKeys.has(fileKey)) {
        toast.error(`"${file.name}" is already added.`);
        continue;
      }

      // File type check (.jpg, .jpeg, .png, .webp, .pdf)
      const isValidType =
        ALLOWED_MIME_TYPES.has(file.type.toLowerCase()) ||
        file.name.toLowerCase().endsWith(".pdf") ||
        file.name.toLowerCase().endsWith(".jpg") ||
        file.name.toLowerCase().endsWith(".jpeg") ||
        file.name.toLowerCase().endsWith(".png") ||
        file.name.toLowerCase().endsWith(".webp");

      if (!isValidType) {
        toast.error(
          `"${file.name}" is not supported. Only Images (.jpg, .png, .webp) and PDF (.pdf) are allowed.`
        );
        continue;
      }

      // File size check
      if (file.size > maxSizeBytes) {
        toast.error(`"${file.name}" exceeds the ${maxSizeMB} MB size limit.`);
        continue;
      }

      const previewUrl = file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : null;

      validAdditions.push({
        file,
        id: fileKey,
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl,
        status: "Ready",
        isExisting: false,
      });

      currentKeys.add(fileKey);
    }

    if (validAdditions.length === 0) return;

    if (selectedFiles.length + validAdditions.length > maxFiles) {
      toast.error(`Maximum allowed files limit is ${maxFiles}.`);
      const allowedCount = maxFiles - selectedFiles.length;
      if (allowedCount > 0) {
        setSelectedFiles((prev) => [...prev, ...validAdditions.slice(0, allowedCount)]);
      }
      return;
    }

    setSelectedFiles((prev) => [...prev, ...validAdditions]);
  };

  const handleRemove = (fileItem, index) => {
    const fileToRemove = selectedFiles[index];
    if (fileToRemove.previewUrl && !fileToRemove.isExisting) {
      URL.revokeObjectURL(fileToRemove.previewUrl);
    }

    const updated = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updated);

    if (onRemove) {
      onRemove(fileItem);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled || !e.dataTransfer.files) return;
    processIncomingFiles(e.dataTransfer.files);
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processIncomingFiles(e.target.files);
      e.target.value = ""; // Reset input
    }
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return;

    if (onUpload) {
      onUpload(selectedFiles.map((f) => f.file || f));
    }
    toast.success("Resolution proof uploaded successfully!");
    if (onClose) onClose();
  };

  const renderStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "uploading":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <FiLoader className="w-3 h-3 animate-spin" /> Uploading
          </span>
        );
      case "uploaded":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <FiCheckCircle className="w-3 h-3" /> Uploaded
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
            <FiAlertCircle className="w-3 h-3" /> Failed
          </span>
        );
      case "ready":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Ready
          </span>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Click-outside Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      ></div>

      {/* Modal Container */}
      <div className="relative bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl transition-all transform scale-100 border border-slate-100 z-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Resolution Proof Upload
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Allow department members to upload proof that the complaint has been resolved.
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

        {/* Drag & Drop Upload Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
            isDragOver
              ? "border-blue-500 bg-blue-50/50 scale-[1.01]"
              : "border-gray-300 hover:border-blue-400 bg-gray-50/50 hover:bg-gray-50"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPT_STRING}
            onChange={handleFileInputChange}
            disabled={disabled}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-full shadow-inner">
              <FiUploadCloud className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">
                Drag and drop files here, or{" "}
                <span className="text-blue-600 underline hover:text-blue-700">
                  browse files
                </span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Supported file types: <strong>Images (.jpg, .png, .webp)</strong> and <strong>PDF (.pdf)</strong>
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Max {maxFiles} files, up to {maxSizeMB} MB each.
              </p>
            </div>
          </div>
        </div>

        {/* File Preview List */}
        {selectedFiles.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Selected Files ({selectedFiles.length}/{maxFiles})
              </h4>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {selectedFiles.map((fileItem, idx) => {
                const isPdf =
                  fileItem.type?.toLowerCase().includes("pdf") ||
                  fileItem.name?.toLowerCase().endsWith(".pdf");

                return (
                  <div
                    key={fileItem.id || idx}
                    className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      {/* Image Thumbnail or PDF Icon */}
                      {fileItem.previewUrl && !isPdf ? (
                        <img
                          src={fileItem.previewUrl}
                          alt={fileItem.name}
                          className="w-10 h-10 object-cover rounded-lg border border-gray-200 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0 border border-red-200 font-bold">
                          <FiFileText className="w-5 h-5" />
                        </div>
                      )}

                      {/* Name & Size */}
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-gray-900 truncate max-w-[200px] sm:max-w-[260px]">
                          {fileItem.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-gray-400">
                            {formatFileSize(fileItem.size)}
                          </span>
                          {renderStatusBadge(fileItem.status)}
                        </div>
                      </div>
                    </div>

                    {/* Remove Action Button */}
                    <button
                      type="button"
                      onClick={() => handleRemove(fileItem, idx)}
                      disabled={disabled}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                      title="Remove file"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Buttons Footer */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              disabled={disabled}
              className="px-4 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleUploadSubmit}
            disabled={disabled || selectedFiles.length === 0}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none"
          >
            Upload Proof ({selectedFiles.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResolutionProofUpload;
