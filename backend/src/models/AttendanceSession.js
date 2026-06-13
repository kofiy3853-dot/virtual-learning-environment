const mongoose = require('mongoose');

const AttendanceSessionSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course',
    required: true,
  },
  teacher: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  topic: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Optimize common queries
AttendanceSessionSchema.index({ course: 1 });
AttendanceSessionSchema.index({ teacher: 1 });
AttendanceSessionSchema.index({ course: 1, date: -1 });

module.exports = mongoose.model('AttendanceSession', AttendanceSessionSchema);
