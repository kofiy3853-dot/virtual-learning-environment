const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course',
    required: true,
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  body: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Optimize common queries
AnnouncementSchema.index({ course: 1 });
AnnouncementSchema.index({ author: 1 });
AnnouncementSchema.index({ course: 1, createdAt: -1 });

module.exports = mongoose.model('Announcement', AnnouncementSchema);
