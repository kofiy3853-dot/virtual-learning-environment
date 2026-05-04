const mongoose = require('mongoose');

const ContentItemSchema = new mongoose.Schema({
  module: {
    type: mongoose.Schema.ObjectId,
    ref: 'Module',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
  },
  type: {
    type: String,
    enum: ['pdf', 'video', 'slide', 'note', 'image'],
    required: true,
  },
  fileUrl: {
    type: String,
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

module.exports = mongoose.model('ContentItem', ContentItemSchema);
