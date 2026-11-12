const { Schema, model } = require('mongoose');

const subjectSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 20 },
    university: { type: String, required: true, trim: true, maxlength: 120 },
    semester: { type: Number, min: 1, max: 12 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

subjectSchema.index({ university: 1, code: 1 }, { unique: true });
subjectSchema.index({ name: 'text', code: 'text', university: 'text' });

module.exports = model('Subject', subjectSchema);
