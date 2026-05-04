const mongoose = require('mongoose');

const EnrollmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course',
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'dropped', 'completed'],
    default: 'active',
  },
  enrolledAt: {
    type: Date,
    default: Date.now,
  },
});

// Prevent duplicate enrollments (unique compound index)
EnrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

// Single-field indexes for individual query patterns
EnrollmentSchema.index({ student: 1 });
EnrollmentSchema.index({ course: 1 });

module.exports = mongoose.model('Enrollment', EnrollmentSchema);
