const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  receiver: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: false, // Optional for course-wide group messages
  },
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course',
    required: false, // Optional for user-to-user private messages
  },
  body: {
    type: String,
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for conversation queries (find messages between two users)
MessageSchema.index({ sender: 1, receiver: 1 });
MessageSchema.index({ course: 1 });
MessageSchema.index({ createdAt: 1 });

module.exports = mongoose.model('Message', MessageSchema);
