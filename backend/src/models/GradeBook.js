const mongoose = require('mongoose');

const GradeBookSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course',
    required: true,
  },
  semester: {
    type: String,
    required: true,
  },
  academicYear: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Optimize common queries
GradeBookSchema.index({ course: 1 });

module.exports = mongoose.model('GradeBook', GradeBookSchema);
