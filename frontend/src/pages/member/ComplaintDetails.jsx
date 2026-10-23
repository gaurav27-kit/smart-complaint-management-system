import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  MapPin,
  Calendar,
  Clock,
  Building,
  User,
  Mail,
  Phone,
  FileText,
  UploadCloud,
  Plus,
  Sparkles,
  Timer,
  Star,
  History,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

// Reused shared components
import StatusBadge from "../../components/badges/StatusBadge";
import Timeline from "../../components/common/Timeline";
import ImageGrid from "../../components/common/ImageGrid";
import Loading from "@/components/ui/Loading";
import EmptyState from "@/components/ui/EmptyState";
import ResolutionProofUpload from "../../components/modals/ResolutionProofUpload";
import ResolutionNotesModal from "../../components/modals/ResolutionNotesModal";
import StatusUpdateModal from "../../components/modals/StatusUpdateModal";
import {
  getComplaintById,
  updateComplaintStatus,
  addComplaintNote,
  uploadResolutionProof,
} from "../../services/complaintService";
import { getCategoryLabel } from "../../config/complaintCategories";
import { formatComplaintId } from "../../utils/formatters";

const ComplaintDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [complaintData, setComplaintData] = useState(null);

  // Status Modal State
  const [updateStatusOpen, setUpdateStatusOpen] = useState(false);
  const [statusValue, setStatusValue] = useState("In Progress");
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  // Resolution Proof Modal State & Uploaded Proofs
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [uploadedProofs, setUploadedProofs] = useState([]);

  // Internal Notes Modal State & Notes List State
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [notesList, setNotesList] = useState([]);

  // Fetch live complaint details from backend endpoint: GET /api/complaints/:id
  const fetchComplaintDetails = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getComplaintById(id);
      const data = response.complaint || response.data || response;
      setComplaintData(data);
      setStatusValue(data.status || "Pending");
      setNotesList(data.notes || []);
      setUploadedProofs(data.resolutionProof || []);
    } catch (err) {
      setError(err.message || "Failed to load complaint details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaintDetails();
  }, [id]);

  // Helper for priority badge styling matching SCMS standard
  const getPriorityBadgeClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case "critical":
        return "bg-red-100 text-red-700 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "medium":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "low":
      default:
        return "bg-green-100 text-green-700 border-green-200";
    }
  };

  const handleStatusUpdateSubmit = async ({ complaintId, newStatus, comment }) => {
    setStatusUpdateLoading(true);
    try {
      const targetId = complaintId || id;
      await updateComplaintStatus(targetId, { status: newStatus, comment });

      toast.success(`Complaint status successfully updated to "${newStatus}"!`);
      setUpdateStatusOpen(false);
      setStatusValue(newStatus);

      // Refresh live complaint details and timeline
      await fetchComplaintDetails();
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || "Failed to update complaint status."
      );
      // Keep modal open so user input is preserved
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const handleAddNoteClick = () => {
    setIsNoteModalOpen(true);
  };

  const handleSaveNote = async (newNoteText) => {
    try {
      await addComplaintNote(id, newNoteText);
      toast.success("Internal resolution note added successfully!");
      setIsNoteModalOpen(false);

      // Refresh live complaint details, notes list, and timeline
      await fetchComplaintDetails();
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || "Failed to add internal resolution note."
      );
      throw err; // Re-throw so modal catches error, keeps modal open, and preserves text input
    }
  };

  const handleUploadProofClick = () => {
    setIsProofModalOpen(true);
  };

  const handleProofUpload = async (newFiles) => {
    try {
      await uploadResolutionProof(id, newFiles);
      toast.success("Resolution proof uploaded successfully!");
      setIsProofModalOpen(false);

      // Refresh live complaint details, resolution proof list, and timeline
      await fetchComplaintDetails();
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || "Failed to upload resolution proof."
      );
      throw err; // Re-throw so modal catches error, keeps modal open, and preserves selected files
    }
  };

  const handleProofRemove = (fileItem) => {
    setUploadedProofs((prev) => prev.filter((f) => f !== fileItem));
  };

  // 1. Loading State (reusing Loading component)
  if (loading) {
    return (
      <div className="py-12">
        <Loading message="Loading complaint details..." />
      </div>
    );
  }

  // 2. Error State with Retry Button
  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl space-y-4 max-w-xl mx-auto my-12 text-center">
        <AlertCircle className="w-10 h-10 text-red-600 mx-auto" />
        <h3 className="text-lg font-bold text-red-900">Failed to Load Complaint</h3>
        <p className="text-sm text-red-700">{error}</p>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={() => navigate("/member/assigned-complaints")}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-100"
          >
            Back to List
          </button>
          <button
            onClick={fetchComplaintDetails}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Loading</span>
          </button>
        </div>
      </div>
    );
  }

  // 3. Empty State if complaint not found
  if (!complaintData) {
    return (
      <div className="py-12">
        <EmptyState
          title="Complaint Not Found"
          message="The requested complaint record does not exist or has been removed."
        />
      </div>
    );
  }

  // Live Complaint Mapping Object
  const complaint = {
    id: complaintData.id || complaintData._id || id,
    title: complaintData.title || "Untitled Complaint",
    category: getCategoryLabel(complaintData.category),
    priority: complaintData.priority || "Medium",
    status: statusValue || complaintData.status || "Pending",
    assignedDate: complaintData.createdAt
      ? new Date(complaintData.createdAt).toLocaleDateString()
      : "Today",
    createdAt: complaintData.createdAt || new Date().toISOString(),
    updatedAt: complaintData.updatedAt || new Date().toISOString(),
    location: complaintData.location || "N/A",
    description: complaintData.description || "No description provided.",
    assignedDepartment:
      complaintData.department?.name ||
      complaintData.departmentName ||
      (typeof complaintData.department === "string" ? complaintData.department : "Unassigned"),
    assignedMember:
      complaintData.assignedMember?.user?.fullName ||
      complaintData.assignedMember?.fullName ||
      complaintData.assignedMemberName ||
      (typeof complaintData.assignedMember === "string" ? complaintData.assignedMember : "Unassigned"),
    citizen: {
      name: complaintData.createdBy?.fullName || complaintData.citizen?.name || "N/A",
      email: complaintData.createdBy?.email || complaintData.citizen?.email || "N/A",
      phone: complaintData.createdBy?.phone || complaintData.citizen?.phone || "N/A",
    },
    images: complaintData.images || [],
    timelineEvents: complaintData.timeline || [],
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 1. HEADER SECTION */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-extrabold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-md border border-indigo-100">
              {formatComplaintId(complaint.id)}
            </span>
            <StatusBadge status={complaint.status} />
            <span
              className={`inline-block px-3 py-0.5 rounded-full text-xs font-semibold border ${getPriorityBadgeClass(
                complaint.priority
              )}`}
            >
              {complaint.priority} Priority
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
            {complaint.title}
          </h1>

          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            Assigned Date: <strong className="text-gray-700">{complaint.assignedDate}</strong>
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/member/assigned-complaints")}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Assigned Complaints</span>
          </button>
          <button
            onClick={() => setUpdateStatusOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Update Status</span>
          </button>
        </div>
      </div>

      {/* TWO COLUMN MAIN CONTENT LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN (SPAN 2): Details, Images, Notes, Proof */}
        <div className="lg:col-span-2 space-y-6">
          {/* 2. COMPLAINT INFORMATION CARD */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Complaint Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Category</label>
                <p className="text-sm font-medium text-gray-800 mt-0.5">
                  <span className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
                    {complaint.category}
                  </span>
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Location</label>
                <p className="text-sm font-medium text-gray-800 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                  {complaint.location}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Created Date</label>
                <p className="text-sm font-medium text-gray-700 mt-0.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  {new Date(complaint.createdAt).toLocaleString()}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Last Updated</label>
                <p className="text-sm font-medium text-gray-700 mt-0.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  {new Date(complaint.updatedAt).toLocaleString()}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Assigned Department</label>
                <p className="text-sm font-semibold text-gray-800 mt-0.5 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-indigo-600 shrink-0" />
                  {complaint.assignedDepartment}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Assigned Member</label>
                <p className="text-sm font-semibold text-gray-800 mt-0.5 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-indigo-600 shrink-0" />
                  {complaint.assignedMember}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <label className="text-xs font-semibold text-gray-400 uppercase">Description</label>
              <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-200 mt-1 leading-relaxed">
                {complaint.description}
              </p>
            </div>
          </div>

          {/* 4. COMPLAINT IMAGES */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
              Attached Evidence Images
            </h2>
            <ImageGrid images={complaint.images} editable={false} />
          </div>

          {/* 6. INTERNAL RESOLUTION NOTES */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-gray-900">
                Internal Resolution Notes
              </h2>
              <button
                onClick={handleAddNoteClick}
                className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border border-indigo-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Note</span>
              </button>
            </div>

            <div className="space-y-3">
              {notesList.map((note, idx) => (
                <div key={note.id || idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="font-bold text-gray-800">{note.author}</span>
                    <span>{note.date || (note.createdAt ? new Date(note.createdAt).toLocaleString() : "Recently")}</span>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">{note.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 7. RESOLUTION PROOF */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-gray-900">
                Resolution Proof Verification
              </h2>
              <button
                onClick={handleUploadProofClick}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload Resolution Proof</span>
              </button>
            </div>

            {uploadedProofs.length === 0 ? (
              <div className="py-6 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                <UploadCloud className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-600">No proof uploaded</p>
                <p className="text-xs text-gray-400 mt-1">
                  Upload image or completion document proof prior to resolving.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg font-bold">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-900">
                      {uploadedProofs.length} Proof File(s) Uploaded
                    </p>
                    <p className="text-xs text-emerald-700">
                      Resolution proof verification ready for administrator review.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsProofModalOpen(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Manage Proof
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (SPAN 1): Citizen Info, Timeline, Future Features */}
        <div className="space-y-6">
          {/* 3. CITIZEN INFORMATION (READ ONLY) */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" />
              Citizen Contact Details
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                  {complaint.citizen.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase">Full Name</p>
                  <p className="font-semibold text-gray-900">{complaint.citizen.name}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-400 font-semibold uppercase">Email Address</p>
                <p className="font-medium text-gray-800 flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  {complaint.citizen.email}
                </p>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-400 font-semibold uppercase">Phone Number</p>
                <p className="font-medium text-gray-800 flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  {complaint.citizen.phone}
                </p>
              </div>
            </div>
          </div>

          {/* 5. TIMELINE (REUSING SHARED TIMELINE COMPONENT) */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
              Activity History
            </h2>
            <Timeline events={complaint.timelineEvents} />
          </div>

          {/* 8. FUTURE FEATURE PLACEHOLDERS (DISABLED / COMING SOON) */}
          <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Advanced Features
              </h2>
              <span className="text-[10px] font-extrabold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md border border-amber-200 uppercase">
                Coming Soon
              </span>
            </div>

            <div className="space-y-3 opacity-60 pointer-events-none select-none">
              {/* AI Resolution Assistant */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">AI Resolution Assistant</h4>
                  <p className="text-[11px] text-slate-500">Auto-suggest resolution steps & responses.</p>
                </div>
              </div>

              {/* SLA Tracking */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center gap-3">
                <Timer className="w-5 h-5 text-emerald-500 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">SLA Tracking</h4>
                  <p className="text-[11px] text-slate-500">Real-time deadline countdown & breach alerts.</p>
                </div>
              </div>

              {/* Citizen Feedback */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center gap-3">
                <Star className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Citizen Feedback</h4>
                  <p className="text-[11px] text-slate-500">Post-resolution rating & satisfaction score.</p>
                </div>
              </div>

              {/* Resolution History */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center gap-3">
                <History className="w-5 h-5 text-purple-500 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Resolution History</h4>
                  <p className="text-[11px] text-slate-500">Immutable supervisor verification audit log.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* REUSED STATUS UPDATE MODAL */}
      <StatusUpdateModal
        isOpen={updateStatusOpen}
        onClose={() => setUpdateStatusOpen(false)}
        onStatusUpdate={handleStatusUpdateSubmit}
        complaint={{ ...complaint, id: complaint.id }}
        loading={statusUpdateLoading}
      />

      {/* RESOLUTION PROOF UPLOAD MODAL */}
      <ResolutionProofUpload
        isOpen={isProofModalOpen}
        onClose={() => setIsProofModalOpen(false)}
        onUpload={handleProofUpload}
        onRemove={handleProofRemove}
        existingFiles={uploadedProofs}
      />

      {/* INTERNAL RESOLUTION NOTES MODAL */}
      <ResolutionNotesModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        onSave={handleSaveNote}
        notes={notesList}
        complaint={complaint}
      />
    </div>
  );
};

export default ComplaintDetails;
