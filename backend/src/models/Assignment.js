const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  dueDate: {
    type: Date,
    required: true,
  },
  totalMarks: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Optimize common queries
AssignmentSchema.index({ course: 1 });
AssignmentSchema.index({ course: 1, dueDate: 1 });

module.exports = mongoose.model('Assignment', AssignmentSchema);
