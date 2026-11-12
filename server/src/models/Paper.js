const { Schema, model } = require('mongoose');

const paperSchema = new Schema(
  {
    subject: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    year: { type: Number, required: true, min: 1990, max: 2100 },
    examType: { type: String, enum: ['regular', 'backlog'], default: 'regular' },
    file: { path: String, originalName: String, size: Number },
    rawText: { type: String, select: false },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // admin review
    moderation: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    // background processing
    status: { type: String, enum: ['queued', 'processing', 'ready', 'failed'], default: 'queued' },
    failReason: String,
    questionCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

paperSchema.index({ subject: 1, year: 1, examType: 1 }, { unique: true });

module.exports = model('Paper', paperSchema);
