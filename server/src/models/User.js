const { Schema, model } = require('mongoose');

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['student', 'contributor', 'admin'], default: 'student' },
    isPremium: { type: Boolean, default: false },
    premiumUntil: Date,
    refreshHash: { type: String, select: false },
    subscribedSubjects: [{ type: Schema.Types.ObjectId, ref: 'Subject' }],
    examDate: Date,
    lastReminderAt: Date,
  },
  { timestamps: true }
);

userSchema.methods.hasPremium = function () {
  return this.role === 'admin' || (this.isPremium && this.premiumUntil && this.premiumUntil > new Date());
};

userSchema.methods.toPublic = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    isPremium: this.hasPremium(),
    premiumUntil: this.premiumUntil,
    subscribedSubjects: this.subscribedSubjects,
    examDate: this.examDate,
  };
};

module.exports = model('User', userSchema);
