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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('LiveSession', LiveSessionSchema);
