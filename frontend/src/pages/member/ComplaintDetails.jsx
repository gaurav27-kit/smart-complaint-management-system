import React, { useState } from "react";
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

const ComplaintDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);

  // Status Modal State
  const [updateStatusOpen, setUpdateStatusOpen] = useState(false);
  const [statusValue, setStatusValue] = useState("In Progress");

  // Resolution Proof Modal State & Mock Uploaded Proofs
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [uploadedProofs, setUploadedProofs] = useState([]);

  // Internal Notes Modal State & Notes List State
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [notesList, setNotesList] = useState([
    {
      id: "n-1",
      author: "Rajesh Kumar (Field Officer)",
      date: "2026-07-26 10:00 AM",
      text: "Inspected location. Control box transformer driver unit needs component replacement. Replacement unit requested from inventory.",
    },
  ]);

  // Mock data for assigned complaint details
  const complaint = {
    id: id || "CMP-1089",
    title: "Street Light Fault in Block B",
    category: "Infrastructure & Electrical",
    priority: "High",
    status: statusValue,
    assignedDate: "2026-07-26",
    createdAt: "2026-07-25T11:30:00Z",
    updatedAt: "2026-07-26T09:15:00Z",
    location: "Main Avenue, Block B, Sector 4, City Zone 2",
    description:
      "Street lights on pole #4 and #5 are completely flickering and non-functional at night, causing safety concerns for pedestrians and commuters after 8 PM.",
    assignedDepartment: "Electrical & Power Infrastructure Department",
    assignedMember: "Rajesh Kumar (Staff ID: MEM-204)",
    citizen: {
      name: "Amit Sharma",
      email: "amit.sharma@example.com",
      phone: "+91 98765 43210",
    },
    images: [
      {
        url: "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=600&q=80",
        publicId: "img-1",
      },
      {
        url: "https://images.unsplash.com/photo-1544725121-be3bf52e2dc8?auto=format&fit=crop&w=600&q=80",
        publicId: "img-2",
      },
    ],
    timelineEvents: [
      {
        _id: "t-1",
        type: "COMPLAINT_CREATED",
        title: "Complaint Created",
        description: "Submitted by citizen Amit Sharma via Mobile Portal.",
        performedByRole: "user",
        createdAt: "2026-07-25T11:30:00Z",
      },
      {
        _id: "t-2",
        type: "DEPARTMENT_ASSIGNED",
        title: "Department Assigned",
        description: "System auto-assigned to Electrical & Power Infrastructure Department.",
        performedByRole: "admin",
        createdAt: "2026-07-25T12:00:00Z",
      },
      {
        _id: "t-3",
        type: "MEMBER_ASSIGNED",
        title: "Member Assigned",
        description: "Assigned to field officer Rajesh Kumar.",
        performedByRole: "admin",
        createdAt: "2026-07-26T08:00:00Z",
      },
      {
        _id: "t-4",
        type: "STATUS_UPDATED",
        title: "Status Updated to In Progress",
        description: "Field team deployed for physical inspection of power lines.",
        performedByRole: "admin",
        createdAt: "2026-07-26T09:15:00Z",
      },
    ],
    notes: [
      {
        id: "n-1",
        author: "Rajesh Kumar (Field Officer)",
        date: "2026-07-26 10:00 AM",
        text: "Inspected location. Control box transformer driver unit needs component replacement. Replacement unit requested from inventory.",
      },
    ],
    proofUploaded: false,
  };

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

  const handleUpdateStatus = () => {
    toast.success(`Status updated to "${statusValue}" (Mock UI update)`);
    setUpdateStatusOpen(false);
  };

  const handleAddNoteClick = () => {
    setIsNoteModalOpen(true);
  };

  const handleSaveNote = (newNoteText) => {
    const newNote = {
      id: `n-${Date.now()}`,
      author: "Rajesh Kumar (Field Officer)",
      date: new Date().toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
      text: newNoteText,
    };
    setNotesList((prev) => [newNote, ...prev]);
    toast.success("Internal resolution note added successfully!");
    setIsNoteModalOpen(false);
  };

  const handleUploadProofClick = () => {
    setIsProofModalOpen(true);
  };

  const handleProofUpload = (newFiles) => {
    setUploadedProofs(newFiles);
    toast.success("Resolution proof uploaded successfully!");
    setIsProofModalOpen(false);
  };

  const handleProofRemove = (fileItem) => {
    setUploadedProofs((prev) => prev.filter((f) => f !== fileItem));
  };

  if (loading) {
    return (
      <div className="py-12">
        <Loading message="Loading complaint details..." />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 1. HEADER SECTION */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-extrabold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-md border border-indigo-100">
              {complaint.id}
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

        {/* Header Action Buttons (No Delete, Assign Dept, or Assign Member) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate("/member/assigned-complaints")}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Assigned</span>
          </button>

          <button
            onClick={() => setUpdateStatusOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
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
              {notesList.map((note) => (
                <div key={note.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="font-bold text-gray-800">{note.author}</span>
                    <span>{note.date}</span>
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

      {/* UPDATE STATUS MODAL */}
      {updateStatusOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-gray-900">Update Complaint Status</h3>
              <button
                onClick={() => setUpdateStatusOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase">
                  Select New Status
                </label>
                <select
                  value={statusValue}
                  onChange={(e) => setStatusValue(e.target.value)}
                  className="w-full mt-1.5 border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setUpdateStatusOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm"
              >
                Save Status
              </button>
            </div>
          </div>
        </div>
      )}

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
