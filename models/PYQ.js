import mongoose from "mongoose";

const PYQSchema = new mongoose.Schema(
  {
    college: { type: String, required: true, trim: true, index: true },
    branch: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    semester: { type: Number, required: true },
    year: { type: Number, required: true },

    fileUrl: { type: String, required: true },
    fileType: { type: String, enum: ["image", "pdf"], default: "image" },

    uploadedBy: { type: String, required: true, index: true },
    uploaderName: { type: String },

    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    rejectionReason: { type: String },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

PYQSchema.index({ college: 1, branch: 1, subject: 1, status: 1 });

export default mongoose.models.PYQ || mongoose.model("PYQ", PYQSchema);