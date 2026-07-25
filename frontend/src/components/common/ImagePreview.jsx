import React, { useState } from "react";

/**
 * ImagePreview — Shows a thumbnail preview of a local file (not yet uploaded).
 * Used inside ImageUploader to preview files selected by the user.
 *
 * Props:
 *   file      - File object from file input / drag-drop
 *   onRemove  - Callback to remove this file from the selection
 *   index     - Index in the files array (for keying and aria)
 */
const ImagePreview = ({ file, onRemove, index }) => {
  const [loaded, setLoaded] = useState(false);
  const previewUrl = React.useMemo(() => URL.createObjectURL(file), [file]);

  // Revoke object URL on unmount to free memory
  React.useEffect(() => {
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const fileSizeDisplay =
    file.size < 1024 * 1024
      ? `${(file.size / 1024).toFixed(1)} KB`
      : `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

  return (
    <div className="group relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shadow-sm transition-shadow hover:shadow-md">
      {/* Skeleton loader */}
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-xl" />
      )}

      <img
        src={previewUrl}
        alt={`Preview ${index + 1}: ${file.name}`}
        className={`w-full h-32 object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        onLoad={() => setLoaded(true)}
        loading="lazy"
      />

      {/* Remove button */}
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center bg-red-600 text-white rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
        aria-label={`Remove image ${file.name}`}
        title="Remove"
      >
        ×
      </button>

      {/* File info */}
      <div className="px-2 py-1.5 bg-white border-t border-gray-100">
        <p className="text-xs text-gray-700 font-medium truncate" title={file.name}>
          {file.name}
        </p>
        <p className="text-[10px] text-gray-400">{fileSizeDisplay}</p>
      </div>
    </div>
  );
};

export default ImagePreview;
