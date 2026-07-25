import React, { useState } from "react";
import { FiEye, FiTrash2 } from "react-icons/fi";

/**
 * Builds a Cloudinary transformation URL.
 * @param {string} secureUrl  - The original secure_url from Cloudinary
 * @param {string} transforms - Cloudinary transformation string (e.g. "w_300,h_200,c_fill,q_auto,f_auto")
 */
const getTransformedUrl = (secureUrl, transforms) => {
  if (!secureUrl || !transforms) return secureUrl;
  // Insert transforms before /upload/ or /v1234.../
  return secureUrl.replace("/upload/", `/upload/${transforms}/`);
};

/**
 * ImageCard — Single image card used inside ImageGrid.
 * Shows Cloudinary-optimized thumbnail, hover overlay with View/Delete.
 *
 * Props:
 *   image     - { url, secureUrl, publicId, width, height, format }
 *   onClick   - Opens fullscreen modal
 *   onDelete  - Callback to delete this image (only shown when editable)
 *   editable  - Whether to show the delete button
 */
const ImageCard = ({ image, onClick, onDelete, editable = false }) => {
  const [loaded, setLoaded] = useState(false);

  const thumbnailUrl = getTransformedUrl(
    image.secureUrl,
    "w_300,h_200,c_fill,q_auto,f_auto"
  );

  const formatLabel = (image.format || "").toUpperCase();

  return (
    <div
      className="group relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-indigo-200"
      onClick={() => onClick?.(image)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.(image);
        }
      }}
      aria-label={`View image, ${image.format} format, ${image.width}×${image.height}`}
    >
      {/* Skeleton */}
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}

      <img
        src={thumbnailUrl}
        alt={`Complaint image (${formatLabel})`}
        className={`w-full h-40 object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        onLoad={() => setLoaded(true)}
        loading="lazy"
      />

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
        <span
          className="w-9 h-9 flex items-center justify-center bg-white/90 text-gray-800 rounded-full shadow-lg hover:bg-white transition-colors"
          title="View fullscreen"
        >
          <FiEye className="w-4 h-4" />
        </span>

        {editable && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(image);
            }}
            className="w-9 h-9 flex items-center justify-center bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-colors"
            title="Delete image"
            aria-label="Delete image"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Format badge */}
      {formatLabel && (
        <span className="absolute top-2 left-2 px-1.5 py-0.5 text-[10px] font-bold bg-black/60 text-white rounded uppercase tracking-wide">
          {formatLabel}
        </span>
      )}

      {/* Dimensions */}
      {image.width && image.height && (
        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 text-[10px] font-medium bg-black/60 text-white rounded">
          {image.width}×{image.height}
        </span>
      )}
    </div>
  );
};

export default ImageCard;
