const mongoose = require('mongoose');

const ModuleSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Please add a module title'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  weekNumber: {
    type: Number,
    required: true,
  },
  order: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Optimize common queries
ModuleSchema.index({ course: 1 });
ModuleSchema.index({ course: 1, order: 1 });

module.exports = mongoose.model('Module', ModuleSchema);
