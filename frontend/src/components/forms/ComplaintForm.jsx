import React, { useState, useCallback } from "react";
import imageCompression from "browser-image-compression";
import { toast } from "react-hot-toast";
import { Sparkles } from "lucide-react";
import ImageUploader from "../common/ImageUploader";
import aiService from "../../services/aiService";
import AILoadingState from "../ai/AILoadingState";
import AIAnalysisCard from "../ai/AIAnalysisCard";

const COMPRESSION_OPTIONS = {
  maxSizeMB: 1, // Compress down to ~1 MB before upload
  maxWidthOrHeight: 1920, // Preserve quality at max 1920px
  useWebWorker: true,
};

const ComplaintForm = ({ onSubmit, initialData = null, isLoading = false }) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    category: initialData?.category || "Other",
    location: initialData?.location || "",
    priority: initialData?.priority || "Medium",
  });

  // Image state
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingImages, setExistingImages] = useState(
    initialData?.images || []
  );
  const [deletedImageIds, setDeletedImageIds] = useState([]);
  const [isCompressing, setIsCompressing] = useState(false);

  // AI State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiMetadata, setAiMetadata] = useState(initialData?.aiMetadata || null);
  const [lastAnalyzedText, setLastAnalyzedText] = useState("");

  const categories = [
    "Road",
    "Water",
    "Electricity",
    "Garbage",
    "Street Light",
    "Drainage",
    "Other",
  ];

  const priorities = ["Low", "Medium", "High"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFilesChange = useCallback((newFiles) => {
    setSelectedFiles(newFiles);
  }, []);

  const handleDeleteExisting = useCallback(
    (image) => {
      setExistingImages((prev) =>
        prev.filter((img) => img.publicId !== image.publicId)
      );
      setDeletedImageIds((prev) => [...prev, image.publicId]);
    },
    []
  );

  const handleAnalyze = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error("Please enter a title and description first.");
      return;
    }

    const currentText = `${formData.title.trim()}|${formData.description.trim()}`;
    
    // Simple frontend caching to avoid redundant API calls
    if (currentText === lastAnalyzedText && aiAnalysis) {
      return; // Already analyzed this exact text
    }

    try {
      setIsAnalyzing(true);
      setAiAnalysis(null); // Clear previous
      
      const analysis = await aiService.analyzeComplaintText(
        formData.title,
        formData.description
      );
      
      setAiAnalysis(analysis);
      setLastAnalyzedText(currentText);
    } catch (error) {
      console.error("AI Analysis failed:", error);
      toast.error(error.response?.data?.message || "AI Analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplySuggestions = () => {
    if (!aiAnalysis) return;
    
    setFormData((prev) => ({
      ...prev,
      category: categories.includes(aiAnalysis.category) ? aiAnalysis.category : prev.category,
      priority: priorities.includes(aiAnalysis.priority) ? aiAnalysis.priority : prev.priority,
    }));
    
    // Store metadata for backend analytics
    setAiMetadata({
      prediction: aiAnalysis,
      confidence: aiAnalysis.confidence,
      modelName: aiAnalysis.modelName,
      generatedAt: aiAnalysis.generatedAt,
    });
    
    setAiAnalysis(null);
    toast.success("AI suggestions applied!");
  };

  const handleDiscardSuggestions = () => {
    setAiAnalysis(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const hasNewFiles = selectedFiles.length > 0;
    const hasDeletedImages = deletedImageIds.length > 0;
    const needsFormData = hasNewFiles || hasDeletedImages;

    if (!needsFormData) {
      // Plain JSON — no image changes
      const submitData = { ...formData };
      if (aiMetadata) {
        submitData.aiMetadata = aiMetadata;
      }
      onSubmit(submitData);
      return;
    }

    // Build FormData with text fields + images
    const fd = new FormData();
    fd.append("title", formData.title);
    fd.append("description", formData.description);
    fd.append("category", formData.category);
    fd.append("location", formData.location);
    fd.append("priority", formData.priority);

    if (aiMetadata) {
      fd.append("aiMetadata", JSON.stringify(aiMetadata));
    }

    // Deleted image public IDs
    if (hasDeletedImages) {
      fd.append("deleteImageIds", JSON.stringify(deletedImageIds));
    }

    // Compress and append new files
    if (hasNewFiles) {
      setIsCompressing(true);
      try {
        const compressedFiles = await Promise.all(
          selectedFiles.map(async (file) => {
            try {
              const compressed = await imageCompression(file, COMPRESSION_OPTIONS);
              return compressed;
            } catch {
              // If compression fails, use original file
              console.warn(`Compression failed for "${file.name}", using original.`);
              return file;
            }
          })
        );

        for (const file of compressedFiles) {
          fd.append("images", file, file.name);
        }
      } catch (error) {
        toast.error("Image compression failed. Please try again.");
        return;
      } finally {
        setIsCompressing(false);
      }
    }

    onSubmit(fd);
  };

  const submitting = isLoading || isCompressing;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
          Complaint Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          id="title"
          required
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g., Water leakage in main street"
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
        />
      </div>

      {/* Grid for Category & Priority */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            name="category"
            id="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div>
          <label htmlFor="priority" className="block text-sm font-semibold text-gray-700 mb-2">
            Priority <span className="text-red-500">*</span>
          </label>
          <select
            name="priority"
            id="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
          >
            {priorities.map((prio) => (
              <option key={prio} value={prio}>
                {prio}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Location */}
      <div>
        <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-2">
          Location / Address <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="location"
          id="location"
          required
          value={formData.location}
          onChange={handleChange}
          placeholder="e.g., Sector 4, Block B, Landmark near park"
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
          Detailed Description <span className="text-red-500">*</span>
        </label>
        <textarea
          name="description"
          id="description"
          required
          rows="5"
          value={formData.description}
          onChange={handleChange}
          placeholder="Please describe the complaint in detail..."
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 resize-none"
        ></textarea>
      </div>

      {/* AI Intelligence Module */}
      <div className="space-y-4 pt-2">
        {!isAnalyzing && !aiAnalysis && (
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={!formData.title.trim() || !formData.description.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4" />
            Analyze with AI
          </button>
        )}

        {isAnalyzing && <AILoadingState />}

        {aiAnalysis && !isAnalyzing && (
          <AIAnalysisCard
            analysis={aiAnalysis}
            onApply={handleApplySuggestions}
            onDiscard={handleDiscardSuggestions}
          />
        )}
      </div>

      {/* Image Uploader */}
      <ImageUploader
        files={selectedFiles}
        onFilesChange={handleFilesChange}
        existingImages={existingImages}
        onDeleteExisting={handleDeleteExisting}
        disabled={submitting}
      />

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition duration-150 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isCompressing
            ? "Compressing images..."
            : isLoading
              ? "Submitting..."
              : initialData
                ? "Update Complaint"
                : "Submit Complaint"}
        </button>
      </div>
    </form>
  );
};

export default ComplaintForm;
