const mongoose = require('mongoose');

const GradeWeightSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course',
    required: true,
    unique: true,
  },
  assignmentWeight: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  quizWeight: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  }
});

// Validate that sum equals 100
GradeWeightSchema.pre('save', function(next) {
  if (this.assignmentWeight + this.quizWeight !== 100) {
    next(new Error('Total weight must equal 100'));
  } else {
    next();
  }
});

module.exports = mongoose.model('GradeWeight', GradeWeightSchema);
