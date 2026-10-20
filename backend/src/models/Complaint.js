import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      enum: [
        // Internal Category Values
        "ROAD_DAMAGE",
        "WATER_LEAKAGE",
        "GARBAGE_COLLECTION",
        "STREET_LIGHT",
        "DRAINAGE",
        "PUBLIC_SAFETY",
        "HEALTH_SANITATION",
        "IT_WEBSITE",
        "OTHER",

        // Legacy Category Values (Backward Compatibility)
        "Road",
        "Water",
        "Electricity",
        "Garbage",
        "Street Light",
        "Drainage",
        "IT",
        "Other",
        "Public Safety",
        "Health",
      ],
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },

    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved", "Closed"],
      default: "Pending",
    },

    images: [
      {
        url: { type: String, required: true },
        secureUrl: { type: String, required: true },
        publicId: { type: String, required: true },
        width: { type: Number },
        height: { type: Number },
        format: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    timeline: [
      {
        type: {
          type: String,
          required: true,
          enum: [
            "COMPLAINT_CREATED",
            "COMPLAINT_UPDATED",
            "IMAGES_UPLOADED",
            "IMAGES_DELETED",
            "STATUS_CHANGED",
            "STATUS_UPDATED",
            "COMPLAINT_ASSIGNED",
            "DEPARTMENT_ASSIGNED",
            "MEMBER_ASSIGNED",
            "ADMIN_COMMENT",
            "PRIORITY_CHANGED",
            "COMPLAINT_RESOLVED",
            "COMPLAINT_CLOSED",
            "COMPLAINT_REOPENED",
          ],
        },
        title: { type: String, required: true },
        description: { type: String, default: "" },
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        performedByRole: {
          type: String,
          enum: ["admin", "department_member", "user"],
          default: "user",
        },
        metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    aiMetadata: {
      prediction: { type: mongoose.Schema.Types.Mixed },
      confidence: { type: Number },
      modelName: { type: String },
      generatedAt: { type: Date }
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },

    assignedMember: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DepartmentMember",
      default: null,
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    assignedAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    notes: {
      type: [
        {
          author: { type: String, required: true },
          text: { type: String, required: true },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },

    resolutionProof: {
      type: [
        {
          url: { type: String, required: true },
          publicId: { type: String },
          fileName: { type: String },
          fileType: { type: String },
          size: { type: Number },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

// ─── Performance Indexes ───────────────────────────────────────────────────────
// Citizen dashboard & list queries: fetch user's complaints sorted newest first
complaintSchema.index({ createdBy: 1, createdAt: -1 });

// Department head & officer scoped queries: filter by department and status
complaintSchema.index({ department: 1, status: 1 });

// Admin & analytics queries: filter/aggregate by status and priority
complaintSchema.index({ status: 1, priority: 1 });

// Field officer queries: filter complaints assigned to member by status
complaintSchema.index({ assignedMember: 1, status: 1 });

const Complaint =
  mongoose.models.Complaint || mongoose.model("Complaint", complaintSchema);

export default Complaint;
