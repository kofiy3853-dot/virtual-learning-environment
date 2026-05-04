const mongoose = require('mongoose');

const AdminLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: [
      'DELETE_USER',
      'SUSPEND_USER',
      'ACTIVATE_USER',
      'CHANGE_ROLE',
      'IMPERSONATE_START',
      'IMPERSONATE_EXIT',
      'DELETE_COURSE',
      'REASSIGN_TEACHER',
      'ARCHIVE_COURSE'
    ]
  },
  targetModel: {
    type: String,
    required: true,
  },
  targetId: {
    type: mongoose.Schema.ObjectId,
    required: true,
  },
  metadata: {
    type: Object,
    default: {},
  },
  ip: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('AdminLog', AdminLogSchema);
