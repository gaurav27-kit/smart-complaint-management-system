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
        "Road",
        "Water",
        "Electricity",
        "Garbage",
        "Street Light",
        "Drainage",
        "Other",
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
          enum: ["user", "admin"],
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

const Complaint =
  mongoose.models.Complaint || mongoose.model("Complaint", complaintSchema);

export default Complaint;
