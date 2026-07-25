import React, { useRef, useState, useCallback } from "react";
import { FiUploadCloud, FiImage } from "react-icons/fi";
import { toast } from "react-hot-toast";
import ImagePreview from "./ImagePreview";
import ImageGrid from "./ImageGrid";

const MAX_FILES = 5;
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ACCEPT_STRING = "image/jpeg,image/png,image/webp";

/**
 * ImageUploader — Drag-and-drop / file-picker upload widget.
 *
 * Props:
 *   files              - Array of new File objects selected by the user
 *   onFilesChange      - Callback(newFilesList) when files are added/removed
 *   existingImages     - Array of already-uploaded image metadata objects
 *   onDeleteExisting   - Callback(image) to mark an existing image for deletion
 *   maxFiles           - Max total images allowed (default 5)
 *   disabled           - Disable the uploader (e.g. during submission)
 */
const ImageUploader = ({
  files = [],
  onFilesChange,
  existingImages = [],
  onDeleteExisting,
  maxFiles = MAX_FILES,
  disabled = false,
}) => {
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const totalSlots = maxFiles - existingImages.length;
  const remainingSlots = totalSlots - files.length;

  /**
   * Validate and add files (deduplicating by name+size).
   */
  const addFiles = useCallback(
    (incoming) => {
      const valid = [];
      const existingNames = new Set(files.map((f) => `${f.name}_${f.size}`));

      for (const file of incoming) {
        const key = `${file.name}_${file.size}`;

        // Duplicate check
        if (existingNames.has(key)) {
          toast.error(`"${file.name}" is already selected.`);
          continue;
        }

        // Type check
        if (!ACCEPTED_TYPES.has(file.type)) {
          toast.error(`"${file.name}" is not allowed. Only JPEG, PNG, WEBP accepted.`);
          continue;
        }

        // Size check
        if (file.size > MAX_SIZE_BYTES) {
          toast.error(`"${file.name}" exceeds the ${MAX_SIZE_MB} MB size limit.`);
          continue;
        }

        valid.push(file);
        existingNames.add(key);
      }

      if (valid.length === 0) return;

      const available = totalSlots - files.length;
      if (valid.length > available) {
        toast.error(
          `You can only add ${available} more image(s). Maximum is ${maxFiles} total.`
        );
        const trimmed = valid.slice(0, Math.max(0, available));
        if (trimmed.length > 0) onFilesChange([...files, ...trimmed]);
        return;
      }

      onFilesChange([...files, ...valid]);
    },
    [files, totalSlots, maxFiles, onFilesChange]
  );

  const handleRemoveFile = useCallback(
    (index) => {
      const updated = files.filter((_, i) => i !== index);
      onFilesChange(updated);
    },
    [files, onFilesChange]
  );

  // Drag events
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
    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  // File picker
  const handleFileInputChange = (e) => {
    const selected = Array.from(e.target.files);
    addFiles(selected);
    // Reset input so the same file can be selected again if removed
    e.target.value = "";
  };

  return (
    <div className="space-y-4">
      {/* Label */}
      <label className="block text-sm font-semibold text-gray-700">
        <span className="flex items-center gap-1.5">
          <FiImage className="w-4 h-4 text-indigo-500" />
          Attach Images
          <span className="text-gray-400 font-normal ml-1">(optional, max {maxFiles})</span>
        </span>
      </label>

      {/* Existing images (edit mode) */}
      {existingImages.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Current Images ({existingImages.length})
          </p>
          <ImageGrid
            images={existingImages}
            editable={!disabled}
            onDelete={onDeleteExisting}
          />
        </div>
      )}

      {/* Drop zone */}
      {remainingSlots > 0 && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !disabled) {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          aria-label={`Drop images here or click to browse. ${remainingSlots} slot(s) remaining.`}
          className={`
            relative flex flex-col items-center justify-center gap-2 px-6 py-8 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200
            ${disabled
              ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
              : isDragOver
                ? "border-indigo-500 bg-indigo-50 shadow-inner"
                : "border-gray-300 bg-white hover:border-indigo-400 hover:bg-indigo-50/30"
            }
          `}
        >
          <FiUploadCloud
            className={`w-8 h-8 ${isDragOver ? "text-indigo-500" : "text-gray-400"} transition-colors`}
          />
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">
              {isDragOver ? "Drop images here" : "Drag & drop images here"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              or{" "}
              <span className="text-indigo-600 font-medium underline underline-offset-2">
                browse files
              </span>
            </p>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            JPEG, PNG, WEBP · Max {MAX_SIZE_MB} MB each · {remainingSlots} slot(s) left
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_STRING}
            multiple
            onChange={handleFileInputChange}
            className="hidden"
            disabled={disabled}
            aria-hidden="true"
          />
        </div>
      )}

      {/* Capacity reached message */}
      {remainingSlots <= 0 && files.length > 0 && (
        <p className="text-xs text-amber-600 font-medium">
          Maximum image limit reached ({maxFiles}). Remove an image to add more.
        </p>
      )}

      {/* New file previews */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            New Images ({files.length})
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {files.map((file, idx) => (
              <ImagePreview
                key={`${file.name}_${file.size}_${idx}`}
                file={file}
                index={idx}
                onRemove={handleRemoveFile}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
