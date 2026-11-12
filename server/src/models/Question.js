const { Schema, model } = require('mongoose');

const questionSchema = new Schema(
  {
    paper: { type: Schema.Types.ObjectId, ref: 'Paper', required: true, index: true },
    subject: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    year: { type: Number, required: true },
    number: Number,
    text: { type: String, required: true },
    marks: Number,
    topic: { type: String, default: 'General', trim: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    // mirrors paper.moderation === 'approved' so analytics/search stay a single-collection query
    approved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

questionSchema.index({ subject: 1, approved: 1, topic: 1 });
questionSchema.index({ text: 'text', topic: 'text' });

module.exports = model('Question', questionSchema);
