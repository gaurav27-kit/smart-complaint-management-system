import React, { useEffect, useCallback } from "react";
import { FiX, FiChevronLeft, FiChevronRight, FiDownload } from "react-icons/fi";

/**
 * Builds a Cloudinary transformation URL for full-size viewing.
 */
const getFullUrl = (secureUrl) => {
  if (!secureUrl) return secureUrl;
  return secureUrl.replace("/upload/", "/upload/w_1200,q_auto,f_auto/");
};

/**
 * ImageModal — Fullscreen lightbox for viewing complaint images.
 *
 * Props:
 *   images        - Array of image objects from complaint
 *   currentIndex  - Index of the currently viewed image
 *   isOpen        - Whether the modal is visible
 *   onClose       - Close handler
 *   onIndexChange - Callback to change the viewed image index
 */
const ImageModal = ({ images = [], currentIndex = 0, isOpen, onClose, onIndexChange }) => {
  const total = images.length;
  const current = images[currentIndex];

  const goNext = useCallback(() => {
    if (currentIndex < total - 1) onIndexChange(currentIndex + 1);
  }, [currentIndex, total, onIndexChange]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) onIndexChange(currentIndex - 1);
  }, [currentIndex, onIndexChange]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          goPrev();
          break;
        case "ArrowRight":
          goNext();
          break;
        default:
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, goNext, goPrev]);

  if (!isOpen || !current) return null;

  const fullUrl = getFullUrl(current.secureUrl);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-5xl px-4">
        {/* Top bar */}
        <div className="w-full flex items-center justify-between mb-4">
          <span className="text-white/80 text-sm font-medium">
            {currentIndex + 1} of {total}
          </span>

          <div className="flex items-center gap-2">
            {/* Download */}
            <a
              href={current.secureUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
              title="Download original"
              aria-label="Download image"
            >
              <FiDownload className="w-5 h-5" />
            </a>

            {/* Close */}
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
              aria-label="Close image viewer"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image */}
        <div className="relative flex items-center justify-center w-full" style={{ maxHeight: "75vh" }}>
          {/* Left arrow */}
          {currentIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors ml-2"
              aria-label="Previous image"
            >
              <FiChevronLeft className="w-6 h-6" />
            </button>
          )}

          <img
            src={fullUrl}
            alt={`Complaint image ${currentIndex + 1} of ${total}`}
            className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl select-none"
            draggable={false}
          />

          {/* Right arrow */}
          {currentIndex < total - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors mr-2"
              aria-label="Next image"
            >
              <FiChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Image metadata */}
        {(current.format || (current.width && current.height)) && (
          <div className="mt-3 flex items-center gap-3 text-white/60 text-xs">
            {current.format && (
              <span className="px-2 py-0.5 bg-white/10 rounded uppercase font-medium">
                {current.format}
              </span>
            )}
            {current.width && current.height && (
              <span>{current.width} × {current.height}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageModal;
