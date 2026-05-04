const mongoose = require('mongoose');

const GradeItemSchema = new mongoose.Schema({
  gradeBook: {
    type: mongoose.Schema.ObjectId,
    ref: 'GradeBook',
    required: true,
  },
  student: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  sourceId: {
    type: mongoose.Schema.ObjectId,
    required: true,
    refPath: 'sourceType',
  },
  sourceType: {
    type: String,
    required: true,
    enum: ['assignment', 'quiz'],
  },
  score: {
    type: Number,
    required: true,
  },
  maxScore: {
    type: Number,
    required: true,
  },
  percentage: {
    type: Number,
    required: true,
  },
  gradedAt: {
    type: Date,
    default: Date.now,
  },
});

// Calculate percentage before saving
GradeItemSchema.pre('save', function(next) {
  this.percentage = (this.score / this.maxScore) * 100;
  next();
});

GradeItemSchema.index({ student: 1 });
GradeItemSchema.index({ gradeBook: 1 });
GradeItemSchema.index({ student: 1, sourceId: 1 }, { unique: true });

module.exports = mongoose.model('GradeItem', GradeItemSchema);
