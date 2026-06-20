import mongoose from "mongoose";

const HistorySchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: ["question_paper", "study_mode"], required: true },
    syllabusInput: { type: String },
    generatedContent: { type: mongoose.Schema.Types.Mixed, required: true },
    title: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.History || mongoose.model("History", HistorySchema);