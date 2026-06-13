const mongoose = require('mongoose');

const LiveSessionSchema = new mongoose.Schema({
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
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  providerRoomId: {
    type: String,
  },
  joinUrl: {
    type: String,
  },
  scheduledAt: {
    type: Date,
    required: true,
  },
  duration: {
    type: Number, // minutes
    required: true,
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'ended'],
    default: 'scheduled',
  },
  startedAt: {
    type: Date,
  },
  endedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Optimize common queries
LiveSessionSchema.index({ course: 1 });
LiveSessionSchema.index({ teacher: 1 });
LiveSessionSchema.index({ course: 1, scheduledAt: -1 });
LiveSessionSchema.index({ status: 1 });

module.exports = mongoose.model('LiveSession', LiveSessionSchema);
