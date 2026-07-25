import React, { useState } from "react";
import ImageCard from "./ImageCard";
import ImageModal from "./ImageModal";

/**
 * ImageGrid — Responsive grid to display uploaded complaint images.
 *
 * Props:
 *   images       - Array of image objects from complaint document
 *   editable     - Whether to show delete buttons on cards
 *   onDelete     - Callback when a delete button is clicked on a card
 */
const ImageGrid = ({ images = [], editable = false, onDelete }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);

  if (!images.length) {
    return (
      <div className="py-6 text-center text-sm text-gray-400 italic">
        No images attached
      </div>
    );
  }

  const handleImageClick = (image) => {
    const idx = images.findIndex((img) => img.publicId === image.publicId);
    setModalIndex(idx >= 0 ? idx : 0);
    setModalOpen(true);
  };

  return (
    <>
      <div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
        role="list"
        aria-label="Complaint images"
      >
        {images.map((image, idx) => (
          <div key={image.publicId || idx} role="listitem">
            <ImageCard
              image={image}
              onClick={handleImageClick}
              onDelete={onDelete}
              editable={editable}
            />
          </div>
        ))}
      </div>

      <ImageModal
        images={images}
        currentIndex={modalIndex}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onIndexChange={setModalIndex}
      />
    </>
  );
};

export default ImageGrid;
