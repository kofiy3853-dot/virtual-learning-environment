const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.ObjectId,
    ref: 'Quiz',
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['multiple_choice', 'true_false', 'short_answer'],
    required: true,
  },
  options: {
    type: [String], // for multiple_choice
  },
  correctAnswer: {
    type: String,
    required: false, // Not required for short_answer type
    select: false, // Security: never expose to students
  },
  marks: {
    type: Number,
    required: true,
  },
  order: {
    type: Number,
    default: 0,
  },
  explanation: {
    type: String,
    required: false
  }
});

module.exports = mongoose.model('Question', QuestionSchema);
